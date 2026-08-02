package hub.knowledge.ai.controller;


import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/health")
public class HealthCheck {

    @GetMapping({"" , "/" , "/status"})
    public String status(){
        return "KnowledgeHub is up and running!";
    }
}
