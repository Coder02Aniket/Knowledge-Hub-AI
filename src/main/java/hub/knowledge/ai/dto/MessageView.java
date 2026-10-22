package hub.knowledge.ai.dto;

import hub.knowledge.ai.model.MessageRole;

import java.time.Instant;
import java.util.List;

public record MessageView(
        String messageId,
        MessageRole role,
        String content,
        Instant sentAt,
        boolean failed,
        String failureReason,
        List<SourceView> sources
) {
    public boolean isUser() {
        return role == MessageRole.USER;
    }

    public boolean isAssistant() {
        return role == MessageRole.ASSISTANT;
    }
}
