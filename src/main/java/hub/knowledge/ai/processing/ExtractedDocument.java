package hub.knowledge.ai.processing;

import java.util.List;
import java.util.Objects;

public record ExtractedDocument(List<ExtractedPage> pages) {

    public ExtractedDocument {
        pages = List.copyOf(pages);
    }

    public boolean isEmpty() {
        return pages.stream().allMatch(p -> p.text() == null || p.text().isBlank());
    }

    public int characterCount() {
        return pages.stream()
                .map(ExtractedPage::text)
                .filter(Objects::nonNull)
                .mapToInt(String::length)
                .sum();
    }
}
