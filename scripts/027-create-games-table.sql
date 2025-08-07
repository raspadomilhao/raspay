-- Criar tabela de jogos
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    min_bet DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    max_prize DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    image_url TEXT,
    gradient_from VARCHAR(20) DEFAULT 'cyan-500',
    gradient_to VARCHAR(20) DEFAULT 'blue-500',
    icon VARCHAR(20) DEFAULT 'Zap',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir jogos iniciais
INSERT INTO games (game_id, name, description, min_bet, max_prize, image_url, gradient_from, gradient_to, icon, is_active) VALUES
('raspe-da-esperanca', 'Raspe da Esperança', 'Prêmios de até R$ 1.000!', 1.00, 1000.00, '/images/raspe-esperanca-banner-updated.png', 'cyan-500', 'blue-500', 'Zap', true),
('fortuna-dourada', 'Fortuna Dourada', 'Tesouros escondidos com prêmios de até R$ 5.000!', 3.00, 5000.00, '/images/banner3reais.png', 'yellow-500', 'orange-500', 'Trophy', true),
('mega-sorte', 'Mega Sorte', 'Os maiores prêmios! Ganhe até R$ 10.000!', 5.00, 10000.00, '/images/banner5reais.png', 'purple-500', 'pink-500', 'Sparkles', true)
ON CONFLICT (game_id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    min_bet = EXCLUDED.min_bet,
    max_prize = EXCLUDED.max_prize,
    image_url = EXCLUDED.image_url,
    gradient_from = EXCLUDED.gradient_from,
    gradient_to = EXCLUDED.gradient_to,
    icon = EXCLUDED.icon,
    updated_at = CURRENT_TIMESTAMP;
