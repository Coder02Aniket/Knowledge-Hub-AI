package hub.knowledge.ai.model;

import jakarta.persistence.*;
import jakarta.validation.Constraint;
import lombok.Data;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.CurrentTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.security.crypto.bcrypt.BCrypt;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name="users", uniqueConstraints = { @UniqueConstraint(columnNames = {"email"}) , @UniqueConstraint(columnNames = {"username"}  )}  )
public class User {



    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String firstName , lastName;
    private String username;

    private String password;

    private String email;


    private ROLE role = ROLE.USER;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(fetch = FetchType.LAZY , mappedBy = "user")
    private List<Conversation> conversations;


    public void hashPassword() {
        this.password = BCrypt.hashpw(this.password, BCrypt.gensalt());
    }

}

enum ROLE{
    USER,
    ADMIN
}