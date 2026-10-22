package hub.knowledge.ai.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/auth/status")
public class AuthStatusController {

    @GetMapping
    public ResponseEntity<?> getStatus(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
            return ResponseEntity.ok(Map.of("authenticated", true, "username", authentication.getName()));
        }
        return ResponseEntity.ok(Map.of("authenticated", false));
    }
}
