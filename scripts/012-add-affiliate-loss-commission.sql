-- Adicionar coluna de comissão por perda na tabela de afiliados
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS loss_commission_rate DECIMAL(5,2) DEFAULT 0.00;

-- Adicionar coluna referred_by na tabela de usuários (se não existir)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES affiliates(id);

-- Adicionar coluna commission_type na tabela de comissões (se não existir)
ALTER TABLE affiliate_commissions 
ADD COLUMN IF NOT EXISTS commission_type VARCHAR(20) DEFAULT 'referral';

-- Adicionar coluna balance na tabela de afiliados (se não existir)
ALTER TABLE affiliates 
ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_type ON affiliate_commissions(commission_type);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);

-- Comentários para documentação
COMMENT ON COLUMN affiliates.loss_commission_rate IS 'Taxa de comissão por perda/ganho do usuário indicado (%)';
COMMENT ON COLUMN users.referred_by IS 'ID do afiliado que indicou este usuário';
COMMENT ON COLUMN affiliate_commissions.commission_type IS 'Tipo de comissão: referral, loss_gain, loss_penalty';
COMMENT ON COLUMN affiliates.balance IS 'Saldo atual do afiliado em comissões';

-- Atualizar registros existentes se necessário
UPDATE affiliate_commissions 
SET commission_type = 'referral' 
WHERE commission_type IS NULL OR commission_type = '';

-- Verificar se as colunas foram criadas corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name IN ('affiliates', 'users', 'affiliate_commissions')
    AND column_name IN ('loss_commission_rate', 'referred_by', 'commission_type', 'balance')
ORDER BY table_name, column_name;
