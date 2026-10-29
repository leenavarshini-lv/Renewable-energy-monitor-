# REMS Console: PostgreSQL Administration & Demo System

**REMS Console** (Renewable Energy Management System Console) is a production-grade database administration and interactive demonstration platform built for PostgreSQL (schema: `rems`).

It runs real SQL against live PostgreSQL databases (Neon, Supabase, Railway, Render, or local instances) with connection pooling via `pg.Pool`, statement timeouts, and ACID transaction session controls, coupled with a built-in zero-configuration emulated PostgreSQL engine for offline demonstration parity.

---

## Architecture & Technology Stack

- **Frontend**: React 19 + Vite, IBM Plex Sans & IBM Plex Mono typography, dense flat database tool aesthetic (`#05070B` page, `#0B1018` panels, `#16202E` hairline borders, `#2F6BFF` primary blue).
- **SQL Editor**: Monaco Editor with PostgreSQL syntax highlighting, `Ctrl+Enter` execution, preloaded Q1–Q12 query library, and `EXPLAIN ANALYZE` visualizer.
- **Charts & Telemetry**: Recharts for generation timelines, source distribution, and index latency benchmarks.
- **Backend**: Node.js + Express + `pg` connection pool running on port 3000. Browser never connects directly to PostgreSQL; `DATABASE_URL` is secured server-side.
- **Database**: PostgreSQL schema `rems` (13 relational tables, 4 triggers, 3 stored PL/pgSQL procedures, 3 RBAC roles, 1 materialized view, and composite B-Tree indexes).

---

## DBMS Concepts Mapping

| REMS Console Feature | PostgreSQL Implementation | DBMS Theoretical Concept |
| :--- | :--- | :--- |
| **Relational Schema** | 13 tables (`plant`, `equipment`, `battery`, `generation_record`, `tariff`, `consumer`, `meter`, `meter_reading`, `bill`, `carbon_credit`, `alert`, `config`, `audit_log`) | **3NF Relational Modeling** (Boyce-Codd / 3rd Normal Form) with functional dependency enforcement |
| **Integrity Constraints** | `CHECK (capacity_kw > 0)`, `CHECK (charge_pct BETWEEN 0 AND 100)`, `UNIQUE (plant_id, gen_date)`, `ON DELETE CASCADE` | **Entity, Domain, & Referential Integrity** enforced by the database kernel |
| **Live ER Diagram** | Queries `information_schema.tables`, `columns`, `table_constraints`, `key_column_usage` | **Data Catalog & Metamodel Introspection** (Self-describing database schemas) |
| **Event Triggers** | `trg_battery_low`, `trg_low_output`, `trg_audit_tariff`, `trg_audit_bill` | **Active Database Systems (ECA Rules)**: Event-Condition-Action procedural triggers fired synchronously on DML |
| **Stored Procedures** | `generate_bills(month)`, `calc_carbon_credits(month)`, `check_warranty_alerts()` | **In-Database Computation (PL/pgSQL)**: Minimizes network round-trips by processing aggregations and upserts directly in memory |
| **ACID Transactions** | `BEGIN`, `COMMIT`, `ROLLBACK` session controls in SQL Console | **ACID Properties**: Atomicity, Consistency, Isolation, and Durability under Multi-Version Concurrency Control (MVCC) |
| **Performance Benchmark** | Index Scan vs. Seq Scan on `meter_reading(meter_id, reading_date)` | **Query Optimization & Access Methods**: Cost-based planner choices, B-Tree index lookup vs. heap sequential scan |
| **Role-Based Security** | `rems_admin`, `rems_operator`, `rems_consumer` tested via `SET LOCAL ROLE` | **Database Security & Principle of Least Privilege**: Kernel-enforced permissions (DML grants, sequence usage) |
| **Analytical Snapshots** | `mv_monthly_plant_summary` refreshed via `REFRESH MATERIALIZED VIEW` | **Materialized Views**: Query optimization through precomputed physical relations |
| **Audit Trail** | `rems.audit_log` with `JSONB` old/new row snapshots | **Immutable Change Data Capture (CDC)**: Non-repudiation and temporal accountability |
| **Destructive Safeguards** | Confirmation modal for unconstrained `UPDATE`/`DELETE`, explicit typing for `DROP SCHEMA` | **Defensive Database Administration**: Mitigating operator error and catalog drops |

---

## 4 Deliberate Denormalizations Explained

1. **Bill Totals (`amount`, `net_kwh`) in `rems.bill`**:
   - *3NF Deviation*: Calculable from `meter_reading` sums and `tariff.import_rate`.
   - *Rationale*: Avoids heavy repeated aggregations across millions of readings for customer portal views and locks in historical billing amounts even if tariff rates change in the future.
2. **Direct `bill.consumer_id`**:
   - *3NF Deviation*: Derivable through `bill → meter → consumer`.
   - *Rationale*: Eliminates a two-table JOIN on billing history lookups, enables direct compound indexing on `(consumer_id, bill_month)`, and facilitates tenant-level sharding.
3. **`carbon_credit.units_kwh` Snapshot**:
   - *3NF Deviation*: Redundant with `SUM(generation_record.units_kwh)`.
   - *Rationale*: Carbon credit registries require immutable certified certificates. Freezing the monthly yield protects the ledger against subsequent sensor recalibrations.
4. **`alert` Polymorphic References (`ref_table`, `ref_id`)**:
   - *3NF Deviation*: Replaces separate typed foreign keys (`plant_id`, `battery_id`, `equipment_id`).
   - *Rationale*: Eliminates sparse tables dominated by NULL foreign keys and allows a unified operational alerts feed with a single index on `(alert_type, resolved)`.

---

## Local Development & Setup

### 1. Prerequisites
- Node.js 18+
- (Optional) PostgreSQL 14+ instance (Local, Neon, Supabase, or Railway)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your `DATABASE_URL` in `.env`:
```env
# Example Neon connection string:
DATABASE_URL="postgresql://username:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Or leave empty to run with the built-in high-fidelity emulated engine!
```

### 3. Initialize PostgreSQL Database
If using a live PostgreSQL database, execute `rems_project.sql` against it:
```bash
psql $DATABASE_URL -f rems_project.sql
```
*(Alternatively, you can click "Reset Demo Database" directly in the REMS Console UI under Database Stats to run the script automatically!)*

### 4. Start Development Server
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment Guide

### Deploying Frontend + Backend on Render / Railway
1. **Repository**: Push the codebase to GitHub.
2. **Build Command**: `npm run build`
3. **Start Command**: `npm start` (runs `tsx server.ts`)
4. **Environment Variables**:
   - `DATABASE_URL`: Your remote PostgreSQL connection string (from Neon or Supabase)
   - `PORT`: `3000` (or injected by platform)
   - `NODE_ENV`: `production`

### Deploying on Vercel + Neon
- **Database**: Create a serverless PostgreSQL branch on [Neon](https://neon.tech) and copy the pooled connection string.
- In Vercel, connect the repository and set the `DATABASE_URL` environment variable.

---

## Keyboard Shortcuts
- `Ctrl + Enter` / `Cmd + Enter`: Execute SQL in SQL Console
- `Ctrl + K` / `Cmd + K`: Open Global Entity Search
