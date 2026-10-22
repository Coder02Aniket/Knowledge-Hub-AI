package hub.knowledge.ai.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * A citation attached to an assistant message. Document details are copied rather
 * than referenced so that deleting a document does not erase the provenance of
 * past answers.
 */
@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "message_sources", indexes = {
        @Index(name = "idx_message_sources_message", columnList = "message_id")
})
public class MessageSource {

    @Id
    @Column(length = 36)
    private String sourceId;

    @Column(name = "document_id", length = 36)
    private String documentId;

    @Column(name = "document_name", nullable = false, length = 255)
    private String documentName;

    @Column(name = "chunk_index", nullable = false)
    private int chunkIndex;

    @Column(name = "page_number")
    private Integer pageNumber;

    @Column(name = "similarity")
    private double similarity;

    @Column(name = "snippet", columnDefinition = "text")
    private String snippet;

    @PrePersist
    void onCreate() {
        if (sourceId == null) {
            sourceId = UUID.randomUUID().toString();
        }
    }
}
