package hub.knowledge.ai.dto;

import lombok.Data;
import lombok.NonNull;

import java.util.HashSet;
import java.util.Set;

@Data
public class ConversationDTO {

    private String conversationId , title , createdAt ;

    private Set<MessageDTO> messageDTOSet = new HashSet<>();


    private UserDTO userDTO ;

    public void addMessageDTO(MessageDTO messageDTO){
        messageDTOSet.add(messageDTO);
    }


}
