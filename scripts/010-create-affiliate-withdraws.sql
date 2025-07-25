-- Criar tabela de saques de afiliados
CREATE TABLE IF NOT EXISTS affiliate_withdraws (
    id SERIAL PRIMARY KEY,
    affiliate_id INTEGER NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    pix_key VARCHAR(255) NOT NULL,
    pix_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_affiliate_withdraws_affiliate_id ON affiliate_withdraws(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdraws_status ON affiliate_withdraws(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdraws_created_at ON affiliate_withdraws(created_at);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_affiliate_withdraws_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_affiliate_withdraws_updated_at
    BEFORE UPDATE ON affiliate_withdraws
    FOR EACH ROW
    EXECUTE FUNCTION update_affiliate_withdraws_updated_at();
