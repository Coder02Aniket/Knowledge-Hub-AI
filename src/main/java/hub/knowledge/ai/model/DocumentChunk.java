package hub.knowledge.ai.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.ColumnTransformer;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "document_chunks",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_document_chunks_document_index",
                columnNames = {"document_id", "chunk_index"}),
        indexes = @Index(name = "idx_document_chunks_document", columnList = "document_id"))
public class DocumentChunk {

    @Id
    @Column(length = 36)
    private String chunkId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "chunk_index", nullable = false)
    private int chunkIndex;

    @Column(name = "content", columnDefinition = "text", nullable = false)
    private String content;

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(name = "token_count", nullable = false)
    private int tokenCount;

    /**
     * pgvector literal (for example {@code [0.1,0.2,...]}). Hibernate has no native
     * vector type, so the write is explicitly cast to {@code vector}. Reads go through
     * JDBC which renders the vector back as its text representation.
     */
    @Column(name = "embedding", columnDefinition = "vector(768)")
    @ColumnTransformer(write = "?::vector")
    private String embedding;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public DocumentChunk(Document document, int chunkIndex, String content, Integer pageNumber,
                         int tokenCount, String embedding) {
        this.document = document;
        this.chunkIndex = chunkIndex;
        this.content = content;
        this.pageNumber = pageNumber;
        this.tokenCount = tokenCount;
        this.embedding = embedding;
    }

    @PrePersist
    void onCreate() {
        if (chunkId == null) {
            chunkId = UUID.randomUUID().toString();
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
