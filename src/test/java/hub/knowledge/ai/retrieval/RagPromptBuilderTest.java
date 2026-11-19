package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RagPromptBuilderTest {

    @Test
    void includesOnlyChunksThatFitTheBudget() {
        KnowledgeHubProperties properties = new KnowledgeHubProperties();
        properties.getRetrieval().setMaxContextCharacters(200);
        RagPromptBuilder builder = new RagPromptBuilder(properties);

        List<RetrievedChunk> chunks = List.of(
                chunk("a", "first excerpt", 0.9),
                chunk("b", "second excerpt that will not fit", 0.8));

        PromptContext context = builder.buildUserPrompt("question", chunks, RetrievalRoute.GROUNDED);

        assertThat(context.included()).extracting(RetrievedChunk::chunkId).containsExactly("a");
        assertThat(context.prompt()).contains("first excerpt");
        assertThat(context.prompt()).doesNotContain("second excerpt");
        assertThat(context.prompt()).contains("UNTRUSTED_DOCUMENT_EXCERPT");
    }

    @Test
    void insufficientRouteSendsNoExcerpts() {
        KnowledgeHubProperties properties = new KnowledgeHubProperties();
        RagPromptBuilder builder = new RagPromptBuilder(properties);

        PromptContext context = builder.buildUserPrompt(
                "question", List.of(chunk("a", "content", 0.9)), RetrievalRoute.INSUFFICIENT);

        assertThat(context.included()).isEmpty();
        assertThat(context.prompt()).contains("No relevant excerpts were retrieved");
    }

    @Test
    void truncatesLongContentButStillIncludesIt() {
        KnowledgeHubProperties properties = new KnowledgeHubProperties();
        properties.getRetrieval().setMaxContextCharacters(300);
        RagPromptBuilder builder = new RagPromptBuilder(properties);

        String content = "x".repeat(1000);
        PromptContext context = builder.buildUserPrompt(
                "question", List.of(chunk("a", content, 0.9)), RetrievalRoute.GROUNDED);

        assertThat(context.included()).hasSize(1);
        assertThat(context.prompt()).contains("...");
    }

    private RetrievedChunk chunk(String id, String content, double score) {
        return new RetrievedChunk(id, "doc", "file.pdf", 1, 2, content, score,
                0.0, 0.0, score, "DECISION");
    }
}
