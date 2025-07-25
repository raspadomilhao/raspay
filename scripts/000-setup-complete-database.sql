-- =====================================================
-- RASPAY - SETUP COMPLETO DO BANCO DE DADOS NEON
-- =====================================================
-- Este script cria todas as tabelas, índices, triggers e dados iniciais
-- necessários para o funcionamento completo do sistema RasPay

-- Limpar tabelas existentes (se houver)
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS game_results CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================================================
-- 1. TABELA DE USUÁRIOS
-- =====================================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) DEFAULT 'regular' CHECK (user_type IN ('regular', 'admin', 'blogger')),
    client_key VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. TABELA DE CARTEIRAS
-- =====================================================
CREATE TABLE wallets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 0.00 CHECK (balance >= 0),
    total_deposited DECIMAL(10,2) DEFAULT 0.00,
    total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
    total_won DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. TABELA DE TRANSAÇÕES
-- =====================================================
CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'game_bet', 'game_win')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'cancelled')),
    external_id INTEGER,
    end_to_end_id VARCHAR(255),
    payer_name VARCHAR(255),
    pix_key VARCHAR(255),
    pix_type VARCHAR(50),
    callback_url TEXT,
    qr_code TEXT,
    copy_paste_code TEXT,
    game_name VARCHAR(100),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. TABELA DE RESULTADOS DE JOGOS
-- =====================================================
CREATE TABLE game_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_name VARCHAR(100) NOT NULL,
    bet_amount DECIMAL(10,2) NOT NULL CHECK (bet_amount > 0),
    win_amount DECIMAL(10,2) DEFAULT 0.00 CHECK (win_amount >= 0),
    is_winner BOOLEAN DEFAULT false,
    is_jackpot BOOLEAN DEFAULT false,
    result_data JSONB,
    transaction_id INTEGER REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 5. TABELA DE LOGS DE WEBHOOK
-- =====================================================
CREATE TABLE webhook_logs (
    id SERIAL PRIMARY KEY,
    external_id INTEGER,
    type VARCHAR(20) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    error_message TEXT,
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10,2),
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 6. ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para usuários
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Índices para carteiras
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_wallets_balance ON wallets(balance);

-- Índices para transações
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_external_id ON transactions(external_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
CREATE INDEX idx_transactions_type_status ON transactions(type, status);

-- Índices para resultados de jogos
CREATE INDEX idx_game_results_user_id ON game_results(user_id);
CREATE INDEX idx_game_results_game_name ON game_results(game_name);
CREATE INDEX idx_game_results_is_winner ON game_results(is_winner);
CREATE INDEX idx_game_results_is_jackpot ON game_results(is_jackpot);
CREATE INDEX idx_game_results_created_at ON game_results(created_at);

-- Índices para webhook logs
CREATE INDEX idx_webhook_logs_external_id ON webhook_logs(external_id);
CREATE INDEX idx_webhook_logs_type ON webhook_logs(type);
CREATE INDEX idx_webhook_logs_processed ON webhook_logs(processed);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at);

-- =====================================================
-- 7. TRIGGERS PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMPS
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. FUNÇÃO PARA CRIAR CARTEIRA AUTOMATICAMENTE
-- =====================================================

