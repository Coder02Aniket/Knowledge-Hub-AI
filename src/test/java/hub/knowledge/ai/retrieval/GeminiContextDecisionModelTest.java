package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GeminiContextDecisionModelTest {

    @Mock
    private GeminiDecisionClient client;

    private KnowledgeHubProperties properties;
    private GeminiContextDecisionModel model;

    @BeforeEach
    void setUp() {
        properties = new KnowledgeHubProperties();
        properties.getRetrieval().setTopK(3);
        model = new GeminiContextDecisionModel(client, properties);
        when(client.isConfigured()).thenReturn(true);
    }

    @Test
    void selectsAboveThresholdAndSortsByRelevance() {
        List<CandidateChunk> candidates = List.of(
                candidate("a", 1.0), candidate("b", 0.8), candidate("c", 0.3));

        when(client.decide(any(), any())).thenReturn(response(Map.of(
                "route", route("grounded", 0.9),
                "p0", noul(0.62),
                "p1", noul(0.91),
                "p2", noul(0.20),
                "s0", noul(0.05),
                "s1", noul(0.05),
                "s2", noul(0.05))));

        RerankDecision decision = model.decide("question", candidates, true);

        assertThat(decision.route()).isEqualTo(RetrievalRoute.GROUNDED);
        assertThat(decision.reranked()).isTrue();
        assertThat(decision.selected()).extracting(RerankDecision.ScoredChunk::chunkId)
                .containsExactly("b", "a");
    }

    @Test
    void capsSelectionAtTopK() {
        List<CandidateChunk> candidates = List.of(
                candidate("a", 1.0), candidate("b", 0.9), candidate("c", 0.8), candidate("d", 0.7));

        when(client.decide(any(), any())).thenReturn(response(Map.of(
                "route", route("grounded", 0.9),
                "p0", noul(0.9), "p1", noul(0.9), "p2", noul(0.9), "p3", noul(0.9),
                "s0", noul(0.05), "s1", noul(0.05), "s2", noul(0.05), "s3", noul(0.05))));

        RerankDecision decision = model.decide("question", candidates, true);

        assertThat(decision.selected()).hasSize(3);
    }

    @Test
    void dropsChunksScreenedAsInjection() {
        List<CandidateChunk> candidates = List.of(candidate("safe", 1.0), candidate("bad", 0.9));

        when(client.decide(any(), any())).thenReturn(response(Map.of(
                "route", route("grounded", 0.9),
                "p0", noul(0.9), "p1", noul(0.9),
                "s0", noul(0.05), "s1", noul(0.95))));

        RerankDecision decision = model.decide("question", candidates, true);

        assertThat(decision.selected()).extracting(RerankDecision.ScoredChunk::chunkId)
                .containsExactly("safe");
    }

    @Test
    void ignoresMissingOrMalformedAnswers() {
        List<CandidateChunk> candidates = List.of(candidate("a", 1.0), candidate("b", 0.9));

        when(client.decide(any(), any())).thenReturn(response(Map.of(
                "route", route("grounded", 0.9),
                "p0", noul(0.8))));

        RerankDecision decision = model.decide("question", candidates, true);

        assertThat(decision.selected()).extracting(RerankDecision.ScoredChunk::chunkId)
                .containsExactly("a");
    }

    @Test
    void lowRouteConfidenceFallsBackToDerivedRoute() {
        List<CandidateChunk> candidates = List.of(candidate("a", 1.0));

        when(client.decide(any(), any())).thenReturn(response(Map.of(
                "route", route("general", 0.2),
                "p0", noul(0.9),
                "s0", noul(0.05))));

        RerankDecision decision = model.decide("question", candidates, true);

        assertThat(decision.route()).isEqualTo(RetrievalRoute.GROUNDED);
    }

    @Test
    void groundedWithoutSelectionBecomesInsufficient() {
        List<CandidateChunk> candidates = List.of(candidate("a", 1.0));

        when(client.decide(any(), any())).thenReturn(response(Map.of(
                "route", route("grounded", 0.9),
                "p0", noul(0.1),
                "s0", noul(0.05))));

        RerankDecision decision = model.decide("question", candidates, true);

        assertThat(decision.route()).isEqualTo(RetrievalRoute.INSUFFICIENT);
        assertThat(decision.selected()).isEmpty();
    }

    @Test
    void sendsOneRelevanceAndOneInjectionQuestionPerPassage() {
        List<CandidateChunk> candidates = List.of(candidate("a", 1.0), candidate("b", 0.9));

        when(client.decide(any(), any())).thenReturn(response(Map.of(
                "route", route("grounded", 0.9),
                "p0", noul(0.9), "p1", noul(0.9),
                "s0", noul(0.05), "s1", noul(0.05))));

        model.decide("question", candidates, true);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, DecisionQuestion>> captor =
                ArgumentCaptor.forClass(Map.class);
        verify(client).decide(any(), captor.capture());

        assertThat(captor.getValue()).containsKeys("route", "p0", "p1", "s0", "s1");
        assertThat(captor.getValue().get("route").type()).isEqualTo("choice");
        assertThat(captor.getValue().get("p0").type()).isEqualTo("noul");
        assertThat(captor.getValue().get("p0").instructions()).contains("lists or mentions");
    }

    @Test
    void clientFailureFallsBackToFusedRanking() {
        List<CandidateChunk> candidates = List.of(candidate("a", 1.0), candidate("b", 0.9));

        when(client.decide(any(), any())).thenThrow(new IllegalStateException("timeout"));

        RerankDecision decision = model.decide("question", candidates, true);

        assertThat(decision.reranked()).isFalse();
        assertThat(decision.route()).isEqualTo(RetrievalRoute.GROUNDED);
        assertThat(decision.selected()).extracting(RerankDecision.ScoredChunk::chunkId)
                .containsExactly("a", "b");
    }

    @Test
    void emptyCandidatesAreInsufficient() {
        RerankDecision decision = model.decide("question", List.of(), true);

        assertThat(decision.route()).isEqualTo(RetrievalRoute.INSUFFICIENT);
        assertThat(decision.selected()).isEmpty();
    }

    private CandidateChunk candidate(String id, double fusedScore) {
        return new CandidateChunk(id, "doc", "file.pdf", 1, 2, "content",
                0.0, 0.0, 0.0, fusedScore, Set.of("VECTOR"));
    }

    private DecisionResponse response(Map<String, DecisionResponse.DecisionAnswer> answers) {
        return new DecisionResponse(new LinkedHashMap<>(answers), null);
    }

    private DecisionResponse.DecisionAnswer noul(double probability) {
        return new DecisionResponse.DecisionAnswer("noul", probability, null, null, null, null);
    }

    private DecisionResponse.DecisionAnswer route(String choice, double confidence) {
        return new DecisionResponse.DecisionAnswer("choice", null, choice, null, confidence, null);
    }
}
