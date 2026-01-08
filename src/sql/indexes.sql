-- sql/indexes.sql
-- Indexes for search optimization

-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Fatwas indexes
CREATE INDEX IF NOT EXISTS idx_fatwas_full_text_trgm 
ON fatwas USING gin (full_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_fatwas_number_year 
ON fatwas (number, year);

-- Laws indexes
CREATE INDEX IF NOT EXISTS idx_laws_full_text_trgm 
ON laws USING gin (full_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_laws_title_trgm 
ON laws USING gin (title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_laws_number_year 
ON laws (number, year);

-- Judgments indexes
CREATE INDEX IF NOT EXISTS idx_judgments_full_text_trgm 
ON judgments USING gin (full_text gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_judgments_case_number_year 
ON judgments (case_number, case_year);

CREATE INDEX IF NOT EXISTS idx_judgments_court_name 
ON judgments (court_name);

-- Add tsvector columns for FTS
ALTER TABLE fatwas ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE laws ADD COLUMN IF NOT EXISTS search_vector tsvector;
ALTER TABLE judgments ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Update search vectors
UPDATE fatwas SET search_vector = to_tsvector('simple', full_text);
UPDATE laws SET search_vector = to_tsvector('simple', full_text);
UPDATE judgments SET search_vector = to_tsvector('simple', full_text);

-- Create GIN indexes on search vectors
CREATE INDEX IF NOT EXISTS idx_fatwas_search ON fatwas USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_laws_search ON laws USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_judgments_search ON judgments USING gin(search_vector);


-- Pagination and sorting
CREATE INDEX IF NOT EXISTS idx_fatwas_year ON fatwas (year DESC);
CREATE INDEX IF NOT EXISTS idx_laws_year ON laws (year DESC);
CREATE INDEX IF NOT EXISTS idx_judgments_year ON judgments (case_year DESC);