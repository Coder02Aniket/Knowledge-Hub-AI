package hub.knowledge.ai.processing;

import hub.knowledge.ai.config.KnowledgeHubProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Splits extracted text into overlapping chunks. Breaks are preferred at paragraph,
 * sentence or word boundaries so chunks stay readable for the language model.
 */
@Component
public class TextChunker {

    private final int chunkSize;
    private final int overlap;

    public TextChunker(KnowledgeHubProperties properties) {
        this.chunkSize = properties.getIngestion().getChunkSize();
        this.overlap = properties.getIngestion().getChunkOverlap();
        if (chunkSize < 100) {
            throw new IllegalStateException("knowledgehub.ingestion.chunk-size must be at least 100");
        }
        if (overlap < 0 || overlap >= chunkSize) {
            throw new IllegalStateException(
                    "knowledgehub.ingestion.chunk-overlap must be >= 0 and smaller than chunk-size");
        }
    }

    public List<ChunkDraft> chunk(ExtractedDocument document) {
        List<ChunkDraft> result = new ArrayList<>();
        int index = 0;
        for (ExtractedPage page : document.pages()) {
            if (page.text() == null || page.text().isBlank()) {
                continue;
            }
            for (String piece : chunkPage(page.text())) {
                result.add(new ChunkDraft(
                        index++,
                        piece,
                        page.pageNumber() > 0 ? page.pageNumber() : null,
                        Math.max(1, (int) Math.ceil(piece.length() / 4.0))));
            }
        }
        return result;
    }

    List<String> chunkPage(String text) {
        List<String> chunks = new ArrayList<>();
        String source = text.trim();
        int length = source.length();
        int start = 0;

        while (start < length) {
            int end = Math.min(start + chunkSize, length);
            if (end < length) {
                int earliest = start + (int) (chunkSize * 0.6);
                int boundary = findBoundary(source, earliest, end);
                if (boundary > start) {
                    end = boundary;
                }
            }

            String content = source.substring(start, end).trim();
            if (!content.isBlank()) {
                chunks.add(content);
            }
            if (end >= length) {
                break;
            }

            int next = Math.max(start + 1, end - overlap);
            // Move forward to the next whitespace so chunks do not begin mid-word.
            while (next < end && next < length && !Character.isWhitespace(source.charAt(next))) {
                next++;
            }
            start = Math.max(next, start + 1);
        }
        return chunks;
    }

    private int findBoundary(String text, int earliest, int latest) {
        String[] separators = {"\n\n", "\n", ". ", "! ", "? ", "; ", ", ", " "};
        for (String separator : separators) {
            int position = text.lastIndexOf(separator, latest);
            if (position >= earliest) {
                return position + separator.length();
            }
        }
        return latest;
    }
}
