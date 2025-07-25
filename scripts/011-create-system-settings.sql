-- Criar tabela de configurações do sistema
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Inserir configuração padrão do valor mínimo de depósito
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('min_deposit_amount', '20.00', 'Valor mínimo para depósitos em reais')
ON CONFLICT (setting_key) DO NOTHING;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
