-- Adicionar os novos jogos à tabela games
INSERT INTO games (game_id, name, description, min_bet, max_prize, image_url, gradient_from, gradient_to, icon, is_active) VALUES
('outfit', 'Outfit', 'Vista-se com estilo! Prêmios de até R$ 2.500!', 2.00, 2500.00, '/images/banner2.png', 'pink-500', 'purple-500', 'Crown', true),
('super-premios', 'Super Prêmios', 'Os melhores prêmios te esperam! Ganhe até R$ 15.000!', 7.50, 15000.00, '/images/banner4.png', 'orange-500', 'red-500', 'Gift', true),
('sonho-de-consumo', 'Sonho de Consumo', 'Realize seus sonhos! Prêmios luxuosos de até R$ 25.000!', 10.00, 25000.00, '/images/banner6.png', 'yellow-500', 'amber-500', 'Diamond', true)
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
