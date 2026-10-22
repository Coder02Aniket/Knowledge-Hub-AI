package hub.knowledge.ai.processing;

import hub.knowledge.ai.ai.EmbeddingCodec;
import hub.knowledge.ai.ai.EmbeddingService;
import hub.knowledge.ai.exception.DocumentProcessingException;
import hub.knowledge.ai.model.Document;
import hub.knowledge.ai.model.DocumentChunk;
import hub.knowledge.ai.model.DocumentStatus;
import hub.knowledge.ai.repository.DocumentChunkRepository;
import hub.knowledge.ai.repository.DocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
public class DocumentProcessingService {

    private final DocumentTextExtractor textExtractor;
    private final TextChunker textChunker;
    private final EmbeddingService embeddingService;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final TransactionTemplate transactionTemplate;

    public DocumentProcessingService(DocumentTextExtractor textExtractor,
                                     TextChunker textChunker,
                                     EmbeddingService embeddingService,
                                     DocumentRepository documentRepository,
                                     DocumentChunkRepository chunkRepository,
                                     TransactionTemplate transactionTemplate) {
        this.textExtractor = textExtractor;
        this.textChunker = textChunker;
        this.embeddingService = embeddingService;
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Runs asynchronously using the bounded document processing executor.
     */
    @Async("documentProcessingExecutor")
    public void processDocumentAsync(String documentId, Path localFile, String extension) {
        try {
            if (!markProcessing(documentId)) {
                log.warn("Document {} no longer exists; skipping ingestion", documentId);
                return;
            }
            log.info("Started processing document {}", documentId);

            ExtractedDocument extracted = textExtractor.extract(localFile, extension);
            if (extracted.isEmpty()) {
                throw new DocumentProcessingException("No text could be extracted from the file.");
            }

            List<ChunkDraft> drafts = textChunker.chunk(extracted);
            if (drafts.isEmpty()) {
                throw new DocumentProcessingException("The document contains no chunkable text.");
            }
            log.info("Document {} split into {} chunks", documentId, drafts.size());

            // Embedding is slow (network), so it deliberately happens outside any transaction.
            List<DocumentChunk> chunks = new ArrayList<>(drafts.size());
            int batchSize = 16;
            for (int i = 0; i < drafts.size(); i += batchSize) {
                List<ChunkDraft> batch = drafts.subList(i, Math.min(drafts.size(), i + batchSize));
                List<String> texts = batch.stream().map(ChunkDraft::content).toList();
                List<float[]> embeddings = embeddingService.embedDocuments(texts);

                for (int j = 0; j < batch.size(); j++) {
                    ChunkDraft draft = batch.get(j);
                    chunks.add(new DocumentChunk(
                            null,
                            draft.index(),
                            draft.content(),
                            draft.pageNumber(),
                            draft.tokenCount(),
                            EmbeddingCodec.toLiteral(embeddings.get(j))
                    ));
                }
            }

            storeChunks(documentId, chunks);
            log.info("Completed processing document {} ({} chunks)", documentId, chunks.size());

        } catch (Exception e) {
            log.error("Failed to process document {}", documentId, e);
            markFailed(documentId, e);
        } finally {
            deleteQuietly(localFile);
        }
    }

    private boolean markProcessing(String documentId) {
        Integer updated = transactionTemplate.execute(status ->
                documentRepository.updateStatus(documentId, DocumentStatus.PROCESSING, null, null));
        return updated != null && updated > 0;
    }

    /**
     * Replaces all chunks and marks the document complete in a single short transaction.
     */
    private void storeChunks(String documentId, List<DocumentChunk> chunks) {
        transactionTemplate.executeWithoutResult(status -> {
            Document document = documentRepository.findById(documentId)
                    .orElseThrow(() -> new DocumentProcessingException(
                            "The document was removed before processing finished."));
            chunkRepository.deleteAllForDocument(documentId);
            chunks.forEach(chunk -> chunk.setDocument(document));
            chunkRepository.saveAll(chunks);

            document.setChunkCount(chunks.size());
            document.setStatus(DocumentStatus.COMPLETED);
            document.setProcessingError(null);
            document.setProcessedAt(LocalDateTime.now());
            documentRepository.save(document);
        });
    }

    private void markFailed(String documentId, Exception failure) {
        String message = failure.getMessage() == null
                ? failure.getClass().getSimpleName()
                : failure.getMessage();
        if (message.length() > 1900) {
            message = message.substring(0, 1900) + "...";
        }
        final String reason = message;
        try {
            transactionTemplate.executeWithoutResult(status ->
                    documentRepository.updateStatus(documentId, DocumentStatus.FAILED, reason, LocalDateTime.now()));
        } catch (Exception nested) {
            log.error("Could not mark document {} as failed", documentId, nested);
        }
    }

    private void deleteQuietly(Path file) {
        if (file == null) return;
        try {
            Files.deleteIfExists(file);
        } catch (Exception e) {
            log.warn("Failed to clean up temporary file {}", file, e);
        }
    }
}
