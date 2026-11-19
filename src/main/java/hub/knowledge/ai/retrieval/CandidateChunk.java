package hub.knowledge.ai.retrieval;

import java.util.Set;

/**
 * Internal candidate produced by one of the retrievers. Never persisted; it carries the
 * per-retriever scores so fusion and the decision model can see where a chunk came from.
 */
public record CandidateChunk(
        String chunkId,
        String documentId,
        String documentName,
        int chunkIndex,
        Integer pageNumber,
        String content,
        double vectorScore,
        double lexicalScore,
        double grepScore,
        double fusedScore,
        Set<String> matchedBy
) {

    public CandidateChunk withFusedScore(double score) {
        return new CandidateChunk(chunkId, documentId, documentName, chunkIndex, pageNumber,
                content, vectorScore, lexicalScore, grepScore, score, matchedBy);
    }

    public CandidateChunk withScores(double vector, double lexical, double grep, Set<String> sources) {
        return new CandidateChunk(chunkId, documentId, documentName, chunkIndex, pageNumber,
                content, vector, lexical, grep, fusedScore, sources);
    }
}
