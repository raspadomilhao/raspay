-- Adicionar campo de ordem aos jogos
ALTER TABLE games ADD COLUMN display_order INTEGER DEFAULT 0;

-- Definir ordem inicial baseada no ID (jogos mais antigos primeiro)
UPDATE games SET display_order = id * 10;

-- Criar índice para melhor performance
CREATE INDEX idx_games_display_order ON games(display_order);
