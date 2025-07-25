-- Criar tabela de indicações de usuários
CREATE TABLE IF NOT EXISTS user_referrals (
  id SERIAL PRIMARY KEY,
  referrer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  referred_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  referral_code VARCHAR(50) NOT NULL,
  bonus_amount DECIMAL(10,2) DEFAULT 5.00,
  bonus_paid BOOLEAN DEFAULT FALSE,
  bonus_paid_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Adicionar campo referral_code na tabela users se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referral_code') THEN
    ALTER TABLE users ADD COLUMN referral_code VARCHAR(50) UNIQUE;
  END IF;
END $$;

-- Adicionar campo referred_by_user_id na tabela users se não existir
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='referred_by_user_id') THEN
    ALTER TABLE users ADD COLUMN referred_by_user_id INTEGER REFERENCES users(id);
  END IF;
END $$;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer_id ON user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_referred_id ON user_referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_code ON user_referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by_user_id ON users(referred_by_user_id);

-- Função para gerar código de indicação único
CREATE OR REPLACE FUNCTION generate_user_referral_code(user_id INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
  code VARCHAR(50);
  exists_code BOOLEAN;
BEGIN
  LOOP
    -- Gerar código baseado no ID do usuário + random
    code := 'USER' || user_id || '_' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    
    -- Verificar se já existe
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists_code;
    
    -- Se não existe, usar este código
    IF NOT exists_code THEN
      EXIT;
    END IF;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Atualizar usuários existentes com códigos de indicação
UPDATE users 
SET referral_code = generate_user_referral_code(id)
WHERE referral_code IS NULL;
