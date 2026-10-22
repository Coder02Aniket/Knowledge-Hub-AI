package hub.knowledge.ai.ai;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.exception.AiProviderException;
import hub.knowledge.ai.model.MessageRole;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class SpringAiChatCompletionService implements ChatCompletionService {

    private final ChatClient chatClient;
    private final String modelName;

    public SpringAiChatCompletionService(ChatClient chatClient,
                                         KnowledgeHubProperties properties,
                                         @Value("${spring.ai.google.genai.chat.model:gemini-3.1-flash-lite}")
                                         String modelName) {
        this.chatClient = chatClient;
        this.modelName = modelName;
    }

    @Override
    public ChatCompletion complete(List<ChatTurn> history, String systemPrompt, String userPrompt) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage(systemPrompt));
        for (ChatTurn turn : history) {
            if (turn.content() == null || turn.content().isBlank()) {
                continue;
            }
            if (turn.role() == MessageRole.ASSISTANT) {
                messages.add(new AssistantMessage(turn.content()));
            } else if (turn.role() == MessageRole.USER) {
                messages.add(new UserMessage(turn.content()));
            }
        }
        messages.add(new UserMessage(userPrompt));

        try {
            ChatResponse response = chatClient.prompt()
                    .messages(messages)
                    .call()
                    .chatResponse();
            if (response == null || response.getResult() == null
                    || response.getResult().getOutput() == null
                    || response.getResult().getOutput().getText() == null
                    || response.getResult().getOutput().getText().isBlank()) {
                throw new AiProviderException("The AI provider returned an empty response.");
            }
            String model = modelName;
            if (response.getMetadata() != null && response.getMetadata().getModel() != null) {
                model = response.getMetadata().getModel();
            }
            return new ChatCompletion(response.getResult().getOutput().getText().trim(), model);
        } catch (AiProviderException e) {
            throw e;
        } catch (RuntimeException e) {
            log.error("AI provider error", e);
            throw new AiProviderException(AiErrorMessages.friendly(e, "the chat request"), e);
        }
    }

    @Override
    public String modelLabel() {
        return modelName;
    }
}
