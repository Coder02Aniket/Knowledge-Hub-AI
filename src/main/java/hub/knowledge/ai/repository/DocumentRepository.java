package hub.knowledge.ai.repository;

import hub.knowledge.ai.model.Document;
import hub.knowledge.ai.model.DocumentStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface DocumentRepository extends JpaRepository<Document, String> {

    @EntityGraph(attributePaths = {"conversation"})
    List<Document> findByConversation_ConversationIdAndUser_IdOrderByCreatedAtDesc(
            String conversationId, String userId);

    @EntityGraph(attributePaths = {"conversation"})
    List<Document> findByUser_IdOrderByCreatedAtDesc(String userId);

    @EntityGraph(attributePaths = {"conversation"})
    Optional<Document> findByDocumentIdAndUser_Id(String documentId, String userId);

    @EntityGraph(attributePaths = {"conversation"})
    Optional<Document> findByDocumentIdAndUser_Username(String documentId, String username);

    boolean existsByConversation_ConversationIdAndChecksumSha256(
            String conversationId, String checksumSha256);

    long countByConversation_ConversationId(String conversationId);

    long countByConversation_ConversationIdAndStatus(String conversationId, DocumentStatus status);

    List<Document> findByStatusIn(Collection<DocumentStatus> statuses);

    @Modifying
    @Query("""
            update Document d
            set d.status = :status, d.processingError = null, d.processedAt = null,
                d.retryCount = d.retryCount + 1
            where d.documentId = :documentId
            """)
    int markForRetry(@Param("documentId") String documentId, @Param("status") DocumentStatus status);

    @Modifying
    @Query("""
            update Document d
            set d.status = :status, d.processingError = :error, d.processedAt = :now
            where d.documentId = :documentId
            """)
    int updateStatus(@Param("documentId") String documentId,
                     @Param("status") DocumentStatus status,
                     @Param("error") String error,
                     @Param("now") LocalDateTime now);
}
