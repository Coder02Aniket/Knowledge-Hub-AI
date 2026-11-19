package hub.knowledge.ai.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "documents",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_documents_conversation_checksum",
                columnNames = {"conversation_id", "checksum_sha256"}),
        indexes = {
        @Index(name = "idx_documents_conversation", columnList = "conversation_id"),
        @Index(name = "idx_documents_user", columnList = "user_id"),
        @Index(name = "idx_documents_status", columnList = "status")
})
public class Document {

    @Id
    @Column(length = 36)
    private String documentId;

    /**
     * Owner of the document. Every read path filters on this column; it is the
     * primary isolation boundary until/unless shared workspaces are introduced.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id")
    private Conversation conversation;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "file_type", length = 150)
    private String contentType;

    @Column(name = "file_size")
    private Long fileSize;

    /** Private object key inside the configured bucket. Never exposed as a URL. */
    @Column(name = "object_key", length = 512)
    private String objectKey;

    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 32)
    private DocumentStatus status = DocumentStatus.PENDING;

    @Column(name = "processing_error", length = 2000)
    private String processingError;

    @Column(name = "chunk_count")
    private Integer chunkCount;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @PrePersist
    void onCreate() {
        if (documentId == null) {
            documentId = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = DocumentStatus.PENDING;
        }
    }

    public boolean isProcessing() {
        return status == DocumentStatus.PENDING || status == DocumentStatus.PROCESSING;
    }
}
