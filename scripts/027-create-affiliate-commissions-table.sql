-- Criar tabela de comissões de afiliados se não existir
CREATE TABLE IF NOT EXISTS affiliate_commissions (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER REFERENCES affiliates(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    transaction_id INTEGER REFERENCES transactions(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    commission_type VARCHAR(50) NOT NULL DEFAULT 'deposit', -- 'deposit', 'loss', 'game_play'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate_id ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_user_id ON affiliate_commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_transaction_id ON affiliate_commissions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_created_at ON affiliate_commissions(created_at);

-- Inserir dados de exemplo baseados nas transações existentes
INSERT INTO affiliate_commissions (affiliate_id, user_id, transaction_id, amount, commission_type)
SELECT 
    u.affiliate_id,
    t.user_id,
    t.id,
    CASE 
        WHEN t.type = 'deposit' THEN t.amount * (a.commission_rate / 100.0)
        WHEN t.type = 'game_play' THEN t.amount * (a.loss_commission_rate / 100.0)
        ELSE 0
    END as commission_amount,
    CASE 
        WHEN t.type = 'deposit' THEN 'deposit'
        WHEN t.type = 'game_play' THEN 'loss'
        ELSE 'other'
    END as commission_type
FROM transactions t
JOIN users u ON t.user_id = u.id
JOIN affiliates a ON u.affiliate_id = a.id
WHERE u.affiliate_id IS NOT NULL 
  AND t.status = 'success'
  AND t.type IN ('deposit', 'game_play')
ON CONFLICT DO NOTHING;

-- Atualizar trigger para manter updated_at
CREATE OR REPLACE FUNCTION update_affiliate_commissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_affiliate_commissions_updated_at ON affiliate_commissions;
CREATE TRIGGER update_affiliate_commissions_updated_at
    BEFORE UPDATE ON affiliate_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_commissions_updated_at();

-- Verificar se os dados foram inseridos
SELECT 
    'affiliate_commissions' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT affiliate_id) as unique_affiliates,
    SUM(amount) as total_commissions
FROM affiliate_commissions;
