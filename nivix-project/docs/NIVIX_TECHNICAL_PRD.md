# 📘 NIVIX — Technical Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2026-06-25
**Owner:** NivixPe Private Limited (Bennett University Hatchery)
**Companion doc:** `IFSC_LEGAL_AND_BUILD_PLAN.md` (legal pathway — read first)
**Status:** Build specification for the re-architected, IFSCA-aligned platform

> This PRD keeps the **dual-blockchain** design (a funded, contractual milestone) and fixes the parts that were unbacked/simulated. The agreed model:
> **USDC settlement on Solana (public, verifiable reserves) · Hyperledger Fabric as the multi-org compliance & audit ledger (KYC, risk, immutable trail) · licensed on/off-ramp partners · Postgres for operational data · KYC vendor for identity verification.**
>
> **Note:** Hyperledger Fabric is RETAINED (core pitch pillar + binding deliverable). What changes vs. the old POC: the self-minted token → **USDC**, the simulated treasury → **real reserves + proof of reserves**, single-org Fabric → **genuinely multi-org**, and the plaintext `kyc-data-store.json` fallback → **removed**.
>
> ## 🔒 LOCKED DECISION (2026-06-25)
> **Hyperledger Fabric is final and non-negotiable.** It is committed in the investor pitch, a binding funding milestone, **and the report submitted to IFSCA**. Fabric stays as the compliance/audit ledger. Do not propose removing it. The only open work on Fabric is making it genuinely **multi-org** and production-hosted.

---

## 1. Overview

### 1.1 Product
Nivix is a **cross-border payment platform** operating from **GIFT City IFSC** under **IFSCA**, settling value in **USDC on Solana** while customers send and receive **local fiat** via **licensed partners**.

### 1.2 Problem
Traditional remittance is slow (3–5 days) and expensive (5–10%). Stablecoin settlement makes it minutes-fast and <1% — but it must be done **legally** (IFSCA sandbox) and **safely** (verifiable reserves, tamper-proof records).

### 1.3 Core principle (memorize this)
> **Nivix orchestrates and records. Licensed partners hold fiat and bear money-transmitter risk. Settlement happens in public USDC so reserves are verifiable. Compliance records and the audit trail are tamper-evident on a multi-org Hyperledger Fabric ledger.**

### 1.4 Goals
- G1: Move money across a corridor end-to-end: fiat-in → USDC settle → fiat-out.
- G2: Full KYC/AML, sanctions, audit trail — sandbox-compliant.
- G3: Provably-backed (proof of reserves) and tamper-evident records.
- G4: Clean, observable, production-grade codebase (no mocks/simulations).

### 1.5 Non-goals (explicitly out of scope for v1)
- ❌ No self-issued/self-minted token (settle in USDC instead).
- ❌ No custom AMM / liquidity pools (FX is via partners).
- ❌ No **single-org** Hyperledger (Fabric is kept, but must be genuinely multi-org to be meaningful — see §4.3).
- ❌ No mainland-India retail INR direct flow without a licensed partner.
- ❌ No holding of customer fiat by Nivix directly.

---

## 2. Users & personas

| Persona | Description | v1 priority |
|---|---|---|
| **Business sender (KYB)** | A company paying a supplier/contractor abroad | ⭐ Launch persona (easiest legally) |
| **Recipient** | Business/individual receiving local fiat abroad | ⭐ |
| **Compliance officer (internal)** | Reviews KYC, sanctions hits, STRs | ✅ |
| **Ops/admin (internal)** | Monitors orders, reserves, reconciliation | ✅ |
| NRI / retail sender | Individual remittance | Phase 3 (needs more partners) |

---

## 3. Scope — functional requirements

### 3.1 Epics (what we build)
- **F1 Identity & KYC** — register, verify identity via vendor, store minimized PII encrypted.
- **F2 Quote & FX** — get a locked quote (rate + fees + ETA) before sending.
- **F3 On-ramp** — collect local fiat via licensed partner; receive USDC into Nivix custody.
- **F4 Settlement** — move USDC on Solana, recorded in the ledger.
- **F5 Off-ramp** — licensed partner converts USDC → local fiat → recipient bank.
- **F6 Ledger & audit** — double-entry order ledger + hash-chained audit log anchored to Solana.
- **F7 Compliance** — sanctions screening, transaction limits, Travel Rule, STR/FIU export.
- **F8 Reserves** — proof-of-reserves (USDC held vs. liabilities owed).
- **F9 Admin & ops** — real dashboards (replace the empty mock methods).
- **F10 Customer app** — React frontend for the sender/recipient flows.

