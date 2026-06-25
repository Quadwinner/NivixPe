# 🏗️ NIVIX — Phase 1 Development Plan

**Version:** 1.0
**Date:** 2026-06-25
**Parent docs:** [`NIVIX_TECHNICAL_PRD.md`](./NIVIX_TECHNICAL_PRD.md) (epics E0–E12) · [`IFSC_LEGAL_AND_BUILD_PLAN.md`](./IFSC_LEGAL_AND_BUILD_PLAN.md)
**Phase 1 = PRD Epics E0 + E1 + E2** (Foundation · Identity/KYC · Hyperledger compliance ledger)

---

## 1. Goal & rationale

> **Build the identity + compliance backbone of Nivix — the part that delivers your core pitch and your IFSC commitment (Hyperledger KYC).**

Phase 1 deliberately stops *before* money movement. We first stand up a clean, secure foundation and prove the **dual-blockchain compliance flow**: a user verifies identity → the result is recorded immutably on a **multi-org Hyperledger Fabric** ledger → cached in Postgres for fast reads. Money settlement (USDC) and on/off-ramp are **Phase 2**.

Why this order: KYC/compliance is a prerequisite for every money endpoint, it's your contractual deliverable, and it's the lowest-risk place to establish the architecture properly.

**Duration:** ~6 weeks, small team (1–3 devs). **Estimated wall-clock with 2 devs: 6 weeks.**

### What Phase 1 delivers ✅
- Clean monorepo, CI, secrets purged from git + moved to a vault.
- Postgres + Redis provisioned; migrations.
- User registration + JWT auth + roles.
- KYC via a real vendor (Sumsub/HyperVerge) — end-to-end in their sandbox.
- **Multi-org Hyperledger Fabric** compliance/audit ledger (hardened `nivix-kyc` chaincode, private data collections).
- Postgres mirror of Fabric KYC state for fast queries.
- Plaintext `kyc-data-store.json` fallback **removed**.

### What Phase 1 does NOT include (→ Phase 2)
- ❌ USDC settlement / Solana money movement
- ❌ On-ramp / off-ramp partners
- ❌ Quotes / FX / fees
- ❌ Proof of reserves
- ❌ Customer payment UI (only the KYC/auth UI)

---

## 2. Local-first setup (AWS deferred until the account is verified)

**Decision:** build and test all of Phase 1 **locally on Docker**. The architecture does NOT change — only *hosting* does. Every cloud service has a local equivalent, isolated behind a small provider interface so moving to AWS later is **config-only, not a rewrite**.

### 2.1 Local stack ↔ AWS equivalent
| Concern | Local (now) | AWS (later, when verified) |
|---|---|---|
| Compliance ledger | **Hyperledger Fabric `test-network`** (Docker, Org1 + Org2) | AWS Managed Blockchain (Nivix + independent endorser) |
| Database | **Postgres** container | RDS Postgres |
| Cache / queues | **Redis** container | ElastiCache |
| Secrets | **gitignored `.env`** behind a `SecretsProvider` interface | AWS Secrets Manager |
| Encryption keys | **local master key** behind an `Encryptor` interface | AWS KMS |

Everything runs from one `docker-compose.yml` (Postgres + Redis) plus the Fabric `test-network` scripts you already have under `fabric-samples/`.

### 2.2 Build for the swap (do this from day 1)
Hide every hosting dependency behind an interface so the AWS migration is just a config/implementation change:
- `SecretsProvider` → `EnvSecretsProvider` now → `AwsSecretsManagerProvider` later
- `Encryptor` → `LocalKeyEncryptor` now → `KmsEncryptor` later
- Fabric → the **same** `@hyperledger/fabric-gateway` code; only the connection profile/endpoints differ between local test-network and AMB
- DB / Redis → connection strings from env; identical code, different host

### 2.3 Still needed in Week 0 (all free / local-friendly — no AWS)
| Item | Why |
|---|---|
| **Docker + Docker Compose, Node 18+, Go** (for chaincode) | Run the local stack |
| **KYC vendor sandbox** (Sumsub / HyperVerge) | Free sandbox; no AWS dependency |
| **Independent endorser** conversation (auditor / hatchery / partner) | Long business lead-time; needed only at AWS-migration, but start now |
| **Fintech lawyer** (carry-over) | Confirm IFSCA sandbox scope before Phase 2 |

> ⚠️ **Local multi-org caveat:** the Fabric `test-network` runs Org1 + Org2 but *both on your machine* — enough to build and test the **dual-endorsement flow, chaincode, and private data collections**. It is NOT yet tamper-proof *against you* (that needs the genuinely *independent* endorser on AMB). So locally you prove the **mechanics**; the independent endorser arrives with the AWS deployment. This does **not** block Phase 1.

> **Week-1 decision:** KYC vendor — recommend **Sumsub** (KYB + global coverage for a B2B corridor); **HyperVerge** if India-resident verification is the priority.

---

## 3. Target state at end of Phase 1

