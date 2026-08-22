package hub.knowledge.ai.repository;

import hub.knowledge.ai.model.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository("documentRepository")
public interface DocumentRepository extends JpaRepository<Document, String> {
}
