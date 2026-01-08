DROP TABLE IF EXISTS judgments CASCADE;

CREATE TABLE judgments (
  id SERIAL PRIMARY KEY,

  issuing_authority TEXT,
  court_name TEXT NOT NULL,
  case_type TEXT,

  case_number INTEGER NOT NULL,
  case_year INTEGER NOT NULL,
  session_date DATE,

  technical_office INTEGER,
  volume_number INTEGER,
  page_number INTEGER,
  rule_number INTEGER,
  reference_number TEXT,

  panel TEXT,
  principles JSONB NOT NULL DEFAULT '[]'::jsonb,
  facts TEXT,
  reasoning TEXT,
  ruling TEXT,

  full_text TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT judgments_case_uniq UNIQUE (case_number, case_year)
);

CREATE INDEX IF NOT EXISTS judgments_case_year_idx ON judgments (case_year DESC);
CREATE INDEX IF NOT EXISTS judgments_court_name_idx ON judgments (court_name);