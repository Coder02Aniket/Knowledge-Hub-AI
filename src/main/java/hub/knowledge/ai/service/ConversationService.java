package hub.knowledge.ai.service;

import hub.knowledge.ai.exception.NotFoundException;
import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.model.Document;
import hub.knowledge.ai.model.Message;
import hub.knowledge.ai.model.User;
import hub.knowledge.ai.repository.ConversationRepository;
import hub.knowledge.ai.repository.DocumentChunkRepository;
import hub.knowledge.ai.repository.DocumentRepository;
import hub.knowledge.ai.repository.MessageRepository;
import hub.knowledge.ai.storage.ObjectStorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;

@Slf4j
@Service
public class ConversationService {

    public static final String DEFAULT_TITLE = "New conversation";
    private static final int MAX_TITLE_LENGTH = 200;

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository chunkRepository;
    private final ObjectStorageService storageService;
    private final UserAccountService userAccountService;
    private final TransactionTemplate transactionTemplate;

    public ConversationService(ConversationRepository conversationRepository,
                               MessageRepository messageRepository,
                               DocumentRepository documentRepository,
                               DocumentChunkRepository chunkRepository,
                               ObjectStorageService storageService,
                               UserAccountService userAccountService,
                               TransactionTemplate transactionTemplate) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.documentRepository = documentRepository;
        this.chunkRepository = chunkRepository;
        this.storageService = storageService;
        this.userAccountService = userAccountService;
        this.transactionTemplate = transactionTemplate;
    }

    @Transactional
    public Conversation create(String username) {
        User user = userAccountService.requireUser(username);
        Conversation conversation = new Conversation();
        conversation.setUser(user);
        conversation.setTitle(DEFAULT_TITLE);
        return conversationRepository.save(conversation);
    }

    @Transactional(readOnly = true)
    public List<Conversation> listOwned(String username) {
        User user = userAccountService.requireUser(username);
        return conversationRepository.findByUser_IdOrderByUpdatedAtDesc(user.getId());
    }

    @Transactional(readOnly = true)
    public Conversation requireOwned(String conversationId, String username) {
        if (conversationId == null || conversationId.isBlank()) {
            throw new NotFoundException("Conversation not found.");
        }
        return conversationRepository.findByConversationIdAndUser_Username(conversationId, username)
                .orElseThrow(() -> new NotFoundException("Conversation not found."));
    }

    @Transactional(readOnly = true)
    public Conversation findOwnedOrNull(String conversationId, String username) {
        if (conversationId == null || conversationId.isBlank()) {
            return null;
        }
        return conversationRepository.findByConversationIdAndUser_Username(conversationId, username)
                .orElse(null);
    }

    public void touch(String conversationId) {
        transactionTemplate.executeWithoutResult(status -> conversationRepository.findById(conversationId)
                .ifPresent(conversation -> {
                    conversation.touch();
                    conversationRepository.save(conversation);
                }));
    }

    @Transactional
    public void rename(String conversationId, String username, String title) {
        Conversation conversation = requireOwned(conversationId, username);
        String clean = cleanTitle(title);
        if (clean != null) {
            conversation.setTitle(clean);
            conversationRepository.save(conversation);
        }
    }

    public String cleanTitle(String title) {
        if (title == null || title.isBlank()) {
            return null;
        }
        String clean = title.replaceAll("[\\r\\n\\t]+", " ").replaceAll(" {2,}", " ").trim();
        if (clean.isEmpty()) {
            return null;
        }
        return clean.length() > MAX_TITLE_LENGTH ? clean.substring(0, MAX_TITLE_LENGTH) : clean;
    }

    public String titleFromMessage(String message) {
        String clean = cleanTitle(message);
        if (clean == null) {
            return DEFAULT_TITLE;
        }
        return clean.length() > 60 ? clean.substring(0, 57) + "..." : clean;
    }

    /**
     * Storage deletion happens outside the database transaction; if object storage is
     * temporarily unavailable the database rows are still removed and the failure is
     * logged. Orphaned private objects are preferable to rows pointing at missing files.
     */
    public void delete(String conversationId, String username) {
        Conversation conversation = requireOwned(conversationId, username);
        String ownerId = conversation.getUser().getId();
        List<Document> documents = documentRepository
                .findByConversation_ConversationIdAndUser_IdOrderByCreatedAtDesc(conversationId, ownerId);

        for (Document document : documents) {
            try {
                storageService.delete(document.getObjectKey());
            } catch (RuntimeException e) {
                log.warn("Could not delete object {} for document {}: {}",
                        document.getObjectKey(), document.getDocumentId(), e.getMessage());
            }
        }

        transactionTemplate.executeWithoutResult(status -> {
            List<Message> messages = messageRepository
                    .findByConversation_ConversationIdOrderBySentAtAscMessageIdAsc(conversationId);
            messageRepository.deleteAll(messages);
            for (Document document : documents) {
                chunkRepository.deleteAllForDocument(document.getDocumentId());
            }
            documentRepository.deleteAll(documents);
            conversationRepository.deleteById(conversationId);
        });
    }
}
