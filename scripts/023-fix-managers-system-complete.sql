-- Script completo para corrigir o sistema de gerentes
BEGIN;

-- 1. Verificar e criar a tabela managers se não existir
CREATE TABLE IF NOT EXISTS managers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    commission_rate DECIMAL(5,2) DEFAULT 5.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    total_earnings DECIMAL(15,2) DEFAULT 0.00,
    balance DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Verificar se a coluna manager_id existe na tabela affiliates
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'affiliates' AND column_name = 'manager_id'
    ) THEN
        ALTER TABLE affiliates ADD COLUMN manager_id INTEGER;
        RAISE NOTICE 'Coluna manager_id adicionada à tabela affiliates';
    ELSE
        RAISE NOTICE 'Coluna manager_id já existe na tabela affiliates';
    END IF;
END $$;

-- 3. Remover constraint existente se houver
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'affiliates_manager_id_fkey' 
        AND table_name = 'affiliates'
    ) THEN
        ALTER TABLE affiliates DROP CONSTRAINT affiliates_manager_id_fkey;
        RAISE NOTICE 'Constraint antiga removida';
    END IF;
END $$;

-- 4. Limpar dados inconsistentes (manager_id que não existem na tabela managers)
UPDATE affiliates 
SET manager_id = NULL 
WHERE manager_id IS NOT NULL 
AND manager_id NOT IN (SELECT id FROM managers);

-- 5. Adicionar a constraint de foreign key
ALTER TABLE affiliates 
ADD CONSTRAINT affiliates_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES managers(id) ON DELETE SET NULL;

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliates_manager_id ON affiliates(manager_id);
CREATE INDEX IF NOT EXISTS idx_managers_status ON managers(status);
CREATE INDEX IF NOT EXISTS idx_managers_email ON managers(email);
CREATE INDEX IF NOT EXISTS idx_managers_username ON managers(username);

-- 7. Inserir gerente de teste se não existir nenhum
INSERT INTO managers (name, email, username, password_hash, commission_rate, balance, status) 
SELECT 
    'Gerente Teste', 
    'gerente@teste.com', 
    'gerente_teste', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- senha: password
    5.00,
    0.00,
    'active'
WHERE NOT EXISTS (SELECT 1 FROM managers LIMIT 1);

-- 8. Verificar se tudo está funcionando
DO $$
DECLARE
    manager_count INTEGER;
    affiliate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO manager_count FROM managers;
    SELECT COUNT(*) INTO affiliate_count FROM affiliates;
    
    RAISE NOTICE 'Sistema de gerentes configurado com sucesso!';
    RAISE NOTICE 'Total de gerentes: %', manager_count;
    RAISE NOTICE 'Total de afiliados: %', affiliate_count;
END $$;

COMMIT;
