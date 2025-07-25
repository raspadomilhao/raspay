-- Criar tabela de gerentes
CREATE TABLE IF NOT EXISTS managers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    status VARCHAR(20) DEFAULT 'active',
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar coluna manager_id na tabela affiliates
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES managers(id);

-- Criar tabela de comissões dos gerentes
CREATE TABLE IF NOT EXISTS manager_commissions (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER NOT NULL REFERENCES managers(id),
    affiliate_id INTEGER NOT NULL REFERENCES affiliates(id),
    commission_amount DECIMAL(15,2) NOT NULL,
    commission_type VARCHAR(50) DEFAULT 'affiliate_commission',
    reference_commission_id INTEGER REFERENCES affiliate_commissions(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    paid_at TIMESTAMP NULL
);

-- Criar tabela de saques dos gerentes
CREATE TABLE IF NOT EXISTS manager_withdraws (
    id SERIAL PRIMARY KEY,
    manager_id INTEGER NOT NULL REFERENCES managers(id),
    amount DECIMAL(15,2) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email);
CREATE INDEX IF NOT EXISTS idx_managers_username ON managers(username);
CREATE INDEX IF NOT EXISTS idx_affiliates_manager_id ON affiliates(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_commissions_manager_id ON manager_commissions(manager_id);
CREATE INDEX IF NOT EXISTS idx_manager_commissions_affiliate_id ON manager_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_manager_withdraws_manager_id ON manager_withdraws(manager_id);

-- Inserir um gerente de exemplo para testes
INSERT INTO managers (name, email, username, password_hash, commission_rate, balance) 
VALUES (
    'João Silva', 
    'joao@exemplo.com', 
    'joao_manager', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    5.00,
    0.00
) ON CONFLICT (email) DO NOTHING;

-- Inserir dados de exemplo para comissões (opcional)
-- Isso será feito automaticamente quando houver transações reais

COMMIT;
