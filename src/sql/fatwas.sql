DROP TABLE IF EXISTS fatwas CASCADE;

CREATE TABLE fatwas (
  id SERIAL PRIMARY KEY,

  issuing_authority TEXT NOT NULL,
  number INTEGER NOT NULL,
  year INTEGER NOT NULL,

  file_number TEXT,
  issue_date DATE,
  session_date DATE,

  entity TEXT,
  principles JSONB NOT NULL DEFAULT '[]'::jsonb,
  facts TEXT,
  application TEXT,
  opinion TEXT,

  full_text TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fatwas_number_year_uniq UNIQUE (number, year)
);

CREATE INDEX IF NOT EXISTS fatwas_year_idx ON fatwas (year DESC);