package hub.knowledge.ai.retrieval;

import java.util.Map;

public record DecisionRequest(String model, Object input, Map<String, DecisionQuestion> questions) {
}