### 3.2 Primary user story (the happy path)
```
As a business sender, I want to pay my supplier abroad, so that:
1. I complete KYB once (F1).
2. I get a quote: "Send 100,000 INR → supplier receives X USD, fee Y, ETA 10 min" (F2).
3. I pay via the on-ramp partner; Nivix receives equivalent USDC (F3).
4. Nivix settles USDC on Solana and records it (F4, F6).
5. The off-ramp partner pays the supplier's bank in local currency (F5).
6. Every step is screened, logged immutably, and reconciled (F6, F7).
```

---

## 4. System architecture

### 4.1 High-level
```
┌─────────────┐    HTTPS    ┌──────────────────────────────────────┐
│  React App  │ ──────────► │            Nivix API (Node)           │
│ (sender/    │             │  Auth · Orders · Quotes · Webhooks     │
│  recipient) │ ◄────────── │  Compliance · Ledger · Admin           │
└─────────────┘             └───────────┬───────────────┬───────────┘
                                        │               │
              ┌─────────────────────────┼───────────────┼─────────────────────┐
              ▼                         ▼               ▼                     ▼
      ┌───────────────┐        ┌────────────────┐ ┌───────────────┐  ┌────────────────┐
      │ KYC/AML vendor│        │ On-ramp partner│ │ Solana (USDC) │  │ Off-ramp partner│
      │ (Sumsub/      │        │ (FIU-VDASP/AD) │ │  mainnet      │  │ (dest country) │
      │  HyperVerge)  │        └────────────────┘ └───────────────┘  └────────────────┘
              │                         │               │                     │
              └─────────────┬───────────┴───────────────┴─────────────────────┘
                            ▼
   ┌──────────────────────────────┐  ┌──────────────────────────┐  ┌─────────────────────┐
   │ Hyperledger Fabric (MULTI-ORG)│  │ Postgres (operational)   │  │ Redis: queues, cache│
   │ COMPLIANCE & AUDIT LEDGER:    │  │ users, orders, txns,     │  │ idempotency, limits │
   │ KYC status, risk, sanctions   │  │ ledger, quotes, mirror   │  └─────────────────────┘
   │ decisions, immutable trail.   │◄─┤ of Fabric for fast reads │
   │ PII → private data collections│  │ (Fabric = source of truth│
   │ Orgs: Nivix + auditor/partner │  │  for compliance/audit)   │
   └──────────────────────────────┘  └──────────────────────────┘
```

### 4.2 Services (modular monolith first, split later)
- **api** — REST API (Express/TS).
- **worker** — async jobs (webhook processing, settlement, reconciliation, reporting, Fabric writes). Backed by Redis/BullMQ.
- **db** — Postgres (operational data + fast-query mirror of Fabric).
- **chain** — Solana client (USDC transfers + reserve proofs).
- **fabric** — Hyperledger Fabric gateway client (compliance/audit chaincode).

> Start as a **modular monolith** (one repo, clear modules). Split into microservices only if scale demands it.

### 4.3 Hyperledger Fabric — role & the multi-org requirement
Fabric is the **compliance and audit ledger** (it is a funded, contractual deliverable and a core pitch pillar). Its jobs:
- Immutable record of **KYC status, risk scores, sanctions decisions, approvals, and every order's compliance outcome**.
- **PII stays in Fabric private data collections** (or off-chain with only hashes on-chain) — never plaintext.
- It is the **tamper-proof audit trail** for regulators/auditors/investors.

**Critical:** to deliver real value (and the fraud-safety the team cares about), Fabric must be **genuinely multi-organization** — at least one *independent* endorsing org (auditor, university/hatchery, or a partner/bank) besides Nivix. A single-org Fabric controlled only by Nivix is not tamper-proof against Nivix and is the thing to avoid.
- **Sandbox phase:** ≥2 orgs with ≥1 independent endorser; remove the old plaintext `kyc-data-store.json` fallback entirely.
- **Scale phase:** onboard bank/auditor/regulator nodes; tighten endorsement policy.
- **Optional extra:** periodically anchor a Fabric block hash to Solana for public verifiability.

---

## 5. Data model (Postgres)

> All PII columns encrypted at rest (app-level envelope encryption + KMS). Store **document hashes/tokens**, not raw documents (vendor holds those).
> **Source-of-truth split:** **Hyperledger Fabric** is the system of record for *compliance state* (KYC status, risk, sanctions decisions) and the *immutable audit trail*. **Postgres** holds operational data and a **fast-query mirror** of the Fabric compliance state. PII lives in Fabric **private data collections** (or off-chain with on-chain hashes), never plaintext.

