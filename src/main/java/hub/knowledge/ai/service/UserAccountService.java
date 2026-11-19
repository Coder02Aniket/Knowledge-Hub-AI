package hub.knowledge.ai.service;

import hub.knowledge.ai.exception.NotFoundException;
import hub.knowledge.ai.exception.ValidationException;
import hub.knowledge.ai.model.User;
import hub.knowledge.ai.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.regex.Pattern;

@Service
public class UserAccountService {

    private static final Pattern USERNAME = Pattern.compile("^[A-Za-z0-9._-]{3,40}$");
    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserAccountService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User register(String username, String email, String password, String firstName, String lastName) {
        String cleanUsername = username == null ? "" : username.trim();
        if (!USERNAME.matcher(cleanUsername).matches()) {
            throw new ValidationException(
                    "Username must be 3-40 characters and contain only letters, numbers, dot, dash or underscore.");
        }
        if (userRepository.existsByUsernameIgnoreCase(cleanUsername)) {
            throw new ValidationException("That username is already taken.");
        }
        String cleanEmail = email == null ? null : email.trim().toLowerCase(Locale.ROOT);
        if (cleanEmail != null && !cleanEmail.isBlank()) {
            if (!EMAIL.matcher(cleanEmail).matches()) {
                throw new ValidationException("Enter a valid email address.");
            }
            if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
                throw new ValidationException("An account with that email already exists.");
            }
        } else {
            cleanEmail = null;
        }
        if (password == null || password.length() < 8) {
            throw new ValidationException("Password must be at least 8 characters long.");
        }
        if (password.length() > 100) {
            throw new ValidationException("Password is too long.");
        }

        User user = new User();
        user.setUsername(cleanUsername);
        user.setEmail(cleanEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setFirstName(blankToNull(firstName));
        user.setLastName(blankToNull(lastName));
        return userRepository.save(user);
    }

    @Transactional(readOnly = true)
    public User requireUser(String username) {
        if (username == null || username.isBlank()) {
            throw new NotFoundException("User not found.");
        }
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found."));
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }
}
