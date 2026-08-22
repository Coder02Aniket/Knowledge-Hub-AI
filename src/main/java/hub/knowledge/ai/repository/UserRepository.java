package hub.knowledge.ai.repository;

import hub.knowledge.ai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository("userRepository")
public interface UserRepository extends JpaRepository<User, String> {

    Optional<User> findByUsername(String username);
}
