package hub.knowledge.ai.repository;

import hub.knowledge.ai.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("messageRepository")
public interface MessageRepository extends JpaRepository<Message, String> {
}
