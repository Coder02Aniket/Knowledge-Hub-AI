package hub.knowledge.ai.mapper;

import hub.knowledge.ai.dto.ConversationDTO;
import hub.knowledge.ai.model.Conversation;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@Component
public class ConversationMapper {

    @Autowired
    private ModelMapper modelMapper;

    public ConversationDTO toDTO(Conversation conversation){
        return modelMapper.map(conversation, ConversationDTO.class);
    }

    public Conversation fromDTO(ConversationDTO conversationDTO){
        return modelMapper.map(conversationDTO, Conversation.class);

    }



}
