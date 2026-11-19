package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.model.Document;
import hub.knowledge.ai.model.DocumentChunk;
import hub.knowledge.ai.model.DocumentStatus;
import hub.knowledge.ai.repository.DocumentChunkRepository;
import hub.knowledge.ai.repository.DocumentRepository;
import hub.knowledge.ai.storage.ObjectStorageService;
import hub.knowledge.ai.storage.StorageKeys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Line-level grep over the normalized extracted text of a conversation's documents.
 *
 * <p>The extracted text is stored as a {@code .txt} sidecar next to the original object
 * at ingestion time, so this service never re-downloads or re-parses a PDF. Hits are
 * mapped back to the chunk that contains the matched line; unmapped hits are dropped
 * rather than cited with a synthetic chunk index.</p>
 */
@Slf4j
@Service
public class GrepFileSearchService {

    private static final Pattern QUOTED = Pattern.compile("\"([^\"]{2,120})\"");
    private static final long MAX_CACHED_CHARS_PER_DOCUMENT = 500_000L;

    private final ObjectStorageService storage;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final KnowledgeHubProperties properties;
    private final Map<String, List<String>> cache;

    public GrepFileSearchService(ObjectStorageService storage,
                                 DocumentRepository documentRepository,
                                 DocumentChunkRepository chunkRepository,
                                 KnowledgeHubProperties properties) {
        this.storage = storage;
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.properties = properties;
        int maxEntries = Math.max(1, properties.getRetrieval().getGrep().getCacheEntries());
        this.cache = Collections.synchronizedMap(new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<String, List<String>> eldest) {
                return size() > maxEntries;
            }
        });
    }

    public List<CandidateChunk> search(String conversationId, String ownerId, String question) {
        KnowledgeHubProperties.Grep cfg = properties.getRetrieval().getGrep();
        if (!cfg.isEnabled() || question == null || question.isBlank()) {
            return List.of();
        }

        Matcher quoted = QUOTED.matcher(question);
        String phrase = quoted.find() ? quoted.group(1) : null;
        List<String> tokens = phrase == null ? LexicalQueryBuilder.tokens(question) : List.of();
        if (phrase == null && tokens.isEmpty()) {
            return List.of();
        }

        Pattern pattern = phrase != null
                ? Pattern.compile(Pattern.quote(phrase),
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE)
                : Pattern.compile(tokens.stream().map(Pattern::quote).collect(Collectors.joining("|")),
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

        List<Document> documents = documentRepository
                .findByConversation_ConversationIdAndUser_IdAndStatusOrderByCreatedAtDesc(
                        conversationId, ownerId, DocumentStatus.COMPLETED)
                .stream()
                .limit(Math.max(1, cfg.getMaxDocuments()))
                .toList();

        Map<String, CandidateChunk> matches = new LinkedHashMap<>();
        for (Document document : documents) {
            List<String> lines = readLines(document);
            if (lines.isEmpty()) {
                continue;
            }

            List<Hit> hits = new ArrayList<>();
            for (int i = 0; i < lines.size() && hits.size() < cfg.getMaxHitsPerDocument(); i++) {
                String line = lines.get(i);
                if (line == null || line.isBlank() || line.length() < 3) {
                    continue;
                }
                if (!pattern.matcher(line).find()) {
                    continue;
                }
                String lower = line.toLowerCase(Locale.ROOT);
                int distinct = (int) tokens.stream().filter(lower::contains).count();
                hits.add(new Hit(i, line, distinct));
            }
            if (hits.isEmpty()) {
                continue;
            }

            List<DocumentChunk> chunks = chunkRepository
                    .findByDocument_DocumentIdOrderByChunkIndexAsc(document.getDocumentId());
            if (chunks.isEmpty()) {
                continue;
            }

            for (Hit hit : hits) {
                DocumentChunk chunk = findChunk(chunks, hit, lines, cfg.getContextLines());
                if (chunk == null) {
                    log.debug("Grep hit in document {} line {} did not map to a chunk",
                            document.getDocumentId(), hit.lineNumber() + 1);
                    continue;
                }
                double score = phrase != null
                        ? 1.0
                        : Math.min(0.9, 0.5 + 0.1 * hit.distinctTokens());
                CandidateChunk candidate = new CandidateChunk(
                        chunk.getChunkId(),
                        document.getDocumentId(),
                        document.getFileName(),
                        chunk.getChunkIndex(),
                        chunk.getPageNumber(),
                        chunk.getContent(),
                        0.0,
                        0.0,
                        score,
                        0.0,
                        Set.of("GREP"));
                matches.merge(chunk.getChunkId(), candidate,
                        (existing, replacement) ->
                                existing.grepScore() >= replacement.grepScore() ? existing : replacement);
            }
        }
        return new ArrayList<>(matches.values());
    }

    private List<String> readLines(Document document) {
        String objectKey = document.getObjectKey();
        if (objectKey == null) {
            return List.of();
        }
        String cacheKey = document.getDocumentId() + ":" + document.getChecksumSha256();
        List<String> cached = cache.get(cacheKey);
        if (cached != null) {
            return cached;
        }
        try (InputStream in = storage.openStream(StorageKeys.extractedText(objectKey));
             BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            List<String> lines = reader.lines().toList();
            long characters = lines.stream().mapToLong(String::length).sum();
            if (characters <= MAX_CACHED_CHARS_PER_DOCUMENT) {
                cache.put(cacheKey, lines);
            }
            return lines;
        } catch (Exception e) {
            log.debug("No extracted text sidecar for document {}: {}",
                    document.getDocumentId(), e.getMessage());
            return List.of();
        }
    }

    private DocumentChunk findChunk(List<DocumentChunk> chunks, Hit hit,
                                    List<String> lines, int contextLines) {
        String needle = buildNeedle(hit, lines, contextLines);
        if (needle.length() < 4) {
            return null;
        }
        for (DocumentChunk chunk : chunks) {
            if (normalize(chunk.getContent()).contains(needle)) {
                return chunk;
            }
        }
        String shorter = needle.substring(0, Math.min(60, needle.length()));
        if (shorter.length() >= 4 && !shorter.equals(needle)) {
            for (DocumentChunk chunk : chunks) {
                if (normalize(chunk.getContent()).contains(shorter)) {
                    return chunk;
                }
            }
        }
        return null;
    }

    private String buildNeedle(Hit hit, List<String> lines, int contextLines) {
        String line = hit.line().trim();
        if (line.length() >= 20 || contextLines <= 0) {
            return normalize(line);
        }
        int from = Math.max(0, hit.lineNumber() - contextLines);
        int to = Math.min(lines.size() - 1, hit.lineNumber() + contextLines);
        StringBuilder needle = new StringBuilder();
        for (int i = from; i <= to; i++) {
            String candidate = lines.get(i);
            if (candidate == null || candidate.isBlank()) {
                continue;
            }
            if (needle.length() > 0) {
                needle.append(' ');
            }
            needle.append(candidate.trim());
        }
        return normalize(needle.toString());
    }

    private String normalize(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("\\s+", " ").trim().toLowerCase(Locale.ROOT);
    }

    private record Hit(int lineNumber, String line, int distinctTokens) {
    }
}
