package hub.knowledge.ai.retrieval;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DecisionResponse(Map<String, DecisionAnswer> answers, DecisionUsage usage) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DecisionAnswer(
            String type,
            Double noul,
            String choice,
            Map<String, Double> probabilities,
            Double confidence,
            Double score) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DecisionUsage(
            @JsonProperty("total_input_tokens") Integer totalInputTokens,
            @JsonProperty("total_output_tokens") Integer totalOutputTokens) {
    }
}
