-- Script para criar dados fake para o afiliado ID 19 (ramon.midia89@gmail.com)
-- Última semana, 50 usuários, depósitos até R$ 100, comissão R$ 10

-- Primeiro, limpar dados existentes do afiliado 19 (se houver)
DELETE FROM affiliate_commissions WHERE affiliate_id = 19;
DELETE FROM transactions WHERE user_id IN (SELECT id FROM users WHERE affiliate_id = 19);
DELETE FROM wallets WHERE user_id IN (SELECT id FROM users WHERE affiliate_id = 19);
DELETE FROM users WHERE affiliate_id = 19;

-- Resetar saldo do afiliado
UPDATE affiliates SET balance = 0.00, total_earnings = 0.00, total_referrals = 0 WHERE id = 19;

-- Inserir 50 usuários fictícios com affiliate_id = 19
INSERT INTO users (email, name, username, password_hash, user_type, affiliate_id, created_at) VALUES
('joao.silva123@gmail.com', 'João Silva', 'joao123', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '6 days'),
('maria.santos456@hotmail.com', 'Maria Santos', 'maria456', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '6 days'),
('pedro.oliveira789@yahoo.com', 'Pedro Oliveira', 'pedro789', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('ana.costa321@gmail.com', 'Ana Costa', 'ana321', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('carlos.ferreira654@outlook.com', 'Carlos Ferreira', 'carlos654', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('lucia.almeida987@gmail.com', 'Lúcia Almeida', 'lucia987', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('rafael.souza147@hotmail.com', 'Rafael Souza', 'rafael147', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('fernanda.lima258@yahoo.com', 'Fernanda Lima', 'fernanda258', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('ricardo.pereira369@gmail.com', 'Ricardo Pereira', 'ricardo369', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days'),
('juliana.rodrigues741@outlook.com', 'Juliana Rodrigues', 'juliana741', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days'),
('marcos.barbosa852@gmail.com', 'Marcos Barbosa', 'marcos852', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days'),
('patricia.gomes963@hotmail.com', 'Patrícia Gomes', 'patricia963', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '2 days'),
('andre.martins159@yahoo.com', 'André Martins', 'andre159', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '2 days'),
('camila.araujo357@gmail.com', 'Camila Araújo', 'camila357', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '2 days'),
('bruno.carvalho468@outlook.com', 'Bruno Carvalho', 'bruno468', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '1 day'),
('vanessa.nascimento579@gmail.com', 'Vanessa Nascimento', 'vanessa579', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '1 day'),
('diego.moreira681@hotmail.com', 'Diego Moreira', 'diego681', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '1 day'),
('priscila.teixeira792@yahoo.com', 'Priscila Teixeira', 'priscila792', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '6 days'),
('gustavo.ribeiro134@gmail.com', 'Gustavo Ribeiro', 'gustavo134', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('larissa.cardoso245@outlook.com', 'Larissa Cardoso', 'larissa245', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('thiago.mendes356@gmail.com', 'Thiago Mendes', 'thiago356', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days'),
('amanda.freitas467@hotmail.com', 'Amanda Freitas', 'amanda467', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '2 days'),
('leonardo.dias578@yahoo.com', 'Leonardo Dias', 'leonardo578', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '1 day'),
('tatiana.castro689@gmail.com', 'Tatiana Castro', 'tatiana689', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '6 days'),
('rodrigo.pinto791@outlook.com', 'Rodrigo Pinto', 'rodrigo791', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('sabrina.machado892@gmail.com', 'Sabrina Machado', 'sabrina892', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('felipe.cunha913@hotmail.com', 'Felipe Cunha', 'felipe913', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days'),
('renata.vieira124@yahoo.com', 'Renata Vieira', 'renata124', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '2 days'),
('vinicius.lopes235@gmail.com', 'Vinícius Lopes', 'vinicius235', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '1 day'),
('carolina.ramos346@outlook.com', 'Carolina Ramos', 'carolina346', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '6 days'),
('eduardo.fonseca457@gmail.com', 'Eduardo Fonseca', 'eduardo457', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('aline.monteiro568@hotmail.com', 'Aline Monteiro', 'aline568', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('daniel.correia679@yahoo.com', 'Daniel Correia', 'daniel679', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days'),
('bianca.torres781@gmail.com', 'Bianca Torres', 'bianca781', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '2 days'),
('mateus.campos892@outlook.com', 'Mateus Campos', 'mateus892', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '1 day'),
('isabela.moura913@gmail.com', 'Isabela Moura', 'isabela913', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '6 days'),
('lucas.azevedo124@hotmail.com', 'Lucas Azevedo', 'lucas124', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('natalia.vargas235@yahoo.com', 'Natália Vargas', 'natalia235', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('gabriel.santana346@gmail.com', 'Gabriel Santana', 'gabriel346', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days'),
('leticia.duarte457@outlook.com', 'Letícia Duarte', 'leticia457', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '2 days'),
('henrique.xavier568@gmail.com', 'Henrique Xavier', 'henrique568', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '1 day'),
('monica.batista679@hotmail.com', 'Mônica Batista', 'monica679', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '6 days'),
('fabio.reis781@yahoo.com', 'Fábio Reis', 'fabio781', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('adriana.silva892@gmail.com', 'Adriana Silva', 'adriana892', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('sergio.costa913@outlook.com', 'Sérgio Costa', 'sergio913', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days'),
('claudia.nunes124@gmail.com', 'Cláudia Nunes', 'claudia124', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '2 days'),
('alexandre.melo235@hotmail.com', 'Alexandre Melo', 'alexandre235', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '1 day'),
('simone.rocha346@yahoo.com', 'Simone Rocha', 'simone346', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '6 days'),
('wagner.fernandes457@gmail.com', 'Wagner Fernandes', 'wagner457', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '5 days'),
('eliane.cavalcanti568@outlook.com', 'Eliane Cavalcanti', 'eliane568', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '4 days'),
('roberto.medeiros679@gmail.com', 'Roberto Medeiros', 'roberto679', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'regular', 19, NOW() - INTERVAL '3 days');

-- Criar carteiras para todos os usuários
INSERT INTO wallets (user_id, balance)
SELECT id, 0.00 FROM users WHERE affiliate_id = 19;

-- Criar transações de depósito (valores entre R$ 10 e R$ 100)
-- Usuário 1 - João Silva (2 depósitos)
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 50.00, 'success', 100001, 'Depósito PIX', NOW() - INTERVAL '6 days' + INTERVAL '2 hours'
FROM users WHERE email = 'joao.silva123@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 75.00, 'success', 100002, 'Redepósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '14 hours'
FROM users WHERE email = 'joao.silva123@gmail.com';

-- Usuário 2 - Maria Santos (1 depósito)
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 30.00, 'success', 100003, 'Depósito PIX', NOW() - INTERVAL '6 days' + INTERVAL '8 hours'
FROM users WHERE email = 'maria.santos456@hotmail.com';

-- Usuário 3 - Pedro Oliveira (3 depósitos)
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 25.00, 'success', 100004, 'Depósito PIX', NOW() - INTERVAL '5 days' + INTERVAL '3 hours'
FROM users WHERE email = 'pedro.oliveira789@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 40.00, 'success', 100005, 'Redepósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '16 hours'
FROM users WHERE email = 'pedro.oliveira789@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 60.00, 'success', 100006, 'Redepósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '10 hours'
FROM users WHERE email = 'pedro.oliveira789@yahoo.com';

-- Usuário 4 - Ana Costa (1 depósito)
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 80.00, 'success', 100007, 'Depósito PIX', NOW() - INTERVAL '5 days' + INTERVAL '12 hours'
FROM users WHERE email = 'ana.costa321@gmail.com';

-- Usuário 5 - Carlos Ferreira (2 depósitos)
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 45.00, 'success', 100008, 'Depósito PIX', NOW() - INTERVAL '5 days' + INTERVAL '18 hours'
FROM users WHERE email = 'carlos.ferreira654@outlook.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 35.00, 'success', 100009, 'Redepósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '9 hours'
FROM users WHERE email = 'carlos.ferreira654@outlook.com';

-- Continuando com mais usuários...
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 90.00, 'success', 100010, 'Depósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '5 hours'
FROM users WHERE email = 'lucia.almeida987@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 20.00, 'success', 100011, 'Depósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '11 hours'
FROM users WHERE email = 'rafael.souza147@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 55.00, 'success', 100012, 'Depósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '15 hours'
FROM users WHERE email = 'fernanda.lima258@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 65.00, 'success', 100013, 'Depósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '7 hours'
FROM users WHERE email = 'ricardo.pereira369@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 85.00, 'success', 100014, 'Depósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '13 hours'
FROM users WHERE email = 'juliana.rodrigues741@outlook.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 15.00, 'success', 100015, 'Depósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '19 hours'
FROM users WHERE email = 'marcos.barbosa852@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 70.00, 'success', 100016, 'Depósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '4 hours'
FROM users WHERE email = 'patricia.gomes963@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 95.00, 'success', 100017, 'Depósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '8 hours'
FROM users WHERE email = 'andre.martins159@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 40.00, 'success', 100018, 'Depósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '12 hours'
FROM users WHERE email = 'camila.araujo357@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 100.00, 'success', 100019, 'Depósito PIX', NOW() - INTERVAL '1 day' + INTERVAL '6 hours'
FROM users WHERE email = 'bruno.carvalho468@outlook.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 25.00, 'success', 100020, 'Depósito PIX', NOW() - INTERVAL '1 day' + INTERVAL '10 hours'
FROM users WHERE email = 'vanessa.nascimento579@gmail.com';

-- Mais 30 transações para completar ~50 depósitos
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 60.00, 'success', 100021, 'Depósito PIX', NOW() - INTERVAL '1 day' + INTERVAL '14 hours'
FROM users WHERE email = 'diego.moreira681@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 35.00, 'success', 100022, 'Depósito PIX', NOW() - INTERVAL '6 days' + INTERVAL '20 hours'
FROM users WHERE email = 'priscila.teixeira792@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 80.00, 'success', 100023, 'Depósito PIX', NOW() - INTERVAL '5 days' + INTERVAL '6 hours'
FROM users WHERE email = 'gustavo.ribeiro134@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 45.00, 'success', 100024, 'Depósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '17 hours'
FROM users WHERE email = 'larissa.cardoso245@outlook.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 50.00, 'success', 100025, 'Depósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '11 hours'
FROM users WHERE email = 'thiago.mendes356@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 75.00, 'success', 100026, 'Depósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '16 hours'
FROM users WHERE email = 'amanda.freitas467@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 30.00, 'success', 100027, 'Depósito PIX', NOW() - INTERVAL '1 day' + INTERVAL '18 hours'
FROM users WHERE email = 'leonardo.dias578@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 90.00, 'success', 100028, 'Depósito PIX', NOW() - INTERVAL '6 days' + INTERVAL '9 hours'
FROM users WHERE email = 'tatiana.castro689@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 20.00, 'success', 100029, 'Depósito PIX', NOW() - INTERVAL '5 days' + INTERVAL '21 hours'
FROM users WHERE email = 'rodrigo.pinto791@outlook.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 65.00, 'success', 100030, 'Depósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '13 hours'
FROM users WHERE email = 'sabrina.machado892@gmail.com';

-- Redepósitos para alguns usuários
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 55.00, 'success', 100031, 'Redepósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '20 hours'
FROM users WHERE email = 'sabrina.machado892@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 40.00, 'success', 100032, 'Redepósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '15 hours'
FROM users WHERE email = 'gustavo.ribeiro134@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 85.00, 'success', 100033, 'Redepósito PIX', NOW() - INTERVAL '1 day' + INTERVAL '22 hours'
FROM users WHERE email = 'tatiana.castro689@gmail.com';

-- Mais alguns depósitos para completar
INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 70.00, 'success', 100034, 'Depósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '8 hours'
FROM users WHERE email = 'felipe.cunha913@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 25.00, 'success', 100035, 'Depósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '14 hours'
FROM users WHERE email = 'renata.vieira124@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 95.00, 'success', 100036, 'Depósito PIX', NOW() - INTERVAL '1 day' + INTERVAL '3 hours'
FROM users WHERE email = 'vinicius.lopes235@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 15.00, 'success', 100037, 'Depósito PIX', NOW() - INTERVAL '6 days' + INTERVAL '16 hours'
FROM users WHERE email = 'carolina.ramos346@outlook.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 60.00, 'success', 100038, 'Depósito PIX', NOW() - INTERVAL '5 days' + INTERVAL '10 hours'
FROM users WHERE email = 'eduardo.fonseca457@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 45.00, 'success', 100039, 'Depósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '19 hours'
FROM users WHERE email = 'aline.monteiro568@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 80.00, 'success', 100040, 'Depósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '12 hours'
FROM users WHERE email = 'daniel.correia679@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 35.00, 'success', 100041, 'Depósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '17 hours'
FROM users WHERE email = 'bianca.torres781@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 50.00, 'success', 100042, 'Depósito PIX', NOW() - INTERVAL '1 day' + INTERVAL '7 hours'
FROM users WHERE email = 'mateus.campos892@outlook.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 75.00, 'success', 100043, 'Depósito PIX', NOW() - INTERVAL '6 days' + INTERVAL '13 hours'
FROM users WHERE email = 'isabela.moura913@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 30.00, 'success', 100044, 'Depósito PIX', NOW() - INTERVAL '5 days' + INTERVAL '15 hours'
FROM users WHERE email = 'lucas.azevedo124@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 90.00, 'success', 100045, 'Depósito PIX', NOW() - INTERVAL '4 days' + INTERVAL '21 hours'
FROM users WHERE email = 'natalia.vargas235@yahoo.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 20.00, 'success', 100046, 'Depósito PIX', NOW() - INTERVAL '3 days' + INTERVAL '5 hours'
FROM users WHERE email = 'gabriel.santana346@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 65.00, 'success', 100047, 'Depósito PIX', NOW() - INTERVAL '2 days' + INTERVAL '11 hours'
FROM users WHERE email = 'leticia.duarte457@outlook.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 85.00, 'success', 100048, 'Depósito PIX', NOW() - INTERVAL '1 day' + INTERVAL '15 hours'
FROM users WHERE email = 'henrique.xavier568@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 40.00, 'success', 100049, 'Depósito PIX', NOW() - INTERVAL '6 days' + INTERVAL '4 hours'
FROM users WHERE email = 'monica.batista679@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, external_id, description, created_at)
SELECT id, 'deposit', 55.00, 'success', 100050, 'Depósito PIX', NOW() - INTERVAL '5 days' + INTERVAL '18 hours'
FROM users WHERE email = 'fabio.reis781@yahoo.com';

-- Criar comissões de R$ 10,00 para cada transação de depósito
INSERT INTO affiliate_commissions (affiliate_id, user_id, transaction_id, commission_amount, commission_type, status, created_at)
SELECT 
    19 as affiliate_id,
    t.user_id,
    t.id as transaction_id,
    10.00 as commission_amount,
    'deposit' as commission_type,
    'pending' as status,
    t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
WHERE u.affiliate_id = 19 AND t.type = 'deposit' AND t.status = 'success';

-- Atualizar estatísticas do afiliado
UPDATE affiliates 
SET 
    balance = 54328.00,
    total_earnings = 54328.00,
    total_referrals = 50,
    updated_at = NOW()
WHERE id = 19;

-- Adicionar algumas transações de jogos para dar movimento (opcional)
-- Algumas jogadas que resultaram em perdas
INSERT INTO transactions (user_id, type, amount, status, description, created_at)
SELECT id, 'game_play', 5.00, 'success', 'Raspe da Esperança', NOW() - INTERVAL '3 days' + INTERVAL '10 hours'
FROM users WHERE email = 'joao.silva123@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, description, created_at)
SELECT id, 'game_play', 10.00, 'success', 'Fortuna Dourada', NOW() - INTERVAL '2 days' + INTERVAL '15 hours'
FROM users WHERE email = 'maria.santos456@hotmail.com';

INSERT INTO transactions (user_id, type, amount, status, description, created_at)
SELECT id, 'game_play', 3.00, 'success', 'Mega Sorte', NOW() - INTERVAL '1 day' + INTERVAL '8 hours'
FROM users WHERE email = 'pedro.oliveira789@yahoo.com';

-- Alguns prêmios menores
INSERT INTO transactions (user_id, type, amount, status, description, created_at)
SELECT id, 'game_prize', 15.00, 'success', 'Prêmio Raspe da Esperança', NOW() - INTERVAL '2 days' + INTERVAL '16 hours'
FROM users WHERE email = 'ana.costa321@gmail.com';

INSERT INTO transactions (user_id, type, amount, status, description, created_at)
SELECT id, 'game_prize', 8.00, 'success', 'Prêmio Fortuna Dourada', NOW() - INTERVAL '1 day' + INTERVAL '12 hours'
FROM users WHERE email = 'carlos.ferreira654@outlook.com';

-- Atualizar saldos das carteiras com base nos depósitos (simulando que ainda têm dinheiro)
UPDATE wallets SET balance = 45.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'joao.silva123@gmail.com');
UPDATE wallets SET balance = 25.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'maria.santos456@hotmail.com');
UPDATE wallets SET balance = 122.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'pedro.oliveira789@yahoo.com');
UPDATE wallets SET balance = 95.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'ana.costa321@gmail.com');
UPDATE wallets SET balance = 88.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'carlos.ferreira654@outlook.com');
UPDATE wallets SET balance = 90.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'lucia.almeida987@gmail.com');
UPDATE wallets SET balance = 20.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'rafael.souza147@hotmail.com');
UPDATE wallets SET balance = 55.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'fernanda.lima258@yahoo.com');
UPDATE wallets SET balance = 60.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'ricardo.pereira369@gmail.com');
UPDATE wallets SET balance = 85.00 WHERE user_id IN (SELECT id FROM users WHERE email = 'juliana.rodrigues741@outlook.com');

-- Finalizar com log de sucesso
SELECT 
    'Dados fake criados com sucesso!' as status,
    COUNT(DISTINCT u.id) as usuarios_criados,
    COUNT(t.id) as transacoes_criadas,
    COUNT(ac.id) as comissoes_criadas,
    SUM(ac.commission_amount) as total_comissoes,
    a.balance as saldo_afiliado
FROM users u
LEFT JOIN transactions t ON u.id = t.user_id AND t.type = 'deposit'
LEFT JOIN affiliate_commissions ac ON u.id = ac.user_id AND ac.affiliate_id = 19
LEFT JOIN affiliates a ON a.id = 19
WHERE u.affiliate_id = 19;
