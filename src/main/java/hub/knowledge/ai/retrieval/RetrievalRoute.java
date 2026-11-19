package hub.knowledge.ai.retrieval;

public enum RetrievalRoute {
    /** Use the selected excerpts and cite them. */
    GROUNDED,
    /** No documents attached, or the question is unrelated; answer from general knowledge. */
    GENERAL,
    /** Documents are attached but do not contain enough evidence; refuse politely. */
    INSUFFICIENT
}
