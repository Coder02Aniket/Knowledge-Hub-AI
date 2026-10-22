package hub.knowledge.ai;

import org.modelmapper.ModelMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@org.springframework.boot.context.properties.EnableConfigurationProperties({
    hub.knowledge.ai.config.KnowledgeHubProperties.class,
    hub.knowledge.ai.config.MinioProperties.class
})
public class KnowledgeHubApplication {

    public static void main(String[] args) {
        SpringApplication.run(KnowledgeHubApplication.class, args);
    }

    @Bean
    public ModelMapper mapper(){
        return new ModelMapper();
    }
}
