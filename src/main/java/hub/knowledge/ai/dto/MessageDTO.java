package hub.knowledge.ai.dto;

import hub.knowledge.ai.model.Document;
import lombok.Data;

import java.time.Instant;

@Data
public class MessageDTO {
    private String messageId , conversationId , userMessage;
    private DocumentDTO documentDTO;
    private Instant sentAt = Instant.now();
}
