-- Criar tabela para armazenar o estado dos cofres de cada jogo
CREATE TABLE IF NOT EXISTS game_cofres (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_contributed DECIMAL(10,2) DEFAULT 0.00,
    total_distributed DECIMAL(10,2) DEFAULT 0.00,
    game_count INTEGER DEFAULT 0,
    last_distribution TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar tabela para registrar os prêmios distribuídos pelo cofre
CREATE TABLE IF NOT EXISTS cofre_prizes (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(100) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    prize_amount DECIMAL(10,2) NOT NULL,
    cofre_balance_before DECIMAL(10,2) NOT NULL,
    cofre_balance_after DECIMAL(10,2) NOT NULL,
    game_count_trigger INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_game_cofres_game_name ON game_cofres(game_name);
CREATE INDEX IF NOT EXISTS idx_cofre_prizes_game_name ON cofre_prizes(game_name);
CREATE INDEX IF NOT EXISTS idx_cofre_prizes_user_id ON cofre_prizes(user_id);
CREATE INDEX IF NOT EXISTS idx_cofre_prizes_created_at ON cofre_prizes(created_at DESC);

-- Inserir cofre inicial para o jogo Raspe da Esperança
INSERT INTO game_cofres (game_name, balance, total_contributed, total_distributed, game_count)
VALUES ('raspe-da-esperanca', 0.00, 0.00, 0.00, 0)
ON CONFLICT (game_name) DO NOTHING;

-- Inserir cofres para outros jogos (caso queira expandir no futuro)
INSERT INTO game_cofres (game_name, balance, total_contributed, total_distributed, game_count)
VALUES 
    ('fortuna-dourada', 0.00, 0.00, 0.00, 0),
    ('mega-sorte', 0.00, 0.00, 0.00, 0)
ON CONFLICT (game_name) DO NOTHING;

COMMIT;
