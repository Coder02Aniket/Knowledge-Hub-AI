package hub.knowledge.ai.service;

import hub.knowledge.ai.model.User;

public interface IUserService {

    User createUser(String userName , String password , String email);

    User createUser(User user);

    User findUserById(String id);

    User findUserByName(String userName);


}
