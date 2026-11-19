package hub.knowledge.ai.retrieval;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Turns a natural-language question into a PostgreSQL {@code to_tsquery} expression.
 *
 * <p>The {@code simple} dictionary has no stemming and no stopword list, so tokens are
 * filtered here and joined with OR to keep recall high. The exact question is also used
 * as an ILIKE phrase boost by the repository.</p>
 */
public final class LexicalQueryBuilder {

    private static final Pattern TOKEN = Pattern.compile("[\\p{L}\\p{N}_]+");
    private static final Set<String> STOPWORDS = Set.of(
            "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
            "how", "what", "why", "when", "where", "which", "who", "whom",
            "do", "does", "did", "done", "to", "of", "in", "on", "at", "by",
            "for", "and", "or", "not", "with", "about", "from", "that", "this",
            "these", "those", "it", "its", "can", "could", "should", "would",
            "will", "shall", "may", "might", "must", "i", "we", "you", "they",
            "he", "she", "my", "our", "your", "their", "as", "if", "then",
            "than", "so", "such", "into", "over", "under", "up", "down", "out");
    private static final int MAX_TOKENS = 12;
    private static final int MAX_PHRASE_CHARS = 120;

    private LexicalQueryBuilder() {
    }

    public static Optional<String> buildTsQuery(String question) {
        if (question == null || question.isBlank()) {
            return Optional.empty();
        }
        Set<String> tokens = new LinkedHashSet<>();
        Matcher matcher = TOKEN.matcher(question);
        while (matcher.find() && tokens.size() < MAX_TOKENS) {
            String token = matcher.group().toLowerCase(Locale.ROOT);
            if (token.length() < 2 || STOPWORDS.contains(token)) {
                continue;
            }
            tokens.add(token);
        }
        if (tokens.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(String.join(" | ", new ArrayList<>(tokens)));
    }

    public static String buildPhrasePattern(String question) {
        if (question == null) {
            return "%";
        }
        String phrase = question.trim().replaceAll("\\s+", " ");
        if (phrase.length() > MAX_PHRASE_CHARS) {
            phrase = phrase.substring(0, MAX_PHRASE_CHARS);
        }
        String escaped = phrase
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
        return "%" + escaped + "%";
    }

    public static List<String> tokens(String question) {
        List<String> result = new ArrayList<>();
        if (question == null) {
            return result;
        }
        Matcher matcher = TOKEN.matcher(question);
        while (matcher.find() && result.size() < MAX_TOKENS) {
            String token = matcher.group().toLowerCase(Locale.ROOT);
            if (token.length() >= 2 && !STOPWORDS.contains(token)) {
                result.add(token);
            }
        }
        return result;
    }
}