```
 React (auth + KYC screens)
        │  JWT
        ▼
 Nivix API (Node/TS)  ──►  KYC VENDOR (Sumsub/HyperVerge)  [does verification]
        │                          │ webhook (result)
        │                          ▼
        ├──────────────►  HYPERLEDGER FABRIC (multi-org)  [records KYC status, risk,
        │                 hardened nivix-kyc chaincode      approvals — PII in private
        │                 + private data collections        data collections]
        │                          │
        ▼                          ▼
 POSTGRES (users, kyc_records mirror, audit mirror)  ◄── fast "is verified?" reads
 REDIS (jobs, retries, idempotency)
```

---

## 4. Work streams & tasks

> Stack: **TypeScript + Express**, **Prisma** (Postgres ORM), **@hyperledger/fabric-gateway**, **BullMQ** (Redis jobs), **Zod** (validation), **jsonwebtoken** (auth), **Vitest** (tests), **GitHub Actions** (CI). Secrets via **AWS Secrets Manager + KMS**.

### WS-A — Foundation & cleanup (Epic E0)
- [ ] A1. Create clean monorepo: `apps/api`, `apps/worker`, `apps/web`, `packages/shared` (shared types/schemas).
- [ ] A2. **Purge secrets from git history** — remove `bridge-service/.env`, `.env.backup`, and the test keys in docs; use `git filter-repo` (or BFG). **Rotate** all leaked test keys.
- [ ] A3. Add `.gitignore` for `.env*`, keys, `data/*.json` keypairs; add **secret-scanning** to CI (e.g. gitleaks).
- [ ] A4. Config module: env-driven, no hardcoded URLs/ports; `SOLANA_CLUSTER` placeholder (unused until Phase 2).
- [ ] A5. Stand up **Postgres + Redis via `docker-compose`** (local); wire Prisma; first migration runner. *(Same connection strings point at RDS/ElastiCache later.)*
- [ ] A6. Implement `SecretsProvider` + `Encryptor` interfaces with **local implementations** (gitignored `.env` + a local master key). App never reads secrets from committed files. *(Swap to Secrets Manager + KMS later — config only.)*
- [ ] A7. **CI/CD** (GitHub Actions): lint, typecheck, test, build on every PR.
- [ ] A8. Tag old code `v0-poc-devnet`; archive the **self-mint Solana program** out of the build path. **Keep `fabric-samples/`** (upgraded in WS-C).
- [ ] **Exit:** clean repo, CI green, DB/Redis reachable from the API, zero secrets in git.

### WS-B — Identity, Auth & KYC vendor (Epic E1)
- [ ] B1. `users` model + migrations (id, type individual/business, email, phone, country, status).
- [ ] B2. Auth: register / login / JWT issue + refresh; **role gating** (user / compliance / admin).
- [ ] B3. Choose + integrate **KYC vendor** sandbox; build `POST /api/v1/kyc/initiate` → create vendor applicant → return SDK token.
- [ ] B4. `POST /api/v1/webhooks/kyc` → **verify webhook signature** → parse result (status, risk score) → hand to WS-C to record on Fabric, and mirror to Postgres.
- [ ] B5. `GET /api/v1/kyc/status` → read from the Postgres mirror (fast).
- [ ] B6. **Envelope encryption** (KMS data keys) for any PII columns; store document **tokens/hashes**, not raw documents (vendor holds those).
- [ ] B7. Middleware: block all (future) money endpoints unless `kyc.status = approved`.
- [ ] **Exit:** a user completes KYC end-to-end in the vendor sandbox; PII encrypted; status queryable.

### WS-C — Hyperledger Fabric multi-org compliance ledger (Epic E2) ⭐
> This is the core pitch deliverable. Do it properly — **multi-org**, not single-org.
- [ ] C1. Stand up Fabric **locally** using the `test-network` with **2 orgs (Org1 + Org2)** via Docker; deploy the chaincode there. *(Later: AWS Managed Blockchain with Nivix + the genuinely independent endorser — same gateway code, different connection profile.)*
- [ ] C2. **Endorsement policy:** a KYC write requires **both orgs** to endorse → no single org (incl. Nivix) can alter records alone.
- [ ] C3. **Harden the existing `nivix-kyc` chaincode** (`fabric-samples/test-network/chaincode-nivix-kyc/nivix-kyc.go`):
  - functions: `RecordKYC`, `GetKYCStatus`, `UpdateRiskScore`, `RecordComplianceEvent`, `QueryAudit`.
  - move PII into **private data collections** (`kycPrivateData`); keep only status/hash on the shared ledger.
- [ ] C4. Build the **Fabric gateway client** (`@hyperledger/fabric-gateway`) in the worker; enrolled identities stored in **Secrets Manager**, not files.
- [ ] C5. On KYC approval (from WS-B webhook) → **write to Fabric** (via worker, with retry) → then update the Postgres mirror.
- [ ] C6. **Remove the plaintext `kyc-data-store.json` fallback** entirely; if Fabric is unavailable → BullMQ retry queue (fail-safe), never plaintext.
- [ ] C7. (Optional, low-priority) anchor a periodic Fabric block hash to Solana for extra public verifiability.
- [ ] C8. `GET /api/v1/audit/verify` → checks Fabric record integrity.
- [ ] **Exit:** KYC results are written to a **2-org** Fabric ledger requiring dual endorsement; no plaintext fallback exists; status is mirrored to Postgres.

