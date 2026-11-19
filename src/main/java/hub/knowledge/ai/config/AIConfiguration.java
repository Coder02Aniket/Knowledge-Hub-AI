package hub.knowledge.ai.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AIConfiguration {

    /**
     * Conversation memory is handled explicitly by {@code ChatService} so that
     * ownership, failure handling and source attribution stay under application
     * control instead of being hidden inside an advisor.
     */
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
