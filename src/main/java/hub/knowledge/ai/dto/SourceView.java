package hub.knowledge.ai.dto;

import com.fasterxml.jackson.annotation.JsonGetter;

public record SourceView(
        String documentId,
        String documentName,
        int chunkIndex,
        Integer pageNumber,
        double similarity,
        String snippet,
        String retrievalMethod
) {
    @JsonGetter("scoreLabel")
    public String scoreLabel() {
        return Math.round(similarity * 100) + "%";
    }

    @JsonGetter("locationLabel")
    public String locationLabel() {
        if (pageNumber != null && pageNumber > 0) {
            return "p. " + pageNumber + " · chunk " + (chunkIndex + 1);
        }
        return "chunk " + (chunkIndex + 1);
    }
}
