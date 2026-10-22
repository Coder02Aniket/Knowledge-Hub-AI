package hub.knowledge.ai.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.BatchSize;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "messages", indexes = {
        @Index(name = "idx_messages_conversation_sent", columnList = "conversation_id, sent_at")
})
public class Message {

    @Id
    @Column(length = 36)
    private String messageId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversation conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", length = 32, nullable = false)
    private MessageRole role;

    @Column(name = "content", columnDefinition = "text")
    private String content;

    @Column(name = "sent_at", nullable = false, updatable = false)
    private Instant sentAt;

    @Column(name = "model_name", length = 120)
    private String modelName;

    @Column(name = "failure_reason", length = 2000)
    private String failureReason;

    @Column(name = "failed", nullable = false)
    private boolean failed;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "message_id", nullable = false)
    @BatchSize(size = 50)
    private List<MessageSource> sources = new ArrayList<>();

    @PrePersist
    void onCreate() {
        if (messageId == null) {
            messageId = java.util.UUID.randomUUID().toString();
        }
        if (sentAt == null) {
            sentAt = Instant.now();
        }
    }

    public void addSource(MessageSource source) {
        sources.add(source);
    }
}
