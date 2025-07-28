-- Popular tabela de prêmios físicos com dados iniciais
-- Data: 2024-01-28

-- Inserir prêmios físicos iniciais
INSERT INTO physical_prizes (name, description, image_url, estimated_value, stock_quantity, min_stock_alert, rarity_weight, is_active) VALUES
-- Prêmios de alta frequência (mais comuns)
('Smartwatch Fitness', 'Smartwatch com monitor cardíaco e GPS', '/images/prizes/smartwatch.png', 299.99, 50, 10, 8.0, true),
('Fone Bluetooth Premium', 'Fone de ouvido Bluetooth com cancelamento de ruído', '/images/prizes/headphones.png', 199.99, 75, 15, 9.0, true),
('Power Bank 20000mAh', 'Carregador portátil de alta capacidade', '/images/prizes/powerbank.png', 89.99, 100, 20, 10.0, true),

-- Prêmios de média frequência
('Tablet 10 polegadas', 'Tablet Android com 64GB de armazenamento', '/images/prizes/tablet.png', 599.99, 25, 5, 5.0, true),
('Console de Jogos Portátil', 'Console retrô com 400 jogos inclusos', '/images/prizes/console.png', 399.99, 30, 5, 6.0, true),
('Cadeira Gamer RGB', 'Cadeira gamer ergonômica com iluminação LED', '/images/prizes/chair.png', 899.99, 15, 3, 4.0, true),

-- Prêmios de baixa frequência (mais raros)
('iPhone 15 128GB', 'iPhone 15 novo lacrado com garantia', '/images/prizes/iphone15.png', 4999.99, 5, 1, 2.0, true),
('PlayStation 5', 'Console PlayStation 5 com controle', '/images/prizes/ps5.png', 3999.99, 8, 2, 2.5, true),
('MacBook Air M2', 'MacBook Air com chip M2 e 256GB SSD', '/images/prizes/macbook.png', 8999.99, 3, 1, 1.0, true),

-- Prêmios especiais/sazonais
('Moto Honda CG 160', 'Motocicleta Honda CG 160 0km', '/images/prizes/moto.png', 12999.99, 2, 1, 0.5, true),
('Vale Compras R$ 1000', 'Vale compras para usar em lojas parceiras', '/images/prizes/voucher.png', 1000.00, 20, 5, 7.0, true);

-- Registrar adição inicial no log
INSERT INTO physical_prize_stock_log (physical_prize_id, change_type, quantity_change, previous_stock, new_stock, reason, admin_user)
SELECT 
    id,
    'add',
    stock_quantity,
    0,
    stock_quantity,
    'Estoque inicial do sistema',
    'system'
FROM physical_prizes;

-- Verificar se os dados foram inseridos
SELECT 
    name,
    estimated_value,
    stock_quantity,
    rarity_weight,
    is_active
FROM physical_prizes
ORDER BY rarity_weight ASC, estimated_value DESC;
