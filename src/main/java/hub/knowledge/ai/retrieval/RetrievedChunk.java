package hub.knowledge.ai.retrieval;

public record RetrievedChunk(
        String chunkId,
        String documentId,
        String documentName,
        int chunkIndex,
        Integer pageNumber,
        String content,
        double similarity
) {
}
