# 📚 Nivix Documentation

All Nivix documentation lives in this folder. **Start with the three authoritative docs below** — everything else is reference, component-level, or historical.

> Last reorganized: 2026-06-25. Verified values: bridge service runs on **port 3002**; start/stop scripts are **`start-nivix.sh` / `stop-nivix.sh`** in the project root.

---

## ⭐ Start here — current & authoritative

| Doc | What it is |
|---|---|
| **[NIVIX_TECHNICAL_PRD.md](./NIVIX_TECHNICAL_PRD.md)** | The current build spec — architecture, data model, APIs, and the step-by-step epics E0→E12. **The source of truth for building.** |
| **[IFSC_LEGAL_AND_BUILD_PLAN.md](./IFSC_LEGAL_AND_BUILD_PLAN.md)** | The current legal pathway — GIFT City IFSC / IFSCA FinTech Sandbox, phased legal+dev roadmap. |
| **[PHASE_1_DEVELOPMENT_PLAN.md](./PHASE_1_DEVELOPMENT_PLAN.md)** | The detailed ~6-week build plan for Phase 1 (foundation + identity/KYC + multi-org Hyperledger). **Start building here.** |
| **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** | The canonical directory layout — new monorepo vs shared infra vs legacy POC, plus migration steps. |
| **[NIVIX_MASTER_DOCUMENTATION.md](./NIVIX_MASTER_DOCUMENTATION.md)** | Consolidated reference. ⚠️ Describes the older POC architecture (self-minted token, simulated treasury) — superseded by the PRD on architecture, but useful as a full reference. |

**Current architecture (per the PRD):** USDC settlement on Solana · Hyperledger Fabric (multi-org) as the compliance/audit ledger · KYC vendor for verification · licensed on/off-ramp partners · Postgres for operational data.

---

## 🛠️ Reference & operational

| Doc | Use for |
|---|---|
| [NIVIX_COMMANDS_GUIDE.md](./NIVIX_COMMANDS_GUIDE.md) | Day-to-day commands (start/test/troubleshoot) |
| [PRODUCTION_KEY_MANAGEMENT.md](./PRODUCTION_KEY_MANAGEMENT.md) | Key inventory, rotation, RBAC |
| [RAZORPAY_SETUP.md](./RAZORPAY_SETUP.md) | On-ramp (Razorpay) credential setup |
| [RAZORPAYX_PAYOUTS_INTEGRATION.md](./RAZORPAYX_PAYOUTS_INTEGRATION.md) | Off-ramp payout (RazorpayX) integration |
| [RAZORPAYX_TROUBLESHOOTING.md](./RAZORPAYX_TROUBLESHOOTING.md) | Debugging payout issues |
| [TEST_RAZORPAYX.md](./TEST_RAZORPAYX.md) | Running the payout integration test |

## 🧩 Component docs

| Doc | Component |
|---|---|
| [BRIDGE_SERVICE.md](./BRIDGE_SERVICE.md) | Node.js bridge service (KYC API) — *paths/port corrected* |
| [SOLANA_PROGRAM.md](./SOLANA_PROGRAM.md) | Solana / Anchor program |
| [FRONTEND_MODERNIZATION_GUIDE.md](./FRONTEND_MODERNIZATION_GUIDE.md) | Frontend styling / MUI→Tailwind migration |
| [ENHANCE_NIVIX_PAY_OLD_PLAN.md](./ENHANCE_NIVIX_PAY_OLD_PLAN.md) | Automated-transfer UI plan + component code |

## 📐 Specs & records

| Doc | Contains |
|---|---|
| [SYSTEM_SPECIFICATIONS.md](./SYSTEM_SPECIFICATIONS.md) | Backup/disaster-recovery strategy + frontend design system |
| [TECHNICAL_OVERVIEW.md](./TECHNICAL_OVERVIEW.md) | Candid as-built overview (flags known code inconsistencies) |
| [LEGAL_TECHNICAL_DOCUMENTATION.md](./LEGAL_TECHNICAL_DOCUMENTATION.md) | Corporate/registration facts + the older *domestic* India legal strategy (superseded by the IFSC plan) |

## 🗄️ Archive

[`archive/`](./archive/) — superseded historical docs (milestone reports, old treasury/deployment plans). Kept for the record; not the current design. See [archive/README.md](./archive/README.md).

---

## 🚀 Quick start (verified paths)

Run from the **project root** (`nivix-project/`):

```bash
# Start the whole stack (Fabric + bridge + frontend)
./start-nivix.sh

# Stop everything
./stop-nivix.sh

# Deploy/redeploy the KYC chaincode
./manual-deploy-chaincode.sh

# End-to-end test
./comprehensive-e2e-test.sh
```

**Services & directories:**
- Bridge service API → `http://localhost:3002`  (code in `bridge-service/`)
- Frontend → `http://localhost:3000`  (code in `frontend/nivix-pay-old/`)
- Hyperledger Fabric network → `fabric-samples/test-network/`
- Solana program → `solana/nivix_protocol/`
- Runtime data → `data/`  ·  helper scripts → `scripts/`

**Available scripts in the project root:**
`start-nivix.sh`, `stop-nivix.sh`, `comprehensive-e2e-test.sh`, `e2e-test-suite.sh`, `manual-deploy-chaincode.sh`, `setup-production-fabric.sh`, `production-config.sh`, `setup-server.sh`, `deploy-frontend-server.sh`

---

## ⚠️ Pending: secrets cleanup

Some reference docs (`NIVIX_COMMANDS_GUIDE.md`, `RAZORPAY_SETUP.md`, `TEST_RAZORPAYX.md`) and `NIVIX_MASTER_DOCUMENTATION.md` still contain **hardcoded test API keys / account numbers**. These must be scrubbed and the keys rotated as part of **PRD Epic E0** (purge secrets from git history + move to a vault). Until then, treat those values as compromised test credentials.
