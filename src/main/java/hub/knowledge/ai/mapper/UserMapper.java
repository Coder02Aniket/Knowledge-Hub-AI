package hub.knowledge.ai.mapper;

import hub.knowledge.ai.dto.UserDTO;
import hub.knowledge.ai.model.User;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    @Autowired
    private ModelMapper modelMapper ;

    public User fromDTO (UserDTO userDTO) {
        return modelMapper.map(userDTO, User.class);

    }

    public UserDTO toDTO (User user) {
        return modelMapper.map(user, UserDTO.class);
    }
}
