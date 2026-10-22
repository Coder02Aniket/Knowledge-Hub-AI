package hub.knowledge.ai.ai;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Deterministic, offline embedding fallback. It hashes words, word bigrams and
 * character trigrams into a fixed-size vector. This is not a semantic model, but it
 * lets the full pgvector pipeline run without credentials and is useful in tests and
 * local development. Select it with KNOWLEDGEHUB_EMBEDDING_PROVIDER=local.
 */
@Service
@ConditionalOnProperty(name = "knowledgehub.ai.embedding-provider", havingValue = "local")
public class LocalHashEmbeddingService implements EmbeddingService {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("[\\p{L}\\p{N}]+");

    private final int dimensions;

    public LocalHashEmbeddingService(KnowledgeHubProperties properties) {
        if (properties.getAi().getEmbeddingDimensions() != DIMENSIONS) {
            throw new IllegalStateException("local embeddings require " + DIMENSIONS + " dimensions");
        }
        this.dimensions = DIMENSIONS;
    }

    @Override
    public float[] embedQuery(String text) {
        return embedDocuments(List.of(text)).get(0);
    }

    @Override
    public List<float[]> embedDocuments(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }
        List<float[]> vectors = new ArrayList<>(texts.size());
        for (String text : texts) {
            vectors.add(embed(text));
        }
        return vectors;
    }

    private float[] embed(String text) {
        float[] vector = new float[dimensions];
        String normalized = text == null ? "" : text.toLowerCase(Locale.ROOT);
        List<String> tokens = new ArrayList<>();
        Matcher matcher = TOKEN_PATTERN.matcher(normalized);
        while (matcher.find()) {
            tokens.add(matcher.group());
        }

        for (String token : tokens) {
            add(vector, "w:" + token, 1.0f);
            if (token.length() > 2) {
                add(vector, "s:" + stem(token), 0.6f);
            }
            String padded = "^" + token + "$";
            for (int i = 0; i + 3 <= padded.length(); i++) {
                add(vector, "t:" + padded.substring(i, i + 3), 0.25f);
            }
        }
        for (int i = 0; i + 1 < tokens.size(); i++) {
            add(vector, "b:" + tokens.get(i) + "_" + tokens.get(i + 1), 0.5f);
        }

        EmbeddingCodec.normalize(vector);
        if (vector.length > 0) {
            // Avoid an all-zero vector for empty input so cosine distance stays defined.
            boolean allZero = true;
            for (float v : vector) {
                if (v != 0f) {
                    allZero = false;
                    break;
                }
            }
            if (allZero) {
                vector[0] = 1f;
            }
        }
        return vector;
    }

    private String stem(String token) {
        if (token.length() > 4 && token.endsWith("ies")) {
            return token.substring(0, token.length() - 3) + "y";
        }
        if (token.length() > 4 && token.endsWith("ing")) {
            return token.substring(0, token.length() - 3);
        }
        if (token.length() > 3 && token.endsWith("s")) {
            return token.substring(0, token.length() - 1);
        }
        return token;
    }

    private void add(float[] vector, String feature, float weight) {
        int hash = feature.hashCode();
        int index = Math.floorMod(hash, dimensions);
        float sign = ((hash >>> 1) & 1) == 0 ? 1f : -1f;
        vector[index] += sign * weight;
    }

    @Override
    public String providerName() {
        return "local-hash";
    }
}