```sql
-- 5.1 users
users(
  id              uuid pk,
  type            enum('individual','business'),
  email           text unique,
  phone           text,
  country         char(2),
  status          enum('pending','active','suspended','closed'),
  created_at      timestamptz, updated_at timestamptz
)

-- 5.2 kyc_records  (verification handled by vendor; we store result + minimized data)
kyc_records(
  id              uuid pk,
  user_id         uuid fk->users,
  vendor          text,                 -- 'sumsub' | 'hyperverge'
  vendor_ref      text,                 -- vendor applicant id
  status          enum('not_started','pending','approved','rejected','review'),
  risk_score      int,                  -- 0-100
  level           text,                 -- KYB/KYC tier
  pii_encrypted   bytea,                -- encrypted blob, minimized
  verified_at     timestamptz,
  expires_at      timestamptz,
  created_at      timestamptz
)

-- 5.3 wallets  (Nivix-custodied settlement addresses; partner payout refs)
wallets(
  id uuid pk, user_id uuid fk, chain text default 'solana',
  address text, custody enum('platform','partner','external'),
  created_at timestamptz
)

-- 5.4 quotes
quotes(
  id uuid pk, user_id uuid fk,
  src_currency text, src_amount numeric, dst_currency text, dst_amount numeric,
  fx_rate numeric, fee_total numeric, corridor text, fx_source text,
  expires_at timestamptz, created_at timestamptz
)

-- 5.5 orders  (one customer payment, spanning 3 legs)
orders(
  id uuid pk, user_id uuid fk, quote_id uuid fk,
  type enum('transfer'),                -- v1: cross-border transfer
  corridor text,                         -- e.g. 'IN->US'
  src_currency text, src_amount numeric,
  dst_currency text, dst_amount numeric,
  fee_total numeric,
  status enum('created','funding','funded','settling','settled',
              'paying_out','completed','failed','refunded','on_hold'),
  recipient_json jsonb,                  -- recipient bank/payout details (encrypted)
  created_at timestamptz, updated_at timestamptz
)

-- 5.6 transactions  (each LEG of an order)
transactions(
  id uuid pk, order_id uuid fk,
  leg enum('fiat_in','settlement','fiat_out'),
  provider text,                         -- partner or 'solana'
  provider_ref text,                     -- partner txn id
  onchain_sig text,                      -- Solana signature (settlement leg)
  amount numeric, currency text,
  status enum('pending','confirmed','failed'),
  created_at timestamptz, confirmed_at timestamptz
)

-- 5.7 ledger_entries  (double-entry; the source of truth for balances)
ledger_entries(
  id uuid pk, order_id uuid fk, account text,  -- e.g. 'customer_liability','usdc_reserve','fees'
  direction enum('debit','credit'), amount numeric, currency text,
  created_at timestamptz
)

-- 5.8 audit_log  (Postgres MIRROR for fast queries; Hyperledger Fabric is the immutable source of truth)
--      Kept append-only + hash-chained as a local integrity check; the authoritative record is on Fabric.
audit_log(
  seq             bigserial pk,          -- strictly increasing
  actor           text,                  -- user/admin/system
  action          text,                  -- 'kyc.approved','order.settled',...
  entity          text, entity_id text,
  data_json       jsonb,
  prev_hash       char(64),              -- sha256 of previous row's row_hash
  row_hash        char(64),              -- sha256(seq|actor|action|entity|entity_id|data_json|prev_hash)
  anchor_id       uuid null fk->anchors, -- set when batch anchored to Solana
  created_at      timestamptz
)
-- Enforce append-only via DB role: no UPDATE/DELETE grants on audit_log.

-- 5.9 anchors  (periodic Solana anchoring of audit_log head)
anchors(
  id uuid pk, from_seq bigint, to_seq bigint,
  merkle_root char(64), onchain_sig text, created_at timestamptz
)

-- 5.10 partners  (on/off-ramp + FX providers, per corridor)
partners(
  id uuid pk, name text, kind enum('onramp','offramp','fx'),
  corridor text, config jsonb, status enum('active','disabled')
)

-- 5.11 compliance_events
compliance_events(
  id uuid pk, order_id uuid null, user_id uuid null,
  kind enum('sanctions_hit','limit_breach','travel_rule','str_flag','manual_review'),
  severity enum('info','warn','block'),
  detail_json jsonb, resolved bool default false, created_at timestamptz
)

-- 5.12 reserve_snapshots  (proof of reserves)
reserve_snapshots(
  id uuid pk, usdc_held numeric, liabilities numeric,
  onchain_proof_sig text, created_at timestamptz
)
```

