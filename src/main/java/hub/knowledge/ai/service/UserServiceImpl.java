package hub.knowledge.ai.service;

import hub.knowledge.ai.model.User;
import hub.knowledge.ai.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service

public class UserServiceImpl implements IUserService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public User createUser(String userName, String password, String email) {
        User user = new User();

        user.setUsername(userName);
        user.setPassword(password);
        user.setEmail(email);

        return userRepository.save(user);


    }

    @Override
    public User createUser(User user) {
        return userRepository.save(user);
    }

    @Override
    public User findUserById(String id) {
        return userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
    }

    @Override
    public User findUserByuserName(String userName) {
        return userRepository.findByUsername(userName).orElseThrow(() -> new RuntimeException("User not found"));
    }
}
