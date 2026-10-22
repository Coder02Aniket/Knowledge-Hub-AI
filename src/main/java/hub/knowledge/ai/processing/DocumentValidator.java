package hub.knowledge.ai.processing;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.exception.ValidationException;
import hub.knowledge.ai.storage.StorageKeys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;

/**
 * Validates uploads before anything touches object storage or the database.
 */
@Slf4j
@Component
public class DocumentValidator {

    private static final byte[] PDF_MAGIC = "%PDF-".getBytes(StandardCharsets.US_ASCII);

    private final KnowledgeHubProperties properties;

    public DocumentValidator(KnowledgeHubProperties properties) {
        this.properties = properties;
    }

    /**
     * @return the normalised file extension
     */
    public String validate(Path file, String originalFilename, long declaredSize) {
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new ValidationException("A file name is required.");
        }
        String displayName = StorageKeys.safeFileName(originalFilename);
        if (displayName.length() > 255) {
            throw new ValidationException("The file name is too long (maximum 255 characters).");
        }

        long size;
        try {
            size = Files.size(file);
        } catch (IOException e) {
            throw new ValidationException("Unable to read the uploaded file.");
        }
        if (size <= 0) {
            throw new ValidationException("The uploaded file is empty.");
        }
        if (size > properties.getIngestion().getMaxFileSizeBytes()) {
            throw new ValidationException("The file is too large. Maximum allowed size is "
                    + humanSize(properties.getIngestion().getMaxFileSizeBytes()) + ".");
        }
        if (declaredSize > 0 && size > declaredSize * 2L + 1024) {
            throw new ValidationException("The uploaded file does not match its declared size.");
        }

        String extension = StorageKeys.extension(displayName);
        List<String> allowed = properties.getIngestion().getAllowedExtensions().stream()
                .map(e -> e.toLowerCase(Locale.ROOT))
                .toList();
        if (extension.isEmpty() || !allowed.contains(extension)) {
            throw new ValidationException("Unsupported file type. Allowed types: "
                    + String.join(", ", allowed) + ".");
        }

        verifyContentMatchesExtension(file, extension);
        return extension;
    }

    private void verifyContentMatchesExtension(Path file, String extension) {
        byte[] head;
        try (InputStream in = Files.newInputStream(file)) {
            head = in.readNBytes(8192);
        } catch (IOException e) {
            throw new ValidationException("Unable to inspect the uploaded file.");
        }

        if ("pdf".equals(extension)) {
            if (head.length < PDF_MAGIC.length) {
                throw new ValidationException("The file is not a valid PDF.");
            }
            for (int i = 0; i < PDF_MAGIC.length; i++) {
                if (head[i] != PDF_MAGIC[i]) {
                    throw new ValidationException("The file is not a valid PDF.");
                }
            }
            return;
        }

        for (byte b : head) {
            if (b == 0) {
                throw new ValidationException("The file appears to be binary, not a text document.");
            }
        }
    }

    private String humanSize(long bytes) {
        if (bytes >= 1024 * 1024) {
            return (bytes / (1024 * 1024)) + " MB";
        }
        return (bytes / 1024) + " KB";
    }
}
