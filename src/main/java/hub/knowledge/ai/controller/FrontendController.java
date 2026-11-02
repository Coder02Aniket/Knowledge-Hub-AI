package hub.knowledge.ai.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class FrontendController {

    @GetMapping({
            "",
            "/",
            "/index",
            "/chat",
            "/documents",
            "/vault",
            "/login",
            "/register",
            "/c/{conversationId}"
    })
    public String forwardSpa() {
        return "forward:/index.html";
    }
}
