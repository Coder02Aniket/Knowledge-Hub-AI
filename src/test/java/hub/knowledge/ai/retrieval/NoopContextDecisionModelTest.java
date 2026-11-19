package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class NoopContextDecisionModelTest {

    @Test
    void groundsWhenDocumentsExistAndCandidatesArePresent() {
        KnowledgeHubProperties properties = new KnowledgeHubProperties();
        NoopContextDecisionModel model = new NoopContextDecisionModel(properties);

        RerankDecision decision = model.decide("question",
                List.of(candidate("a", 1.0)), true);

        assertThat(decision.route()).isEqualTo(RetrievalRoute.GROUNDED);
        assertThat(decision.reranked()).isFalse();
        assertThat(decision.selected()).extracting(RerankDecision.ScoredChunk::chunkId)
                .containsExactly("a");
    }

    @Test
    void answersGenerallyWhenNoDocumentsArePresent() {
        NoopContextDecisionModel model = new NoopContextDecisionModel(new KnowledgeHubProperties());

        RerankDecision decision = model.decide("question", List.of(), false);

        assertThat(decision.route()).isEqualTo(RetrievalRoute.GENERAL);
        assertThat(decision.selected()).isEmpty();
    }

    @Test
    void isInsufficientWhenDocumentsExistButNothingWasRetrieved() {
        NoopContextDecisionModel model = new NoopContextDecisionModel(new KnowledgeHubProperties());

        RerankDecision decision = model.decide("question", List.of(), true);

        assertThat(decision.route()).isEqualTo(RetrievalRoute.INSUFFICIENT);
    }

    private CandidateChunk candidate(String id, double fusedScore) {
        return new CandidateChunk(id, "doc", "file.pdf", 1, 2, "content",
                0.0, 0.0, 0.0, fusedScore, Set.of("VECTOR"));
    }
}
