package hub.knowledge.ai.controller;

import hub.knowledge.ai.dto.DocumentView;
import hub.knowledge.ai.model.Document;
import hub.knowledge.ai.service.DocumentService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentApiController {

    private final DocumentService documentService;

    public DocumentApiController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping("/upload")
    public DocumentView upload(@RequestParam(value = "conversationId", required = false) String conversationId,
                               @RequestParam("file") MultipartFile file,
                               @AuthenticationPrincipal UserDetails userDetails) {
        Document doc = documentService.upload(conversationId, userDetails.getUsername(), file);
        return map(doc);
    }

    @GetMapping
    public List<DocumentView> list(@RequestParam(value = "conversationId", required = false) String conversationId,
                                   @AuthenticationPrincipal UserDetails userDetails) {
        return documentService.listOwned(conversationId, userDetails.getUsername())
                .stream()
                .map(this::map)
                .toList();
    }

    @DeleteMapping("/{documentId}")
    public void delete(@PathVariable("documentId") String documentId,
                       @AuthenticationPrincipal UserDetails userDetails) {
        documentService.delete(documentId, userDetails.getUsername());
    }

    @PostMapping("/{documentId}/retry")
    public DocumentView retry(@PathVariable("documentId") String documentId,
                              @AuthenticationPrincipal UserDetails userDetails) {
        return map(documentService.retry(documentId, userDetails.getUsername()));
    }

    @GetMapping("/{documentId}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable("documentId") String documentId,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        // Find document metadata to get the safe filename and content type
        Document doc = documentService.listOwned(null, userDetails.getUsername()).stream()
                .filter(d -> d.getDocumentId().equals(documentId))
                .findFirst()
                .orElseThrow(() -> new hub.knowledge.ai.exception.NotFoundException("Document not found."));

        InputStream stream = documentService.download(documentId, userDetails.getUsername());
        
        String filename = URLEncoder.encode(doc.getFileName(), StandardCharsets.UTF_8).replace("+", "%20");
        String disposition = "attachment; filename*=UTF-8''" + filename;
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                .contentType(MediaType.parseMediaType(doc.getContentType() != null ? doc.getContentType() : "application/octet-stream"))
                .body(new InputStreamResource(stream));
    }

    private DocumentView map(Document doc) {
        return new DocumentView(
                doc.getDocumentId(),
                doc.getConversation() != null ? doc.getConversation().getConversationId() : null,
                doc.getConversation() != null ? doc.getConversation().getTitle() : null,
                doc.getFileName(),
                doc.getContentType(),
                doc.getFileSize() != null ? doc.getFileSize() : 0,
                doc.getStatus(),
                doc.getProcessingError(),
                doc.getChunkCount(),
                doc.getCreatedAt(),
                doc.getStatus() == hub.knowledge.ai.model.DocumentStatus.FAILED && doc.getRetryCount() < 3
        );
    }
}
