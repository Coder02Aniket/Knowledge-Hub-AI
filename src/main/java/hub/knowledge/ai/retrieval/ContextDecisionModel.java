package hub.knowledge.ai.retrieval;

import java.util.List;

/**
 * Chooses which candidates reach the chat model and how the answer should be grounded.
 * Implementations must fail open: retrieval should never fail because the model is down.
 */
public interface ContextDecisionModel {

    RerankDecision decide(String question, List<CandidateChunk> candidates, boolean documentsPresent);

    String providerName();
}
