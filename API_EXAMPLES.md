# 📘 Exemplos de Uso da API

Exemplos práticos de como usar a API do AltCorp Wallet.

## 🔗 Base URL

```
http://localhost:8000/api/v1
```

## 📝 Receitas (Incomes)

### Listar todas as receitas
```bash
curl http://localhost:8000/api/v1/incomes
```

### Criar nova receita fixa
```bash
curl -X POST http://localhost:8000/api/v1/incomes \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Salário",
    "amount": 5000.00,
    "type": "fixed"
  }'
```

### Criar receita extra (específica de um mês)
```bash
curl -X POST http://localhost:8000/api/v1/incomes \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Freelance",
    "amount": 1500.00,
    "type": "extra",
    "month": 0,
    "year": 2026
  }'
```

### Deletar receita
```bash
curl -X DELETE http://localhost:8000/api/v1/incomes/1
```

## 💰 Despesas (Expenses)

### Listar todas as despesas
```bash
curl http://localhost:8000/api/v1/expenses
```

### Filtrar despesas por mês e ano
```bash
# Janeiro (month=0) de 2026
curl "http://localhost:8000/api/v1/expenses?month=0&year=2026"
```

### Filtrar por categoria
```bash
curl "http://localhost:8000/api/v1/expenses?category=Alimentação"
```

### Criar nova despesa
```bash
curl -X POST http://localhost:8000/api/v1/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-19",
    "description": "Supermercado",
    "category": "Alimentação",
    "amount": 250.50,
    "owner": "Eu",
    "is_recurring": false
  }'
```

### Criar despesa recorrente
```bash
curl -X POST http://localhost:8000/api/v1/expenses \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-05",
    "description": "Internet",
    "category": "Serviços",
    "amount": 120.00,
    "owner": "Eu",
    "is_recurring": true,
    "frequency": "monthly"
  }'
```

### Atualizar despesa
```bash
curl -X PUT http://localhost:8000/api/v1/expenses/1 \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300.00,
    "description": "Supermercado (atualizado)"
  }'
```

### Deletar despesa
```bash
curl -X DELETE http://localhost:8000/api/v1/expenses/1
```

## 💳 Cartões (Cards)

### Listar todos os cartões
```bash
curl http://localhost:8000/api/v1/cards
```

### Criar novo cartão
```bash
curl -X POST http://localhost:8000/api/v1/cards \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cartão Nubank",
    "type": "credit",
    "color": "#8B5CF6"
  }'
```

### Deletar cartão
```bash
curl -X DELETE http://localhost:8000/api/v1/cards/1
```

## 🧾 Itens de Fatura (Invoice Items)

### Listar itens de um cartão
```bash
curl http://localhost:8000/api/v1/cards/1/items
```

### Filtrar itens por mês
```bash
# Janeiro (month=0) de 2026
curl "http://localhost:8000/api/v1/cards/1/items?month=0&year=2026"
```

### Adicionar item simples
```bash
curl -X POST http://localhost:8000/api/v1/cards/1/items \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-19",
    "description": "Netflix",
    "category": "Streaming",
    "amount": 55.90,
    "owner": "Eu",
    "is_recurring": true,
    "frequency": "monthly"
  }'
```

### Adicionar item parcelado (12x)
```bash
curl -X POST http://localhost:8000/api/v1/cards/1/items \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-19",
    "description": "Notebook",
    "category": "Compras",
    "amount": 3600.00,
    "owner": "Eu",
    "installments": 12
  }'
```

### Atualizar item
```bash
curl -X PUT http://localhost:8000/api/v1/cards/1/items/1 \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 60.00,
    "description": "Netflix Premium"
  }'
```

### Deletar item
```bash
curl -X DELETE http://localhost:8000/api/v1/cards/1/items/1
```

## 🎯 Orçamentos (Budgets)

### Listar todos os orçamentos
```bash
curl http://localhost:8000/api/v1/budgets
```

