# 🚀 Configurações Obrigatórias do Vercel

## Variáveis de Ambiente Necessárias

### 1. NextAuth Configuration
```
NEXTAUTH_URL=https://pmcellvendas.vercel.app
NEXTAUTH_SECRET=<seu-secret-seguro-aqui>
```

### 2. Database Configuration
```
DATABASE_URL=<postgresql-connection-string>
DIRECT_URL=<postgresql-connection-string>
```

### 3. Other Environment Variables
```
NODE_ENV=production
```

## 📝 Como Configurar no Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto: `pmcellvendas`
3. Vá em `Settings` > `Environment Variables`
4. Adicione cada variável acima

## ⚠️ IMPORTANTE

- **NEXTAUTH_URL** deve ser exatamente: `https://pmcellvendas.vercel.app`
- **NEXTAUTH_SECRET** deve ser uma string longa e segura (pode gerar em: `openssl rand -base64 32`)
- Após adicionar as variáveis, faça um novo deploy

## 🔍 Como Verificar se Funcionou

1. Faça login em: https://pmcellvendas.vercel.app/admin/login
2. Se funcionar, você será redirecionado para: `/admin/dashboard`
3. Verifique os logs no Vercel para confirmar que não há erros de token

---

**Nota**: Este arquivo foi criado automaticamente para ajudar na configuração do ambiente de produção.