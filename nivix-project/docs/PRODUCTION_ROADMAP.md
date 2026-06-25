# 🛣️ NIVIX — Road to Production

**Date:** 2026-06-25
**Approach:** build **production-grade locally** (Docker), then migrate to **AWS** as a *config-only* swap.
**This is the single source of truth for "what's done / what's next / how to start."**

---

## 📍 Where we are right now

| Layer | Status |
|---|---|
| Architecture + legal path decided (IFSC sandbox, USDC, multi-org Hyperledger, partners) | ✅ |
| Clean monorepo (`apps/api`, `apps/worker`, `apps/web`, `packages/shared`) + docs | ✅ |
| **M1.1** Foundation — Postgres, Redis, config, secret/encrypt providers, health | ✅ done |
| **M1.2** Auth — register / login / JWT / roles (bcrypt) | ✅ done & tested |
| **M1.3** KYC vendor flow — initiate / webhook / status, PII encryption, audit | ✅ done & tested |
| **M1.4** KYC on Hyperledger (multi-org) | ✅ done & tested (record persists on-chain + Postgres mirror) |
| **M1 — Identity & Compliance core** | ✅ **COMPLETE** |
| **M2** USDC settlement | ⬜ **next (you are here)** |
| Everything below | ⬜ not started |

> Old system (bridge-service + old frontend) still runs on `:3002`/`:3000` as your **working demo** — untouched.

---

## 🧱 The path to production — 8 milestones

Each milestone is a shippable chunk with a clear "done when." Build top-to-bottom.

### M1 — Identity & Compliance core  ▸ ~85% done
- ✅ Auth, ✅ KYC vendor flow, ✅ Postgres mirror + audit
- 🔶 **M1.4 — write KYC result onto Hyperledger Fabric** (worker → `StoreKYC`, dual-org endorsement), set `fabricTxRef`
- **Done when:** register → KYC approved → record is on Fabric (verifiable) + mirrored in Postgres.

### M2 — Money settlement (USDC on Solana)
- Custody wallet (multisig/HSM later), USDC transfer + memo, confirmation tracking
- Double-entry `ledger_entries` in Postgres
- **Done when:** a USDC transfer settles on devnet and is recorded + confirmed.

### M3 — Fiat on-ramp & off-ramp (licensed partners)
- `OnRampProvider` (fiat → USDC) + `OffRampProvider` (USDC → fiat) interfaces + first adapters
- Quote/FX engine + transparent fees, webhook handling, reconciliation job
- **Done when:** end-to-end transfer (fiat in → USDC → fiat out) completes in sandbox.

### M4 — Compliance & reserves
- Sanctions screening, per-tier transaction limits, Travel Rule capture, STR/FIU export
- Proof-of-reserves (USDC held vs liabilities)
- **Done when:** orders are screened/limited/reportable; reserves publicly verifiable.

### M5 — Frontend & admin
- Customer flow on `apps/web`: register → KYC → send → track → receipt (wired to `apps/api`)
- Real admin/ops dashboard (orders, compliance queue, reserves)
- **Done when:** the full flow works from the UI against the new backend.

### M6 — Hardening & security
- Unit + integration + e2e tests; structured logging, metrics, alerts
- **Purge secrets from git + rotate** (incl. `nivixpemain.pem`, `treasury-keypair.json`); multisig/HSM for keys
- External security + smart-contract audit
- **Done when:** tests green, audit clean, zero secrets in git.

### M7 — AWS migration (config-only swap)
- Swap providers: Fabric→**Managed Blockchain**, Postgres→**RDS**, Redis→**ElastiCache**, secrets→**Secrets Manager**, encryption→**KMS**
- Update `deploy.yml` to `apps/web` path; deploy api/worker
- **Done when:** running on AWS with the same code, only config changed.

### M8 — IFSC sandbox launch
- Lawyer sign-off on corridor/scope → IFSCA FinTech Sandbox application → limited live pilot
- **Done when:** pilot running within IFSCA sandbox caps.

---

## 👉 Start here (the immediate next task)

**Finish M1.4 — KYC on Hyperledger.** Everything is staged for it:
- Fabric network is running (Org1+Org2); crypto material verified; SDK installed.
- The hook is already in `apps/api/src/kyc/service.ts` (`// WS-C hook`).
- Plan: `apps/api` enqueues a `fabric-writes` job on KYC approval → `apps/worker` connects via the **Fabric Gateway SDK**, calls `StoreKYC` (keyed by `userId`), then sets `kycRecord.fabricTxRef` in Postgres.

After M1.4, M1 is complete and you move to **M2 (USDC settlement)**.

---

## 🖥️ How to work locally (day-to-day)

From `nivix-project/`:
```bash
npm run infra:up          # start Postgres + Redis (Docker)
npm install               # deps (first time)
npm run db:migrate        # apply DB migrations
npm run dev:api           # API → http://localhost:3010 (or :3002 if free)
npm run dev:worker        # background worker
# Fabric (compliance ledger) runs from fabric-samples/test-network
```
- Build/typecheck everything: `npm run build` / `npm run typecheck`
- API health: `GET /api/v1/health`
- Full docs index: `docs/README.md` · build plan: `docs/PHASE_1_DEVELOPMENT_PLAN.md`

---

## 🔧 Known cleanups (do alongside)
- **Pin Prisma to one version** across the monorepo (worker pulled `@prisma/client` v7 vs api v5 — align both to 5.x to avoid client/CLI mismatch). *(quick fix, do before M1.4 worker code runs)*
- Wire `apps/web` into the workspace properly (M5).
- Secrets purge + rotation (M6).

---

## 🧭 The simple mental model
- **Old system** = working demo, keep for testing.
- **New monorepo** = the real product, built milestone by milestone.
- **You are finishing M1 of 8.** Local first → AWS at M7 → sandbox at M8.
