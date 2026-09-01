package hub.knowledge.ai.service;

import hub.knowledge.ai.dto.ConversationDTO;
import hub.knowledge.ai.mapper.ConversationMapper;
import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.model.User;
import hub.knowledge.ai.repository.ConversationRepository;
import hub.knowledge.ai.repository.UserRepository;
import lombok.NonNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ConversationServiceImpl implements IConversationService {

    @Autowired
    private ConversationRepository conRepo;

    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ConversationMapper conversationMapper;


    @Override
    public Conversation getConversationById(String conversationId) {
        Optional<Conversation> conversation =  conRepo.findById(conversationId);
        return conversation.orElseThrow(()-> new RuntimeException("Conversation with id " + conversationId + " not found"));
    }



    @Override
    public List<Conversation> getConversationsByUserId(String userId) {
        return conRepo.getConversationsByUserId(userId);
    }

    @Override
    public Conversation CreateConversation(User user) {
        String id  = user.getId();

        return CreateConversation(id);
    }

    @Override
    public Conversation CreateConversation(@NonNull String userId) {

        Conversation conversation = new Conversation();

        conversation.setUser(userRepository.findByUsername(userId).orElseThrow(()-> new RuntimeException("User with id %s not found!")));


        conRepo.save(conversation);

        return conversation;
    }

    @Override
    public Conversation saveConversation(Conversation conversation) {
        return conRepo.save(conversation);
    }

    public ConversationDTO SaveConversationAndGetDTO(ConversationDTO conversationDTO) {
        Conversation conversation = conversationMapper.fromDTO(conversationDTO);
        return conversationMapper.toDTO(saveConversation(conversation));
    }
}
