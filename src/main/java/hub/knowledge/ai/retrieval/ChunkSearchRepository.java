package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.ai.EmbeddingCodec;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * pgvector similarity search. JdbcTemplate is used deliberately: Hibernate has no
 * native vector type, and an explicit query makes the ownership filters auditable.
 */
@Repository
public class ChunkSearchRepository {

    private static final String SEARCH_SQL = """
            SELECT * FROM (
                SELECT dc.chunk_id,
                       dc.document_id,
                       d.file_name AS document_name,
                       dc.chunk_index,
                       dc.page_number,
                       dc.content,
                       1 - (dc.embedding <=> CAST(? AS vector)) AS similarity
                FROM document_chunks dc
                JOIN documents d ON d.document_id = dc.document_id
                WHERE d.conversation_id = ?
                  AND d.user_id = ?
                  AND d.status = 'COMPLETED'
                  AND dc.embedding IS NOT NULL
            ) ranked
            WHERE ranked.similarity >= ?
            ORDER BY ranked.similarity DESC
            LIMIT ?
            """;

    private final JdbcTemplate jdbcTemplate;

    public ChunkSearchRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<RetrievedChunk> search(String conversationId,
                                       String ownerId,
                                       float[] queryEmbedding,
                                       double minScore,
                                       int limit) {
        String literal = EmbeddingCodec.toLiteral(queryEmbedding);
        return jdbcTemplate.query(SEARCH_SQL,
                (rs, rowNum) -> map(rs),
                literal,
                conversationId,
                ownerId,
                minScore,
                limit);
    }

    private RetrievedChunk map(ResultSet rs) throws SQLException {
        int page = rs.getInt("page_number");
        Integer pageNumber = rs.wasNull() ? null : page;
        return new RetrievedChunk(
                rs.getString("chunk_id"),
                rs.getString("document_id"),
                rs.getString("document_name"),
                rs.getInt("chunk_index"),
                pageNumber,
                rs.getString("content"),
                rs.getDouble("similarity"));
    }
}
