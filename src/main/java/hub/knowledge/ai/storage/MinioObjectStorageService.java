package hub.knowledge.ai.storage;

import hub.knowledge.ai.config.MinioProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
public class MinioObjectStorageService implements ObjectStorageService {

    private final S3Client s3Client;
    private final MinioProperties properties;
    private final AtomicBoolean bucketVerified = new AtomicBoolean(false);

    public MinioObjectStorageService(S3Client s3Client, MinioProperties properties) {
        this.s3Client = s3Client;
        this.properties = properties;
    }

    @Override
    public void ensureBucket() {
        if (bucketVerified.get()) {
            return;
        }
        synchronized (bucketVerified) {
            if (bucketVerified.get()) {
                return;
            }
            try {
                s3Client.headBucket(HeadBucketRequest.builder().bucket(properties.getBucket()).build());
            } catch (NoSuchBucketException e) {
                try {
                    s3Client.createBucket(request -> request.bucket(properties.getBucket()));
                    log.info("Created private bucket '{}'", properties.getBucket());
                } catch (S3Exception createError) {
                    if (createError.statusCode() != 409) {
                        throw new StorageException("Unable to create bucket " + properties.getBucket(), createError);
                    }
                }
            } catch (S3Exception e) {
                // MinIO returns 404 rather than NoSuchBucket in some versions.
                if (e.statusCode() == 404) {
                    try {
                        s3Client.createBucket(request -> request.bucket(properties.getBucket()));
                        log.info("Created private bucket '{}'", properties.getBucket());
                    } catch (S3Exception createError) {
                        if (createError.statusCode() != 409) {
                            throw new StorageException("Unable to create bucket " + properties.getBucket(), createError);
                        }
                    }
                } else {
                    throw new StorageException("Unable to reach object storage", e);
                }
            } catch (SdkException e) {
                throw new StorageException("Unable to reach object storage", e);
            }
            bucketVerified.set(true);
        }
    }

    @Override
    public void put(String objectKey, Path file, String contentType) {
        ensureBucket();
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(objectKey)
                    .contentType(contentType == null ? "application/octet-stream" : contentType)
                    .build();
            s3Client.putObject(request, RequestBody.fromFile(file));
        } catch (SdkException e) {
            throw new StorageException("Failed to store document in object storage", e);
        }
    }

    @Override
    public InputStream openStream(String objectKey) {
        try {
            return s3Client.getObject(GetObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(objectKey)
                    .build());
        } catch (NoSuchKeyException e) {
            throw new StorageException("Document object no longer exists in storage", e);
        } catch (SdkException e) {
            throw new StorageException("Failed to read document from object storage", e);
        }
    }

    @Override
    public void delete(String objectKey) {
        if (objectKey == null || objectKey.isBlank()) {
            return;
        }
        try {
            s3Client.deleteObject(DeleteObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(objectKey)
                    .build());
        } catch (SdkException e) {
            throw new StorageException("Failed to delete document from object storage", e);
        }
    }

    @Override
    public boolean exists(String objectKey) {
        try {
            s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(properties.getBucket())
                    .key(objectKey)
                    .build());
            return true;
        } catch (NoSuchKeyException e) {
            return false;
        } catch (SdkException e) {
            throw new StorageException("Failed to check object storage", e);
        }
    }

    @Override
    public String bucketName() {
        return properties.getBucket();
    }
}
