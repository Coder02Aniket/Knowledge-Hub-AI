# Refactoring Plan: Migrating to Spring AI Native Messages & Chat Memory

## 1. Executive Summary & Objective

The objective of this refactoring is to transition the **Knowledge-Hub-AI** application from a bespoke, tightly-coupled custom message representation (`userMessage` + `modelResponse` in a single entity/DTO) to the standardized message and conversational memory architecture provided by **Spring AI** (`org.springframework.ai.chat.messages.*` and `org.springframework.ai.chat.memory.*`).

This migration will:
- Establish first-class conversational role separation (`USER`, `ASSISTANT`, `SYSTEM`).
- Leverage Spring AI's native `ChatMemory` and `MessageChatMemoryAdvisor` to maintain conversation history automatically.
- Enable seamless multi-turn context retention across conversation turns with Google GenAI (Gemini).
- Provide a clean, extensible foundation for document grounding, retrieval-augmented generation (RAG), and tool-calling without breaking existing frontend contracts.

---

## 2. Current Architecture vs. Target Architecture

### 2.1 Current Implementation (As-Is)
- **Entity (`hub.knowledge.ai.model.Message`)**:
  - Couples both user input (`userMessage`) and assistant output (`modelResponse`) in a single record.
  - Lacks role identification (`MessageType`).
  - Lacks multi-turn conversation sequencing (each database row is treated as a pair rather than discrete events in time).
- **Service Layer (`hub.knowledge.ai.service.AIServiceImpl`)**:
  - Manually constructs `Prompt` using only the latest `userMessage`:
    ```java
    Prompt prompt = Prompt.builder().content(userMessage.getUserMessage()).build();
    ChatClient.CallResponseSpec crs = chatClient.prompt(prompt).call();
    userMessage.setModelResponse(crs.content());
    ```
  - Historical context is ignored completely; the LLM has zero conversational memory.
- **Chat Memory (`hub.knowledge.ai.service.ChatMemoryService`)**:
  - Exists as an empty stub with no implementation.
- **Bugs/Defects Present**:
  - Syntax error in `MessageServiceImpl.java:73` (`aiService.getAIR esponse(messageDto, conDto);`).

### 2.2 Target Implementation (To-Be)
- **Spring AI Message Model (`org.springframework.ai.chat.messages.*`)**:
  - Adopts Spring AI's message hierarchy:
    - `UserMessage`: User-generated prompts (including support for attachments / media).
    - `AssistantMessage`: Model-generated replies (including metadata, token counts).
    - `SystemMessage`: System prompts guiding assistant persona and grounding.
- **Persistence & Entity Adapter**:
  - `Message` entity represents a single discrete message with `MessageType` (`USER`, `ASSISTANT`, `SYSTEM`), `content`, `sentAt`, `conversation`, and optional `document` association.
  - Bidirectional mapping between JPA entity and Spring AI `Message` objects.
- **Spring AI `ChatMemoryRepository` & `ChatMemory`**:
  - `ChatMemoryService` implements `org.springframework.ai.chat.memory.ChatMemoryRepository` backed by JPA / `MessageRepository`.
  - Spring bean `MessageWindowChatMemory` maintains a configurable sliding window of previous messages (e.g., last 20 messages).
- **Advisor Pipeline in `ChatClient`**:
  - `ChatClient` configured with `MessageChatMemoryAdvisor`.
  - Conversational context is injected transparently into Gemini prompts using the `conversationId` parameter.

---

## 3. Phased Implementation Roadmap

### Phase 1: Entity & Repository Transformation
1. **Refactor `hub.knowledge.ai.model.Message`**:
   - Add `MessageType messageType` (persisted as String or Ordinal).
   - Consolidate text content into a single field: `@Lob private String content`.
   - Retain metadata: `Instant sentAt`, `Conversation conversation`, `User user`, `Document document`.
   - Provide conversion methods:
     - `org.springframework.ai.chat.messages.Message toSpringAIMessage()`
     - `static Message fromSpringAIMessage(org.springframework.ai.chat.messages.Message msg, Conversation conversation, User user)`
