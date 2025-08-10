-- Create table to store daily draws for CG160
-- Ensures one row per day and allows setting a manual winner
CREATE TABLE IF NOT EXISTS cg160_draws (
  id BIGSERIAL PRIMARY KEY,
  draw_date DATE NOT NULL UNIQUE,
  winner_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  manual BOOLEAN NOT NULL DEFAULT FALSE,
  total_tickets INTEGER,
  notes TEXT,
  selected_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Helpful index on winner and created_at for history queries
CREATE INDEX IF NOT EXISTS idx_cg160_draws_winner ON cg160_draws (winner_user_id);
CREATE INDEX IF NOT EXISTS idx_cg160_draws_created_at ON cg160_draws (created_at);
