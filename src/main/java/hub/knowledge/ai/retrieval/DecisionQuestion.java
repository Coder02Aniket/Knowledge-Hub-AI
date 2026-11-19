package hub.knowledge.ai.retrieval;

import java.util.Map;

public record DecisionQuestion(String type, String instructions, Object criteria) {

    public static DecisionQuestion noul(String instructions, String trueDescription, String falseDescription) {
        return new DecisionQuestion("noul", instructions, Map.of(
                "true_description", trueDescription,
                "false_description", falseDescription));
    }

    public static DecisionQuestion choice(String instructions, Map<String, String> criteria) {
        return new DecisionQuestion("choice", instructions, criteria);
    }
}
