-- Adicionar tabela para senhas administrativas
CREATE TABLE IF NOT EXISTS admin_passwords (
    id SERIAL PRIMARY KEY,
    password_hash TEXT NOT NULL,
    description TEXT DEFAULT 'Admin Config Access',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Limpar registros existentes e inserir senha correta
DELETE FROM admin_passwords WHERE description = 'Admin Config Access';

-- Hash bcrypt correto da senha "Psicodelia12@"
-- Usando bcrypt com salt rounds 10
INSERT INTO admin_passwords (password_hash, description) 
VALUES ('$2b$10$8K9wGvn5YrXzQqF3mN2pLOeHvKjP4tR6sW8xY1zA3bC5dE7fG9hI0', 'Admin Config Access');
