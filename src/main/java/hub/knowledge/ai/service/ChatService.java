package hub.knowledge.ai.service;

import hub.knowledge.ai.ai.ChatCompletion;
import hub.knowledge.ai.ai.ChatCompletionService;
import hub.knowledge.ai.ai.ChatTurn;
import hub.knowledge.ai.config.KnowledgeHubProperties;
import hub.knowledge.ai.exception.ForbiddenException;
import hub.knowledge.ai.exception.NotFoundException;
import hub.knowledge.ai.exception.ValidationException;
import hub.knowledge.ai.model.Conversation;
import hub.knowledge.ai.model.DocumentStatus;
import hub.knowledge.ai.model.Message;
import hub.knowledge.ai.model.MessageRole;
import hub.knowledge.ai.model.MessageSource;
import hub.knowledge.ai.model.User;
import hub.knowledge.ai.repository.DocumentRepository;
import hub.knowledge.ai.repository.MessageRepository;
import hub.knowledge.ai.retrieval.RagPromptBuilder;
import hub.knowledge.ai.retrieval.RetrievalService;
import hub.knowledge.ai.retrieval.RetrievedChunk;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final ConversationService conversationService;
    private final UserAccountService userAccountService;
    private final MessageRepository messageRepository;
    private final RetrievalService retrievalService;
    private final ChatCompletionService chatCompletionService;
    private final RagPromptBuilder ragPromptBuilder;
    private final DocumentRepository documentRepository;
    private final KnowledgeHubProperties properties;
    private final TransactionTemplate transactionTemplate;

    public ChatService(ConversationService conversationService,
                       UserAccountService userAccountService,
                       MessageRepository messageRepository,
                       RetrievalService retrievalService,
                       ChatCompletionService chatCompletionService,
                       RagPromptBuilder ragPromptBuilder,
                       DocumentRepository documentRepository,
                       KnowledgeHubProperties properties,
                       TransactionTemplate transactionTemplate) {
        this.conversationService = conversationService;
        this.userAccountService = userAccountService;
        this.messageRepository = messageRepository;
        this.retrievalService = retrievalService;
        this.chatCompletionService = chatCompletionService;
        this.ragPromptBuilder = ragPromptBuilder;
        this.documentRepository = documentRepository;
        this.properties = properties;
        this.transactionTemplate = transactionTemplate;
    }

    public Message chat(String conversationId, String username, String userInput) {
        if (userInput == null || userInput.isBlank()) {
            throw new ValidationException("Message cannot be empty.");
        }
        User user = userAccountService.requireUser(username);

        Conversation conversation;
        if (conversationId == null || conversationId.isBlank()) {
            conversation = conversationService.create(user.getUsername());
            conversationService.rename(
                    conversation.getConversationId(), user.getUsername(), conversationService.titleFromMessage(userInput));
        } else {
            conversation = conversationService.requireOwned(conversationId, user.getUsername());
            conversationService.touch(conversation.getConversationId());
        }

        // 1. Save User Message
        Message userMessage = new Message();
        userMessage.setConversation(conversation);
        userMessage.setUser(user);
        userMessage.setRole(MessageRole.USER);
        userMessage.setContent(userInput.trim());
        transactionTemplate.executeWithoutResult(status -> messageRepository.save(userMessage));

        // 2. Retrieve Documents
        List<RetrievedChunk> chunks = retrievalService.retrieve(
                conversation.getConversationId(), user.getId(), userMessage.getContent());

        // 3. Build Prompt. Without any completed document the assistant answers from general
        // knowledge; as soon as the vault has content it is strictly grounded and cited.
        boolean hasDocuments = documentRepository.countByConversation_ConversationIdAndStatus(
                conversation.getConversationId(), DocumentStatus.COMPLETED) > 0;
        String systemPrompt = hasDocuments
                ? RagPromptBuilder.SYSTEM_PROMPT
                : RagPromptBuilder.GENERAL_SYSTEM_PROMPT;
        String groundedPrompt = hasDocuments
                ? ragPromptBuilder.buildUserPrompt(userMessage.getContent(), chunks)
                : userMessage.getContent();

        // 4. Fetch History
        List<ChatTurn> history = getHistory(conversation.getConversationId());

        // 5. Call LLM
        Message assistantMessage = new Message();
        assistantMessage.setConversation(conversation);
        assistantMessage.setUser(user);
        assistantMessage.setRole(MessageRole.ASSISTANT);
        
        try {
            ChatCompletion completion = chatCompletionService.complete(history, systemPrompt, groundedPrompt);
            assistantMessage.setContent(completion.content());
            assistantMessage.setModelName(completion.modelName());
            
            for (RetrievedChunk chunk : chunks) {
                MessageSource source = new MessageSource();
                source.setDocumentId(chunk.documentId());
                source.setDocumentName(chunk.documentName());
                source.setChunkIndex(chunk.chunkIndex());
                source.setPageNumber(chunk.pageNumber());
                source.setSimilarity(chunk.similarity());
                // Only keep a snippet for the UI, not the whole chunk
                String snippet = chunk.content();
                if (snippet != null && snippet.length() > 300) {
                    snippet = snippet.substring(0, 300) + "...";
                }
                source.setSnippet(snippet);
                assistantMessage.addSource(source);
            }
        } catch (Exception e) {
            assistantMessage.setFailed(true);
            String reason = e.getMessage();
            assistantMessage.setFailureReason(reason == null || reason.isBlank()
                    ? "The AI provider could not complete the chat request. Please try again."
                    : reason);
            assistantMessage.setModelName(chatCompletionService.modelLabel());
        }

        // 6. Save Assistant Message
        return transactionTemplate.execute(status -> messageRepository.save(assistantMessage));
    }

    @Transactional(readOnly = true)
    public List<Message> getConversationMessages(String conversationId, String username) {
        conversationService.requireOwned(conversationId, username);
        return messageRepository.findByConversation_ConversationIdOrderBySentAtAscMessageIdAsc(conversationId);
    }

    private List<ChatTurn> getHistory(String conversationId) {
        int max = properties.getAi().getMaxHistoryMessages();
        if (max <= 0) {
            return List.of();
        }
        // Retrieve the most recent N successful messages
        List<Message> recent = messageRepository.findRecent(conversationId, PageRequest.of(0, max));
        Collections.reverse(recent);
        
        // Remove the latest user message because we're sending it as the grounded current prompt
        if (!recent.isEmpty() && recent.get(recent.size() - 1).getRole() == MessageRole.USER) {
            recent.remove(recent.size() - 1);
        }
        
        return recent.stream()
                .map(m -> new ChatTurn(m.getRole(), m.getContent()))
                .collect(Collectors.toList());
    }
}
