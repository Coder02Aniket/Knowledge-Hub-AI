package hub.knowledge.ai.controller;

import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.service.ConversationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationApiController {

    private final ConversationService conversationService;

    public ConversationApiController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @GetMapping
    public List<ConversationView> list(@AuthenticationPrincipal UserDetails userDetails) {
        return conversationService.listOwned(userDetails.getUsername())
                .stream()
                .map(c -> new ConversationView(c.getConversationId(), c.getTitle(), c.getUpdatedAt()))
                .toList();
    }

    @PostMapping
    public ConversationView create(@AuthenticationPrincipal UserDetails userDetails) {
        Conversation c = conversationService.create(userDetails.getUsername());
        return new ConversationView(c.getConversationId(), c.getTitle(), c.getUpdatedAt());
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable("id") String id, @AuthenticationPrincipal UserDetails userDetails) {
        conversationService.delete(id, userDetails.getUsername());
    }
    
    @PutMapping("/{id}/title")
    public void rename(@PathVariable("id") String id, 
                       @RequestBody RenameRequest request, 
                       @AuthenticationPrincipal UserDetails userDetails) {
        conversationService.rename(id, userDetails.getUsername(), request.title());
    }

    public record ConversationView(String id, String title, LocalDateTime updatedAt) {}
    public record RenameRequest(String title) {}
}
