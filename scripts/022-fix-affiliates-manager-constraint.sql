-- Adicionar coluna manager_id na tabela affiliates se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='affiliates' AND column_name='manager_id') THEN
    ALTER TABLE affiliates ADD COLUMN manager_id INTEGER;
  END IF;
END $$;

-- Remover constraint existente se houver
DO $$ 
BEGIN 
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='affiliates_manager_id_fkey') THEN
    ALTER TABLE affiliates DROP CONSTRAINT affiliates_manager_id_fkey;
  END IF;
END $$;

-- Verificar se a tabela managers existe, se não, criar
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

-- Adicionar constraint de foreign key
ALTER TABLE affiliates 
ADD CONSTRAINT affiliates_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_affiliates_manager_id ON affiliates(manager_id);

-- Inserir um gerente de exemplo se não existir
INSERT INTO managers (name, email, username, password_hash, commission_rate, balance) 
VALUES (
    'Gerente Teste', 
    'gerente@teste.com', 
    'gerente_teste', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    5.00,
    0.00
) ON CONFLICT (email) DO NOTHING;

COMMIT;
