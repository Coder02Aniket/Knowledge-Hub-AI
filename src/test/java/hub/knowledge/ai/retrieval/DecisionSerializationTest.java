package hub.knowledge.ai.retrieval;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards the wire format of the Decisions API. The model never sees question keys, so
 * this test also documents that every instruction names its passage explicitly.
 */
class DecisionSerializationTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void serializesRequestUsingTheDocumentedSchema() throws Exception {
        Map<String, DecisionQuestion> questions = new LinkedHashMap<>();
        questions.put("route", DecisionQuestion.choice("Can this be answered?", Map.of(
                "grounded", "Yes.", "general", "Unrelated.", "insufficient", "Not enough.")));
        questions.put("p0", DecisionQuestion.noul(
                "Does passage [P0] answer the question? Judge only [P0].",
                "Contains evidence.", "No usable evidence."));

        String json = mapper.writeValueAsString(
                new DecisionRequest("gemini-decision-1", "QUESTION\nwhy?", questions));

        assertThat(json).contains("\"model\":\"gemini-decision-1\"");
        assertThat(json).contains("\"type\":\"choice\"");
        assertThat(json).contains("\"type\":\"noul\"");
        assertThat(json).contains("\"true_description\"");
        assertThat(json).contains("\"false_description\"");
        assertThat(json).contains("[P0]");
    }

    @Test
    void deserializesNoulChoiceAndUsage() throws Exception {
        String json = """
                {
                  "answers": {
                    "p0": { "type": "noul", "noul": 0.91, "confidence": 0.91 },
                    "route": { "type": "choice", "choice": "grounded",
                               "probabilities": { "grounded": 0.8, "general": 0.1, "insufficient": 0.1 },
                               "confidence": 0.8 }
                  },
                  "usage": { "total_input_tokens": 1200, "total_output_tokens": 0 },
                  "future_field": true
                }
                """;

        DecisionResponse response = mapper.readValue(json, DecisionResponse.class);

        assertThat(response.answers().get("p0").noul()).isEqualTo(0.91);
        assertThat(response.answers().get("route").choice()).isEqualTo("grounded");
        assertThat(response.answers().get("route").confidence()).isEqualTo(0.8);
        assertThat(response.usage().totalInputTokens()).isEqualTo(1200);
        assertThat(response.usage().totalOutputTokens()).isZero();
    }
}
