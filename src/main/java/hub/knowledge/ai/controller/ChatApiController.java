package hub.knowledge.ai.controller;

import hub.knowledge.ai.dto.MessageView;
import hub.knowledge.ai.dto.SourceView;
import hub.knowledge.ai.model.Message;
import hub.knowledge.ai.service.ChatService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatApiController {

    private final ChatService chatService;

    public ChatApiController(ChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    public MessageView send(@RequestParam(value = "conversationId", required = false) String conversationId,
                            @RequestBody ChatRequest request,
                            @AuthenticationPrincipal UserDetails userDetails) {
        Message response = chatService.chat(conversationId, userDetails.getUsername(), request.message());
        return map(response);
    }

    @GetMapping("/{conversationId}")
    public List<MessageView> history(@PathVariable("conversationId") String conversationId,
                                     @AuthenticationPrincipal UserDetails userDetails) {
        return chatService.getConversationMessages(conversationId, userDetails.getUsername())
                .stream()
                .map(this::map)
                .toList();
    }

    public record ChatRequest(String message) {}

    private MessageView map(Message m) {
        List<SourceView> sources = m.getSources().stream()
                .map(s -> new SourceView(
                        s.getDocumentId(),
                        s.getDocumentName(),
                        s.getChunkIndex(),
                        s.getPageNumber(),
                        s.getSimilarity(),
                        s.getSnippet()))
                .toList();

        return new MessageView(
                m.getMessageId(),
                m.getRole(),
                m.getContent(),
                m.getSentAt(),
                m.isFailed(),
                m.getFailureReason(),
                sources
        );
    }
}
