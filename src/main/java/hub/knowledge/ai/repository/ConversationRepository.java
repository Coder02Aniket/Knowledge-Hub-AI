package hub.knowledge.ai.repository;

import hub.knowledge.ai.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository("conversationRepo")
public interface ConversationRepository extends JpaRepository<Conversation, String> {

    Conversation getConversationByConversationId(String conversationId);

    List<Conversation> getConversationsByUserId(String userId);
}
