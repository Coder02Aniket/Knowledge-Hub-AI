# KnowledgeHub AI — Frontend Application Analysis & Revamp Plan

## Part 1: Application Analysis

### 1. Overview & Tech Stack
**KnowledgeHub AI** is a multi-user Retrieval-Augmented Generation (RAG) and conversational AI platform built on:
- **Backend Framework:** Java 21 + Spring Boot 4.1.0 (`spring-boot-starter-webmvc`, `spring-boot-starter-data-jpa`, `spring-boot-starter-security`)
- **AI & Embeddings:** Spring AI (`2.0.1`) with Google GenAI (`gemini-3.1-flash-lite` for chat, `gemini-embedding-001` at 768 dimensions for embeddings, plus an offline deterministic `LocalHashEmbeddingService` fallback)
- **Database & Vector Store:** PostgreSQL 17 with `pgvector` for cosine-similarity chunk retrieval
- **Object Storage:** S3-compatible MinIO (`software.amazon.awssdk:s3`) for storing raw uploaded documents
- **Document Ingestion:** Apache PDFBox (`3.0.7`) and text parsers supporting `pdf`, `txt`, `md`, `csv`, and `json` (up to 20 MB per file), processed asynchronously via a thread pool (`DocumentProcessingService`)
- **Context Path:** All endpoints are served under `/knowledgehub` (port `8080`)

---

### 2. Domain Model & Core Workflows

