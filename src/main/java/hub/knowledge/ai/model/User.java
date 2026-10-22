package hub.knowledge.ai.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "users",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_users_username", columnNames = "username"),
                @UniqueConstraint(name = "uk_users_email", columnNames = "email")
        })
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String firstName;
    private String lastName;

    @Column(nullable = false, length = 80)
    private String username;

    @Column(length = 120)
    private String email;

    @Column(nullable = false, length = 120)
    private String password;

    // Stored as ordinal for backwards compatibility with the existing schema.
    private Role role = Role.USER;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public String getDisplayName() {
        if (firstName != null && !firstName.isBlank()) {
            String last = (lastName == null) ? "" : " " + lastName;
            return firstName + last;
        }
        return username;
    }
}
