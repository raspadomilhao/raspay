-- Adicionar coluna balance na tabela affiliates
ALTER TABLE affiliates ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0.00;

-- Atualizar balance existente baseado no total_earnings
UPDATE affiliates SET balance = total_earnings WHERE balance IS NULL OR balance = 0;

-- Comentário sobre a estrutura
-- balance: saldo atual disponível para saque
-- total_earnings: total histórico de ganhos (nunca diminui, só para estatística)
