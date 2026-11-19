package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.ai.EmbeddingService;
import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.model.DocumentStatus;
import hub.knowledge.ai.repository.DocumentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RetrievalServiceTest {

    @Mock
    private EmbeddingService embeddingService;

    @Mock
    private ChunkSearchRepository vectorSearchRepository;

    @Mock
    private ChunkLexicalSearchRepository lexicalSearchRepository;

    @Mock
    private GrepFileSearchService grepFileSearchService;

    @Mock
    private ContextDecisionModel decisionModel;

    @Mock
    private DocumentRepository documentRepository;

    private KnowledgeHubProperties properties;
    private RetrievalService service;

    @BeforeEach
    void setUp() {
        properties = new KnowledgeHubProperties();
        service = new RetrievalService(embeddingService, vectorSearchRepository,
                lexicalSearchRepository, grepFileSearchService, decisionModel,
                documentRepository, properties);
    }

    @Test
    void returnsGeneralWhenThereAreNoCompletedDocuments() {
        when(documentRepository.countByConversation_ConversationIdAndStatus(
                "conv", DocumentStatus.COMPLETED)).thenReturn(0L);

        RetrievalResult result = service.retrieve("conv", "user", "question");

        assertThat(result.route()).isEqualTo(RetrievalRoute.GENERAL);
        assertThat(result.chunks()).isEmpty();
        verify(embeddingService, never()).embedQuery(anyString());
    }

    @Test
    void fusesVectorAndLexicalCandidatesAndMapsDecision() {
        when(documentRepository.countByConversation_ConversationIdAndStatus(
                "conv", DocumentStatus.COMPLETED)).thenReturn(1L);
        when(embeddingService.embedQuery("question")).thenReturn(new float[768]);

        CandidateChunk vector = candidate("a", 0.9, 0.0, Set.of("VECTOR"));
        CandidateChunk lexical = candidate("b", 0.0, 0.8, Set.of("LEXICAL"));
        when(vectorSearchRepository.vectorSearch(eq("conv"), eq("user"), any(), anyDouble(), anyInt()))
                .thenReturn(List.of(vector));
        when(lexicalSearchRepository.search(eq("conv"), eq("user"), eq("question"), anyInt()))
                .thenReturn(List.of(lexical));

        when(decisionModel.decide(eq("question"), any(), eq(true))).thenReturn(
                new RerankDecision(RetrievalRoute.GROUNDED, List.of(
                        new RerankDecision.ScoredChunk("a", 0.9, 0.0),
                        new RerankDecision.ScoredChunk("b", 0.7, 0.0)),
                        0.9, true, "gemini-decision-1"));

        RetrievalResult result = service.retrieve("conv", "user", "question");

        assertThat(result.route()).isEqualTo(RetrievalRoute.GROUNDED);
        assertThat(result.reranked()).isTrue();
        assertThat(result.candidateCount()).isEqualTo(2);
        assertThat(result.chunks()).extracting(RetrievedChunk::chunkId).containsExactly("a", "b");
        assertThat(result.chunks()).extracting(RetrievedChunk::retrievalMethod)
                .containsExactly("VECTOR", "LEXICAL");
        assertThat(result.chunks().get(0).similarity()).isEqualTo(0.9);
    }

    @Test
    void ordersMultiTierProvenanceDeterministically() {
        when(documentRepository.countByConversation_ConversationIdAndStatus(
                "conv", DocumentStatus.COMPLETED)).thenReturn(1L);
        when(embeddingService.embedQuery("question")).thenReturn(new float[768]);
        CandidateChunk combined = new CandidateChunk(
                "c", "doc", "file.pdf", 1, 2, "content", 0.5, 0.5, 0.5, 0.7, Set.of("GREP", "VECTOR"));
        when(vectorSearchRepository.vectorSearch(anyString(), anyString(), any(), anyDouble(), anyInt()))
                .thenReturn(List.of(combined));
        when(lexicalSearchRepository.search(anyString(), anyString(), anyString(), anyInt()))
                .thenReturn(List.of());

        when(decisionModel.decide(anyString(), any(), eq(true))).thenReturn(
                new RerankDecision(RetrievalRoute.GROUNDED, List.of(new RerankDecision.ScoredChunk("c", 0.9, 0.0)),
                        0.9, false, "fallback"));

        RetrievalResult result = service.retrieve("conv", "user", "question");

        assertThat(result.chunks()).hasSize(1);
        assertThat(result.chunks().get(0).retrievalMethod()).isEqualTo("VECTOR+GREP");
    }

    @Test
    void returnsNoChunksWhenRouteIsInsufficient() {
        when(documentRepository.countByConversation_ConversationIdAndStatus(
                "conv", DocumentStatus.COMPLETED)).thenReturn(1L);
        when(embeddingService.embedQuery("question")).thenReturn(new float[768]);
        when(vectorSearchRepository.vectorSearch(anyString(), anyString(), any(), anyDouble(), anyInt()))
                .thenReturn(List.of(candidate("a", 0.9, 0.0, Set.of("VECTOR"))));
        when(lexicalSearchRepository.search(anyString(), anyString(), anyString(), anyInt()))
                .thenReturn(List.of());
        when(decisionModel.decide(anyString(), any(), eq(true))).thenReturn(
                new RerankDecision(RetrievalRoute.INSUFFICIENT, List.of(), 0.8, true, "insufficient"));

        RetrievalResult result = service.retrieve("conv", "user", "question");

        assertThat(result.route()).isEqualTo(RetrievalRoute.INSUFFICIENT);
        assertThat(result.chunks()).isEmpty();
    }

    @Test
    void usesFusedScoresWhenDecisionModelDidNotRerank() {
        when(documentRepository.countByConversation_ConversationIdAndStatus(
                "conv", DocumentStatus.COMPLETED)).thenReturn(1L);
        when(embeddingService.embedQuery("question")).thenReturn(new float[768]);
        when(vectorSearchRepository.vectorSearch(anyString(), anyString(), any(), anyDouble(), anyInt()))
                .thenReturn(List.of(candidate("a", 0.9, 0.0, Set.of("VECTOR"))));
        when(lexicalSearchRepository.search(anyString(), anyString(), anyString(), anyInt()))
                .thenReturn(List.of());
        when(decisionModel.decide(anyString(), any(), eq(true))).thenReturn(
                new RerankDecision(RetrievalRoute.GROUNDED,
                        List.of(new RerankDecision.ScoredChunk("a", 1.0, 0.0)),
                        0.0, false, "fallback"));

        RetrievalResult result = service.retrieve("conv", "user", "question");

        assertThat(result.reranked()).isFalse();
        assertThat(result.chunks()).hasSize(1);
        assertThat(result.chunks().get(0).retrievalMethod()).isEqualTo("VECTOR");
        assertThat(result.chunks().get(0).decisionScore()).isEqualTo(0.0);
    }

    private CandidateChunk candidate(String id, double vector, double lexical, Set<String> sources) {
        return new CandidateChunk(id, "doc", "file.pdf", 1, 2, "content",
                vector, lexical, 0.0, 0.0, sources);
    }
}
