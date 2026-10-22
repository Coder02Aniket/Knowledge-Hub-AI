package hub.knowledge.ai.ai;

import hub.knowledge.ai.model.MessageRole;

public record ChatTurn(MessageRole role, String content) {
}
