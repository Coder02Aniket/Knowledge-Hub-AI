package hub.knowledge.ai.ai;

import java.util.Locale;

public final class AiErrorMessages {

    private AiErrorMessages() {
    }

    /**
     * Maps provider exceptions onto short, user-facing messages. Raw provider payloads
     * are never shown in the UI because they can contain request metadata.
     */
    public static String friendly(Throwable error, String operation) {
        String text = describe(error);
        if (text.contains("429") || text.contains("rate limit") || text.contains("resource_exhausted")
                || text.contains("quota")) {
            return "The AI provider is rate limiting requests. Please wait a moment and try again.";
        }
        if (text.contains("401") || text.contains("403") || text.contains("unauthenticated")
                || text.contains("permission denied") || text.contains("api key") || text.contains("api_key")) {
            return "The AI provider rejected the configured credentials. Check GENAI_API_KEY.";
        }
        if (text.contains("timeout") || text.contains("timed out") || text.contains("deadline")) {
            return "The AI provider took too long to respond. Please try again.";
        }
        if (text.contains("not found") || text.contains("404") || text.contains("model")) {
            return "The configured AI model is not available for this account.";
        }
        return "The AI provider could not complete " + operation + ". Please try again.";
    }

    /**
     * Flattens the whole cause chain so wrapped provider exceptions are classified correctly.
     */
    private static String describe(Throwable error) {
        StringBuilder builder = new StringBuilder();
        Throwable current = error;
        int depth = 0;
        while (current != null && depth++ < 10) {
            if (current.getMessage() != null) {
                builder.append(current.getMessage().toLowerCase(Locale.ROOT)).append(' ');
            }
            current = current.getCause() == current ? null : current.getCause();
        }
        return builder.toString();
    }
}
