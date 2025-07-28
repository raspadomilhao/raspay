-- Criar sistema de prêmios físicos
-- Data: 2024-01-28

-- Tabela de prêmios físicos disponíveis
CREATE TABLE IF NOT EXISTS physical_prizes (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    estimated_value DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_alert INTEGER NOT NULL DEFAULT 5,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rarity_weight DECIMAL(5,2) NOT NULL DEFAULT 1.00, -- Peso para raridade (menor = mais raro)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de ganhadores de prêmios físicos
CREATE TABLE IF NOT EXISTS physical_prize_winners (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    physical_prize_id INTEGER NOT NULL REFERENCES physical_prizes(id),
    transaction_id INTEGER REFERENCES transactions(id),
    game_name VARCHAR(100) NOT NULL,
    
    -- Dados de entrega
    winner_name VARCHAR(255),
    winner_phone VARCHAR(20),
    winner_email VARCHAR(255),
    delivery_address TEXT,
    delivery_city VARCHAR(100),
    delivery_state VARCHAR(50),
    delivery_zipcode VARCHAR(20),
    delivery_notes TEXT,
    
    -- Status do prêmio
    status VARCHAR(50) NOT NULL DEFAULT 'pending_contact', -- pending_contact, contacted, address_collected, shipped, delivered, cancelled
    admin_notes TEXT,
    contacted_at TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    tracking_code VARCHAR(100),
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de log de alterações de estoque
CREATE TABLE IF NOT EXISTS physical_prize_stock_log (
    id SERIAL PRIMARY KEY,
    physical_prize_id INTEGER NOT NULL REFERENCES physical_prizes(id),
    change_type VARCHAR(50) NOT NULL, -- 'add', 'remove', 'won', 'adjustment'
    quantity_change INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    admin_user VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_physical_prize_winners_user_id ON physical_prize_winners(user_id);
CREATE INDEX IF NOT EXISTS idx_physical_prize_winners_status ON physical_prize_winners(status);
CREATE INDEX IF NOT EXISTS idx_physical_prize_winners_created_at ON physical_prize_winners(created_at);
CREATE INDEX IF NOT EXISTS idx_physical_prizes_active ON physical_prizes(is_active);
CREATE INDEX IF NOT EXISTS idx_physical_prizes_stock ON physical_prizes(stock_quantity);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_physical_prizes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_physical_prizes_updated_at
    BEFORE UPDATE ON physical_prizes
    FOR EACH ROW
    EXECUTE FUNCTION update_physical_prizes_updated_at();

CREATE TRIGGER trigger_physical_prize_winners_updated_at
    BEFORE UPDATE ON physical_prize_winners
    FOR EACH ROW
    EXECUTE FUNCTION update_physical_prizes_updated_at();

-- Função para decrementar estoque automaticamente
CREATE OR REPLACE FUNCTION decrement_physical_prize_stock(
    prize_id INTEGER,
    reason TEXT DEFAULT 'Prêmio ganho'
) RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Buscar estoque atual
    SELECT stock_quantity INTO current_stock
    FROM physical_prizes
    WHERE id = prize_id AND is_active = true;
    
    -- Verificar se o prêmio existe e tem estoque
    IF current_stock IS NULL THEN
        RETURN FALSE;
    END IF;
    
    IF current_stock <= 0 THEN
        RETURN FALSE;
    END IF;
    
    -- Calcular novo estoque
    new_stock := current_stock - 1;
    
    -- Atualizar estoque
    UPDATE physical_prizes
    SET stock_quantity = new_stock,
        updated_at = NOW()
    WHERE id = prize_id;
    
    -- Registrar no log
    INSERT INTO physical_prize_stock_log (
        physical_prize_id,
        change_type,
        quantity_change,
        previous_stock,
        new_stock,
        reason
    ) VALUES (
        prize_id,
        'won',
        -1,
        current_stock,
        new_stock,
        reason
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para adicionar estoque
CREATE OR REPLACE FUNCTION add_physical_prize_stock(
    prize_id INTEGER,
    quantity INTEGER,
    reason TEXT DEFAULT 'Reposição de estoque',
    admin_user VARCHAR(255) DEFAULT 'system'
) RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
    new_stock INTEGER;
BEGIN
    -- Buscar estoque atual
    SELECT stock_quantity INTO current_stock
    FROM physical_prizes
    WHERE id = prize_id;
    
    -- Verificar se o prêmio existe
    IF current_stock IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calcular novo estoque
    new_stock := current_stock + quantity;
    
    -- Atualizar estoque
    UPDATE physical_prizes
    SET stock_quantity = new_stock,
        updated_at = NOW()
    WHERE id = prize_id;
    
    -- Registrar no log
    INSERT INTO physical_prize_stock_log (
        physical_prize_id,
        change_type,
        quantity_change,
        previous_stock,
        new_stock,
        reason,
        admin_user
    ) VALUES (
        prize_id,
        'add',
        quantity,
        current_stock,
        new_stock,
        reason,
        admin_user
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE physical_prizes IS 'Tabela de prêmios físicos disponíveis no sistema';
COMMENT ON TABLE physical_prize_winners IS 'Tabela de ganhadores de prêmios físicos';
COMMENT ON TABLE physical_prize_stock_log IS 'Log de alterações no estoque de prêmios físicos';
