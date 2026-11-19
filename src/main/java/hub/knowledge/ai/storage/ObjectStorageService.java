package hub.knowledge.ai.storage;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;

/**
 * Thin abstraction over private object storage. Implementations must never expose
 * public object URLs; callers stream bytes through authorised controller endpoints.
 */
public interface ObjectStorageService {

    void ensureBucket();

    void put(String objectKey, Path file, String contentType);

    InputStream openStream(String objectKey);

    void delete(String objectKey);

    boolean exists(String objectKey);

    String bucketName();

    class StorageException extends RuntimeException {
        public StorageException(String message) {
            super(message);
        }

        public StorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
