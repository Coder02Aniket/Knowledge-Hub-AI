package hub.knowledge.ai.retrieval;

import java.util.List;

/**
 * The rendered prompt and the exact excerpts that fit inside the context budget.
 * Only {@code included} should be persisted as message sources.
 */
public record PromptContext(String prompt, List<RetrievedChunk> included) {
}
