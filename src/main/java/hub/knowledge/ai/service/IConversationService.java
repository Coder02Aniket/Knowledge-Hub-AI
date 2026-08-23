package hub.knowledge.ai.service;

import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.model.User;

import java.util.List;
import java.util.Optional;

public interface IConversationService {

    Conversation getConversationById(String conversationId);

    List<Conversation> getConversationsByUserId(String userId);

    Conversation CreateConversation(User user);

    Conversation CreateConversation(String userId);

    Conversation saveConversation(Conversation conversation);
}
