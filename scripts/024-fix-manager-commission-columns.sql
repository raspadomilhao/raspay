-- Verificar e corrigir estrutura das tabelas de comissões de gerentes

-- Verificar se a tabela manager_commissions existe e tem as colunas corretas
DO $$
BEGIN
    -- Verificar se a coluna commission_amount existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manager_commissions' 
        AND column_name = 'commission_amount'
    ) THEN
        -- Se não existe, verificar se existe 'amount' e renomear
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'manager_commissions' 
            AND column_name = 'amount'
        ) THEN
            ALTER TABLE manager_commissions RENAME COLUMN amount TO commission_amount;
            RAISE NOTICE 'Coluna amount renomeada para commission_amount na tabela manager_commissions';
        ELSE
            -- Se não existe nenhuma, criar a coluna
            ALTER TABLE manager_commissions ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0;
            RAISE NOTICE 'Coluna commission_amount criada na tabela manager_commissions';
        END IF;
    END IF;

    -- Verificar se a coluna commission_type existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manager_commissions' 
        AND column_name = 'commission_type'
    ) THEN
        ALTER TABLE manager_commissions ADD COLUMN commission_type VARCHAR(50) DEFAULT 'referral';
        RAISE NOTICE 'Coluna commission_type criada na tabela manager_commissions';
    END IF;

    -- Verificar se a coluna description existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manager_commissions' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE manager_commissions ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description criada na tabela manager_commissions';
    END IF;

    -- Verificar se a coluna affiliate_id existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'manager_commissions' 
        AND column_name = 'affiliate_id'
    ) THEN
        ALTER TABLE manager_commissions ADD COLUMN affiliate_id INTEGER REFERENCES affiliates(id);
        RAISE NOTICE 'Coluna affiliate_id criada na tabela manager_commissions';
    END IF;

END $$;

-- Inserir alguns dados de teste se a tabela estiver vazia
INSERT INTO manager_commissions (manager_id, affiliate_id, commission_amount, commission_type, description, created_at)
SELECT 
    1 as manager_id,
    a.id as affiliate_id,
    25.00 as commission_amount,
    'referral' as commission_type,
    'Comissão por indicação de usuário' as description,
    NOW() - INTERVAL '5 days' as created_at
FROM affiliates a 
WHERE a.manager_id = 1
AND NOT EXISTS (SELECT 1 FROM manager_commissions WHERE manager_id = 1)
LIMIT 3;

-- Verificar estrutura final
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('manager_commissions', 'manager_withdraws', 'managers')
ORDER BY table_name, ordinal_position;