---

## 6. API specification (REST, JSON, `/api/v1`)

> Auth: JWT (customer) + API keys (partners) + role-gated admin. All money-moving endpoints require an **idempotency key** header.

### 6.1 Identity & KYC
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | JWT issue |
| POST | `/kyc/initiate` | Create vendor session → returns vendor SDK token |
| POST | `/webhooks/kyc` | Vendor callback → update `kyc_records` |
| GET | `/kyc/status` | Current KYC status/risk |

### 6.2 Quote & order
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/quotes` | `{src_currency, src_amount, dst_currency, corridor}` → locked quote |
| POST | `/orders` | Create order from a quote + recipient details |
| GET | `/orders/:id` | Order status (all legs) |
| GET | `/orders` | List user's orders |

### 6.3 On-ramp / off-ramp / webhooks
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/orders/:id/fund` | Get on-ramp partner payment instructions/intent |
| POST | `/webhooks/onramp/:partner` | Partner confirms fiat received → trigger settlement |
| POST | `/webhooks/offramp/:partner` | Partner confirms payout status |

### 6.4 Transparency & admin
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/proof-of-reserves` | Public: USDC held vs liabilities + on-chain proof |
| GET | `/audit/verify` | Verify hash-chain integrity (+ latest anchor) |
| GET | `/admin/orders` | Ops: all orders, filters |
| GET | `/admin/compliance` | Compliance queue |
| GET | `/admin/reserves` | Reserve dashboard |

### 6.5 Example — create quote
```http
POST /api/v1/quotes
{ "src_currency":"INR", "src_amount":100000, "dst_currency":"USD", "corridor":"IN->US" }

200 OK
{ "quote_id":"...", "src_amount":100000, "dst_amount":1180.50,
  "fx_rate":0.01185, "fee_total":250, "eta_minutes":10, "expires_at":"..." }
