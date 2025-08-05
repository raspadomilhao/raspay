-- Criar tabela para armazenar subscriptions de notificações push dos admins
CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
    id SERIAL PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_admin_push_subscriptions_active ON admin_push_subscriptions(active);
CREATE INDEX IF NOT EXISTS idx_admin_push_subscriptions_created_at ON admin_push_subscriptions(created_at);

-- Inserir dados de exemplo (opcional)
INSERT INTO admin_push_subscriptions (endpoint, p256dh, auth, user_agent, active) VALUES
('https://fcm.googleapis.com/fcm/send/example1', 'example_p256dh_1', 'example_auth_1', 'Mozilla/5.0 (Example)', true),
('https://fcm.googleapis.com/fcm/send/example2', 'example_p256dh_2', 'example_auth_2', 'Chrome/120.0.0.0', false)
ON CONFLICT (endpoint) DO NOTHING;
