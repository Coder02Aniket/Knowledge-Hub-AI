package hub.knowledge.ai.service;

import hub.knowledge.ai.dto.ConversationDTO;
import hub.knowledge.ai.dto.MessageDTO;
import hub.knowledge.ai.mapper.ConversationMapper;
import hub.knowledge.ai.mapper.MessageMapper;
import hub.knowledge.ai.mapper.UserMapper;
import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service("messageService")
public class MessageServiceImpl implements IMessageService {

    private IConversationService conversationService;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private IUserService userService;

    private ConversationMapper conMapper ;

    private MessageMapper msgMapper ;
    private UserMapper userMapper;


    public MessageServiceImpl() {

    }

    @Autowired
    public MessageServiceImpl(IConversationService conversationService, ConversationMapper conversationMapper, MessageMapper messageMapper, UserMapper userMapper) {
        this.conversationService = conversationService;
        this.conMapper = conversationMapper;
        this.msgMapper = messageMapper;
        this.userMapper = userMapper;
    }


    public MessageDTO  processUserMessage(MessageDTO messageDto , String userId) {
        Conversation conversation  = null ;
        ConversationDTO conDto = new  ConversationDTO();
        // check if DTO has null  conversationID if yesCreate conversation //will not be called mostly
        if(messageDto.getConversationId()==null){
            //create new conversation
            //remove dependency for userId in future since it should be taken from authentication context
            conDto.setTitle("Random :: " + new Random().nextInt(1000, 10000));
            conDto.setUserDTO(userMapper.toDTO(userService.findUserByuserName(userId)));

        }else{
            conDto = conMapper.toDTO(conversationService.getConversationById(messageDto.getConversationId()));
        }

        conDto = conversationService.SaveConversationAndGetDTO(conDto);
        messageDto.setConversationId(conDto.getConversationId());
        //save this conversation
        conDto.addMessageDTO(messageDto);
        messageDto = saveMessage(messageDto);


        return messageDto ;
    }



    @Override
    public MessageDTO processUserMessage(MessageDTO messageDTO) {
        //implement user id retrieval from authentication context...
        String userId = "aniket87" ;

        return processUserMessage(messageDTO, userId);
    }

    @Override
    public MessageDTO saveMessage(MessageDTO messageDTO) {

        return msgMapper.toDTO(messageRepository.save(msgMapper.toEntity(messageDTO)));

    }
}
