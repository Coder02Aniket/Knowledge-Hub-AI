package hub.knowledge.ai.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Getters and setters
    public String title;
}