```

---

## 7. Component build steps (each module, in order)

> Conventions: TypeScript, Express, Prisma/Knex for DB, BullMQ on Redis for jobs, Zod for validation, Vitest/Jest for tests. Every external call goes through an **interface** so partners are swappable.

### EPIC E0 — Foundation & cleanup (do first)
1. Create a clean monorepo: `apps/api`, `apps/worker`, `apps/web`, `packages/shared`.
2. **Purge secrets from git history** (`bridge-service/.env`, `.env.backup`); rotate all keys; add secret-scanning to CI.
3. Set up **config**: env-driven, `SOLANA_CLUSTER` (devnet for sandbox tests / mainnet later), no hardcoded URLs.
4. Provision **Postgres** + **Redis** (managed). Add migrations tool.
5. CI/CD: lint, typecheck, test, build on every PR.
6. Add **secrets vault** (AWS Secrets Manager / Doppler); app reads secrets from vault, never files.
7. Tag the old code `v0-poc-devnet`; archive the **self-mint Solana program** out of the build path. **Keep `fabric-samples/`** — it gets upgraded to multi-org in E2 (do NOT archive it).
   **Exit:** clean repo, CI green, DB/Redis reachable, no secrets in git.

### EPIC E1 — Identity & KYC
1. Build `users` + `auth` (register/login, JWT, roles).
2. Choose KYC vendor (Sumsub or HyperVerge); create sandbox account.
3. `POST /kyc/initiate` → create vendor applicant → return SDK token.
4. `POST /webhooks/kyc` → verify signature → write `kyc_records` (status, risk_score), encrypt minimized PII.
5. `GET /kyc/status`. Gate all money endpoints on `kyc.status='approved'`.
6. Implement **envelope encryption** (KMS data keys) for PII columns.
   **Exit:** a user can complete KYC end-to-end in the vendor sandbox; PII encrypted; non-KYC users blocked.

### EPIC E2 — Compliance & audit ledger (Hyperledger Fabric, MULTI-ORG)
1. Stand up Fabric as **multi-org** — Nivix + ≥1 *independent* endorser (auditor / university-hatchery / partner). Define an endorsement policy that requires the independent org. **Harden the existing `nivix-kyc` chaincode; do NOT run single-org.**
2. Chaincode functions record **KYC status, risk score, sanctions decision, order compliance outcome, approvals**; PII goes in **private data collections** (or off-chain with only hashes on-chain).
3. Build the **fabric gateway client** in api/worker; write a compliance/audit record to Fabric inside every KYC and order state change.
4. Implement **double-entry `ledger_entries`** in Postgres for money balances (operational), plus a **Postgres mirror** of Fabric compliance state for fast reads.
5. **Remove the plaintext `kyc-data-store.json` fallback.** If Fabric is unavailable → queue + retry (fail-safe), never write plaintext.
6. (Optional) **Anchor a Fabric block hash to Solana** periodically for extra public verifiability.
7. `GET /audit/verify` checks Fabric record integrity (+ optional Solana anchor).
   **Exit:** compliance/audit records live on a **multi-org** Fabric ledger; no single org (including Nivix) can silently alter them; no plaintext fallback exists.

### EPIC E3 — Wallet & USDC settlement
1. Solana client wired to **USDC mint** (devnet USDC for sandbox; mainnet later).
2. Create/derive **platform custody wallet(s)**; on mainnet → **multisig + HSM**.
3. Get-or-create **ATA** for USDC; balance reads.
4. **Transfer + memo** for settlement leg; record `onchain_sig` in `transactions`.
5. Confirmation tracking (poll/subscribe) → mark `settlement` confirmed.
6. Remove the old self-mint Anchor program from the path; if a custom program is kept, reduce it to **transfer/memo/escrow only** (no minting).
   **Exit:** a USDC transfer settles on devnet and is recorded + confirmed.

### EPIC E4 — On-ramp (licensed partner)
1. Define `OnRampProvider` interface: `createIntent()`, `parseWebhook()`, `status()`.
2. Implement the first partner adapter (India FIU-registered VDASP/AD — **[VERIFY-LAWYER]**).
3. `POST /orders/:id/fund` → create partner intent → return instructions.
4. `POST /webhooks/onramp/:partner` → verify → mark order `funded` → enqueue settlement.
5. **Reconciliation job:** match partner reports to `transactions`; flag mismatches.
   **Exit:** simulated/sandbox fiat-in marks an order funded and auto-triggers settlement.

### EPIC E5 — Off-ramp (licensed partner)
1. Define `OffRampProvider` interface: `createPayout()`, `parseWebhook()`, `status()`.
2. Implement destination-country partner adapter.
3. After settlement → worker calls `createPayout()` with recipient bank details.
4. `POST /webhooks/offramp/:partner` → update payout status → order `completed`.
5. Failure/refund path: if payout fails → `refunded` flow + audit.
   **Exit:** end-to-end order reaches `completed` in sandbox.

### EPIC E6 — Quote & FX engine
1. `FxProvider` interface; integrate a real rate source (partner or market feed).
2. **Fee engine:** platform fee + partner fees + spread → transparent breakdown.
3. `POST /quotes` returns a locked, expiring quote stored in `quotes`.
4. Orders must reference a non-expired quote.
   **Exit:** quotes are real, time-bounded, and drive order amounts.

### EPIC E7 — Compliance
1. **Sanctions screening** (real lists: OFAC/UN/EU) on user + recipient — remove the test-pattern code.
2. **Transaction limits** per KYC tier/corridor; breach → `compliance_events` block.
3. **Travel Rule** data capture for the settlement leg above thresholds.
4. **STR/FIU export** (report generation) + 5-year retention.
5. Compliance review queue + manual `on_hold`/release.
   **Exit:** orders are screened, limited, and reportable; blocks are enforced (not advisory).

### EPIC E8 — Treasury & proof of reserves
1. Replace the simulated treasury with a **real USDC balance reader** + the `ledger_entries` liabilities.
2. **`reserve_snapshots` job:** record USDC held vs liabilities + on-chain proof.
3. `GET /proof-of-reserves` (public): show backing ratio + Solana proof link.
4. Low-reserve alerting.
   **Exit:** reserves are real and publicly verifiable; no JSON-file treasury.

### EPIC E9 — Customer frontend
1. Reuse the React app; remove demo/simulated screens.
2. Flows: register → KYC (vendor SDK) → quote → pay (on-ramp) → track order → done.
3. Order status timeline (3 legs), receipts, history.
   **Exit:** a user completes the full flow from the UI in sandbox.

### EPIC E10 — Admin & ops
1. Replace the empty mock dashboard methods with **real queries**.
2. Order monitoring, compliance queue, reserve dashboard, reconciliation status.
   **Exit:** ops can see real data and act on exceptions.

### EPIC E11 — Observability, security, testing
1. Structured logging, metrics, alerting; request tracing.
2. Unit + integration + **end-to-end** tests across the full corridor.
3. Load test; **external security audit** (app + any on-chain program) before non-sandbox.
   **Exit:** test suite green; audit findings resolved.

### EPIC E12 — Sandbox deploy & go-live
1. Deploy to a hardened environment (TLS, WAF, least-privilege).
2. Switch settlement to **mainnet USDC** when sandbox terms allow.
3. Run the **limited live pilot** within IFSCA sandbox caps; file reports.
   **Exit:** pilot running within sandbox limits; evidence collected for full licence.

---

## 8. Sprint plan (2-week sprints, small team)

| Sprint | Epics | Deliverable |
|---|---|---|
| S1 | E0 | Clean repo, CI, DB/Redis, secrets purged |
| S2 | E1 | KYC end-to-end (vendor sandbox), auth |
| S3 | E2 | Multi-org Fabric compliance/audit ledger + Postgres double-entry ledger |
| S4 | E3 | USDC settlement on devnet |
| S5 | E6 | Quote + FX + fee engine |
| S6 | E4 | On-ramp partner integration |
| S7 | E5 | Off-ramp partner integration → full happy path |
| S8 | E7 | Compliance (sanctions/limits/Travel Rule/STR) |
| S9 | E8 + E10 | Proof of reserves + real admin dashboards |
| S10 | E9 | Customer frontend flow complete |
| S11 | E11 | Tests, observability, security audit |
| S12 | E12 | Sandbox deploy + pilot |

> ~6 months to a sandbox pilot with a focused team. Adjust to capacity.

---

## 9. Non-functional requirements
- **Security:** secrets in vault; PII encrypted; multisig+HSM for mainnet keys; RBAC; rate limiting; idempotency on money endpoints.
- **Reliability:** idempotent webhooks; retries with backoff; reconciliation jobs; no silent failures (the current `return 0 on error` pattern is banned).
- **Auditability:** every state change writes an audit row in the same DB transaction.
- **Compliance:** sandbox caps enforced in code; 5-year retention; exportable reports.
- **Performance:** quote < 500ms; settlement confirm tracked async; API p95 < 300ms.

## 10. Success metrics
| Metric | Target |
|---|---|
| End-to-end transfer time | < 15 min |
| Settlement verifiable on-chain | 100% |
| Reserve backing ratio | ≥ 100% |
| Audit chain integrity | 100% (verifiable) |
| Critical security findings at audit | 0 |
| Simulated/mock code paths in prod | 0 |

## 11. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Partner not available for corridor | Provider interface = swappable; line up ≥2 per corridor |
| Sandbox scope misread | `[VERIFY-LAWYER]`; start B2B; lawyer sign-off pre-build |
| Key compromise | Vault + multisig + HSM; least privilege |
| Reconciliation drift | Daily jobs + alerting; ledger is source of truth |
| Scope creep | v1 = one corridor, one persona, happy path + refunds only |

## 12. Open questions (resolve in Phase 0)
1. **[VERIFY-LAWYER]** Exact sandbox scope: corridor, customer cap, value cap, duration.
2. Which on-ramp (India) and off-ramp (destination) partners are licensed + integratable?
3. KYC vendor final choice (Sumsub vs HyperVerge) — pricing + coverage.
4. Hosting/region (must align with IFSC/data rules).
5. Custody model for the mainnet USDC wallet (multisig provider/HSM).

---

## 13. What maps from the OLD codebase
| Old | New |
|---|---|
| `solana/.../lib.rs` self-mint + fixed-rate swap | USDC settlement; program (if any) = transfer/memo/escrow only |
| `bridge-service/src/treasury/treasury-manager.js` | Real USDC reader + `ledger_entries` + `reserve_snapshots` |
| `anchor-liquidity-client.js` (mock IDL) | Deleted (FX via partners) |
| `fabric-samples/` + `nivix-kyc.go` (single-org) | **KEPT & UPGRADED** → genuinely multi-org Fabric compliance/audit ledger + private data collections; hardened chaincode |
| `kyc-data-store.json` (plaintext fallback) | **Deleted** → Fabric is source of truth; Postgres mirror for fast reads; KYC vendor does verification |
| `index.js` `(simulated)` endpoints | Real endpoints per §6 |
| `bridge-service/.env` committed | Vault; purged from git |

---

*End of PRD v1.0. Build order = E0 → E12. Resolve all `[VERIFY-LAWYER]` items in Phase 0 before writing money-moving code.*
