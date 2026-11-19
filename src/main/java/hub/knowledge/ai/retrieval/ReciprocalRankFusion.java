package hub.knowledge.ai.retrieval;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Reciprocal Rank Fusion: {@code score = sum(1 / (k + rank))} across every ranked list.
 * The result is normalized to 0..1 so it can be compared with the configured floor.
 */
public final class ReciprocalRankFusion {

    private ReciprocalRankFusion() {
    }

    public static List<CandidateChunk> fuse(List<List<CandidateChunk>> rankedLists, int k) {
        int rrfK = Math.max(1, k);
        Map<String, Accumulator> byId = new LinkedHashMap<>();

        for (List<CandidateChunk> list : rankedLists) {
            if (list == null || list.isEmpty()) {
                continue;
            }
            int rank = 1;
            for (CandidateChunk candidate : list) {
                if (candidate == null || candidate.chunkId() == null) {
                    continue;
                }
                Accumulator accumulator = byId.computeIfAbsent(
                        candidate.chunkId(), id -> new Accumulator(candidate));
                accumulator.add(candidate, 1.0 / (rrfK + rank));
                rank++;
            }
        }

        double max = byId.values().stream().mapToDouble(a -> a.score).max().orElse(0.0);
        return byId.values().stream()
                .map(accumulator -> accumulator.toCandidate(max))
                .sorted(Comparator.comparingDouble(CandidateChunk::fusedScore).reversed())
                .toList();
    }

    private static final class Accumulator {
        private final CandidateChunk base;
        private final Set<String> sources = new LinkedHashSet<>();
        private double score;
        private double vectorScore;
        private double lexicalScore;
        private double grepScore;

        private Accumulator(CandidateChunk base) {
            this.base = base;
            merge(base);
        }

        private void add(CandidateChunk candidate, double delta) {
            this.score += delta;
            merge(candidate);
        }

        private void merge(CandidateChunk candidate) {
            vectorScore = Math.max(vectorScore, candidate.vectorScore());
            lexicalScore = Math.max(lexicalScore, candidate.lexicalScore());
            grepScore = Math.max(grepScore, candidate.grepScore());
            if (candidate.matchedBy() != null) {
                sources.addAll(candidate.matchedBy());
            }
        }

        private CandidateChunk toCandidate(double max) {
            double normalized = max <= 0.0 ? 0.0 : score / max;
            return base.withScores(vectorScore, lexicalScore, grepScore, Set.copyOf(sources))
                    .withFusedScore(normalized);
        }
    }
}
