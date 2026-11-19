package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

/**
 * Thin client for the Gemini Decisions API ({@code POST /v1beta/decisions}).
 *
 * <p>This API is not exposed by Spring AI or by the Google GenAI Java SDK in the
 * versions used here, so it is called over plain HTTP. The response is intentionally
 * parsed into tolerant records because the endpoint is still {@code v1beta}.</p>
 */
@Component
public class GeminiDecisionClient {

    private final RestClient restClient;
    private final String endpoint;
    private final String model;
    private final boolean configured;

    public GeminiDecisionClient(KnowledgeHubProperties properties,
                                @Value("${spring.ai.google.genai.api-key:not-configured}") String apiKey) {
        KnowledgeHubProperties.Decision cfg = properties.getRetrieval().getDecision();
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(cfg.getTimeoutMs()));
        requestFactory.setReadTimeout(Duration.ofMillis(cfg.getTimeoutMs()));

        this.restClient = RestClient.builder()
                .requestFactory(requestFactory)
                .defaultHeader("x-goog-api-key", apiKey == null ? "" : apiKey)
                .build();
        this.endpoint = cfg.getEndpoint();
        this.model = cfg.getModel();
        this.configured = apiKey != null && !apiKey.isBlank() && !"not-configured".equals(apiKey);
    }

    public boolean isConfigured() {
        return configured;
    }

    public String model() {
        return model;
    }

    public DecisionResponse decide(Object input, Map<String, DecisionQuestion> questions) {
        return restClient.post()
                .uri(endpoint)
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DecisionRequest(model, input, questions))
                .retrieve()
                .body(DecisionResponse.class);
    }
}
