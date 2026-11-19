-- Removes columns left behind by the pre-refactor schema.
-- Hibernate's ddl-auto=update only adds columns, it never drops them, so these
-- unused NOT NULL / oid columns keep breaking inserts. Safe to run repeatedly.

-- documents.timestamp was NOT NULL with no default and is no longer mapped.
ALTER TABLE documents DROP COLUMN IF EXISTS "timestamp";

-- messages.document_document_id, model_response and user_message are no longer mapped.
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_document_document_id_key;
ALTER TABLE messages DROP COLUMN IF EXISTS document_document_id;
ALTER TABLE messages DROP COLUMN IF EXISTS model_response;
ALTER TABLE messages DROP COLUMN IF EXISTS user_message;
