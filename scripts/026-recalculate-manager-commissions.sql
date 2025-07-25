-- Recalcular comissões dos gerentes baseado no total ganho dos afiliados

-- 1. Backup dos dados atuais (opcional)
-- CREATE TABLE manager_commissions_backup AS SELECT * FROM manager_commissions;
-- CREATE TABLE managers_backup AS SELECT * FROM managers;

-- 2. Limpar comissões existentes dos gerentes
DELETE FROM manager_commissions;

-- 3. Resetar saldos dos gerentes
UPDATE managers SET total_earnings = 0, balance = 0;

-- 4. Recalcular e aplicar comissões baseado no total ganho atual dos afiliados
WITH manager_calculations AS (
  SELECT 
    a.manager_id,
    a.id as affiliate_id,
    a.name as affiliate_name,
    a.total_earnings as affiliate_total_earnings,
    m.name as manager_name,
    m.commission_rate,
    (a.total_earnings * m.commission_rate / 100) as commission_amount
  FROM affiliates a
  JOIN managers m ON a.manager_id = m.id
  WHERE a.manager_id IS NOT NULL 
    AND m.status = 'active'
    AND a.total_earnings > 0
)
INSERT INTO manager_commissions (manager_id, affiliate_id, commission_amount, commission_type, description)
SELECT 
  manager_id,
  affiliate_id,
  commission_amount,
  'recalculation' as commission_type,
  CONCAT('Recálculo: ', commission_rate, '% de R$ ', affiliate_total_earnings, ' do afiliado ', affiliate_name) as description
FROM manager_calculations
WHERE commission_amount >= 0.01;

-- 5. Atualizar saldos dos gerentes baseado nas comissões calculadas
UPDATE managers 
SET 
  total_earnings = COALESCE((
    SELECT SUM(mc.commission_amount)
    FROM manager_commissions mc
    WHERE mc.manager_id = managers.id
  ), 0),
  balance = COALESCE((
    SELECT SUM(mc.commission_amount)
    FROM manager_commissions mc
    WHERE mc.manager_id = managers.id
  ), 0),
  updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT manager_id 
  FROM manager_commissions
);

-- 6. Relatório final
SELECT 
  '=== RELATÓRIO DE RECÁLCULO ===' as relatorio;

SELECT 
  m.name as manager_name,
  m.username,
  m.commission_rate as taxa_comissao,
  COUNT(a.id) as total_afiliados,
  COALESCE(SUM(a.total_earnings), 0) as total_ganho_afiliados,
  m.total_earnings as total_ganho_gerente,
  m.balance as saldo_gerente,
  ROUND((m.total_earnings / NULLIF(SUM(a.total_earnings), 0) * 100), 2) as percentual_real
FROM managers m
LEFT JOIN affiliates a ON a.manager_id = m.id
WHERE m.status = 'active'
GROUP BY m.id, m.name, m.username, m.commission_rate, m.total_earnings, m.balance
ORDER BY m.total_earnings DESC;

-- 7. Verificar se há inconsistências
SELECT 
  'VERIFICAÇÃO DE CONSISTÊNCIA' as verificacao;

SELECT 
  m.name as manager_name,
  a.name as affiliate_name,
  a.total_earnings as affiliate_total,
  m.commission_rate,
  ROUND((a.total_earnings * m.commission_rate / 100), 2) as deveria_ter,
  COALESCE(mc.commission_amount, 0) as tem_registrado,
  CASE 
    WHEN ABS(ROUND((a.total_earnings * m.commission_rate / 100), 2) - COALESCE(mc.commission_amount, 0)) > 0.01 
    THEN '❌ INCONSISTENTE' 
    ELSE '✅ OK' 
  END as status
FROM managers m
JOIN affiliates a ON a.manager_id = m.id
LEFT JOIN manager_commissions mc ON mc.manager_id = m.id AND mc.affiliate_id = a.id
WHERE m.status = 'active' AND a.total_earnings > 0
ORDER BY m.name, a.name;
