-- Runs once when the Postgres data volume is first initialised.
-- The application also issues "CREATE EXTENSION IF NOT EXISTS vector" on every
-- new connection so that pre-existing volumes are upgraded automatically.
CREATE EXTENSION IF NOT EXISTS vector;
