package hub.knowledge.ai.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;


@Entity
@Data
@Table(name = "documents")
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    // Getters and setters
    private String fileName;

    @CreationTimestamp
    private LocalDateTime timestamp;

    private String fileType;

    private String objectKey;

    @OneToOne(mappedBy = "document")
    private Message message ;


}