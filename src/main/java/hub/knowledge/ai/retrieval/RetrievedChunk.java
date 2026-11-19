package hub.knowledge.ai.retrieval;

public record RetrievedChunk(
        String chunkId,
        String documentId,
        String documentName,
        int chunkIndex,
        Integer pageNumber,
        String content,
        double similarity,
        double vectorScore,
        double lexicalScore,
        double decisionScore,
        String retrievalMethod
) {

    public static RetrievedChunk fromCandidate(CandidateChunk candidate,
                                               double similarity,
                                               double decisionScore,
                                               String retrievalMethod) {
        return new RetrievedChunk(
                candidate.chunkId(),
                candidate.documentId(),
                candidate.documentName(),
                candidate.chunkIndex(),
                candidate.pageNumber(),
                candidate.content(),
                similarity,
                candidate.vectorScore(),
                candidate.lexicalScore(),
                decisionScore,
                retrievalMethod);
    }
}
