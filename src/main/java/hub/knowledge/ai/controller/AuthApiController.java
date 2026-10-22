package hub.knowledge.ai.controller;

import hub.knowledge.ai.model.User;
import hub.knowledge.ai.service.UserAccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthApiController {

    private final UserAccountService userAccountService;

    public AuthApiController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            User user = userAccountService.register(
                    request.username(), request.email(), request.password(), request.firstName(), request.lastName());
            return ResponseEntity.ok(Map.of("message", "User created successfully", "username", user.getUsername()));
        } catch (hub.knowledge.ai.exception.ValidationException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public record RegisterRequest(String username, String email, String password, String firstName, String lastName) {}
}
