package hub.knowledge.ai.controller;

import hub.knowledge.ai.dto.MessageDTO;
import hub.knowledge.ai.service.MessageServiceImpl;
import jakarta.annotation.Nullable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/messages")
class MessageController {

    @Autowired
    private MessageServiceImpl messageServiceImpl;

    @PostMapping("/chat")
    public MessageDTO sendMessage(@RequestBody MessageDTO messageDTO , @RequestParam(name="userId" , required = false) String userId) {
        //TODO: Implement automatic retrieval of Username through Authentication Context -> Need to remove userId from this method
        return messageServiceImpl.processUserMessage(messageDTO , (userId ==null || userId.isBlank()) ? "aniket87" : userId);

    }
}
