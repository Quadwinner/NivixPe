# Nivix Platform

Cross-border payment platform (GIFT City IFSC / IFSCA). **All documentation lives in [`docs/`](./docs/)** — start with [`docs/README.md`](./docs/README.md), the [PRD](./docs/NIVIX_TECHNICAL_PRD.md), and the [Phase 1 plan](./docs/PHASE_1_DEVELOPMENT_PLAN.md).

This README is the **local-dev quick-start only**.

## Phase 1 — local development (no AWS needed)

```bash
# 1. Start Postgres + Redis
npm run infra:up

# 2. Install dependencies
npm install

# 3. Configure env (already created for local dev; regenerate the key for any shared env)
cp .env.example .env        # if you don't have .env yet
#   then set LOCAL_MASTER_KEY = $(openssl rand -base64 32)

# 4. Generate Prisma client + run migrations
npm run db:generate
npm run db:migrate

# 5. Run the API and worker (separate terminals)
npm run dev:api             # http://localhost:3002/api/v1/health
npm run dev:worker
```

The Hyperledger Fabric compliance ledger runs from `fabric-samples/test-network` (Org1 + Org2) — see Phase 1 plan **WS-C**.

## Monorepo structure
- `apps/api` — REST API (Express + TypeScript, Prisma)
- `apps/worker` — async jobs (BullMQ) incl. Fabric writes
- `packages/shared` — shared types & Zod schemas
- `fabric-samples/` — Hyperledger Fabric network (compliance ledger)
- `docs/` — all documentation

## Hosting note
Built **local-first**. All hosting dependencies sit behind interfaces
(`SecretsProvider`, `Encryptor`, connection strings, Fabric connection profile),
so migrating to AWS (Managed Blockchain / RDS / ElastiCache / Secrets Manager / KMS)
when the account is verified is a **config change, not a rewrite**.
