package hub.knowledge.ai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfiguration {

    public static final String DOCUMENT_EXECUTOR = "documentProcessingExecutor";

    /**
     * Document ingestion is CPU + network bound. A small bounded pool keeps memory
     * usage predictable while still allowing a couple of uploads to process in parallel.
     */
    @Bean(name = DOCUMENT_EXECUTOR)
    public Executor documentProcessingExecutor(KnowledgeHubProperties properties) {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        int threads = Math.max(1, properties.getIngestion().getWorkerThreads());
        executor.setCorePoolSize(threads);
        executor.setMaxPoolSize(threads);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("doc-ingest-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.initialize();
        return executor;
    }
}
