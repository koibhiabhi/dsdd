# Tally-like Ledger (React + Firebase)

A production-ready, client-side web app to manage full double-entry accounting on top of your **existing fertilizers portal** Firestore data.

- **Stack**: React + Vite, Firebase Auth + Firestore
- **Features**:
  - Double-entry vouchers (Purchase, Sales, Receipt, Payment, Journal)
  - Party ledgers with running balance, outstanding / overdue
  - Inventory-aware postings: Inventory, COGS, Sales auto-entries
  - Per-voucher payment status (Pending / Partially Paid / Paid)
  - Powerful search, edit, delete (with audit fields)
  - Migration tool to **import from your existing schema**
  - Exports to CSV
- **Schema**: `books/{companyId}/accounts`, `books/{companyId}/vouchers`, `books/{companyId}/parties`, reuses `companies/{companyId}/materials`

## 1) Prereqs

- Node 18+
- A Firebase project with Firestore enabled.
- Your existing `companies/*/materials` and `companies/*/entries` data in the same project (or copy it there).

## 2) Setup

```bash
npm create vite@latest ledger -- --template react
# OR just use this folder directly:
npm i
```

Create `.env` from `.env.example` and fill Firebase config.

## 3) Run

```bash
npm run dev
```

## 4) Deploy

Any static host (GitHub Pages, Vercel, Firebase Hosting).

## 5) Migrate Old Data (one-time)

- Open the app, sign in as admin, choose a company, then go to **Settings → Migrate from Old App**.
- This reads from `companies/{companyId}/materials` and `companies/{companyId}/entries` and creates:
  - Master accounts (Inventory, Sales, COGS, Cash, Bank, AR, AP, Equity)
  - Parties from existing `entry.party`
  - Vouchers for every purchase/sale with inventory lines
  - Receipts/Payments from `entry.note` when pattern `paid:` or via manual reconciliation
- Safe to rerun: it de-duplicates by a deterministic `legacyRefId`.

## 6) Notes

- Everything is double-entry. Balances are computed as **Debit - Credit**.
- You can edit/delete vouchers; inventory gets revalued via weighted-average like your current app.
- CSV export available from the menu.