package hub.knowledge.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Application specific configuration. Everything here can be overridden through
 * environment variables (see README) so no secrets or tuning values live in code.
 */
@Data
@ConfigurationProperties(prefix = "knowledgehub")
public class KnowledgeHubProperties {

    private Ai ai = new Ai();
    private Retrieval retrieval = new Retrieval();
    private Ingestion ingestion = new Ingestion();

    @Data
    public static class Ai {
        /** google or local */
        private String embeddingProvider = "google";
        private int embeddingDimensions = 768;
        private int maxHistoryMessages = 20;
        private String modelLabel = "Gemini";
    }

    @Data
    public static class Retrieval {
        private int topK = 6;
        private double minScore = 0.20;
        private int maxContextCharacters = 9000;

        /** How many candidates each retriever contributes before fusion. */
        private int vectorCandidates = 20;
        private int lexicalCandidates = 20;
        /** Reciprocal Rank Fusion constant. */
        private int rrfK = 60;

        private Decision decision = new Decision();
        private Grep grep = new Grep();
    }

    @Data
    public static class Decision {
        private boolean enabled = true;
        private String model = "gemini-decision-1";
        private String endpoint = "https://generativelanguage.googleapis.com/v1beta/decisions";
        private int timeoutMs = 3000;
        private int maxPassages = 20;
        private int snippetChars = 600;
        private double relevanceThreshold = 0.55;
        private double routeConfidenceThreshold = 0.60;
        private boolean injectionScreen = true;
        private double injectionThreshold = 0.70;
        private double dominanceGap = 0.15;
    }

    @Data
    public static class Grep {
        private boolean enabled = true;
        private int maxDocuments = 10;
        private int maxHitsPerDocument = 20;
        private int contextLines = 2;
        private int triggerMinLexicalHits = 1;
        private int cacheEntries = 64;
    }

    @Data
    public static class Ingestion {
        private int chunkSize = 1200;
        private int chunkOverlap = 200;
        private int embeddingBatchSize = 16;
        private long maxFileSizeBytes = 20L * 1024 * 1024;
        private List<String> allowedExtensions = new ArrayList<>(List.of("pdf", "txt", "md", "csv", "json"));
        private int workerThreads = 2;
    }
}
