# Sistema de Usuários - Guia de Uso

## Funcionalidades Implementadas

### 1. Tipos de Usuário
- **ADMIN**: Acesso completo ao sistema
- **EMPLOYEE**: Acesso limitado (Pedidos e Carrinhos)

### 2. Controle de Acesso

#### Administradores (ADMIN) têm acesso a:
- ✅ Gerenciamento de usuários
- ✅ Criação/edição de produtos
- ✅ Gerenciamento de categorias
- ✅ Configurações do sistema
- ✅ Transportadoras
- ✅ Pedidos
- ✅ Carrinhos

#### Funcionários (EMPLOYEE) têm acesso a:
- ✅ Pedidos
- ✅ Carrinhos
- ❌ Gerenciamento de usuários
- ❌ Criação/edição de produtos
- ❌ Gerenciamento de categorias
- ❌ Configurações do sistema
- ❌ Transportadoras

### 3. URLs do Sistema

- **Login Admin**: `/admin/login`
- **Dashboard**: `/admin/dashboard`
- **Gerenciar Usuários**: `/admin/usuarios` (apenas ADMIN)
- **Pedidos**: `/admin/pedidos` (ADMIN e EMPLOYEE)
- **Carrinhos**: `/admin/carrinhos` (ADMIN e EMPLOYEE)

### 4. Como Testar

#### Login como Admin (mock):
- Email: `admin@pmcell.com.br`
- Senha: `admin123`

#### Acessar Gerenciamento de Usuários:
1. Faça login como admin
2. No dashboard, clique no botão "Usuários"
3. Adicione novos usuários com diferentes tipos de acesso

#### Testar como Funcionário:
1. Crie um usuário com tipo "Funcionário"
2. Faça logout e login com as credenciais do funcionário
3. Observe que alguns botões não aparecem no dashboard

### 5. API Endpoints

#### Gerenciar Usuários (apenas ADMIN):
- `GET /api/admin/users` - Listar usuários
- `POST /api/admin/users` - Criar usuário
- `PUT /api/admin/users/[id]` - Editar usuário
- `DELETE /api/admin/users/[id]` - Deletar usuário

### 6. Banco de Dados

#### Tabela User:
```sql
- id: String (CUID)
- email: String (único)
- password: String (bcrypt)
- name: String
- role: UserRole (ADMIN | EMPLOYEE)
- isActive: Boolean
- createdAt: DateTime
- updatedAt: DateTime
```

#### Compatibilidade:
- O sistema mantém compatibilidade com a tabela `Admin` legada
- Novos usuários são criados na tabela `User`
- A autenticação verifica ambas as tabelas

### 7. Segurança

- ✅ Senhas criptografadas com bcrypt
- ✅ Verificação de role em todas as APIs sensíveis
- ✅ Controle de acesso baseado em roles nas páginas
- ✅ Validação de entrada nos formulários
- ✅ Prevenção de auto-deletar conta

### 8. Interface

- ✅ Lista paginada de usuários
- ✅ Modal para criar/editar usuários
- ✅ Indicadores visuais de tipo de usuário
- ✅ Status ativo/inativo
- ✅ Botões contextuais baseados em permissões
- ✅ Feedback visual das ações

### 9. Próximos Passos (Opcional)

1. **Logs de Auditoria**: Registrar ações dos usuários
2. **Recuperação de Senha**: Sistema de reset via email
3. **Permissões Granulares**: Controle mais fino de acesso
4. **Sessões Ativas**: Gerenciar sessões ativas dos usuários
5. **2FA**: Autenticação de dois fatores