### Filtrar por mês e ano
```bash
curl "http://localhost:8000/api/v1/budgets?month=0&year=2026"
```

### Criar/atualizar orçamento
```bash
curl -X POST http://localhost:8000/api/v1/budgets \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Alimentação",
    "limit": 1000.00,
    "month": 0,
    "year": 2026
  }'
```

### Deletar orçamento por ID
```bash
curl -X DELETE http://localhost:8000/api/v1/budgets/1
```

### Deletar orçamento por categoria
```bash
curl -X DELETE "http://localhost:8000/api/v1/budgets/category/Alimentação?month=0&year=2026"
```

## 📊 Exemplos com Python

### Usando requests
```python
import requests

BASE_URL = "http://localhost:8000/api/v1"

# Criar despesa
response = requests.post(
    f"{BASE_URL}/expenses",
    json={
        "date": "2026-01-19",
        "description": "Café",
        "category": "Alimentação",
        "amount": 15.00,
        "owner": "Eu"
    }
)
print(response.json())

# Listar cartões
response = requests.get(f"{BASE_URL}/cards")
cards = response.json()
print(cards)

# Adicionar item parcelado
response = requests.post(
    f"{BASE_URL}/cards/1/items",
    json={
        "date": "2026-01-19",
        "description": "Celular",
        "category": "Compras",
        "amount": 2400.00,
        "owner": "Eu",
        "installments": 10
    }
)
print(response.json())
```

## 🌐 Exemplos com JavaScript/Fetch

```javascript
const BASE_URL = 'http://localhost:8000/api/v1';

// Criar receita
async function criarReceita() {
  const response = await fetch(`${BASE_URL}/incomes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: 'Bônus',
      amount: 2000.00,
      type: 'extra',
      month: 0,
      year: 2026
    })
  });
  const data = await response.json();
  console.log(data);
}

// Listar despesas do mês
async function listarDespesas(month, year) {
  const response = await fetch(
    `${BASE_URL}/expenses?month=${month}&year=${year}`
  );
  const expenses = await response.json();
  console.log(expenses);
}

// Adicionar item no cartão
async function adicionarItem(cardId) {
  const response = await fetch(`${BASE_URL}/cards/${cardId}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      date: '2026-01-19',
      description: 'Compra online',
      category: 'Compras',
      amount: 150.00,
      owner: 'Eu'
    })
  });
  const items = await response.json();
  console.log(items);
}
```

## 🧪 Testando com Swagger UI

Acesse: `http://localhost:8000/api/docs`

A interface Swagger permite:
- ✅ Ver todos os endpoints disponíveis
- ✅ Testar requisições direto no navegador
- ✅ Ver schemas de request/response
- ✅ Verificar códigos de erro

## 📖 Códigos de Status HTTP

- `200 OK` - Sucesso (GET, PUT)
- `201 Created` - Criado com sucesso (POST)
- `204 No Content` - Deletado com sucesso (DELETE)
- `400 Bad Request` - Dados inválidos
- `404 Not Found` - Recurso não encontrado
- `422 Unprocessable Entity` - Validação falhou
- `500 Internal Server Error` - Erro no servidor

## 🔍 Tipos de Dados

### IncomeType
- `fixed` - Receita fixa mensal
- `extra` - Receita extra (única vez)

### CardType
- `credit` - Cartão de crédito
- `debit` - Cartão de débito
- `bank` - Conta bancária

### FrequencyType
- `monthly` - Mensal
- `weekly` - Semanal

## 💡 Dicas

1. Use `month` baseado em 0 (Janeiro = 0, Dezembro = 11)
2. Datas no formato `YYYY-MM-DD` (ISO 8601)
3. Valores monetários com 2 casas decimais
4. Parcelamento cria múltiplos itens automaticamente
5. Despesas recorrentes devem ter `frequency` definida

---

**Documentação completa:** http://localhost:8000/api/docs
