-- Script para corrigir comissões de gerentes não processadas

-- 1. Verificar afiliados com gerentes
SELECT 
    a.id as affiliate_id,
    a.name as affiliate_name,
    a.manager_id,
    m.name as manager_name,
    m.commission_rate,
    a.total_earnings as affiliate_earnings
FROM affiliates a
JOIN managers m ON a.manager_id = m.id
WHERE a.manager_id IS NOT NULL
ORDER BY a.id;

-- 2. Processar comissões de gerentes para comissões de afiliados existentes
INSERT INTO manager_commissions (manager_id, affiliate_id, commission_amount, commission_type, description, created_at)
SELECT 
    a.manager_id,
    ac.affiliate_id,
    (ac.commission_amount * m.commission_rate / 100) as manager_commission,
    ac.commission_type,
    'Comissão retroativa sobre afiliado',
    ac.created_at
FROM affiliate_commissions ac
JOIN affiliates a ON ac.affiliate_id = a.id
JOIN managers m ON a.manager_id = m.id
WHERE a.manager_id IS NOT NULL
  AND m.status = 'active'
  AND (ac.commission_amount * m.commission_rate / 100) >= 0.01
  AND NOT EXISTS (
    SELECT 1 FROM manager_commissions mc 
    WHERE mc.manager_id = a.manager_id 
    AND mc.affiliate_id = ac.affiliate_id 
    AND ABS(mc.commission_amount - (ac.commission_amount * m.commission_rate / 100)) < 0.01
    AND mc.created_at = ac.created_at
  );

-- 3. Atualizar saldos dos gerentes baseado nas comissões criadas
UPDATE managers 
SET 
    total_earnings = COALESCE((
        SELECT SUM(commission_amount) 
        FROM manager_commissions 
        WHERE manager_id = managers.id
    ), 0),
    balance = COALESCE((
        SELECT SUM(commission_amount) 
        FROM manager_commissions 
        WHERE manager_id = managers.id
    ), 0) - COALESCE((
        SELECT SUM(amount) 
        FROM manager_withdraws 
        WHERE manager_id = managers.id AND status != 'rejected'
    ), 0),
    updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT manager_id 
    FROM manager_commissions
);

-- 4. Verificar resultado final
SELECT 
    m.id,
    m.name as manager_name,
    m.commission_rate,
    m.total_earnings,
    m.balance,
    COUNT(mc.id) as total_commissions,
    COUNT(DISTINCT a.id) as total_affiliates
FROM managers m
LEFT JOIN manager_commissions mc ON m.id = mc.manager_id
LEFT JOIN affiliates a ON m.id = a.manager_id
GROUP BY m.id, m.name, m.commission_rate, m.total_earnings, m.balance
ORDER BY m.id;
