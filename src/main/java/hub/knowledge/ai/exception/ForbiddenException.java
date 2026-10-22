package hub.knowledge.ai.exception;

/**
 * Raised when a resource exists but belongs to another user. The message is kept
 * intentionally generic so the API does not disclose the existence of others' data.
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
