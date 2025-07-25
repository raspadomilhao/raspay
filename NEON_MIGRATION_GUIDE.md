# Guia de Migração para Neon Database

Este guia explica como migrar o RasPay para usar o Neon Database como provedor de PostgreSQL.

## Pré-requisitos

1. Conta no Neon Database (https://neon.tech)
2. Projeto criado no Neon
3. String de conexão do banco de dados

## Variáveis de Ambiente Necessárias

Configure as seguintes variáveis de ambiente:

\`\`\`env
# Database
DATABASE_URL=postgresql://username:password@host/database?sslmode=require

# JWT
JWT_SECRET=your-jwt-secret-key

# Base URL
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# HorsePay (Server-only - não usar NEXT_PUBLIC_)
HORSEPAY_CLIENT_KEY=your-horsepay-client-key
HORSEPAY_CLIENT_SECRET=your-horsepay-client-secret
\`\`\`

## Passos da Migração

### 1. Configurar Neon Database

1. Acesse https://neon.tech e crie uma conta
2. Crie um novo projeto
3. Copie a string de conexão do banco de dados
4. Configure a variável `DATABASE_URL` no seu ambiente

### 2. Executar Migrações

Execute os scripts SQL na seguinte ordem:

1. `000-setup-complete-database.sql` - Configuração completa do banco
2. `001-create-tables.sql` - Criação das tabelas principais
3. `002-seed-data.sql` - Dados iniciais
4. `003-add-user-fields.sql` - Campos adicionais de usuário
5. `004-update-transaction-types.sql` - Tipos de transação
6. `005-fix-transaction-types.sql` - Correções nos tipos
7. `006-run-all-migrations.sql` - Executar todas as migrações
8. `007-add-user-type.sql` - Tipos de usuário
9. `008-ensure-wallets.sql` - Garantir carteiras
10. `009-create-affiliate-system.sql` - Sistema de afiliados
11. `010-create-affiliate-withdraws.sql` - Saques de afiliados
12. `011-create-system-settings.sql` - Configurações do sistema
13. `012-add-affiliate-loss-commission.sql` - Comissão por perda
14. `013-add-transaction-description.sql` - Descrição de transações
15. `014-add-withdraw-settings.sql` - Configurações de saque
16. `015-add-affiliate-balance.sql` - Saldo de afiliados
17. `016-add-admin-password.sql` - Senha do admin
18. `017-create-referral-system.sql` - Sistema de indicação

### 3. Configurar Aplicação

1. Atualize as variáveis de ambiente
2. Teste a conexão com o banco
3. Execute a aplicação em modo de desenvolvimento
4. Verifique se todas as funcionalidades estão funcionando

### 4. Deploy

1. Configure as variáveis de ambiente no seu provedor de hosting
2. Execute o deploy da aplicação
3. Teste todas as funcionalidades em produção

## Verificação

Para verificar se a migração foi bem-sucedida:

1. Acesse `/api/test-db` para testar a conexão
2. Faça login no sistema
3. Teste depósitos e saques
4. Verifique o painel administrativo

## Troubleshooting

### Erro de Conexão

Se houver erro de conexão com o banco:

1. Verifique se a string de conexão está correta
2. Confirme se o SSL está habilitado
3. Teste a conexão diretamente no Neon Console

### Tabelas não Encontradas

Se as tabelas não existirem:

1. Execute novamente os scripts de migração
2. Verifique se todos os scripts foram executados na ordem correta
3. Consulte os logs do Neon para erros

### Problemas de Performance

Para otimizar a performance:

1. Configure índices apropriados
2. Use connection pooling
3. Monitore as queries no Neon Console

## Suporte

Para suporte adicional:

1. Consulte a documentação do Neon: https://neon.tech/docs
2. Verifique os logs da aplicação
3. Entre em contato com o suporte técnico
