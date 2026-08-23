package hub.knowledge.ai.service;

import hub.knowledge.ai.dto.ConversationDTO;
import hub.knowledge.ai.dto.MessageDTO;
import hub.knowledge.ai.model.Conversation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service("messageService")
public class MessageServiceImpl implements IMessageService {

    @Autowired
    private IConversationService conversationService;


    public MessageDTO processUserMessage(MessageDTO dto , String userId) {
        ConversationDTO conDto = null ;
        // check if DTO has null  conversationID if yesCreate conversation
        if(dto.getConversationId()==null){
            //create new conversation
            //remove dependency for userId in future since it should be taken from authentication context
            conversationService.CreateConversation(userId);

        }else{
            conDto = conversationService.getConversationById(dto.getConversationId());
        }

        conDto.addMessage(messageDTO);

        //save this conversation
        conversationService.saveConversation(conversation);

    }

    @Override
    public MessageDTO processUserMessage(MessageDTO messageDTO) {
        //implement user id retrieval from authentication context...
        String userId = "aniket87" ;

        return processUserMessage(messageDTO, userId);
    }
}
