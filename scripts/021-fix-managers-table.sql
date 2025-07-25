-- Criar tabela de gerentes se não existir
CREATE TABLE IF NOT EXISTS managers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    balance DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar tabela de comissões de gerentes se não existir
CREATE TABLE IF NOT EXISTS manager_commissions (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER REFERENCES managers(id) ON DELETE CASCADE,
    affiliate_commission_id INTEGER REFERENCES affiliate_commissions(id) ON DELETE CASCADE,
    commission_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP NULL
);

-- Criar tabela de saques de gerentes se não existir
CREATE TABLE IF NOT EXISTS manager_withdraws (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER REFERENCES managers(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL
);

-- Adicionar coluna manager_id na tabela affiliates se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='affiliates' AND column_name='manager_id') THEN
        ALTER TABLE affiliates ADD COLUMN manager_id INTEGER REFERENCES managers(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_manager_commissions_manager_id ON manager_commissions(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_commissions_affiliate_commission_id ON manager_commissions(affiliate_commission_id);
CREATE INDEX IF NOT EXISTS idx_manager_withdraws_manager_id ON manager_withdraws(manager_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_manager_id ON affiliates(manager_id);

-- Inserir gerente de teste se não existir
INSERT INTO managers (name, email, username, password_hash, commission_rate, balance)
SELECT 'Gerente Teste', 'gerente@teste.com', 'gerente_teste', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 5.00, 100.00
WHERE NOT EXISTS (SELECT 1 FROM managers WHERE email = 'gerente@teste.com');

-- Atualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para updated_at se não existirem
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_managers_updated_at') THEN
        CREATE TRIGGER update_managers_updated_at BEFORE UPDATE ON managers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMIT;
