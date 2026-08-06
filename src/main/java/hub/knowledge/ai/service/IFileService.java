package hub.knowledge.ai.service;


import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;

import java.io.IOException;
import java.util.List;

public interface IFileService {
    void uploadFile(MultipartFile file , String bName) throws IOException;
    void uploadFile(MultipartFile file) throws IOException;
    boolean ifBucketExists(String bucketName);
    void createBucket(String bucketName);
    void deleteBucket(String bucketName);
    DeleteObjectResponse deleteFile(String fileName, String bucketName);
    DeleteObjectResponse deleteFile(String fileName);
    List<String> listFiles();
    List<String> listFiles(String bucketName);
}
