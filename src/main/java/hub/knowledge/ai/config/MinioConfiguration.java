package hub.knowledge.ai.config;


import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.services.s3.S3Client;

import java.net.URI;



@Configuration
@ConfigurationProperties("minio")
public class MinioConfiguration {
    @Getter
    @Setter
    private String endpoint;
    @Setter
    @Getter
    private String accessKey;
    @Getter
    @Setter
    private String secretKey;



    @Bean
    public S3Client s3Client(

    ) {

        System.out.println(endpoint);
        System.out.println(accessKey);
        System.out.println(secretKey);
        return S3Client.
                builder().
                endpointOverride(URI.create(endpoint)).
                region(software.amazon.awssdk.regions.Region.US_EAST_1).
                credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(accessKey, secretKey)
                )).forcePathStyle(true).build();

    }
}
