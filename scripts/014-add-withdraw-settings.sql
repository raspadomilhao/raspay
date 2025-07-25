-- Adicionar configuração de valor mínimo de saque
INSERT INTO system_settings (setting_key, setting_value, description)
VALUES ('min_withdraw_amount', '10.00', 'Valor mínimo para saques em reais')
ON CONFLICT (setting_key) DO NOTHING;

-- Atualizar descrição do depósito mínimo
UPDATE system_settings 
SET description = 'Valor mínimo para depósitos em reais'
WHERE setting_key = 'min_deposit_amount';
