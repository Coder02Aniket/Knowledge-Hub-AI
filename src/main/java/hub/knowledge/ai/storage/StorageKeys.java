package hub.knowledge.ai.storage;

import java.util.Locale;

public final class StorageKeys {

    private StorageKeys() {
    }

    /**
     * Builds an object key entirely from server-generated identifiers. The only
     * user-controlled component is the sanitised base name.
     */
    public static String forDocument(String ownerId, String conversationId, String documentId, String originalName) {
        return "users/" + ownerId
                + "/conversations/" + conversationId
                + "/" + documentId
                + "/" + safeFileName(originalName);
    }

    public static String safeFileName(String originalName) {
        String name = (originalName == null) ? "document" : originalName;
        name = name.replace('\\', '/');
        int slash = name.lastIndexOf('/');
        if (slash >= 0) {
            name = name.substring(slash + 1);
        }
        name = name.replaceAll("[\\p{Cntrl}]", "");
        name = name.replaceAll("[^A-Za-z0-9._ -]", "_").trim();
        name = name.replaceAll("\\s+", " ");
        if (name.isBlank() || name.equals(".") || name.equals("..")) {
            name = "document";
        }
        if (name.length() > 180) {
            String ext = extension(name);
            String base = name.substring(0, 180 - (ext.isEmpty() ? 0 : ext.length() + 1));
            name = ext.isEmpty() ? base : base + "." + ext;
        }
        return name;
    }

    public static String extension(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
