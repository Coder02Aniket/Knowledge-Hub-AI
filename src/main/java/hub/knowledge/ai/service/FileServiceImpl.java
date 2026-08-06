package hub.knowledge.ai.service;

import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@ConfigurationProperties("minio")
public class FileServiceImpl implements IFileService {

    @Autowired
    private S3Client s3Client;

    @Getter
    @Setter
    private String defaultBucket;


    @Override
    public void uploadFile(MultipartFile file , String bucketName) throws IOException {
        if(ifBucketExists(bucketName)){
            System.out.println("Bucket exists");
        }else {
            System.out.println("Bucket does not exist");
            createBucket(bucketName);
        }
        s3Client.
                putObject(
                        PutObjectRequest
                                .builder()
                                .bucket(bucketName)
                                .key(file.getName())
                                .build(),
                        RequestBody.fromBytes(file.getBytes())
                );


    }
    @Override
    public void uploadFile(MultipartFile file) throws IOException {
        uploadFile(file,defaultBucket);
    }
    @Override
    public boolean ifBucketExists(String bucketName) {
        return s3Client.listBuckets().buckets().stream().anyMatch(b -> b.name().equals(bucketName));
    }

    @Override
    public void createBucket(String bucketName) {
        s3Client.createBucket(request -> request.bucket(bucketName));
    }

    @Override
    public void deleteBucket(String bucketName) {
        s3Client.deleteBucket(request -> request.bucket(bucketName));
    }

    @Override
    public DeleteObjectResponse deleteFile(String fileName , String bucketName){

        try {
            return s3Client.deleteObject(request -> request.bucket(bucketName).key(fileName));
        } catch (NoSuchBucketException e) {
            System.out.println("Bucket does not exist: " + bucketName);
            throw e;
        } catch (Exception e) {
            System.out.println("Error deleting file: " + e.getMessage());
            throw e ;
        }
    }

    @Override
    public DeleteObjectResponse deleteFile(String fileName) {
        return deleteFile(fileName,defaultBucket);
    }

    public List<String> listFiles(String bucketName) {
        return s3Client.listObjectsV2(request -> request.bucket(bucketName))
                .contents()
                .stream()
                .map(S3Object::key)
                .collect(Collectors.toList());
    }

    public List<String> listFiles() {
        return listFiles(defaultBucket);
    }
}
