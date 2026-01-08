DROP TABLE IF EXISTS laws CASCADE;

CREATE TABLE laws (
  id SERIAL PRIMARY KEY,

  issuing_authority TEXT NOT NULL,
  number INTEGER NOT NULL,
  year INTEGER NOT NULL,

  president_name TEXT,
  issue_date DATE,
  publish_date DATE,
  effective_date DATE,
  gazette_ref TEXT,
  title TEXT,

  preamble TEXT,
  articles JSONB NOT NULL DEFAULT '[]'::jsonb,

  full_text TEXT NOT NULL,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT laws_number_year_uniq UNIQUE (number, year)
);

CREATE INDEX IF NOT EXISTS laws_year_idx ON laws (year DESC);