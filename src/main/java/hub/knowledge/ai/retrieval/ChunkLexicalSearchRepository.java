package hub.knowledge.ai.retrieval;

import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * Lexical (keyword) search over document chunks, the "grep over chunks" half of the
 * hybrid retriever. It uses the same ownership and status filters as the vector search.
 */
@Slf4j
@Repository
public class ChunkLexicalSearchRepository {

    private static final String SEARCH_SQL = """
            WITH q AS (SELECT to_tsquery('simple', ?) AS tsq)
            SELECT dc.chunk_id,
                   dc.document_id,
                   d.file_name AS document_name,
                   dc.chunk_index,
                   dc.page_number,
                   dc.content,
                   CAST(ts_rank_cd(to_tsvector('simple', dc.content), q.tsq) AS double precision)
                     + CAST(CASE WHEN dc.content ILIKE ? THEN 0.5 ELSE 0 END AS double precision) AS lexical_score
            FROM document_chunks dc
            JOIN documents d ON d.document_id = dc.document_id
            CROSS JOIN q
            WHERE d.conversation_id = ?
              AND d.user_id = ?
              AND d.status = 'COMPLETED'
              AND (to_tsvector('simple', dc.content) @@ q.tsq OR dc.content ILIKE ?)
            ORDER BY lexical_score DESC
            LIMIT ?
            """;

    private final JdbcTemplate jdbcTemplate;

    public ChunkLexicalSearchRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CandidateChunk> search(String conversationId,
                                       String ownerId,
                                       String question,
                                       int limit) {
        Optional<String> tsQuery = LexicalQueryBuilder.buildTsQuery(question);
        if (tsQuery.isEmpty()) {
            return List.of();
        }
        String phrasePattern = LexicalQueryBuilder.buildPhrasePattern(question);
        try {
            return jdbcTemplate.query(SEARCH_SQL,
                    (rs, rowNum) -> map(rs),
                    tsQuery.get(),
                    phrasePattern,
                    conversationId,
                    ownerId,
                    phrasePattern,
                    limit);
        } catch (DataAccessException e) {
            log.warn("Lexical search failed; continuing with vector/grep results: {}", e.getMessage());
            return List.of();
        }
    }

    private CandidateChunk map(ResultSet rs) throws SQLException {
        int page = rs.getInt("page_number");
        Integer pageNumber = rs.wasNull() ? null : page;
        return new CandidateChunk(
                rs.getString("chunk_id"),
                rs.getString("document_id"),
                rs.getString("document_name"),
                rs.getInt("chunk_index"),
                pageNumber,
                rs.getString("content"),
                0.0,
                rs.getDouble("lexical_score"),
                0.0,
                0.0,
                Set.of("LEXICAL"));
    }
}
