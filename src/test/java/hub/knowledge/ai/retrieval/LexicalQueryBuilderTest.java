package hub.knowledge.ai.retrieval;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class LexicalQueryBuilderTest {

    @Test
    void removesStopwordsAndJoinsWithOr() {
        Optional<String> query = LexicalQueryBuilder.buildTsQuery(
                "How do I configure the retry timeout?");

        assertThat(query).isPresent();
        assertThat(query.get()).isEqualTo("configure | retry | timeout");
    }

    @Test
    void returnsEmptyForBlankInput() {
        assertThat(LexicalQueryBuilder.buildTsQuery("   ")).isEmpty();
        assertThat(LexicalQueryBuilder.buildTsQuery(null)).isEmpty();
    }

    @Test
    void returnsEmptyWhenOnlyStopwordsRemain() {
        assertThat(LexicalQueryBuilder.buildTsQuery("what is the how to do it")).isEmpty();
    }

    @Test
    void keepsIdentifiersAndNumbers() {
        Optional<String> query = LexicalQueryBuilder.buildTsQuery("error E-4021 in handler_2");

        assertThat(query).isPresent();
        assertThat(query.get()).contains("error", "4021", "handler_2");
    }

    @Test
    void escapesLikeWildcardsInPhrasePattern() {
        String pattern = LexicalQueryBuilder.buildPhrasePattern("100%_done");

        assertThat(pattern).isEqualTo("%100\\%\\_done%");
    }

    @Test
    void tokensAreLowercaseAndFiltered() {
        List<String> tokens = LexicalQueryBuilder.tokens("The RETRY policy for Qwen3");

        assertThat(tokens).containsExactly("retry", "policy", "qwen3");
    }
}
