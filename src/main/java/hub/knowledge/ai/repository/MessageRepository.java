package hub.knowledge.ai.repository;

import hub.knowledge.ai.model.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, String> {

    @EntityGraph(attributePaths = {"sources"})
    List<Message> findByConversation_ConversationIdOrderBySentAtAscMessageIdAsc(String conversationId);

    @Query("""
            select m from Message m
            where m.conversation.conversationId = :conversationId
              and m.failed = false
            order by m.sentAt desc, m.messageId desc
            """)
    @EntityGraph(attributePaths = {"sources"})
    List<Message> findRecent(@Param("conversationId") String conversationId, Pageable pageable);

    void deleteByConversation_ConversationId(String conversationId);
}
