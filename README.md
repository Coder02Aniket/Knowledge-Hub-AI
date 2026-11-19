# KnowledgeHub AI

KnowledgeHub is a RAG-style assistant: users upload documents (PDF / TXT / DOCX / MD), the
backend extracts text, chunks it, indexes it, and answers questions grounded in those
documents with citations.

## Current milestone: hybrid retrieval + decision reranker

This milestone completes the hybrid retrieval and decision layer that was previously
plan-only and turns the assistant into a grounded, self-routing chat experience.

### What shipped

- **Hybrid retrieval**
  - `pgvector` dense retrieval (`ChunkSearchRepository`) over a candidate pool.
  - Postgres lexical / full-text retrieval (`ChunkLexicalSearchRepository`) with
    `to_tsquery`, `ts_rank_cd`, and an `ILIKE` phrase boost.
  - Optional literal line-grep tier over an extracted-text sidecar (`GrepFileSearchService`),
    mapped back onto real chunks and cached.
  - Reciprocal Rank Fusion (`ReciprocalRankFusion`) across all sources with dedupe and
    score normalization.

- **Decision reranker**
  - `gemini-decision-1` via `POST /v1beta/decisions` (`GeminiDecisionClient`,
    `GeminiContextDecisionModel`).
  - One request carries a route choice (`grounded` / `general` / `insufficient`) plus
    per-passage relevance and prompt-injection screens.
  - Fails open to fused ranking on error, timeout, safety rejection, or malformed response.
  - `NoopContextDecisionModel` available when decisions are disabled.

- **Routing and citations**
  - `ChatService` routes by decision and persists only the chunks that were actually sent
    (`PromptContext`), fixing stale citations from truncated chunks.

- **Retrieval provenance surfaced in the UI**
  - `retrievalMethod` is persisted per citation (`VECTOR`, `LEXICAL`, `GREP`, or a `+`-joined
    combination) and returned as `retrievalMethod` on `SourceView`.
  - `RetrievalBadge` renders a small blinking pill (Vector / Keyword / Grep / Hybrid / Fused)
    next to each citation, with click-to-explain.

- **Answer formatting**
  - Assistant answers render through `ReactMarkdown` + `remark-gfm` and now also support
    KaTeX math (`$...$`), so formatted output from the model is actually displayed.

### Configuration

Defaults live in `src/main/resources/application.yaml` under `knowledgehub.retrieval.*`.

- `knowledgehub.retrieval.decision.enabled` (default `true`) — toggle the Decisions API.
- `knowledgehub.retrieval.grep.enabled` (default `true`) — toggle the line-grep tier.
- `knowledgehub.retrieval.decision.relevance`, `routeConfidenceThreshold`,
  `injectionThreshold`, `maxPassages`, `injectionScreen`.
- Candidate counts and RRF `k`.

Disable decisions only:

```bash
KNOWLEDGEHUB_DECISION_ENABLED=false
```

Disable grep only:

```bash
KNOWLEDGEHUB_GREP_ENABLED=false
```

### Verification

- Backend unit tests: hybrid fusion, lexical query building, grep mapping, decision
  interpretation, injection drops, fallback, prompt budget, wire format — 37 passing.
- Live smoke tests against Dockerized Postgres + MinIO.
- Live `gemini-decision-1` call verified (`noul ≈ 0.99`).
- End-to-end chat round trip: upload → index → ask → grounded answer with citations.

## Layout

- `src/main/java/hub/knowledge/ai/retrieval/` — hybrid retrieval, decision client/model, RRF, prompts.
- `src/main/java/hub/knowledge/ai/service/` — chat, document, conversation services.
- `src/main/java/hub/knowledge/ai/processing/` — extraction, chunking, ingestion.
- `frontend/` — React (Vite) SPA served under `/knowledgehub`.

## Running

- Backend: `./mvnw spring-boot:run`
- Frontend: `bun run dev` (proxies `/knowledgehub` → `localhost:8080`)
- Build UI into the backend: `cd frontend && bun run build` (outputs to `src/main/resources/static`)

---

*This README replaced the superseded `REFACTORING_PLAN.md` during the milestone cleanup.*