2. **Update `hub.knowledge.ai.repository.MessageRepository`**:
   - Add query methods:
     - `List<Message> findByConversation_ConversationIdOrderBySentAtAsc(String conversationId)`
     - `void deleteByConversation_ConversationId(String conversationId)`
     - `List<String> findDistinctConversationIds()`

### Phase 2: Implement Persistent `ChatMemoryRepository` & ChatMemory Bean
1. **Implement `ChatMemoryRepository` in `ChatMemoryService`**:
   - Implement `org.springframework.ai.chat.memory.ChatMemoryRepository`:
     - `List<org.springframework.ai.chat.messages.Message> findByConversationId(String conversationId)`
     - `void saveAll(String conversationId, List<org.springframework.ai.chat.messages.Message> messages)`
     - `void deleteByConversationId(String conversationId)`
     - `List<String> findConversationIds()`
2. **Configure Beans in `AIConfiguration`**:
   - Register `ChatMemory` using `MessageWindowChatMemory.builder().chatMemoryRepository(...).maxMessages(20).build()`.
   - Customize `ChatClient.Builder` with `MessageChatMemoryAdvisor`.

### Phase 3: AI Service & Chat Client Integration
1. **Refactor `AIServiceImpl`**:
   - Inject configured `ChatClient`.
   - Update `getAIResponse(String conversationId, String promptText)`:
     ```java
     return chatClient.prompt()
         .user(promptText)
         .advisors(a -> a.param(ChatMemory.CONVERSATION_ID, conversationId))
         .call()
         .content();
     ```
   - Automatically handles conversation history loading and response saving via the advisor pipeline.

### Phase 4: Service Orchestration & DTO Compatibility Layer
1. **Fix `MessageServiceImpl`**:
   - Resolve compilation syntax error (`getAIR esponse`).
   - Coordinate conversation lookup / creation.
   - Dispatch user message to AI service and return structured response.
2. **Maintain API Contract in `MessageDTO` & `MessageController`**:
   - Keep `MessageDTO` compatible with existing frontend (`chat.html`):
     - `userMessage`: Prompt submitted by the user.
     - `modelResponse`: Content returned by the assistant.
     - `conversationId`: Active conversation UUID.
   - If desired, add support for discrete message payloads for modern clients (`content`, `messageType`).

### Phase 5: Verification & Quality Assurance
1. **Compile & Build Validation**:
   - Run Maven compile (`./mvnw.cmd test-compile -q`) to ensure no compilation issues.
2. **Automated Unit & Integration Tests**:
   - Test Spring AI message conversion (`UserMessage` -> Entity -> `UserMessage`).
   - Test `ChatMemoryRepository` persistence and sliding window retrieval.
   - Test `MessageServiceImpl` conversational flow.
3. **End-to-End Chat UI Verification**:
   - Validate `/api/messages/chat` with `chat.html` ensuring consecutive questions retain context of earlier questions.

---

## 4. Risk Mitigation & Compatibility Strategy

| Risk | Impact | Mitigation |
| :--- | :--- | :--- |
| **Frontend Breaking Changes** | `chat.html` expects JSON with `modelResponse` and `conversationId`. | Keep `MessageDTO` fields populated so frontend JavaScript functions seamlessly without breaking. |
| **Database Schema Evolution** | JPA table `messages` structure changes. | Since Hibernate `ddl-auto: update` is active in `application.yaml`, new columns (`content`, `message_type`) will be created automatically. Legacy columns can be retained or mapped gracefully. |
| **Context Window Overflow** | Sending too many past messages could exceed LLM tokens. | `MessageWindowChatMemory` enforces a capped window (e.g. 20 messages), preventing prompt bloat. |

---

## 5. Definition of Done (DoD)
- [x] `REFACTORING_PLAN.md` recorded and reviewed.
- [x] `Message` model aligns with Spring AI `MessageType`.
- [x] `ChatMemoryService` implements `ChatMemoryRepository` with full JPA persistence.
- [x] `ChatClient` utilizes `MessageChatMemoryAdvisor` for conversational memory.
- [x] `MessageServiceImpl` compilation error fixed and service logic refactored.
- [x] All unit and integration tests pass cleanly with `./mvnw.cmd test`.
- [x] Backward compatibility with `chat.html` and REST endpoints verified.
