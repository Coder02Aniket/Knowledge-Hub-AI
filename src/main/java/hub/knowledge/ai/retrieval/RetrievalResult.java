package hub.knowledge.ai.retrieval;

import java.util.List;

public record RetrievalResult(
        List<RetrievedChunk> chunks,
        RetrievalRoute route,
        String reason,
        boolean reranked,
        int candidateCount
) {

    public static RetrievalResult general(String reason) {
        return new RetrievalResult(List.of(), RetrievalRoute.GENERAL, reason, false, 0);
    }

    public static RetrievalResult insufficient(String reason, int candidateCount) {
        return new RetrievalResult(List.of(), RetrievalRoute.INSUFFICIENT, reason, false, candidateCount);
    }
}
