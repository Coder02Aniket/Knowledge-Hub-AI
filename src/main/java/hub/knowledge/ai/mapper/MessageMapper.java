package hub.knowledge.ai.mapper;

import hub.knowledge.ai.dto.MessageDTO;
import hub.knowledge.ai.model.Message;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class MessageMapper {
    private final ModelMapper modelMapper;

    @Autowired
    public MessageMapper(ModelMapper modelMapper){
        this.modelMapper = modelMapper;
    }

    public MessageDTO toDTO(Message message){
        return  modelMapper.map(message, MessageDTO.class);
    }

    public Message toEntity(MessageDTO messageDTO){
        return modelMapper.map(messageDTO, Message.class);
    }
}
