package hub.knowledge.ai.controller;

import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.service.IConversationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/api/conversations")
@Controller
public class ConversationController {

    @Autowired
    private IConversationService conversationService;

    @ResponseBody
    @GetMapping("/list")
    public List<Conversation> getConversationsByUser(@RequestParam("userId") String userId){
        return conversationService.getConversationsByUserId(userId);

    }

    @PostMapping("/create")
    @ResponseBody
    public Conversation createConversation(@RequestParam("userId") String userId) {
        // Implementation for creating a new conversation

        return conversationService.CreateConversation(userId);
    }
}
