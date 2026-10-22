package hub.knowledge.ai.ai;

import java.util.List;

public interface ChatCompletionService {

    ChatCompletion complete(List<ChatTurn> history, String systemPrompt, String userPrompt);

    String modelLabel();
}
