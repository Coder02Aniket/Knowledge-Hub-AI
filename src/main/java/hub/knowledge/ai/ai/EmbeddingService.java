package hub.knowledge.ai.ai;

import java.util.List;

/**
 * Provider-neutral embedding contract. Implementations must return L2-normalised
 * vectors of {@link #DIMENSIONS} dimensions so cosine distance in pgvector behaves
 * consistently.
 */
public interface EmbeddingService {

    /**
     * The pgvector column is declared as vector(768). Changing the dimension requires
     * a schema migration, so it is fixed here and validated at startup.
     */
    int DIMENSIONS = 768;

    float[] embedQuery(String text);

    List<float[]> embedDocuments(List<String> texts);

    String providerName();
}
