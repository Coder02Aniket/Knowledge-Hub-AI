package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.ai.EmbeddingService;
import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.model.DocumentStatus;
import hub.knowledge.ai.repository.DocumentRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Hybrid retrieval: pgvector + lexical + optional grep, fused with reciprocal rank
 * fusion, then reranked and routed by a decision model.
 */
@Slf4j
@Service
public class RetrievalService {

    private final EmbeddingService embeddingService;
    private final ChunkSearchRepository vectorSearchRepository;
    private final ChunkLexicalSearchRepository lexicalSearchRepository;
    private final GrepFileSearchService grepFileSearchService;
    private final ContextDecisionModel contextDecisionModel;
    private final DocumentRepository documentRepository;
    private final KnowledgeHubProperties properties;

    public RetrievalService(EmbeddingService embeddingService,
                            ChunkSearchRepository vectorSearchRepository,
                            ChunkLexicalSearchRepository lexicalSearchRepository,
                            GrepFileSearchService grepFileSearchService,
                            ContextDecisionModel contextDecisionModel,
                            DocumentRepository documentRepository,
                            KnowledgeHubProperties properties) {
        this.embeddingService = embeddingService;
        this.vectorSearchRepository = vectorSearchRepository;
        this.lexicalSearchRepository = lexicalSearchRepository;
        this.grepFileSearchService = grepFileSearchService;
        this.contextDecisionModel = contextDecisionModel;
        this.documentRepository = documentRepository;
        this.properties = properties;
    }

    public RetrievalResult retrieve(String conversationId, String ownerId, String question) {
        long completed = documentRepository.countByConversation_ConversationIdAndStatus(
                conversationId, DocumentStatus.COMPLETED);
        if (completed == 0) {
            return RetrievalResult.general("no completed documents");
        }

        KnowledgeHubProperties.Retrieval cfg = properties.getRetrieval();

        float[] queryEmbedding = embeddingService.embedQuery(question);
        List<CandidateChunk> vector = vectorSearchRepository.vectorSearch(
                conversationId, ownerId, queryEmbedding, cfg.getMinScore(), cfg.getVectorCandidates());
        List<CandidateChunk> lexical = lexicalSearchRepository.search(
                conversationId, ownerId, question, cfg.getLexicalCandidates());

        List<CandidateChunk> grep = List.of();
        boolean quoted = question != null && question.indexOf('"') >= 0;
        boolean lexicalWeak = lexical.size() < cfg.getGrep().getTriggerMinLexicalHits();
        if (cfg.getGrep().isEnabled() && (quoted || lexicalWeak)) {
            grep = grepFileSearchService.search(conversationId, ownerId, question);
        }

        List<CandidateChunk> fused = ReciprocalRankFusion.fuse(
                List.of(vector, lexical, grep), cfg.getRrfK());

        RerankDecision decision = contextDecisionModel.decide(question, fused, true);
        List<RetrievedChunk> chunks = mapSelected(decision, fused);

        log.debug("Retrieved vector={} lexical={} grep={} fused={} route={} selected={} reranked={} reason={}",
                vector.size(), lexical.size(), grep.size(), fused.size(),
                decision.route(), chunks.size(), decision.reranked(), decision.reason());

        return new RetrievalResult(
                chunks,
                decision.route(),
                decision.reason(),
                decision.reranked(),
                fused.size());
    }

    private List<RetrievedChunk> mapSelected(RerankDecision decision, List<CandidateChunk> fused) {
        if (decision.route() != RetrievalRoute.GROUNDED || decision.selected().isEmpty()) {
            return List.of();
        }
        Map<String, CandidateChunk> byId = new LinkedHashMap<>();
        for (CandidateChunk candidate : fused) {
            byId.put(candidate.chunkId(), candidate);
        }

        List<RetrievedChunk> chunks = new ArrayList<>(decision.selected().size());
        for (RerankDecision.ScoredChunk scored : decision.selected()) {
            CandidateChunk candidate = byId.get(scored.chunkId());
            if (candidate == null) {
                continue;
            }
            if (decision.reranked()) {
                chunks.add(RetrievedChunk.fromCandidate(
                        candidate, scored.relevance(), scored.relevance(), "DECISION"));
            } else {
                String method = candidate.matchedBy().isEmpty()
                        ? "FUSED"
                        : String.join("+", candidate.matchedBy());
                chunks.add(RetrievedChunk.fromCandidate(
                        candidate, candidate.fusedScore(), 0.0, method));
            }
        }
        return chunks;
    }
}