### WS-D — Data layer & mirror (supports B & C)
- [ ] D1. `kyc_records` table (Postgres mirror): vendor_ref, status, risk_score, verified_at, pii_encrypted, **fabric_tx_ref**.
- [ ] D2. `audit_log` table (Postgres mirror of Fabric events) for fast queries; Fabric remains source of truth.
- [ ] D3. Sync rule: every Fabric write is mirrored to Postgres in the same worker job; reconciliation job flags drift.
- [ ] **Exit:** Postgres answers all routine reads; Fabric is touched only for writes + audit.

### WS-E — Minimal frontend (auth + KYC only)
- [ ] E1. In `frontend/nivix-pay-old`, keep only: register/login + the KYC vendor SDK flow + a KYC-status screen.
- [ ] E2. Remove/park the payment/transfer/pool demo screens (return in Phase 2).
- [ ] **Exit:** a user can register, run KYC, and see their verified status from the UI.

---

## 5. Week-by-week timeline (6 weeks, 2 devs)

| Week | Focus | Milestone |
|---|---|---|
| **1** | WS-A (A1–A4) + KYC vendor decision + AWS accounts | Repo scaffold, CI green, **secrets purged & rotated** |
| **2** | WS-A (A5–A8) + WS-B (B1–B2) | Postgres/Redis live, vault wired, auth working |
| **3** | WS-B (B3–B6) | KYC vendor end-to-end in sandbox; PII encrypted |
| **4** | WS-C (C1–C2) + WS-D (D1) | Fabric **2-org** network running **locally** (test-network, Org1+Org2); chaincode deploys |
| **5** | WS-C (C3–C6) + WS-D (D2–D3) | KYC result recorded on Fabric (dual-endorsed) + mirrored; **plaintext fallback removed** |
| **6** | WS-C (C8) + WS-E + hardening + tests | Full flow demoable from UI (all local); Phase 1 exit review |

> Locally you run **Org1 + Org2 on your machine** — enough to build/test dual endorsement. The genuinely **independent endorser** (separate party/infra) is onboarded when you migrate to AWS Managed Blockchain; start that conversation now, but it does **not** block local Phase 1.

---

## 6. Definition of Done (Phase 1 exit criteria)
1. ✅ A new user can **register → complete KYC (vendor) → be recorded on a 2-org Fabric ledger → status readable from Postgres** — fully in sandbox.
2. ✅ KYC writes require **dual-org endorsement**; tampering by one org is rejected.
3. ✅ **No secrets in git**; all keys in the vault; leaked test keys rotated.
4. ✅ **No plaintext `kyc-data-store.json`** path remains.
5. ✅ CI green; unit + integration + one end-to-end KYC test passing.
6. ✅ PII encrypted at rest; document raw data held only by the vendor.

---

## 7. Testing
- **Unit:** auth, validation (Zod), encryption, chaincode functions.
- **Integration:** API ↔ Postgres; API ↔ KYC vendor sandbox webhook; API/worker ↔ Fabric gateway.
- **End-to-end:** register → KYC approve (vendor sandbox) → Fabric record exists (dual-endorsed) → `/kyc/status` returns approved.
- **Negative:** Fabric down → write queues + retries (no plaintext); bad webhook signature → rejected; single-org endorsement → rejected.

---

## 8. Risks specific to Phase 1
| Risk | Mitigation |
|---|---|
| **AWS account still under verification** | Build 100% locally (Docker); keep all hosting behind provider interfaces so the AWS swap is config-only |
| Independent endorser not ready | Not a blocker locally — use Org1+Org2 on Docker; onboard the independent endorser at AWS-migration time |
| Local→AWS migration surprises | Isolate hosting behind `SecretsProvider`/`Encryptor`/connection-strings/Fabric-profile from day 1; smoke-test the swap early on one service |
| Fabric cert expiry breaks network | Track expiries from day 1; document rotation |
| Secret purge breaks running POC | Do it on a branch; rotate keys; the POC is being replaced anyway |
| KYC vendor coverage gaps for the corridor | Confirm vendor covers sender+recipient countries before integrating |

---

## 9. Parallel (non-dev) tasks — start Week 0
- [ ] Confirm **IFSCA sandbox scope** with the lawyer (gates Phase 2 money movement).
- [ ] Sign the **independent endorser** (auditor / Bennett hatchery / partner) for `EndorserOrg`.
- [ ] **KYC vendor** commercial sign-off (pricing, data-residency, corridor coverage).
- [ ] Open **Circle (USDC)** sandbox account now (lead time) — used in Phase 2.

---

## 10. Hand-off to Phase 2 (preview)
With identity + compliance proven, **Phase 2 = money movement**: USDC settlement on Solana (E3), quotes/FX (E6), on-ramp (E4), off-ramp (E5) — each gated on the Phase 1 KYC status. See the PRD epics for detail.

---

*End of Phase 1 plan. Build order within the phase: WS-A → WS-B/WS-D → WS-C → WS-E.*
