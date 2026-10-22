package hub.knowledge.ai.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "minio")
public class MinioProperties {
    private String endpoint = "http://localhost:9002";
    private String accessKey;
    private String secretKey;
    private String bucket = "knowledgehub";
    private String region = "us-east-1";
}
