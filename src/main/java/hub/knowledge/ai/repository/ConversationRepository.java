package hub.knowledge.ai.repository;

import hub.knowledge.ai.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    List<Conversation> findByUser_IdOrderByUpdatedAtDesc(String userId);

    Optional<Conversation> findByConversationIdAndUser_Id(String conversationId, String userId);

    Optional<Conversation> findByConversationIdAndUser_Username(String conversationId, String username);

    long countByUser_Id(String userId);
}
