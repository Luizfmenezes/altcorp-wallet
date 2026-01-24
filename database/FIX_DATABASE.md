# Correção do Problema de Salvamento no Banco de Dados

## Problema Identificado

Os dados de **cartões, gastos, pessoas e rendas NÃO estavam sendo salvos** devido a uma **incompatibilidade entre o schema do banco de dados e os modelos Python**.

### Causa Raiz

A tabela `invoice_items` no banco de dados estava com estrutura diferente do modelo Python:

**Banco de Dados (init.sql) - ANTIGO:**
- Tinha apenas: `id`, `card_id`, `date`, `description`, `category`, `amount`, `installments`, `created_at`

**Modelo Python (models.py):**
- Esperava: `id`, `card_id`, `date`, `description`, `category`, `amount`, `owner`, `is_recurring`, `frequency`, `installment_info`, `created_at`

**Resultado:** Ao tentar salvar dados, o SQLAlchemy tentava inserir campos que não existiam, causando erro e impedindo o salvamento.

## Solução Aplicada

### 1. Arquivo `database/init.sql` Corrigido ✅

A tabela `invoice_items` foi atualizada para incluir todos os campos necessários:
- ✅ Adicionado campo `owner` (VARCHAR 100, NOT NULL)
- ✅ Adicionado campo `is_recurring` (BOOLEAN, DEFAULT FALSE)
- ✅ Adicionado campo `frequency` (frequency_type ENUM)
- ✅ Adicionado campo `installment_info` (JSONB)
- ✅ Removido campo antigo `installments` (VARCHAR 20)

### 2. Script de Migração Criado ✅

Arquivo: `database/migrate_fix_invoice_items.sql`

Este script adiciona as colunas faltantes em bancos de dados **já existentes** sem perder dados.

## Como Aplicar a Correção

### Opção A: Banco de Dados NOVO (Recomendado para Desenvolvimento)

```powershell
# Parar containers
docker-compose down

# Remover volume do banco de dados antigo
docker volume rm altcorp-wallet-postgres-data

# Subir containers novamente (vai criar banco com schema correto)
docker-compose up -d

# Verificar logs
docker-compose logs -f backend
```

### Opção B: Banco de Dados EXISTENTE (Para manter dados)

```powershell
# 1. Copiar script de migração para o container
docker cp database/migrate_fix_invoice_items.sql altcorp-wallet-db:/tmp/migrate.sql

# 2. Executar migração
docker exec -it altcorp-wallet-db psql -U walletuser -d altcorp_wallet -f /tmp/migrate.sql

# 3. Verificar se colunas foram adicionadas
docker exec -it altcorp-wallet-db psql -U walletuser -d altcorp_wallet -c "\d invoice_items"

# 4. Reiniciar backend
docker-compose restart backend
```

## Verificação

### 1. Verificar Estrutura da Tabela

```powershell
docker exec -it altcorp-wallet-db psql -U walletuser -d altcorp_wallet -c "\d invoice_items"
```

**Resultado esperado:**
```
                                         Table "public.invoice_items"
      Column       |           Type           | Collation | Nullable |                  Default                   
-------------------+--------------------------+-----------+----------+--------------------------------------------
 id                | integer                  |           | not null | nextval('invoice_items_id_seq'::regclass)
 card_id           | integer                  |           | not null | 
 date              | character varying(10)    |           | not null | 
 description       | character varying(255)   |           | not null | 
 category          | character varying(100)   |           | not null | 
 amount            | numeric(10,2)            |           | not null | 
 owner             | character varying(100)   |           | not null | 
 is_recurring      | boolean                  |           |          | false
 frequency         | frequency_type           |           |          | 
 installment_info  | jsonb                    |           |          | 
 created_at        | timestamp with time zone |           |          | CURRENT_TIMESTAMP
```

### 2. Testar Criação de Dados

Após aplicar a correção, teste criar:

1. **Um novo cartão** na interface
2. **Uma nova despesa** 
3. **Uma nova renda**
4. **Um item de fatura** no cartão

Todos devem ser salvos e aparecer na listagem.

### 3. Verificar Logs do Backend

```powershell
docker-compose logs -f backend
```

**Antes (com erro):**
```
❌ Validation error...
❌ Column 'owner' not found...
```

**Depois (sucesso):**
```
✅ INFO: POST /api/v1/cards/ - 201 Created
✅ INFO: POST /api/v1/expenses/ - 201 Created
✅ INFO: POST /api/v1/incomes/ - 201 Created
```

## Arquivos Modificados

1. ✅ `database/init.sql` - Corrigido schema da tabela `invoice_items`
2. ✅ `database/migrate_fix_invoice_items.sql` - Script de migração criado
3. ✅ `database/FIX_DATABASE.md` - Documentação da correção (este arquivo)

## Prevenção Futura

Para evitar problemas similares:

1. **Sempre sincronizar** os schemas SQL com os modelos Python
2. **Criar migrações** quando modificar estruturas
3. **Testar em ambiente local** antes de produção
4. **Usar migrations tools** como Alembic para controle de versão do schema

## Status

✅ **CORRIGIDO** - O banco de dados agora está em sincronia com os modelos Python e todos os dados devem ser salvos corretamente.

## Suporte

Se ainda houver problemas após aplicar a correção:

1. Verifique os logs do backend: `docker-compose logs backend`
2. Verifique os logs do banco: `docker-compose logs database`
3. Confirme que a migração foi aplicada: `docker exec -it altcorp-wallet-db psql -U walletuser -d altcorp_wallet -c "\d invoice_items"`
