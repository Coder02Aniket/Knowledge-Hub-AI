package hub.knowledge.ai.retrieval;

import java.util.List;

public record RerankDecision(
        RetrievalRoute route,
        List<ScoredChunk> selected,
        double routeConfidence,
        boolean reranked,
        String reason
) {

    public record ScoredChunk(String chunkId, double relevance, double injectionRisk) {
    }

    public static RerankDecision fallback(RetrievalRoute route, List<CandidateChunk> top,
                                          double routeConfidence, String reason) {
        List<ScoredChunk> selected = route == RetrievalRoute.GROUNDED
                ? top.stream()
                    .map(c -> new ScoredChunk(c.chunkId(), c.fusedScore(), 0.0))
                    .toList()
                : List.of();
        return new RerankDecision(route, selected, routeConfidence, false, reason);
    }
}
