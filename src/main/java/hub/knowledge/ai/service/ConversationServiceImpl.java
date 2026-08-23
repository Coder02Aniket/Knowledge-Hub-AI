package hub.knowledge.ai.service;

import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.model.User;
import hub.knowledge.ai.repository.ConversationDao;
import hub.knowledge.ai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ConversationServiceImpl implements IConversationService {

    @Autowired
    private ConversationDao conversationDao;

    @Autowired
    private UserRepository userRepository;


    @Override
    public Conversation getConversationById(String conversationId) {
        Optional<Conversation> conversation =  conversationDao.findById(conversationId);
        return conversation.orElseThrow(()-> new RuntimeException("Conversation with id " + conversationId + " not found"));
    }



    @Override
    public List<Conversation> getConversationsByUserId(String userId) {
        return conversationDao.getConversationsByUserId(userId);
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




        conversationDao.save(conversation);

        return conversation;
    }

    @Override
    public Conversation saveConversation(Conversation conversation) {
        return conversationDao.save(conversation);
    }
}
