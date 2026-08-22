package hub.knowledge.ai.controller;

import hub.knowledge.ai.service.IFileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.model.DeleteObjectResponse;

import java.io.IOException;
import java.util.List;

@Controller
@RequestMapping("/documents")
public class DocumentController {

    @Autowired
    private IFileService fileService;

    @GetMapping("/file/list")
    @ResponseBody
    public List<String> listFiles(@RequestParam(value = "bucketName" , required = false)String bucketName) {
        if(bucketName == null) {
            return fileService.listFiles();
        }
        return fileService.listFiles(bucketName);
    }

    @PostMapping("/file/upload")
    @ResponseBody
    public String uploadDocument(@RequestParam("file") MultipartFile file , @RequestParam(value = "bucketName"  , required = false) String bucketName) throws IOException {
        // Logic to handle document upload

        //minio integration
        if(bucketName == null || bucketName.isBlank()){
            fileService.uploadFile(file);
        }else {
           fileService.uploadFile(file,bucketName);
        }

        return "Document uploaded successfully";
    }

    @GetMapping("/file/delete/{fileName}")
    @ResponseBody
    public DeleteObjectResponse deleteDocument(@PathVariable("fileName") String fileName , @RequestParam(value = "bucketName", required = false) String bucketName){
        if(bucketName == null) {
            return fileService.deleteFile(fileName);
        }
        return fileService.deleteFile(fileName, bucketName);
    }

    @GetMapping("/file")
    public String uploadDocument() {
        return "documents";
    }
}
