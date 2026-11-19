package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Used when {@code knowledgehub.retrieval.decision.enabled=false}. It keeps the
 * hybrid candidate generation and fused ranking but skips the external model call.
 */
@Service
@ConditionalOnProperty(name = "knowledgehub.retrieval.decision.enabled", havingValue = "false")
public class NoopContextDecisionModel implements ContextDecisionModel {

    private final KnowledgeHubProperties properties;

    public NoopContextDecisionModel(KnowledgeHubProperties properties) {
        this.properties = properties;
    }

    @Override
    public RerankDecision decide(String question, List<CandidateChunk> candidates, boolean documentsPresent) {
        int topK = properties.getRetrieval().getTopK();
        List<CandidateChunk> top = candidates == null ? List.of()
                : candidates.stream().limit(topK).toList();

        RetrievalRoute route;
        if (!documentsPresent) {
            route = RetrievalRoute.GENERAL;
        } else if (top.isEmpty()) {
            route = RetrievalRoute.INSUFFICIENT;
        } else if (top.get(0).fusedScore() < properties.getRetrieval().getMinScore()) {
            route = RetrievalRoute.INSUFFICIENT;
        } else {
            route = RetrievalRoute.GROUNDED;
        }
        return RerankDecision.fallback(route, top, 0.0, "decision model disabled");
    }

    @Override
    public String providerName() {
        return "noop";
    }
}
