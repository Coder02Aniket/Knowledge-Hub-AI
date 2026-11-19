package hub.knowledge.ai.ai;

import java.util.Locale;

public final class EmbeddingCodec {

    private EmbeddingCodec() {
    }

    /**
     * Renders a vector as a pgvector literal, e.g. {@code [0.12,-0.4,0.9]}.
     */
    public static String toLiteral(float[] vector) {
        if (vector == null) {
            return null;
        }
        StringBuilder sb = new StringBuilder(vector.length * 12).append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                sb.append(',');
            }
            if (Float.isNaN(vector[i]) || Float.isInfinite(vector[i])) {
                throw new IllegalArgumentException("Embedding contains a non-finite value at index " + i);
            }
            sb.append(String.format(Locale.ROOT, "%.7f", vector[i]));
        }
        return sb.append(']').toString();
    }

    public static void normalize(float[] vector) {
        double sum = 0;
        for (float v : vector) {
            sum += (double) v * v;
        }
        double norm = Math.sqrt(sum);
        if (norm == 0) {
            return;
        }
        for (int i = 0; i < vector.length; i++) {
            vector[i] = (float) (vector[i] / norm);
        }
    }
}
