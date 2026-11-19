package hub.knowledge.ai.dto;

import com.fasterxml.jackson.annotation.JsonGetter;
import hub.knowledge.ai.model.DocumentStatus;

import java.time.LocalDateTime;

public record DocumentView(
        String documentId,
        String conversationId,
        String conversationTitle,
        String fileName,
        String contentType,
        long fileSize,
        DocumentStatus status,
        String processingError,
        Integer chunkCount,
        LocalDateTime createdAt,
        boolean retryable
) {
    @JsonGetter("sizeLabel")
    public String sizeLabel() {
        if (fileSize <= 0) {
            return "—";
        }
        if (fileSize >= 1024 * 1024) {
            return String.format(java.util.Locale.ROOT, "%.1f MB", fileSize / (1024.0 * 1024.0));
        }
        return String.format(java.util.Locale.ROOT, "%.0f KB", fileSize / 1024.0);
    }

    @JsonGetter("extension")
    public String extension() {
        int dot = fileName == null ? -1 : fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "DOC";
        }
        return fileName.substring(dot + 1).toUpperCase(java.util.Locale.ROOT);
    }

    @JsonGetter("ready")
    public boolean isReady() {
        return status == DocumentStatus.COMPLETED;
    }
}
