package hub.knowledge.ai.service;

import hub.knowledge.ai.dto.MessageDTO;
import org.springframework.boot.context.properties.PropertyMapper;

public interface IMessageService {

    MessageDTO processUserMessage(MessageDTO messageDTO);


}
