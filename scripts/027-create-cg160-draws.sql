-- Create table to store a manual winner per day for CG160
-- Run this script once before using the feature.
-- Safe to re-run (will only create if not exists).

CREATE TABLE IF NOT EXISTS cg160_draws (
  draw_date date PRIMARY KEY,
  winner_user_id integer NOT NULL,
  set_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cg160_draws_winner_fk FOREIGN KEY (winner_user_id) REFERENCES users(id)
);

-- Helpful index if you need to list by winner
CREATE INDEX IF NOT EXISTS idx_cg160_draws_winner ON cg160_draws (winner_user_id);

-- Optional: ensure updated_at is touched on update
CREATE OR REPLACE FUNCTION set_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_cg160_draws_updated_at ON cg160_draws;

CREATE TRIGGER set_cg160_draws_updated_at
BEFORE UPDATE ON cg160_draws
FOR EACH ROW
EXECUTE PROCEDURE set_updated_at_timestamp();
