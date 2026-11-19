package hub.knowledge.ai.retrieval;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.model.Document;
import hub.knowledge.ai.model.DocumentChunk;
import hub.knowledge.ai.model.DocumentStatus;
import hub.knowledge.ai.repository.DocumentChunkRepository;
import hub.knowledge.ai.repository.DocumentRepository;
import hub.knowledge.ai.storage.ObjectStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GrepFileSearchServiceTest {

    @Mock
    private ObjectStorageService storage;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private DocumentChunkRepository chunkRepository;

    private KnowledgeHubProperties properties;
    private GrepFileSearchService service;

    @BeforeEach
    void setUp() {
        properties = new KnowledgeHubProperties();
        service = new GrepFileSearchService(storage, documentRepository, chunkRepository, properties);
    }

    @Test
    void findsQuotedPhraseAndMapsItToAChunk() {
        Document document = document("doc-1");
        String line = "The server logged connection reset at 10:42.";
        stubDocument(document, line + "\nNext line.");
        stubChunks(document, chunk("chunk-1", 0, line));

        List<CandidateChunk> hits = service.search("conv", "user", "find \"connection reset\" please");

        assertThat(hits).hasSize(1);
        assertThat(hits.get(0).chunkId()).isEqualTo("chunk-1");
        assertThat(hits.get(0).grepScore()).isEqualTo(1.0);
        assertThat(hits.get(0).matchedBy()).containsExactly("GREP");
    }

    @Test
    void findsTokenMatchAndScoresByDistinctTokens() {
        Document document = document("doc-1");
        String line = "The failure appears when error code E-4021 is returned.";
        stubDocument(document, line);
        stubChunks(document, chunk("chunk-1", 0, line));

        List<CandidateChunk> hits = service.search("conv", "user", "E-4021 failure");

        assertThat(hits).hasSize(1);
        assertThat(hits.get(0).grepScore()).isEqualTo(0.7);
    }

    @Test
    void dropsHitsThatDoNotMapToAChunk() {
        Document document = document("doc-1");
        stubDocument(document, "a line that is not in any chunk");
        stubChunks(document, chunk("chunk-1", 0, "completely different content"));

        List<CandidateChunk> hits = service.search("conv", "user", "\"a line that is not in any chunk\"");

        assertThat(hits).isEmpty();
    }

    @Test
    void skipsDocumentsWithoutASidecar() {
        Document document = document("doc-1");
        when(documentRepository
                .findByConversation_ConversationIdAndUser_IdAndStatusOrderByCreatedAtDesc(
                        "conv", "user", DocumentStatus.COMPLETED))
                .thenReturn(List.of(document));
        when(storage.openStream(anyString()))
                .thenThrow(new ObjectStorageService.StorageException("missing"));

        List<CandidateChunk> hits = service.search("conv", "user", "\"anything\"");

        assertThat(hits).isEmpty();
    }

    @Test
    void returnsNothingWhenNoTokensOrPhrase() {
        assertThat(service.search("conv", "user", "the and of")).isEmpty();
    }

    private void stubDocument(Document document, String text) {
        when(documentRepository
                .findByConversation_ConversationIdAndUser_IdAndStatusOrderByCreatedAtDesc(
                        "conv", "user", DocumentStatus.COMPLETED))
                .thenReturn(List.of(document));
        when(storage.openStream(document.getObjectKey() + ".txt"))
                .thenReturn(new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8)));
    }

    private void stubChunks(Document document, DocumentChunk... chunks) {
        when(chunkRepository.findByDocument_DocumentIdOrderByChunkIndexAsc(document.getDocumentId()))
                .thenReturn(List.of(chunks));
    }

    private Document document(String id) {
        Document document = new Document();
        document.setDocumentId(id);
        document.setFileName("handbook.txt");
        document.setObjectKey("users/u/conversations/c/" + id + "/handbook.txt");
        document.setChecksumSha256("checksum");
        document.setStatus(DocumentStatus.COMPLETED);
        return document;
    }

    private DocumentChunk chunk(String id, int index, String content) {
        DocumentChunk chunk = new DocumentChunk();
        chunk.setChunkId(id);
        chunk.setChunkIndex(index);
        chunk.setContent(content);
        chunk.setPageNumber(1);
        return chunk;
    }
}
