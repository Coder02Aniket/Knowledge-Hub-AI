package hub.knowledge.ai.controller;


import hub.knowledge.ai.model.User;
import hub.knowledge.ai.service.IUserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RequestMapping("/api/user/")
@RestController
public class UserController {

    @Autowired
    private IUserService userService;

    @PostMapping(value = "/create")
    public User addUser(@RequestBody User user) {

        user.hashPassword();

        return userService.createUser(user);
    }
}
