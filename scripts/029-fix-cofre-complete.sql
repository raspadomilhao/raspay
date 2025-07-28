-- Script completo para corrigir o sistema de cofre

-- 1. Remover tabelas antigas se existirem
DROP TABLE IF EXISTS cofre_prizes CASCADE;
DROP TABLE IF EXISTS game_cofres CASCADE;

-- 2. Criar tabela game_cofres
CREATE TABLE IF NOT EXISTS game_cofres (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(50) UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_contributed DECIMAL(10,2) DEFAULT 0.00,
    total_distributed DECIMAL(10,2) DEFAULT 0.00,
    game_count INTEGER DEFAULT 0,
    last_distribution TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 3. Criar tabela cofre_prizes
CREATE TABLE IF NOT EXISTS cofre_prizes (
    id SERIAL PRIMARY KEY,
    game_name VARCHAR(50) NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id),
    prize_amount DECIMAL(10,2) NOT NULL,
    cofre_balance_before DECIMAL(10,2) NOT NULL,
    cofre_balance_after DECIMAL(10,2) NOT NULL,
    game_count_trigger INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_game_cofres_game_name ON game_cofres(game_name);
CREATE INDEX IF NOT EXISTS idx_cofre_prizes_game_name ON cofre_prizes(game_name);
CREATE INDEX IF NOT EXISTS idx_cofre_prizes_user_id ON cofre_prizes(user_id);
CREATE INDEX IF NOT EXISTS idx_cofre_prizes_created_at ON cofre_prizes(created_at DESC);

-- 5. Inserir cofres iniciais com saldo para teste
INSERT INTO game_cofres (game_name, balance, total_contributed, total_distributed, game_count)
VALUES 
    ('raspe-da-esperanca', 0.00, 0.00, 0.00, 0),
    ('fortuna-dourada', 0.00, 0.00, 0.00, 0),
    ('mega-sorte', 0.00, 0.00, 0.00, 0)
ON CONFLICT (game_name) DO NOTHING;

-- 6. Verificar se foi criado corretamente
SELECT 'Tabela game_cofres criada com sucesso' as status;
SELECT 'Tabela cofre_prizes criada com sucesso' as status;

-- 7. Mostrar dados iniciais
SELECT 
    game_name,
    balance,
    total_contributed,
    total_distributed,
    game_count,
    created_at
FROM game_cofres
ORDER BY game_name;

-- Atualizar timestamps
CREATE OR REPLACE FUNCTION update_cofre_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cofre_timestamp ON game_cofres;
CREATE TRIGGER trigger_update_cofre_timestamp
    BEFORE UPDATE ON game_cofres
    FOR EACH ROW
    EXECUTE FUNCTION update_cofre_timestamp();

COMMIT;
