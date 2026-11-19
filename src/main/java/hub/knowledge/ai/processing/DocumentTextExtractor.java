package hub.knowledge.ai.processing;

import hub.knowledge.ai.exception.DocumentProcessingException;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Extracts plain text from the supported formats. PDFs keep per-page attribution so
 * answers can cite the page an excerpt came from.
 */
@Slf4j
@Component
public class DocumentTextExtractor {

    public ExtractedDocument extract(Path file, String extension) {
        String ext = extension == null ? "" : extension.toLowerCase(Locale.ROOT);
        try {
            return switch (ext) {
                case "pdf" -> extractPdf(file);
                case "txt", "md", "csv", "json" -> extractPlainText(file);
                default -> throw new DocumentProcessingException(
                        "Text extraction is not supported for ." + ext + " files.");
            };
        } catch (IOException e) {
            throw new DocumentProcessingException("Unable to read the uploaded file.", e);
        }
    }

    private ExtractedDocument extractPdf(Path file) throws IOException {
        try (PDDocument pdf = Loader.loadPDF(file.toFile())) {
            int pageCount = pdf.getNumberOfPages();
            if (pageCount == 0) {
                throw new DocumentProcessingException("The PDF contains no pages.");
            }
            List<ExtractedPage> pages = new ArrayList<>(pageCount);
            PDFTextStripper stripper = new PDFTextStripper();
            for (int page = 1; page <= pageCount; page++) {
                stripper.setStartPage(page);
                stripper.setEndPage(page);
                String text = normalize(stripper.getText(pdf));
                if (!text.isBlank()) {
                    pages.add(new ExtractedPage(page, text));
                }
            }
            return new ExtractedDocument(pages);
        }
    }

    private ExtractedDocument extractPlainText(Path file) throws IOException {
        String text = Files.readString(file, StandardCharsets.UTF_8);
        if (!text.isEmpty() && text.charAt(0) == '\uFEFF') {
            text = text.substring(1);
        }
        text = normalize(text);
        if (text.isBlank()) {
            return new ExtractedDocument(List.of());
        }
        return new ExtractedDocument(List.of(new ExtractedPage(0, text)));
    }

    private String normalize(String text) {
        if (text == null) {
            return "";
        }
        return text.replace("\r\n", "\n")
                .replace('\r', '\n')
                .replace("\u0000", " ")
                .replaceAll("[\\t\\x0B\\f]+", " ")
                .replaceAll(" {2,}", " ")
                .trim();
    }
}
