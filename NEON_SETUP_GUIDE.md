# 🗄️ Guia de Configuração do Neon Database

Este guia te ajudará a configurar o banco de dados Neon para o projeto RaspaPix.

## 📋 Pré-requisitos

- Conta no [Neon](https://neon.tech)
- Projeto Next.js configurado
- Variáveis de ambiente configuradas

## 🚀 Passo a Passo

### 1. Criar Projeto no Neon

1. Acesse [neon.tech](https://neon.tech)
2. Faça login ou crie uma conta
3. Clique em "Create Project"
4. Escolha:
   - **Nome**: `raspapix-database`
   - **Região**: Mais próxima do seu público
   - **PostgreSQL Version**: 15 (recomendado)

### 2. Obter String de Conexão

1. No dashboard do projeto, vá para "Connection Details"
2. Copie a **Connection String** completa
3. Deve ser algo como:
   \`\`\`
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   \`\`\`

### 3. Configurar Variáveis de Ambiente

No Vercel ou localmente, configure:

\`\`\`bash
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
JWT_SECRET=raspix04072025
NEXT_PUBLIC_BASE_URL=https://v0-raspadinhacomcontademo.vercel.app
\`\`\`

### 4. Executar Script SQL

1. No Neon Console, vá para "SQL Editor"
2. Execute o arquivo `scripts/000-setup-complete-database.sql`
3. Verifique se todas as tabelas foram criadas

### 5. Verificar Configuração

Acesse `/setup-database` no seu projeto para verificar:
- ✅ Conexão estabelecida
- ✅ Tabelas criadas
- ✅ Dados iniciais inseridos

## 📊 Estrutura do Banco

### Tabelas Criadas:

- **users**: Usuários do sistema
- **wallets**: Carteiras e saldos
- **transactions**: Histórico de transações
- **webhook_logs**: Logs dos webhooks

### Usuários Padrão:

- **Admin**: `admin@raspapix.com` / `admin123`
- **Blogger**: `blogger@raspapix.com` / `admin123`

## 🔧 Webhook Configurado

O webhook está configurado para receber callbacks em:
\`\`\`
https://v0-raspadinhacomcontademo.vercel.app/api/webhook/horsepay
\`\`\`

## 🎯 Próximos Passos

1. Testar login no sistema
2. Configurar integração HorsePay
3. Testar jogos de raspadinha
4. Configurar notificações

## 🆘 Solução de Problemas

### Erro de Conexão
- Verifique se a `DATABASE_URL` está correta
- Confirme se o projeto Neon está ativo

### Tabelas Não Encontradas
- Execute novamente o script SQL
- Verifique permissões no Neon

### Webhook Não Funciona
- Confirme se a URL está acessível
- Verifique logs no Vercel

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs no Vercel
2. Teste a conexão em `/setup-database`
3. Consulte a documentação do Neon
