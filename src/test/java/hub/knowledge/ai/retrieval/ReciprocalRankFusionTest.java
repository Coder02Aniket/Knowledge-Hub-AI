package hub.knowledge.ai.retrieval;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class ReciprocalRankFusionTest {

    @Test
    void deduplicatesByIdAndUnionsSources() {
        CandidateChunk vector = candidate("c1", 0.9, 0.0, 0.0, "VECTOR");
        CandidateChunk lexical = candidate("c1", 0.0, 0.8, 0.0, "LEXICAL");
        CandidateChunk other = candidate("c2", 0.7, 0.0, 0.0, "VECTOR");

        List<CandidateChunk> fused = ReciprocalRankFusion.fuse(
                List.of(List.of(vector, other), List.of(lexical)), 60);

        assertThat(fused).hasSize(2);
        CandidateChunk first = fused.get(0);
        assertThat(first.chunkId()).isEqualTo("c1");
        assertThat(first.matchedBy()).containsExactlyInAnyOrder("VECTOR", "LEXICAL");
        assertThat(first.vectorScore()).isEqualTo(0.9);
        assertThat(first.lexicalScore()).isEqualTo(0.8);
        assertThat(first.fusedScore()).isEqualTo(1.0);
    }

    @Test
    void ranksByReciprocalRank() {
        CandidateChunk a = candidate("a", 0.0, 0.0, 0.0, "VECTOR");
        CandidateChunk b = candidate("b", 0.0, 0.0, 0.0, "VECTOR");

        List<CandidateChunk> fused = ReciprocalRankFusion.fuse(
                List.of(List.of(a, b)), 60);

        assertThat(fused).extracting(CandidateChunk::chunkId).containsExactly("a", "b");
        assertThat(fused.get(0).fusedScore()).isGreaterThan(fused.get(1).fusedScore());
        assertThat(fused.get(1).fusedScore()).isCloseTo(61.0 / 62.0, org.assertj.core.data.Offset.offset(1e-12));
    }

    @Test
    void ignoresEmptyListsAndNullCandidates() {
        List<CandidateChunk> fused = ReciprocalRankFusion.fuse(
                List.of(List.of(), List.of(candidate("a", 0.0, 0.0, 0.0, "LEXICAL"))), 60);

        assertThat(fused).hasSize(1);
        assertThat(fused.get(0).chunkId()).isEqualTo("a");
    }

    @Test
    void normalizesTopScoreToOne() {
        List<CandidateChunk> fused = ReciprocalRankFusion.fuse(
                List.of(List.of(
                        candidate("a", 0.0, 0.0, 0.0, "VECTOR"),
                        candidate("b", 0.0, 0.0, 0.0, "VECTOR"))), 60);

        assertThat(fused.get(0).fusedScore()).isEqualTo(1.0);
        assertThat(fused.get(1).fusedScore()).isBetween(0.0, 1.0);
    }

    private CandidateChunk candidate(String id, double vector, double lexical, double grep, String source) {
        return new CandidateChunk(id, "doc", "file.pdf", 1, 2, "content",
                vector, lexical, grep, 0.0, Set.of(source));
    }
}
