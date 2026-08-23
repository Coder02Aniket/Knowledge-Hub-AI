package hub.knowledge.ai.dto;

import lombok.Data;
import lombok.NonNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
public class DocumentDTO {

    private String documentId;

    private String fileName;


    private LocalDateTime creationTimeStamp = LocalDateTime.now();

    private String fileType;

    private String objectKey;

    @NonNull
    private MessageDTO message ;
}