CREATE OR REPLACE FUNCTION create_wallet_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO wallets (user_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para criar carteira automaticamente
CREATE TRIGGER create_wallet_after_user_insert 
    AFTER INSERT ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION create_wallet_for_user();

-- =====================================================
-- 9. DADOS INICIAIS - USUÁRIOS DE TESTE
-- =====================================================

-- Usuário Admin
INSERT INTO users (name, username, email, password_hash, user_type, client_key) VALUES 
('Administrador', 'admin', 'admin@raspay.com', '$2b$10$rQZ9vKzqzqzqzqzqzqzqzOeKqzqzqzqzqzqzqzqzqzqzqzqzqzqzqz', 'admin', 'admin_client_key_123');

-- Usuário Blogger (para testes)
INSERT INTO users (name, username, email, password_hash, user_type, client_key) VALUES 
('Blogger Teste', 'blogger', 'blogger@raspay.com', '$2b$10$rQZ9vKzqzqzqzqzqzqzqzOeKqzqzqzqzqzqzqzqzqzqzqzqzqzqzqz', 'blogger', 'blogger_client_key_456');

-- Usuário Regular de Teste
INSERT INTO users (name, username, email, password_hash, user_type) VALUES 
('Usuário Teste', 'teste', 'teste@raspay.com', '$2b$10$rQZ9vKzqzqzqzqzqzqzqzOeKqzqzqzqzqzqzqzqzqzqzqzqzqzqzqz', 'regular');

-- =====================================================
-- 10. DADOS INICIAIS - SALDOS DE TESTE
-- =====================================================

-- Adicionar saldo inicial para o usuário blogger (para testes)
UPDATE wallets SET balance = 1000.00, total_deposited = 1000.00 WHERE user_id = 2;

-- Adicionar saldo inicial para o usuário teste
UPDATE wallets SET balance = 50.00, total_deposited = 50.00 WHERE user_id = 3;

-- =====================================================
-- 11. TRANSAÇÕES DE EXEMPLO
-- =====================================================

-- Depósito inicial para blogger
INSERT INTO transactions (user_id, type, amount, status, description) VALUES 
(2, 'deposit', 1000.00, 'success', 'Depósito inicial para testes');

-- Depósito inicial para usuário teste
INSERT INTO transactions (user_id, type, amount, status, description) VALUES 
(3, 'deposit', 50.00, 'success', 'Depósito inicial para testes');

-- =====================================================
-- 12. RESULTADOS DE JOGOS DE EXEMPLO
-- =====================================================

-- Alguns resultados de jogos para popular a lista de vencedores
INSERT INTO game_results (user_id, game_name, bet_amount, win_amount, is_winner, is_jackpot) VALUES 
(2, 'Raspe da Esperança', 1.00, 100.00, true, false),
(3, 'Fortuna Dourada', 3.00, 500.00, true, false),
(2, 'Mega Sorte', 5.00, 1000.00, true, true);

-- =====================================================
-- 13. VERIFICAÇÕES FINAIS
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('users', 'wallets', 'transactions', 'game_results', 'webhook_logs');
    
    IF table_count = 5 THEN
        RAISE NOTICE '✅ Todas as 5 tabelas foram criadas com sucesso!';
    ELSE
        RAISE NOTICE '❌ Erro: Apenas % de 5 tabelas foram criadas', table_count;
    END IF;
END $$;

-- Verificar se os usuários foram criados
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    
    IF user_count >= 3 THEN
        RAISE NOTICE '✅ Usuários de teste criados com sucesso! Total: %', user_count;
    ELSE
        RAISE NOTICE '❌ Erro: Apenas % usuários foram criados', user_count;
    END IF;
END $$;

-- Verificar se as carteiras foram criadas automaticamente
DO $$
DECLARE
    wallet_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO wallet_count FROM wallets;
    
    IF wallet_count >= 3 THEN
        RAISE NOTICE '✅ Carteiras criadas automaticamente! Total: %', wallet_count;
    ELSE
        RAISE NOTICE '❌ Erro: Apenas % carteiras foram criadas', wallet_count;
    END IF;
END $$;

-- =====================================================
-- 14. INFORMAÇÕES IMPORTANTES
-- =====================================================

-- Exibir informações de login
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🎉 SETUP COMPLETO DO BANCO RASPAY!';
    RAISE NOTICE '';
    RAISE NOTICE '👤 CREDENCIAIS DE TESTE:';
    RAISE NOTICE '   Admin: admin@raspay.com / admin123';
    RAISE NOTICE '   Blogger: blogger@raspay.com / admin123';
    RAISE NOTICE '   Teste: teste@raspay.com / admin123';
    RAISE NOTICE '';
    RAISE NOTICE '💰 SALDOS INICIAIS:';
    RAISE NOTICE '   Blogger: R$ 1.000,00';
    RAISE NOTICE '   Teste: R$ 50,00';
    RAISE NOTICE '';
    RAISE NOTICE '🔧 PRÓXIMOS PASSOS:';
    RAISE NOTICE '   1. Verificar em /setup-database';
    RAISE NOTICE '   2. Testar login com as credenciais acima';
    RAISE NOTICE '   3. Configurar webhooks do HorsePay';
    RAISE NOTICE '';
END $$;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
