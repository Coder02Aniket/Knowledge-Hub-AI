package hub.knowledge.ai.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Hibernate's {@code ddl-auto=update} cannot create expression or vector indexes, so
 * they are created here. Each statement is independent and best-effort: a missing
 * pgvector build should not stop the application from starting.
 */
@Slf4j
@Component
public class RetrievalIndexInitializer implements ApplicationRunner {

    private static final String FTS_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_document_chunks_fts
              ON document_chunks USING GIN (to_tsvector('simple', content))
            """;

    private static final String VECTOR_INDEX = """
            CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
              ON document_chunks USING hnsw (embedding vector_cosine_ops)
            """;

    private final JdbcTemplate jdbcTemplate;

    public RetrievalIndexInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        execute("full-text", FTS_INDEX);
        execute("vector", VECTOR_INDEX);
    }

    private void execute(String name, String sql) {
        try {
            jdbcTemplate.execute(sql);
            log.info("Ensured {} retrieval index", name);
        } catch (DataAccessException e) {
            log.warn("Could not create {} retrieval index ({}); retrieval will still work, "
                    + "but may be slower", name, e.getMostSpecificCause().getMessage());
        }
    }
}
