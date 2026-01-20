# Database README

## PostgreSQL Database

This directory contains the PostgreSQL database initialization scripts for the AltCorp Wallet application.

### Files

- `init.sql`: Main database schema and initial data

### Schema

The database includes the following tables:

1. **users** - User accounts
2. **incomes** - Income records
3. **expenses** - Expense records
4. **cards** - Payment cards (credit/debit/bank)
5. **invoice_items** - Items in card invoices
6. **budgets** - Budget limits by category

### Default User

A default user is created for testing:
- Email: `admin@altcorp.com`
- Password: `admin123`

### Data Persistence

Database data is persisted in a Docker volume named `postgres_data`.
