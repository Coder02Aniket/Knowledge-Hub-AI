package hub.knowledge.ai.service;

import hub.knowledge.ai.exception.ForbiddenException;
import hub.knowledge.ai.exception.NotFoundException;
import hub.knowledge.ai.exception.ValidationException;
import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.model.Document;
import hub.knowledge.ai.model.DocumentStatus;
import hub.knowledge.ai.model.User;
import hub.knowledge.ai.processing.DocumentProcessingService;
import hub.knowledge.ai.processing.DocumentValidator;
import hub.knowledge.ai.repository.DocumentChunkRepository;
import hub.knowledge.ai.repository.DocumentRepository;
import hub.knowledge.ai.storage.ObjectStorageService;
import hub.knowledge.ai.storage.StorageKeys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.List;

@Slf4j
@Service
public class DocumentService {

    private static final int MAX_RETRIES = 3;

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final ConversationService conversationService;
    private final UserAccountService userAccountService;
    private final ObjectStorageService storageService;
    private final DocumentValidator validator;
    private final DocumentProcessingService processingService;
    private final TransactionTemplate transactionTemplate;

    public DocumentService(DocumentRepository documentRepository,
                           DocumentChunkRepository chunkRepository,
                           ConversationService conversationService,
                           UserAccountService userAccountService,
                           ObjectStorageService storageService,
                           DocumentValidator validator,
                           DocumentProcessingService processingService,
                           TransactionTemplate transactionTemplate) {
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.conversationService = conversationService;
        this.userAccountService = userAccountService;
        this.storageService = storageService;
        this.validator = validator;
        this.processingService = processingService;
        this.transactionTemplate = transactionTemplate;
    }

    public Document upload(String conversationId, String username, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ValidationException("No file was uploaded.");
        }
        User user = userAccountService.requireUser(username);
        Conversation conversation = conversationService.requireOwned(conversationId, username);

        Path tempFile = null;
        try {
            tempFile = Files.createTempFile("khub_upload_", ".tmp");
            file.transferTo(tempFile);

            String extension = validator.validate(tempFile, file.getOriginalFilename(), file.getSize());
            String checksum = computeChecksum(tempFile);

            if (documentRepository.existsByConversation_ConversationIdAndChecksumSha256(conversationId, checksum)) {
                throw new ValidationException("This exact file has already been uploaded to this conversation.");
            }

            Document document = new Document();
            document.setUser(user);
            document.setConversation(conversation);
            document.setFileName(StorageKeys.safeFileName(file.getOriginalFilename()));
            document.setContentType(file.getContentType());
            document.setFileSize(Files.size(tempFile));
            document.setChecksumSha256(checksum);

            String objectKey = StorageKeys.forDocument(
                    user.getId(), conversationId, document.getDocumentId(), document.getFileName());
            document.setObjectKey(objectKey);

            storageService.put(objectKey, tempFile, file.getContentType());

            Document saved = transactionTemplate.execute(status -> documentRepository.save(document));
            conversationService.touch(conversationId);

            processingService.processDocumentAsync(saved.getDocumentId(), tempFile, extension);
            tempFile = null; // ownership passed to async task
            return saved;
        } catch (Exception e) {
            if (e instanceof ValidationException ve) {
                throw ve;
            }
            throw new RuntimeException("Upload failed: " + e.getMessage(), e);
        } finally {
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (Exception ignored) {
                }
            }
        }
    }

    /**
     * Re-queues a failed ingestion using the original object already stored in MinIO.
     */
    public Document retry(String documentId, String username) {
        Document document = documentRepository.findByDocumentIdAndUser_Username(documentId, username)
                .orElseThrow(() -> new NotFoundException("Document not found."));

        if (document.isProcessing()) {
            throw new ValidationException("This document is already being processed.");
        }
        if (document.getStatus() != DocumentStatus.FAILED) {
            throw new ValidationException("Only failed uploads can be retried.");
        }
        if (document.getRetryCount() >= MAX_RETRIES) {
            throw new ValidationException("This document reached the retry limit. Please upload it again.");
        }

        String extension = StorageKeys.extension(document.getFileName());
        Path tempFile;
        try {
            tempFile = Files.createTempFile("khub_retry_", ".tmp");
            try (InputStream in = storageService.openStream(document.getObjectKey())) {
                Files.copy(in, tempFile, StandardCopyOption.REPLACE_EXISTING);
            }
            // Verify the stored object is still a valid document before queueing it again.
            validator.validate(tempFile, document.getFileName(), Files.size(tempFile));
        } catch (ValidationException ve) {
            throw ve;
        } catch (Exception e) {
            throw new RuntimeException("Could not prepare the document for retry: " + e.getMessage(), e);
        }

        Document updated = transactionTemplate.execute(status -> {
            int rows = documentRepository.markForRetry(documentId, DocumentStatus.PENDING);
            if (rows == 0) {
                throw new NotFoundException("Document not found.");
            }
            return documentRepository.findByDocumentIdAndUser_Username(documentId, username)
                    .orElseThrow(() -> new NotFoundException("Document not found."));
        });

        processingService.processDocumentAsync(documentId, tempFile, extension);
        return updated;
    }

    @Transactional(readOnly = true)
    public List<Document> listOwned(String conversationId, String username) {        User user = userAccountService.requireUser(username);
        if (conversationId != null) {
            Conversation conversation = conversationService.requireOwned(conversationId, username);
            return documentRepository.findByConversation_ConversationIdAndUser_IdOrderByCreatedAtDesc(
                    conversation.getConversationId(), user.getId());
        }
        return documentRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
    }

    public void delete(String documentId, String username) {
        Document document = documentRepository.findByDocumentIdAndUser_Username(documentId, username)
                .orElseThrow(() -> new NotFoundException("Document not found."));

        if (document.isProcessing()) {
            throw new ValidationException("Cannot delete a document while it is still processing.");
        }

        try {
            storageService.delete(document.getObjectKey());
        } catch (Exception e) {
            log.warn("Could not delete object {} for document {}: {}",
                    document.getObjectKey(), documentId, e.getMessage());
        }

        transactionTemplate.executeWithoutResult(status -> {
            chunkRepository.deleteAllForDocument(documentId);
            documentRepository.delete(document);
        });
    }

    @Transactional(readOnly = true)
    public InputStream download(String documentId, String username) {
        Document document = documentRepository.findByDocumentIdAndUser_Username(documentId, username)
                .orElseThrow(() -> new NotFoundException("Document not found."));
        return storageService.openStream(document.getObjectKey());
    }

    private String computeChecksum(Path file) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        try (InputStream is = Files.newInputStream(file)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) > 0) {
                digest.update(buffer, 0, read);
            }
        }
        byte[] hash = digest.digest();
        StringBuilder hex = new StringBuilder(2 * hash.length);
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        return hex.toString();
    }
}
