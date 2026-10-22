package hub.knowledge.ai.dto;

public record SourceView(
        String documentId,
        String documentName,
        int chunkIndex,
        Integer pageNumber,
        double similarity,
        String snippet
) {
    public String scoreLabel() {
        return Math.round(similarity * 100) + "%";
    }

    public String locationLabel() {
        if (pageNumber != null && pageNumber > 0) {
            return "p. " + pageNumber + " · chunk " + (chunkIndex + 1);
        }
        return "chunk " + (chunkIndex + 1);
    }
}
