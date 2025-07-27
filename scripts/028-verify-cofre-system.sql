-- Verificar se as tabelas do cofre existem
DO $$
BEGIN
    -- Criar tabela game_cofres se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'game_cofres') THEN
        CREATE TABLE game_cofres (
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
        
        RAISE NOTICE 'Tabela game_cofres criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela game_cofres já existe';
    END IF;

    -- Criar tabela cofre_prizes se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cofre_prizes') THEN
        CREATE TABLE cofre_prizes (
            id SERIAL PRIMARY KEY,
            game_name VARCHAR(100) NOT NULL,
            user_id INTEGER NOT NULL REFERENCES users(id),
            prize_amount DECIMAL(10,2) NOT NULL,
            cofre_balance_before DECIMAL(10,2) NOT NULL,
            cofre_balance_after DECIMAL(10,2) NOT NULL,
            game_count_trigger INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela cofre_prizes criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela cofre_prizes já existe';
    END IF;

    -- Inicializar cofres para os jogos se não existirem
    INSERT INTO game_cofres (game_name, balance, total_contributed, total_distributed, game_count)
    VALUES 
        ('raspe-da-esperanca', 0.00, 0.00, 0.00, 0),
        ('fortuna-dourada', 0.00, 0.00, 0.00, 0),
        ('mega-sorte', 0.00, 0.00, 0.00, 0)
    ON CONFLICT (game_name) DO NOTHING;

    RAISE NOTICE 'Cofres inicializados para todos os jogos';
END $$;

-- Verificar status atual dos cofres
SELECT 
    game_name,
    balance,
    total_contributed,
    total_distributed,
    game_count,
    last_distribution,
    created_at
FROM game_cofres
ORDER BY game_name;
