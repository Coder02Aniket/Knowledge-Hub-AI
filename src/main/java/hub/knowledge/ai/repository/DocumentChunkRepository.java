package hub.knowledge.ai.repository;

import hub.knowledge.ai.model.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, String> {

    void deleteByDocument_DocumentId(String documentId);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query(
            "delete from DocumentChunk c where c.document.documentId = :documentId")
    int deleteAllForDocument(@org.springframework.data.repository.query.Param("documentId") String documentId);

    long countByDocument_DocumentId(String documentId);

    List<DocumentChunk> findByDocument_DocumentIdOrderByChunkIndexAsc(String documentId);
}
