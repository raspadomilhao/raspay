-- Inserir um gerente de teste se não existir
INSERT INTO managers (name, email, username, password_hash, commission_rate, status, balance, total_earnings, created_at, updated_at)
SELECT 'João Silva', 'joao@exemplo.com', 'joao_manager', '$2b$10$rQZ9vKKQZ9vKKQZ9vKKQZO', 5.0, 'active', 0.00, 0.00, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM managers WHERE email = 'joao@exemplo.com');

-- Inserir um afiliado de teste se não existir
INSERT INTO affiliates (name, email, username, password_hash, affiliate_code, commission_rate, loss_commission_rate, status, total_earnings, total_referrals, created_at, updated_at)
SELECT 'Maria Afiliada', 'maria@exemplo.com', 'maria_afiliada', '$2b$10$rQZ9vKKQZ9vKKQZ9vKKQZO', 'MARIA2024', 10.0, 2.0, 'active', 0.00, 0, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM affiliates WHERE email = 'maria@exemplo.com');

-- Comentário: Senhas são 'password' para ambos os usuários de teste
