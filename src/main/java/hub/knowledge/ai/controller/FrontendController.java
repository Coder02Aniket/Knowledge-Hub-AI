package hub.knowledge.ai.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {

    @GetMapping({"", "/", "/chat", "/index"})
    public String index() {
        return "chat";
    }

    @GetMapping("/documents")
    public String documents() {
        return "chat"; // Both views use the same HTMX+Alpine template now
    }
}
