package hub.knowledge.ai.dto;

import lombok.Data;

import java.util.Set;

@Data
public class ConversationDTO {

    private String conversationId , title , createdAt ;

    private Set<MessageDTO> messageDTOSet ;

    private UserDTO userDTO ;

    public void addMessageDTO(MessageDTO messageDTO){
        messageDTOSet.add(messageDTO);

    }
}
