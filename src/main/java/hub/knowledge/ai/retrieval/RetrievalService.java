package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.ai.EmbeddingService;
import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.exception.EmbeddingException;
import hub.knowledge.ai.repository.DocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
public class RetrievalService {

    private final EmbeddingService embeddingService;
    private final ChunkSearchRepository searchRepository;
    private final DocumentRepository documentRepository;
    private final KnowledgeHubProperties properties;

    public RetrievalService(EmbeddingService embeddingService,
                            ChunkSearchRepository searchRepository,
                            DocumentRepository documentRepository,
                            KnowledgeHubProperties properties) {
        this.embeddingService = embeddingService;
        this.searchRepository = searchRepository;
        this.documentRepository = documentRepository;
        this.properties = properties;
    }

    public List<RetrievedChunk> retrieve(String conversationId, String ownerId, String question) {
        long completed = documentRepository.countByConversation_ConversationIdAndStatus(
                conversationId, hub.knowledge.ai.model.DocumentStatus.COMPLETED);
        if (completed == 0) {
            return List.of();
        }
        float[] queryEmbedding = embeddingService.embedQuery(question);
        List<RetrievedChunk> chunks = searchRepository.search(
                conversationId,
                ownerId,
                queryEmbedding,
                properties.getRetrieval().getMinScore(),
                properties.getRetrieval().getTopK());
        log.debug("Retrieved {} chunk(s) for conversation {}", chunks.size(), conversationId);
        return chunks;
    }
}
