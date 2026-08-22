package hub.knowledge.ai.service;

import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.model.User;
import hub.knowledge.ai.repository.ConversationRepository;
import hub.knowledge.ai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ConversationsServiceImpl implements IConversationsService {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserRepository userRepository;


    @Override
    public Conversation getConversationById(String conversationId) {
        return conversationRepository.getConversationByConversationId(conversationId);
    }



    @Override
    public List<Conversation> getConversationsByUserId(String userId) {
        return conversationRepository.getConversationsByUserId(userId);
    }

    @Override
    public Conversation CreateConversation(User user) {
        String id  = user.getId();

        return CreateConversation(id);
    }

    @Override
    public Conversation CreateConversation(String userId) {

        Conversation conversation = new Conversation();

        conversation.setUser(userRepository.findById(userId).orElseThrow(()-> new RuntimeException("User not found!")));




        conversationRepository.save(conversation);

        return conversation;
    }
}