1. **User (`User`)**: Authenticated account owning conversations and documents.
2. **Conversation (`Conversation`)**: Scopes both the chat message history and the document "Vault". Deleting a conversation deletes its messages, document chunks, database records, and MinIO objects.
3. **Document & Chunks (`Document`, `DocumentChunk`)**:
   - Uploaded to a specific `conversationId` (or listed globally across the user's account when `conversationId` is omitted).
   - Lifecycle statuses: `PENDING` -> `PROCESSING` -> `COMPLETED` or `FAILED` (with up to 3 retries allowed via `/retry`).
   - Deduplicated per conversation using SHA-256 checksums.
4. **Chat & Grounded RAG (`Message`, `MessageSource`)**:
   - When a user sends a message (`POST /api/chat`), if the conversation has at least one `COMPLETED` document, the backend embeds the query, retrieves the top-K (default 6, min similarity 0.20) chunks from `pgvector`, injects them into a strict system prompt (`RagPromptBuilder.SYSTEM_PROMPT`), and instructs Gemini to cite sources using bracketed numbers (`[1]`, `[2]`).
   - If no completed documents exist in the conversation, it falls back to `GENERAL_SYSTEM_PROMPT` (answering from general knowledge while reminding the user once about the Vault).
   - Assistant messages store the cited `MessageSource` records (`documentId`, `documentName`, `chunkIndex`, `pageNumber`, `similarity`, and a 300-character `snippet`).

---

### 3. Existing API Surface & Contracts

All endpoints are prefixed with `/knowledgehub`:

#### Authentication & Session (`SecurityConfig`, `AuthApiController`, `AuthStatusController`)
- **Session mechanism:** Stateful HTTP session (`JSESSIONID` cookie), CSRF disabled.
- `GET /auth/status` -> `{ "authenticated": boolean, "username"?: string }`
- `POST /api/auth/register` (`application/json`) -> `{ username, email, password, firstName, lastName }`
- `POST /api/auth/login` (`application/x-www-form-urlencoded`) -> `username=...&password=...` -> `{ "username": "..." }` or `401 { "error": "Bad credentials" }`
- `POST /api/auth/logout` -> `200 OK`

#### Conversations (`ConversationApiController`)
- `GET /api/conversations` -> `ConversationView[]` (`{ id, title, updatedAt }`)
- `POST /api/conversations` -> Creates an empty `"New conversation"`, returns `ConversationView`
- `PUT /api/conversations/{id}/title` -> `{ "title": "..." }` (max 200 chars)
- `DELETE /api/conversations/{id}` -> Deletes conversation, messages, and associated documents

#### Chat (`ChatApiController`)
- `GET /api/chat/{conversationId}` -> `MessageView[]`
- `POST /api/chat?conversationId={optional}` -> Body: `{ "message": "..." }` -> Returns the assistant's `MessageView`:
  ```json
  {
    "messageId": "uuid",
    "role": "USER | ASSISTANT | SYSTEM",
    "content": "Markdown string with [1] citations...",
    "sentAt": "2026-11-02T...",
    "failed": false,
    "failureReason": null,
    "sources": [
      {
        "documentId": "uuid",
        "documentName": "report.pdf",
        "chunkIndex": 4,
        "pageNumber": 2,
        "similarity": 0.84,
        "snippet": "Excerpt text..."
      }
    ]
  }
  ```

#### Documents (`DocumentApiController`)
- `GET /api/documents?conversationId={optional}` -> `DocumentView[]`:
  ```json
  {
    "documentId": "uuid",
    "conversationId": "uuid",
    "conversationTitle": "Title",
    "fileName": "report.pdf",
    "contentType": "application/pdf",
    "fileSize": 1048576,
    "status": "PENDING | PROCESSING | COMPLETED | FAILED",
    "processingError": null,
    "chunkCount": 18,
    "createdAt": "2026-11-02T...",
    "retryable": false
  }
  ```
- `POST /api/documents/upload` (`multipart/form-data`: `file`, `conversationId`) -> `DocumentView`
- `POST /api/documents/{documentId}/retry` -> `DocumentView`
- `DELETE /api/documents/{documentId}` -> `200 OK`
- `GET /api/documents/{documentId}/download` -> Binary stream with `Content-Disposition: attachment`

---

### 4. Audit of the Current Frontend (`src/main/resources/templates/chat.html`)

Currently, the UI is a single 773-line Thymeleaf file using CDN-loaded **Alpine.js**, **Tailwind CSS**, and **Marked.js**. Key limitations and unused backend capabilities include:

1. **Unfinished Citation Inspector:**
   - The backend returns rich `SourceView` data (`snippet`, `pageNumber`, `chunkIndex`, `similarity`), and the LLM writes inline `[1]`, `[2]` citations. However, `toggleSource(idx)` in `chat.html` is an empty stub. Users cannot read the retrieved excerpt or see similarity scores and page numbers.
2. **Unused Backend Features:**
   - **Conversation Renaming:** `PUT /api/conversations/{id}/title` exists on the backend, but the UI has no way to rename conversations.
   - **Pre-Chat Conversation Creation & Upload:** `POST /api/conversations` exists, but the UI forces users to send a chat message *before* they can upload a document to a new conversation (`"Start a chat first to attach documents"`), preventing an "upload-first, ask-second" RAG workflow.
   - **Global Document Library:** `GET /api/documents` (without `conversationId`) returns all documents across all conversations (with `conversationId` and `conversationTitle` populated), but the UI only shows documents for the active chat.
   - **Missing Serialization on `DocumentView` Helper Methods:** `doc.extension` and `doc.sizeLabel` are referenced in `chat.html`, but Java record helper methods (`sizeLabel()`, `extension()`) are not serialized by Jackson without `@JsonGetter`, leaving those labels empty.
3. **Security & Rendering Risks:**
   - `marked.parse(text)` is injected directly via `x-html` without HTML sanitization (XSS risk).
   - No syntax highlighting or copy-to-clipboard buttons for code blocks.
4. **Architecture & Maintainability:**
   - Loading unpinned CDN scripts inside a monolithic HTML file lacks type safety, bundling, component reuse, URL routing (`/c/:id`, `/vault`), and automated testing.

---

## Part 2: Plan for Creating the Frontend Application

### 1. Recommended Frontend Tech Stack
- **Framework & Build Tool:** **React 19 + TypeScript + Vite** (located in `/frontend`).
- **Routing:** **React Router** (or **TanStack Router**) with URL-driven state (`/login`, `/register`, `/c/:conversationId`, `/vault`).
- **Server State & Polling:** **TanStack Query (React Query)** for managing conversation lists, optimistic chat updates, and conditional polling of document ingestion status (`PENDING` / `PROCESSING`).
- **Styling & UI Primitives:** **Tailwind CSS v4** + **Radix UI / shadcn/ui** primitives + **Lucide React** icons.
- **Markdown & Citations:** `react-markdown` + `remark-gfm` + `rehype-sanitize` + syntax highlighting + custom citation badge renderer for `[1]`, `[2]`.

---

### 2. Deployment & Backend Integration Strategy
1. **Development Mode:** Vite dev server on `http://localhost:5173` configured with a proxy forwarding `/knowledgehub/api`, `/knowledgehub/auth`, and `/knowledgehub/health` to `http://localhost:8080` (preserving `JSESSIONID` cookies on the same origin without CORS issues).
2. **Production Build:** Configure `frontend-maven-plugin` (or multi-stage Docker build) to build the Vite app into `src/main/resources/static` and update `FrontendController` to forward SPA routes (`/`, `/c/**`, `/vault`, `/login`) to `index.html`.

---

### 3. Core Functional Modules & UX Design

#### Module A: Authentication & Session Guard
- **Auth Context / Query (`GET /knowledgehub/auth/status`):** Checks session on boot; intercepts `401 Unauthorized` responses globally via an API client wrapper to redirect to `/login`.
- **Login & Registration Views:**
  - Client-side validation for registration fields (`username`, `email`, `password` min 8 chars, `firstName`, `lastName`).
  - Seamless transition after registration (chaining `/api/auth/register` -> `/api/auth/login`).

#### Module B: Workspace Shell & Conversation Sidebar
- **Conversation List:**
  - Grouped by recency (*Today*, *Yesterday*, *Previous 7 Days*, *Older*) using `updatedAt`.
  - **Inline Rename:** Double-click or action menu to call `PUT /api/conversations/{id}/title`.
  - **Delete Confirmation Dialog:** Calls `DELETE /api/conversations/{id}` with a clear warning that attached Vault documents will also be deleted.
  - **Search/Filter Input:** Instant client-side filter over conversation titles.

#### Module C: Chat Interface & Interactive RAG Citations
- **Upload-First or Chat-First Flow:**
  - Allow dragging and dropping files directly into the chat composer even on a brand-new chat: if `conversationId` is null, automatically call `POST /api/conversations` first, then `POST /api/documents/upload`, so users can upload documents before asking their first question.
- **Rich Message Stream:**
  - User & Assistant messages with timestamps (`sentAt`), failed-message error banners (`failed`, `failureReason`), and a one-click **"Retry"** button.
  - Sanitized Markdown rendering with tables, GFM task lists, and syntax-highlighted code blocks with a "Copy code" button.
- **Interactive Citation Drawer / Popover:**
  - Parse inline bracket citations (`[1]`, `[2]`) in assistant responses and render them as interactive pills.
  - Clicking a citation pill or source card at the bottom of a message opens a **Source Inspector Drawer** showing:
    - Document filename & direct **Download** button (`/api/documents/{id}/download`)
    - Page number (`pageNumber`) & Chunk index (`chunkIndex + 1`)
    - Relevance / Similarity score meter (`Math.round(similarity * 100)%`)
    - Full retrieved text `snippet` highlighted in context

#### Module D: Conversation Vault & Global Document Manager
- **Contextual Vault Drawer + Dedicated Global `/vault` Page:**
  - **In-Conversation Vault Drawer:** Slide-over panel next to the chat showing documents attached to the current `conversationId`, allowing users to monitor status and upload files without leaving the chat stream.
  - **Global Document Hub (`/vault`):** Calls `GET /api/documents` (without `conversationId`) to display all documents across all conversations, filterable by status (`COMPLETED`, `PROCESSING`, `FAILED`), file type (`PDF`, `MD`, `CSV`, `TXT`, `JSON`), and conversation title.
- **Client-Side Pre-Validation & Upload Dropzone:**
  - Validate file extension (`pdf, txt, md, csv, json`) and size (<= 20 MB) before uploading, matching `DocumentValidator.java`.
  - Format file size (`KB` / `MB`) and file extension badges in TypeScript on the client.
- **Smart Ingestion Polling:**
  - Using TanStack Query's `refetchInterval`, automatically poll `/api/documents?conversationId=...` every 2.5 seconds **only** while at least one document is in `PENDING` or `PROCESSING` state, and stop when all reach `COMPLETED` or `FAILED`.
  - Display error details (`processingError`) and a **Retry** button (`POST /api/documents/{id}/retry`) when `retryable === true`.

---

### 4. Proposed Frontend Folder Structure

```text
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts               # Proxy /knowledgehub -> http://localhost:8080
└── src/
    ├── main.tsx
    ├── App.tsx                  # Router + QueryClientProvider + AuthGuard
    ├── api/
    │   ├── client.ts            # Fetch wrapper with base '/knowledgehub' & 401 interceptor
    │   ├── auth.ts              # status, login (form-urlencoded), register, logout
    │   ├── conversations.ts     # list, create, rename, delete
    │   ├── chat.ts              # getHistory, sendMessage
    │   └── documents.ts         # list, upload, retry, remove, getDownloadUrl
    ├── types/
    │   └── api.ts               # TypeScript interfaces matching Java DTO records
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── useConversations.ts
    │   ├── useChat.ts
    │   └── useDocuments.ts      # Includes conditional polling for PENDING/PROCESSING
    ├── components/
    │   ├── layout/
    │   │   ├── AppShell.tsx
    │   │   ├── Sidebar.tsx
    │   │   └── TopBar.tsx
    │   ├── chat/
    │   │   ├── MessageList.tsx
    │   │   ├── MessageBubble.tsx
    │   │   ├── MarkdownRenderer.tsx
    │   │   ├── CitationBadge.tsx
    │   │   ├── SourceInspectorDrawer.tsx
    │   │   └── ChatComposer.tsx
    │   ├── vault/
    │   │   ├── VaultDrawer.tsx  # Side-by-side drawer in active chat
    │   │   ├── DropzoneUploader.tsx
    │   │   ├── DocumentCard.tsx
    │   │   └── DocumentStatusBadge.tsx
    │   └── ui/                  # Reusable buttons, modals, tooltips, toasts
    ├── pages/
    │   ├── AuthPage.tsx
    │   ├── ChatWorkspacePage.tsx
    │   └── GlobalVaultPage.tsx
    └── utils/
        └── formatters.ts        # formatBytes(), getExtension(), formatRelativeTime()
```

---

### 5. Phased Implementation Roadmap

#### Phase 1: Scaffolding, API Layer & Auth Flow
1. Initialize Vite + React + TypeScript + Tailwind CSS project in `frontend/`.
2. Configure Vite dev proxy for `/knowledgehub` to `http://localhost:8080`.
3. Define strict TypeScript types matching `ConversationView`, `MessageView`, `SourceView`, and `DocumentView`.
4. Implement API client (`api/client.ts`) handling `application/x-www-form-urlencoded` for `/api/auth/login` and JSON/multipart for all other endpoints.
5. Build `AuthPage` (Sign In / Create Account tabs) and `AuthGuard` using `/auth/status`.

#### Phase 2: App Shell & Conversation Management
1. Build responsive `AppShell` and `Sidebar` with conversation list grouped by date.
2. Wire up `useConversations` hook for listing, creating (`POST /api/conversations`), inline renaming (`PUT /api/conversations/{id}/title`), and deleting (`DELETE /api/conversations/{id}`).
3. Connect URL routing (`/c/:conversationId`) so refreshing the browser or sharing a link preserves the active conversation.

#### Phase 3: Core Chat Experience & Citation Inspector
1. Build `MessageList`, `MessageBubble`, and `ChatComposer` with auto-expanding textarea, keyboard shortcuts (`Enter` to send, `Shift+Enter` for newline), and optimistic UI updates.
2. Implement `MarkdownRenderer` with syntax highlighting, safe HTML sanitization, and custom parsing for `[1]`, `[2]` inline citation tokens.
3. Build `SourceInspectorDrawer` to display `snippet`, `pageNumber`, `chunkIndex`, `similarity` percentage, and a direct download button when a user clicks any citation badge.

#### Phase 4: Document Vault (Contextual Drawer & Global View)
1. Build `DropzoneUploader` with client-side validation (20 MB limit, `pdf, txt, md, csv, json` extensions) and upload-before-first-message support (auto-creating a conversation if needed).
2. Implement `VaultDrawer` (slide-out right panel in the chat view) so users can upload and monitor documents while chatting.
3. Implement automatic status polling in `useDocuments` whenever any document has `status === 'PENDING' || status === 'PROCESSING'`.
4. Build `GlobalVaultPage` (`/vault`) showing all user documents across conversations (`GET /api/documents`), with search, status filtering, retry (`POST /retry`), delete, and jump-to-conversation links.

#### Phase 5: Polish, Testing & Production Packaging
1. Add toast notifications for background events (e.g., *"report.pdf finished processing (18 chunks)"* or *"Failed to process file"*).
2. Add Vitest + React Testing Library unit tests for key components (`ChatComposer`, `CitationBadge`, `DropzoneUploader`, `useDocuments` polling logic).
3. Configure production build output to integrate cleanly with Spring Boot static asset serving (or Docker Compose).
