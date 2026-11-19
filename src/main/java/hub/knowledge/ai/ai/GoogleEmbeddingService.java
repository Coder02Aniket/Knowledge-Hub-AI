package hub.knowledge.ai.ai;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.exception.EmbeddingException;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.google.genai.text.GoogleGenAiTextEmbeddingOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@ConditionalOnProperty(name = "knowledgehub.ai.embedding-provider", havingValue = "google", matchIfMissing = true)
public class GoogleEmbeddingService implements EmbeddingService {

    private final EmbeddingModel embeddingModel;
    private final String modelName;

    public GoogleEmbeddingService(EmbeddingModel embeddingModel,
                                  KnowledgeHubProperties properties,
                                  @Value("${spring.ai.google.genai.embedding.text.model:gemini-embedding-001}")
                                  String modelName) {
        if (properties.getAi().getEmbeddingDimensions() != DIMENSIONS) {
            throw new IllegalStateException("google embeddings require " + DIMENSIONS
                    + " dimensions to match the pgvector column (found "
                    + properties.getAi().getEmbeddingDimensions() + ")");
        }
        this.embeddingModel = embeddingModel;
        this.modelName = modelName;
    }

    @Override
    public float[] embedQuery(String text) {
        return embed(List.of(text), GoogleGenAiTextEmbeddingOptions.TaskType.RETRIEVAL_QUERY).get(0);
    }

    @Override
    public List<float[]> embedDocuments(List<String> texts) {
        if (texts == null || texts.isEmpty()) {
            return List.of();
        }
        return embed(texts, GoogleGenAiTextEmbeddingOptions.TaskType.RETRIEVAL_DOCUMENT);
    }

    private List<float[]> embed(List<String> texts, GoogleGenAiTextEmbeddingOptions.TaskType taskType) {
        try {
            GoogleGenAiTextEmbeddingOptions options = GoogleGenAiTextEmbeddingOptions.builder()
                    .model(modelName)
                    .dimensions(DIMENSIONS)
                    .taskType(taskType)
                    .build();
            EmbeddingResponse response = embeddingModel.call(new EmbeddingRequest(texts, options));
            List<Embedding> results = response.getResults();
            if (results == null || results.size() != texts.size()) {
                throw new EmbeddingException("The embedding provider returned an unexpected number of vectors.");
            }
            List<float[]> vectors = new ArrayList<>(results.size());
            for (Embedding embedding : results) {
                float[] output = embedding.getOutput();
                if (output == null || output.length != DIMENSIONS) {
                    throw new EmbeddingException("The embedding provider returned a vector with "
                            + (output == null ? 0 : output.length) + " dimensions; expected " + DIMENSIONS + ".");
                }
                EmbeddingCodec.normalize(output);
                vectors.add(output);
            }
            return vectors;
        } catch (EmbeddingException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new EmbeddingException(AiErrorMessages.friendly(e, "embedding generation"), e);
        }
    }

    @Override
    public String providerName() {
        return "google:" + modelName;
    }
}
