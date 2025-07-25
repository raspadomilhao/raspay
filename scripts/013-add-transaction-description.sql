-- Script para adicionar coluna description na tabela transactions se não existir
-- Execute este script para garantir compatibilidade com futuras funcionalidades

DO $$
BEGIN
    -- Verificar se a coluna description existe na tabela transactions
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'transactions' 
        AND column_name = 'description'
    ) THEN
        -- Adicionar coluna description
        ALTER TABLE transactions ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description adicionada à tabela transactions';
    ELSE
        RAISE NOTICE 'Coluna description já existe na tabela transactions';
    END IF;

    -- Verificar se a coluna referred_by existe na tabela users
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'referred_by'
    ) THEN
        -- Adicionar coluna referred_by
        ALTER TABLE users ADD COLUMN referred_by VARCHAR(50);
        RAISE NOTICE 'Coluna referred_by adicionada à tabela users';
    ELSE
        RAISE NOTICE 'Coluna referred_by já existe na tabela users';
    END IF;

    -- Verificar se a tabela affiliate_commissions existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'affiliate_commissions'
    ) THEN
        -- Criar tabela affiliate_commissions
        CREATE TABLE affiliate_commissions (
            id SERIAL PRIMARY KEY,
            affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
            commission_amount DECIMAL(10,2) NOT NULL,
            commission_type VARCHAR(20) DEFAULT 'deposit',
            status VARCHAR(20) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT NOW(),
            paid_at TIMESTAMP NULL
        );
        
        -- Criar índices
        CREATE INDEX idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
        CREATE INDEX idx_affiliate_commissions_user_id ON affiliate_commissions(user_id);
        CREATE INDEX idx_affiliate_commissions_transaction_id ON affiliate_commissions(transaction_id);
        CREATE INDEX idx_affiliate_commissions_created_at ON affiliate_commissions(created_at);
        
        RAISE NOTICE 'Tabela affiliate_commissions criada com sucesso';
    ELSE
        RAISE NOTICE 'Tabela affiliate_commissions já existe';
    END IF;

    -- Verificar se a coluna loss_commission_rate existe na tabela affiliates
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'affiliates' 
        AND column_name = 'loss_commission_rate'
    ) THEN
        -- Adicionar coluna loss_commission_rate
        ALTER TABLE affiliates ADD COLUMN loss_commission_rate DECIMAL(5,2) DEFAULT 0.00;
        RAISE NOTICE 'Coluna loss_commission_rate adicionada à tabela affiliates';
    ELSE
        RAISE NOTICE 'Coluna loss_commission_rate já existe na tabela affiliates';
    END IF;

    -- Atualizar dados existentes se necessário
    UPDATE affiliates SET loss_commission_rate = 0.00 WHERE loss_commission_rate IS NULL;

END $$;

-- Verificar estrutura das tabelas
SELECT 
    'transactions' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'transactions'
ORDER BY ordinal_position;

SELECT 
    'users' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT 
    'affiliates' as tabela,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'affiliates'
ORDER BY ordinal_position;

-- Verificar se as tabelas existem
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as status
FROM information_schema.tables 
WHERE table_name IN ('transactions', 'users', 'affiliates', 'affiliate_commissions', 'wallets')
ORDER BY table_name;
