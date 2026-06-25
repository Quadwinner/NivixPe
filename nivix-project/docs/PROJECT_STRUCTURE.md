# 🗂️ Project Structure

Canonical layout of `nivix-project/`. The repo is **mid-migration** from the proof-of-concept (POC) to the re-architected platform (see [`NIVIX_TECHNICAL_PRD.md`](./NIVIX_TECHNICAL_PRD.md)). Until migration completes, NEW and LEGACY code coexist — this map keeps it unambiguous.

---

## ✅ New platform — the monorepo we are building

```
nivix-project/
├── apps/
│   ├── api/        REST API (Express + TypeScript, Prisma)      → @nivix/api
│   ├── worker/     Async jobs (BullMQ): Fabric writes, retries  → @nivix/worker
│   └── web/        Frontend (migrated from frontend/nivix-pay-old) → @nivix/web
├── packages/
│   └── shared/     Shared types & Zod schemas                   → @nivix/shared
├── docs/           All documentation (single source)
│   └── deployment/ AWS / EC2 / subnet / chaincode deploy guides
├── package.json    npm workspaces root
├── package-lock.json
├── tsconfig.base.json
├── docker-compose.yml   Local Postgres + Redis
├── .env / .env.example  Local config (.env gitignored)
└── README.md       Local-dev quick-start
```

## 🔗 Shared infrastructure (used by new + legacy)

```
├── fabric-samples/ Hyperledger Fabric network + the nivix-kyc chaincode (compliance ledger)
├── solana/         Solana / Anchor program (settlement; self-mint program to be reduced)
└── data/           Runtime data — treasury config/keypairs (secrets gitignored)
```

## 🕗 Legacy POC (being migrated — do not extend)

```
├── bridge-service/ Old Node POC (port 3002). Logic ports into apps/api, then retired.
└── legacy/         Parked orphan POC files (e.g. automated-transfer-server.js)
```

> `apps/web` is **not yet an npm workspace** (excluded from the root `workspaces` list). It runs standalone via its own `node_modules`/`react-app-rewired`. It joins the workspace in **WS-E** with proper config, to avoid CRA dependency-hoisting clashes. It also still carries some POC clutter (`a_close.txt`, `close.txt`, `HOMEPAGE_IMPROVEMENTS_SUMMARY.md`, `logs/`) to tidy during WS-E.

## 🌐 Outer repo root (`blockchain solana/` — the git repo containing this project)

The git repo root is one level above `nivix-project/`. After cleanup it holds:
- `reports/` — **academic internship report** (PDF/DOCX/XLSX + conversion scripts). Self-contained deliverable; **left in place** (its scripts use internal relative paths). Consolidate only deliberately.
- ⚠️ `nivixpemain.pem` — **a private key committed at the repo root.** Should be **gitignored, purged from history, and rotated** (see PRD E0 secrets task). Not deleted automatically (you may need it).
- `kyc-data-store.json`, `node_modules/`, `package.json`, `test-ledger/`, `public-key/`, diagram PNGs — outer-root artifacts; review during the AWS-migration cleanup.

## ⚙️ Operational scripts (kept at root — coupled to the legacy layout)

`start-nivix.sh`, `stop-nivix.sh`, `manual-deploy-chaincode.sh`, `comprehensive-e2e-test.sh`, `e2e-test-suite.sh`, `setup-production-fabric.sh`, `setup-server.sh`, `deploy-frontend-server.sh`, `production-config.sh`

> ⚠️ These compute `PROJECT_ROOT` relative to themselves and `cd` into `bridge-service/` and `fabric-samples/`. They **must be updated before relocating**, or the POC orchestration breaks. Left at root intentionally.

---

## 🧭 Planned migration steps (deliberate — update references as you go)

1. **Port `bridge-service` logic** (KYC, Razorpay) into `apps/api` (WS-B / WS-C), then retire `bridge-service/`.
2. ✅ **Done:** `frontend/nivix-pay-old` → `apps/web`; `deploy-frontend-server.sh` `FRONTEND_DIR` updated; package renamed `@nivix/web`. (Workspace integration + clutter tidy in WS-E.)
3. **Consolidate root operational scripts into `scripts/`** after updating their `PROJECT_ROOT` logic.
4. **Reduce the Solana self-mint program** to transfer/memo only (per PRD).
5. **Resolve the `nivixpemain.pem` key** (gitignore + purge + rotate) during E0 secrets cleanup.

## 🧹 Cleanup log — 2026-06-25
- Removed stray logs (`automated-transfer.log`, `startup.log`, outer-root `bridge.log`) and the empty root `kyc-data-store.json`.
- Parked the orphaned `automated-transfer-server.js` into `legacy/`.
- Migrated `frontend/nivix-pay-old` → `apps/web`.
- Consolidated outer-root deployment guides (AWS / EC2 / subnet / chaincode) into `docs/deployment/`, and `DOCUMENTATION_SUMMARY.md` into `docs/`.
- Consolidated all documentation into `docs/` (see [`docs/README.md`](./README.md)).

> Left in place for now (possibly read by legacy code/scripts; move during migration): `WALLETS_REGISTRY.json`, `production-environment-template.env`, and the outer-root `reports/` academic folder.
