# NIVIX — Master Build Plan (End to End)

**Version:** 1.0
**Date:** 2026-08-09
**Status:** Authoritative build plan. Supersedes the engineering scope in `PHASE_1_DEVELOPMENT_PLAN.md` and `M2_USDC_SETTLEMENT_PLAN.md`.
**Companion docs:** `IFSCA_SANDBOX_READINESS_PLAN.md` (regulatory detail) · `NIVIX_LEGAL_ARCHITECTURE_BLUEPRINT.md` (legal reasoning)

---

## 0. What this document is

The single end-to-end plan for building Nivix into a system that can enter IFSCA sandbox testing and operate real cross-border transfers. It covers the legal track and the engineering track together, because each one gates the other.

Everything here is grounded in primary sources read during research: the IFSCA FinTech Sandbox Framework (16 March 2026), Bridge's live API documentation, and a full read of the existing codebase. Clause numbers, file paths, and line numbers are cited so any claim can be checked.

**Three things to know before reading further:**

1. An earlier statement in `NIVIX_INVESTOR_TECHNICAL_BRIEF.pdf` — that the IFSCA sandbox "permits a stablecoin-settled pilot" — is **not supported by the framework text**. See §2.1. This needs correcting before the brief is shared further.
2. **No single payment partner covers India↔USA.** This is permanent market structure, not a gap to close. See §2.2.
3. **IFSCA clause 28(i) bars the sandbox entity from transacting in INR.** This changes which corridor direction goes first. See §2.3.

---

## 1. Current reality (verified, not assumed)

### 1.1 What exists and works

| Component | State |
|---|---|
| `apps/api` — Express + TS + Prisma | 7 endpoints, all identity/KYC. Register, login, JWT, `/auth/me`, `/kyc/initiate`, `/kyc/status`, `/webhooks/kyc` |
| `apps/worker` — BullMQ | One job type (`store-kyc`). Fabric gateway client is correct and working |
| Hyperledger Fabric | 2-org test-network running locally; `StoreKYC` chaincode write verified end to end |
| `apps/web` — React | Transfer wizard restored and working against the legacy service |
| `bridge-service` (legacy) | Working prototype: INR collection → self-minted token → burn → INR payout via Cashfree |

### 1.2 What does not exist

- **No money-movement schema at all.** Prisma has only `User`, `KycRecord`, `AuditLog`. There is **no `Decimal` column anywhere** — nothing in the database can currently hold a monetary amount.
- No quotes, transfers, orders, ledger, recipients, balances, FX rates, or webhook-event tables.
- **Zero tests.** `npm test` runs vitest against zero specs and exits green — a signal that verifies nothing.
- No CORS, helmet, rate limiting, or error-handling middleware.

### 1.3 Security holes (each verified by direct file read)

| Issue | Location | Consequence |
|---|---|---|
| `verifyWebhook()` returns `true` unconditionally | `apps/api/src/kyc/provider.ts:37-40` | **Anyone who can reach the port can approve any user's KYC** and trigger a Fabric write |
| HMAC computed over `JSON.stringify(req.body)`, not raw bytes | `apps/api/src/routes/kyc.ts:34` | Real vendor signatures can never verify, even once the above is fixed |
| Attacker-controlled identity fallback `req.body.userId` | `apps/api/src/routes/kyc.ts:39` | Identity resolution can be forced by the caller |
| `JWT_SECRET` has a dev fallback, so the required-check is dead code | `apps/api/src/config.ts:21` | Production can boot on a publicly-known signing key → full auth bypass |
| No async error handling; zero `try/catch` in any route | `apps/api/src/routes/*` | Express 4 doesn't catch rejections; a DB blip hangs the request or kills the process |
| `requireRole` / `requireApprovedKyc` written but never mounted | `apps/api/src/middleware/auth.ts:20,30` | Dead security middleware reads as protection while providing none |
| `User.status` never checked in `requireAuth` | `apps/api/src/middleware/auth.ts:6` | A suspended user passes every guard |

### 1.4 🚨 Committed secrets — act independently of this plan

`git ls-files` confirms these are **tracked in git**:

```
nivix-project/data/treasury-keypair.json          ← Solana treasury PRIVATE KEY
nivix-project/bridge-service/.env.production      ← live-shaped payment credentials
nivix-project/bridge-service/.env.staging
nivix-project/bridge-service/.env.backup
nivix-project/WALLETS_REGISTRY.json               ← wallet keys
nivix-project/bridge-service/WALLETS_REGISTRY.json
nivixpemain.pem                                    ← SSH private key
```

Treat all as **compromised**. Anyone who has ever had repo access can recover them from history. Rotate every key, then purge with `git filter-repo`/BFG. A regulator-facing application cannot coexist with a leaked treasury key.

### 1.5 Legacy bugs that must be structurally impossible in the rebuild

These are not style problems. Each one is a money-loss mechanism.

| Bug | Location | Impact |
|---|---|---|
| FX service silently falls back to a stale table, ultimately **returning `1.0`** for an unknown pair | `bridge-service/src/stablecoin/exchange-rate-service.js:382` | ~83× mispay on INR→USD |
| Signature mismatch **bypassed** when the key contains `"test"` | `bridge-service/src/onramp/onramp-engine.js:271-287` | Forged payment confirmations |
| Webhooks processed with **no verification at all** | `bridge-service/src/index.js:1745-1760, 2031-2047` | Same |
| `getAccountBalance` returns a fake **`999999999`** on 404 | `bridge-service/src/payments/razorpayx-payouts.js:362-373` | Defeats the insufficient-funds check entirely |
| Blind retry across **three different endpoints** on a money-moving call, no idempotency key | `bridge-service/src/payments/razorpayx-payouts.js:270-298` | Double payouts |
| All state in JSON files / in-memory `Map`s | throughout | Lost on restart |
| Full bank details and credentials logged | `fiat-payout-service.js:208,567,954,986` | PII/credential leak |

### 1.6 Patterns worth keeping from the legacy code

Genuinely good ideas, to be reimplemented properly:

- Provider registry with `enabled: !!(creds present)`, preference override, normalized response envelope — `fiat-payout-service.js:25-78, 1015-1083, 376-394`
- RazorpayX Contact → Fund Account → Payout chain with rail selection by amount (UPI for VPA; ≤₹5L IMPS, ≤₹20L NEFT, above RTGS) — `razorpayx-payouts.js:473, 412, 430`
- Deterministic beneficiary fingerprint from `sha256(account|ifsc|name)` — `fiat-payout-service.js:252` (as an *internal* key only, never sent to a partner as their id)
- Order state machine with append-only step log — `onramp/order-manager.js:47-97`
- Quote shape with itemized fees and `validUntil` — `offramp-engine.js:133-153`
- Production-readiness validation, especially the mainnet check — `production-config.js:175-211`

---

## 2. The three findings that reshape the plan

### 2.1 The IFSCA framework does not mention stablecoins

The governing document is **IFSCA FinTech Sandbox Framework, Circular F.No. 505/IFSCA-FTec0FTEF/1/2023, dated 16 March 2026** (16 pages), which supersedes the 2022 FinTech Entity Framework.

What Appendix-1 and Appendix-2 actually permit:

| Permitted (verbatim) | Clause |
|---|---|
| "Banking including but not limited to … **Payment Services (PSs) and Payment & Settlement Systems (PSSs)**" | Appendix-1 (ii) |
| "**Distributed Ledger Technology (DLT)**" | Appendix-2, TechFin (xvi)(e) |
| "**Tokenization support services**" | Appendix-2, TechFin (xxii) |
| "Digital identity / KYC / AML / CFT" | Appendix-2, TechFin (xvi)(c) |

**The words "virtual digital asset", "VDA", "crypto", and "stablecoin" appear nowhere in the framework.** DLT is permitted as *technology*. There is no stated permission to use a stablecoin as the *settlement asset* for customer value.

The route is clause 13:

> "Requests for relaxations/exemptions from the regulatory requirements can be considered by the Authority after analysing specific sandbox testing applications. The Applicant seeking such relaxations or exemptions **shall specify** the regulatory relaxations/exemptions sought… The Authority reserves the right to **grant, or refuse**, or grant with such modifications."

**Consequence:** the application must name this exemption explicitly and argue it. It may be refused. **This is the single question the entire architecture rests on, and it should be asked informally — by email to `fe-sandbox@ifsca.gov.in` — before four months of work is committed.**

### 2.2 No single partner covers India↔USA

Verified against live provider documentation:

| Provider | India | INR rail | Third-party payouts | Verdict |
|---|---|---|---|---|
| **Bridge** (Stripe) | Onboards Indian businesses (India = "Medium" risk, "Bridge will facilitate services") | **None** — USD/EUR/GBP/MXN/BRL/COP only | Yes (`on_behalf_of` + `travel_rule_data.beneficiary.is_self=false`) | Use for the **non-INR leg** |
| **Conduit** | 100+ countries | **None** — no UPI/NEFT/IMPS | Yes | Alternative for the non-INR leg |
| **BVNK** | Yes | Yes (claimed 130+ markets) | Yes | **Out of reach** — requires ~$500k/month volume + 6 months history |
| **Razorpay / Cashfree** | Domestic licensed | Yes | Yes | Use for the **INR leg** |

**Therefore: two independent partners per corridor, one per fiat leg, with Nivix's treasury bridging them.** This is permanent architecture, not a temporary workaround.

Bridge specifics worth designing against:
- `POST /transfers` requires an `Idempotency-Key` header; body takes `on_behalf_of`, `source{currency,payment_rail,from_address}`, `destination{currency,payment_rail,external_account_id}`
- Supports `dry_run` (free correctness check before real money moves) and `developer_fee`
- States: `awaiting_funds → funds_received → payment_submitted → payment_processed`
- **Sandbox fires no payment webhooks** — so polling is mandatory, not optional (§6.7)

### 2.3 The sandbox entity cannot transact in INR

> **Clause 28(i):** "transact **only in the foreign currency** as specified in the First Schedule of the IFSCA (Banking) Regulations, 2020… However, the FinTech Sandbox Entity **may defray their administrative expenses in INR** account."

Also: books and records in a freely convertible foreign currency **other than INR** (28(ii)); financials reported to IFSCA in **US Dollar** (28(iii)).

| Direction | Under clause 28 |
|---|---|
| **USA → India (inbound)** | **Clean fit.** Sender pays USD (foreign currency — permitted). Recipient's INR payout is executed by a licensed Indian partner; the FSE never touches INR. |
| **India → USA (outbound)** | **Awkward.** The sender pays INR, which the FSE may not receive. The entire INR collection leg must sit outside the FSE perimeter, raising an unresolved authorization question for that leg. |

**Decision impact:** "both directions" was chosen before this was known. The **code stays direction-agnostic** — that remains correct engineering. But **the sandbox application should lead with inbound (USA→India)**, which is also the world's largest remittance corridor (~$100B+/yr into India). Outbound goes in a later application once the INR-collection-leg authorization is resolved.

### 2.4 Two more constraints worth knowing

**Clause 40 — physical presence is conditional.** FRS testing may be remote, *"Provided that the FinTech Sandbox Entity shall be required to establish its physical presence in the IFSC where the testing involves the **holding of customer's fund** that necessitates the opening of a bank account with an IFSC Banking Unit."* Partner-held-funds orchestration points toward remote testing; whether fiat transiting Nivix's own account counts as "holding" is a counsel question that determines whether a GIFT City office is needed.

**Clause 15 — a Testing Partner may be mandatory.** *"One of the conditions of the 'In-Principle Approval' may require the Applicant to have at least one Testing Partner"* — defined (clause 3(s)) as an entity with which the applicant has an **MoU, Letter of Intent, or similar arrangement**. Partner selection is therefore potentially a *regulatory precondition*, not just an engineering choice. Commercial lead time — start now.

---

## 3. Target architecture

### 3.1 The one rule

**Stablecoins never touch a customer.** Not bought, not held, not burned. Customers see fiat in, fiat out. Real Circle USDC exists solely as Nivix's own internal treasury settlement asset, moved between Nivix's custody and a licensed partner's custody.

**No self-issued tokens. No minting or burning by Nivix — only transfers of USDC already owned.**

This single rule removes retail crypto custody (the highest-scrutiny regulatory category), eliminates the unlicensed-stored-value problem structurally, and reframes the customer's payment as a domestic transaction for a service.

### 3.2 Flow

```
Sender (fiat)
   │
   ▼
Licensed collection partner  ── fiat only, never crypto
   │
   ▼
Nivix USDC treasury  ── real Circle USDC, institutionally custodied
   │
   ▼
Licensed conversion + payout partner  ── fiat only reaches the recipient
   │
   ▼
Recipient (fiat)

Hyperledger Fabric (multi-org) records compliance events at every hop.
It is the AUDIT ledger — never the money ledger, never in the payout path.
```

### 3.3 What changes from the prototype

| | Prototype (today) | Target |
|---|---|---|
| Settlement asset | 7 self-minted SPL tokens named after currencies (6 unused) | One real asset: Circle USDC |
| Who can create it | Nivix's own mint-authority key, unlimited, no oversight | Circle only — regulated, audited, publicly attested reserves |
| Customer holds crypto? | Yes — receives tokens, signs a burn | Never |
| Money ledger | JSON files + in-memory Maps | Postgres double-entry ledger |
| Corridor support | India-only rails, mislabeled as multi-currency | Corridor = config + adapter |

---

## 4. Legal track

Runs in parallel with engineering. Engineering does not wait on it; the application quality depends on having something real to describe.

### 4.1 The four questions for counsel

1. **Will IFSCA grant a clause 13 exemption for stablecoin settlement of customer value?** (§2.1) — everything depends on this. Ask informally first.
2. **Does clause 28(i) permit the inbound model as designed** — FSE receives USD, licensed domestic partner pays INR, FSE never touches INR? And for outbound, what authorization does the INR-collection leg need (AD category / RBI PA-CB framework)?
3. **Does the design trigger clause 40 physical presence?** Does fiat transiting Nivix's own account constitute "holding customer's fund"?
4. **Per clause 7, do the IFSCA (TechFin and Ancillary Services) Regulations 2025 apply** instead of or alongside the sandbox route? The framework requires this check be done before applying.

### 4.2 Application process (SWIT portal, `swit.ifsca.gov.in`)

```
Preliminary Application
        │  ≤ 30 days — suitability assessment          [clause 9]
        ▼
Acceptance communication  (required before proceeding) [clause 3(j), 10]
        ▼
Final Application + fee   (IFSCA Fee Circular 08 Apr 2025) [clause 11]
        │  ≤ 60 days — examination                     [clause 14]
        ▼
In-Principle Approval
        │  ≤ 30 days to satisfy conditions
        │  (may require a Testing Partner MoU)         [clause 15]
        ▼
LIMITED USE AUTHORISATION → Testing Stage
                            12 months, +6 month extension at discretion [clause 21]
```

**Minimum realistic time to authorisation: ~4 months (≈120 days)**, assuming no resubmission.

### 4.3 Eligibility — Nivix qualifies three ways

Per clause 5(iii), an applicant from India may be: (a) a Companies Act company / LLP / partnership; (b) a **DPIIT-registered startup**; (c) an entity regulated by a domestic financial sector regulator; or (d) individuals affiliated with a recognised **incubator**.

Nivix has three viable routes: **NivixPe Private Limited** (a), DPIIT registration if held (b), or **Bennett University Hatchery** affiliation (d).

### 4.4 Boundary Conditions — propose your own

There are **no published customer or volume caps**. Per clause 3(d), they are set per entity in the authorisation letter, covering "duration, customer type, transaction, and geographic scope."

**Propose your own limits in the application.** A well-reasoned self-imposed cap is evidence of the "risk measured/graded testing conditions" IFSCA evaluates on (clause 12, criterion e).

### 4.5 Application must contain (clause 12 evaluation criteria)

- Test scenarios with expected outcomes (criterion d)
- Risk management strategy (clause 6) and graded testing conditions (criterion e)
- Self-proposed Boundary Conditions
- User disclosures, consent design, grievance redressal (criteria f, g, h, i)
- **Explicitly specified regulatory exemptions sought**, including stablecoin settlement (clause 13)
- Post-testing deployment strategy **and** exit strategy (criterion l)
- Evidence of intent to undertake market-exploration activity in the IFSC (criterion m)

### 4.6 Parallel commercial work — start immediately

- **Testing Partner MoU/LoI** — potentially a precondition (clause 15); longest lead time
- Bridge sandbox access + KYB
- Razorpay/Cashfree cross-border product discussion
- Circle Mint KYB (treasury funding)
- Institutional custody provider (multisig/MPC)

---

## 5. Engineering track — phases

### M0 — Security remediation (blocking; nothing else starts)

A compliance-focused product cannot be demonstrated with an unauthenticated approval endpoint. Ordered by exploitability.

1. **Rotate all exposed credentials** (§1.4), then purge from git history. Verify `.gitignore` covers every pattern.
2. **Fix the KYC webhook** — real HMAC over **raw bytes** with `crypto.timingSafeEqual`. The mock provider must be constructible only when `NODE_ENV !== 'production'`; `createKycProvider()` throws at boot in production if it would return the mock. Delete the `req.body.userId` identity fallback.
3. **Raw-body capture** — mount webhook routes with `express.raw({type:'*/*', limit:'1mb'})` **before** the global `express.json()`. Parse only *after* verification, so malformed-JSON attacks never reach the parser unauthenticated.
4. **Remove the `JWT_SECRET` fallback** (`config.ts:21`) so `required()` actually throws. Audit every other `?? ''` credential default in that file. Add boot assertions: secret ≥32 bytes, not in a denylist of known dev values. Validate all config with Zod at boot.
5. **Middleware stack** — `helmet()`, `cors()` with an explicit origin allowlist (never `*` with credentials), tiered rate limiting (strict on `/auth/*`, per-user on `/quotes` and `/transfers`, separate generous limit on `/webhooks/*` keyed by provider), and a terminal 4-arg error handler that never returns `error.message` to clients.
6. **Async handler wrapper** — every async route wrapped so Express 4 catches rejections.
7. **Mount the dead middleware** — `requireApprovedKyc` on every money route, `requireRole` on admin/compliance routes. Add a route-manifest test that fails if any path under `/transfers`, `/quotes`, `/recipients`, `/refunds`, `/admin` lacks its guards.
8. **Check `User.status` in `requireAuth`** so suspended users are actually blocked. Add `tokenVersion` to `User` for revocation.
9. **Logging redaction** — pino `redact` for `authorization`, `cookie`, `x-signature`, `password`, `passwordHash`, `pii`, `accountNumber`, `ifsc`, `vpa`, `token`, `*.secret`. Replace `console.*` in the worker. Propagate a request-id into worker jobs.
10. **Add `User.fullName`** — `kyc/service.ts:58` currently writes the user's **email** into the compliance ledger's name field.
11. **Stand up vitest properly** — config plus first real specs, so `npm test` stops being a false green.

### M1 — Ledger core

The foundation everything else posts to. Build before any partner integration.

**Money representation:**
- Amounts are `BigInt` **minor units** — never float, never an unqualified `amount` column
- Every amount column travels as a triple: `<name>AmountMinor` + `<name>Currency` + `<name>Scale`, with a DB `CHECK` that they're all-or-nothing null
- FX rates as `Decimal(24,12)`; spread as `Int` **basis points**; pre-rounding intermediates as `Decimal(28,8)`
- `Asset.scale` capped at 9 by `CHECK` (protects `BigInt` from 18-dp assets)
- A shared `Money` value object whose addition **throws** on currency mismatch

**Models:** `Asset`, `LedgerAccount`, `LedgerJournal`, `LedgerEntry`, `LedgerAccountBalance`, `LedgerCheckpoint`.

**Chart of accounts** — structured codes (`asset:partner_float:bridge:USD`), covering assets (partner floats, bank, treasury USDC), liabilities (`customer_payable`, `recipient_payable`, `unapplied_receipts`), revenue (platform fee, FX spread, FX P&L), expense (partner fees), and suspense/clearing accounts that must trend to zero.

**Non-negotiable DB constraints (raw SQL in the migration — Prisma can't express these):**
- **`LedgerEntry.amount_minor > 0`** — sign lives in `direction`, never in the amount
- **A `DEFERRABLE` constraint trigger asserting every journal balances *per currency*.** This is the single most important line in the schema. In TypeScript it will eventually be bypassed by a backfill or a stray `prisma.ledgerEntry.create`. In the database it cannot be.
- **Append-only triggers** on `LedgerEntry`, `LedgerJournal`, `TransferEvent`, `FxRateObservation`, `ProviderWebhookEvent` — plus `REVOKE UPDATE, DELETE` from the app role, so history physically cannot be rewritten. Corrections are reversing journals.
- `LedgerJournal @@unique(kind, sourceKind, sourceRef)` — makes journal posting idempotent, which is what makes at-least-once webhook delivery safe

**Currency crossing** goes through paired FX position accounts (`suspense:fx_position:INR` / `:USD`), each half balancing in its own currency. A daily revaluation job posts the delta to `revenue:fx_pnl`, giving a real FX P&L line instead of the delta hiding inside fees.

### M2 — FX engine

Four independent layers make the legacy `1.0` bug structurally impossible.

1. **The type has no room for a fallback.** `resolveMidRate()` returns a discriminated union — `{ok:true, ...}` or `{ok:false, reason:'no_source'|'stale'|'dispersion_exceeded'|'band_violation'|'pair_unsupported'}`. There is no `number` return, so there is nothing to default. **No `fallbackRates` object exists anywhere in the repo**; add a CI grep for `fallbackRate|hardcodedRate|\|\| 1\.0` that fails the build. Same-currency is a *separate* function, never a `rate = 1` short-circuit in the rate path.
2. **Policy over multiple sources.** Reads `FxRateObservation` rows written by a poller — never an HTTP call in the request path. Requires ≥2 enabled sources within `maxAgeSeconds`, pairwise dispersion ≤ threshold, mid = median. Failed evaluations are still persisted with a non-`ok` `policyResult`, so refusals are auditable.
3. **Corridor sanity band.** `Corridor.minRate/maxRate` (e.g. `0.0100..0.0140` for IN-US). A rate of `1.0` is 80× outside the band and fails as `band_violation`. Catches inverted-direction bugs and unit errors.
4. **Direction is named, not inferred.** Explicit `baseCurrency`/`quoteCurrency` plus a literal `rateDirection = "dst_per_src"`. Inversion is one audited helper with a property test.

**Spread is first-class** — `spreadBps Int`, always present, never folded into the rate. `effectiveRate` is stored *and* recomputable, with a check job asserting consistency. A customer dispute is answerable in one query.

**Models:** `FxRateSource`, `FxRateObservation` (immutable, with `rawPayload` + sha), `FxRateDecision` (immutable, with `observationIds` provenance).

### M3 — Quote + corridor config

`Corridor` is the unit of "adding a country": source/destination currency, provider keys, rate band, fees, amount limits, quote TTL, enable flag, circuit-breaker reason.

`Quote` carries: src/dst amounts, `fxRateDecisionId` provenance, frozen `midRate`, explicit `spreadBps`, stored `effectiveRate`, **itemized fees** (platform / collection / payout / FX-spread-as-money / total), `roundingRemainderMinor`, hard `validUntil`, and `transferId @unique`.

That `@unique` is the entire single-use enforcement — a second binding attempt violates a DB constraint, with no application-level race.

### M4 — Idempotency + webhook intake

**Our API (inbound):** `Idempotency-Key` **required** (not optional) on `POST /transfers`, `/transfers/:id/confirm`, `/refunds`, `/recipients`. Canonicalize body → `requestSha256`. Same key + different payload → `422`. Completed → replay the stored response. In-progress → `409`. **The response must be stored in the same transaction as the business write** — otherwise a crash between them yields a duplicate transfer on retry. Keys namespaced per user.

**Keys we send to partners — write-ahead.** The critical inversion from the legacy code: generate and persist the key **before** the request, not as a header afterthought.
```
key = `nvx_${legKind}_${legId}_${attemptSeq}`
```
Sequence: (1) `UPDATE leg SET state='submitting', submitStartedAt=now() WHERE state='ready' AND version=?` → **commit**; (2) HTTP POST with the key; (3) 2xx → store ref, transition; (4) definitive 4xx → `failed`; (5) timeout/5xx/network → **`indeterminate`, never retry in-process**.

If the process dies between 1 and 3, `submitStartedAt IS NOT NULL AND providerRef IS NULL` is a *detectable* ambiguous state. That is exactly what the legacy code could not do, because the intent was never written down.

`attemptSeq` increments **only on a definitive failure** — enforced by requiring a `DefiniteFailure` value as the function's argument. A new key after a timeout is a double-pay. **No endpoint rotation on retry, ever.**

**Inbound partner webhooks — verify synchronously, process asynchronously:**
1. Verify HMAC over raw bytes, timing-safe. Failure → persist with `verdict='bad_signature'`, return `401`, never process.
2. Timestamp/replay window check (reject >5 min skew).
3. `INSERT ProviderWebhookEvent` with the **exact raw bytes**. Unique violation on `(provider, providerEventId)` or `(provider, bodySha256)` → return `200` (already have it).
4. Insert an `OutboxMessage` in the same transaction. Return `200`.

Returning 200 before processing is deliberate: providers retry on non-2xx, and retries on a *processing* bug amplify the bug.

**Ordering guard:** compare each event's implied state against the leg's current state using a rank table. A `payment_submitted` arriving after `payment_processed` is ranked lower and **ignored**, not applied. Providers deliver out of order; without this you will regress a completed payout.

Unmatched events are **quarantined + alerted**, never silently dropped — an unmatched money event is a reconciliation break waiting to happen.

### M5 — Transfer + state machine

Three leg sub-machines (`CollectionLeg`, `TreasuryLeg`, `PayoutLeg`) drive one derived `Transfer` state. Legs hold the truth because legs map to partner objects; the transfer state is a projection, with a consistency job verifying projection == stored.

**Every non-terminal state carries `stateDeadlineAt`** from a per-state SLA table. A sweeper job flags breaches into `TransferAlert` (unique on `transferId+kind+state`, so no alert storms).

**The three hard paths, explicitly:**

*Collection ok, payout failed.* Two branches. Retryable (transient, definitive negative) → `payout_failed → payout_ready` with `attemptSeq++` and a fresh key — safe **only** because the provider confirmed it didn't happen. Non-retryable (invalid account, sanctions) → `refund_pending`, reverse the journals, instruct the refund.

*Payout ambiguous / timed out.* → `indeterminate`, set `indeterminateSince`. A dedicated job resolves it **by looking up the payout at the provider using our idempotency key** — never by re-sending. Found terminal → adopt. Found in-flight → `payout_submitted`. Definitively absent after N attempts → `payout_ready` (absence is proof). Unresolvable → `manual_review` + critical alert.

> **The rule that prevents double-pay:** `indeterminate` has **no edge** back to submitting that isn't gated on a lookup result. A retry that skips the lookup is not an available transition.

*Stuck surfacing.* Per-transfer deadlines, **plus** an independent aggregate check: `SUM(liability:customer_payable)` older than N hours. If we're holding customer money with nothing moving, that fires even if per-transfer deadline logic is broken.

**Enforcement:** one module exports the transition table as data plus `transition(tx, {...})`, which rejects any edge not in the table, does `UPDATE ... WHERE id=? AND state=$from AND version=$v` and fails on 0 rows, inserts the `TransferEvent`, and recomputes the deadline. **No other code path writes `Transfer.state`** — enforced by lint rule and review checklist.

### M6 — Provider abstraction + first corridor

**The `ProviderResult` union is the heart of it:**
```ts
type ProviderResult<T> =
  | { ok: true; data: T; raw: unknown }
  | { ok: false; kind: 'definitive';        retryable: false; ... }  // didn't happen — safe to re-attempt with a new key
  | { ok: false; kind: 'ambiguous';         lookupHint?: string; ... } // DON'T KNOW — never re-send
  | { ok: false; kind: 'transport_precall'; ... }                     // never left our process — safe to retry as-is
```
The legacy code had one `success: false` and therefore could not distinguish "didn't happen" from "don't know" — which is precisely how a blind retry becomes a double payment. Making it a union forces every call site to handle `ambiguous` separately.

**Three interfaces:** `CollectionProvider` (fiat in), `PayoutProvider` (fiat out), `TreasuryProvider` (USDC custody/transfer). `TreasuryProvider` deliberately has **no `mint`, `burn`, or `issue` method** — the constraint is visible in the type system, not just in a doc.

**Capability gating:** `supportsStatusLookupByIdempotencyKey` is asserted at boot for every enabled payout provider, and startup **fails** without it. A provider that can't answer "did you receive my key K?" makes `indeterminate` unresolvable and cannot be used safely.

`getBalance()` returns a real value or `ok:false`. **Unknown means the pre-flight funding check fails** — deleting the `999999999` path is the single highest-value line of the port.

**Routing is decided once, at quote time**, and pinned onto the leg. The legacy execution-time fallback chain (`fiat-payout-service.js:1015-1083`) meant a retry could hit a *different* provider with a different idempotency namespace — resilience theater that is actually a double-pay mechanism. Failover is legal only from a *definitive* `payout_failed`, creating a new leg with a new key.

**Adding a corridor** = insert a `Corridor` row + credentials, and only if the partner is new, one adapter. No changes to the state machine, ledger, API, or queues.

**First corridor:** Razorpay collection (INR) + Bridge payout (USD), simulated adapters first, real sandbox swapped in behind the interface.

### M7 — Treasury

Real USDC **transfers only** — `createTransferInstruction`, never mint/burn. Note the legacy code has **no working SPL transfer path**; the closest reference is in `backups/`, unverified.

Balance-based pre-flight checks (the legacy code assumed `balance: 'unlimited'` because it held mint authority — that assumption inverts here). `TreasuryAccount.observedBalanceMinor` is **nullable** with an `observationError` field, so "we could not read the balance" is representable — and means the check *fails*.

Multisig/MPC custody, no private key on disk. Fix the three-way env-name confusion (`SOLANA_RPC_URL` / `SOLANA_RPC_ENDPOINT` / `SOLANA_NETWORK`) and the five hardcoded devnet connections.

### M8 — Reconciliation + ops

**Three-way reconciliation** per reconcilable account:
```
unexplained = ledgerBalance − externalBalance − inFlight
```
`unexplained` must be **exactly zero**. It's an integer, so "approximately zero" is not a concept.

Break classification: `timing_expected` (auto-resolve only if state *and* amount match), `missing_in_ledger` (**always critical** — money moved without our instruction, or a webhook never arrived), `missing_at_partner`, `amount_mismatch`, **`duplicate_at_partner` (the double-pay signature — page immediately)**, `currency_mismatch` (structurally impossible; indicates an adapter bug).

Match keys in priority order: our idempotency key echoed in the provider reference → provider's object id → fuzzy (amount, currency, date, masked account) **flagged for human confirmation, never auto-resolved**.

**Circuit breakers:** `unexplained != 0` for two consecutive runs, or any `duplicate_at_partner`, opens `provider:{key}`. New transfers on affected corridors are refused at quote time; in-flight transfers continue (halting them mid-flight creates more breaks, not fewer).

Plus: low-treasury-balance alerting (absent today — a dry balance simply fails a payout with no warning), `LedgerCheckpoint` integrity job, and admin endpoints for `manual_review` and refunds with approval thresholds.

### M9 — Sandbox compliance surface

Framework obligations that are **product features**, not paperwork:

| Obligation | Clause | Build |
|---|---|---|
| Disclose what's being tested + key risks **in writing** | 19 | Sandbox disclosure screen |
| User **acknowledgment** of risks **before onboarding** | 20 | Consent capture, persisted, auditable per user |
| Disclose compensation terms + obtain **express written consent** | 20 | Separate consent record |
| Defined user rights and **grievance redressal** | criterion (h) | Working complaints intake + resolution trail |
| **Monthly status report** before the 10th | 23 | KPI/milestone/statistics export |
| Fraud and operational incident reports + actions taken | 24 | Incident log with remediation tracking |
| **Final report** within 30 days of expiry | 25 | Outcome reporting, full incident and complaint account |
| Records retained **7 years** after exit | 26 | Retention policy — no hard deletes of audit data |
| Prior **written approval** for material changes | 22 | Change-control discipline |

The Hyperledger Fabric compliance ledger is genuinely well-suited to the audit-trail and 7-year retention obligations, and is worth presenting in the application as exactly that.

### M10 — Fabric compliance events + frontend

Extend the working gateway with `storeTransferCompliance`: transfer reference, KYC refs, screening decision + timestamp, travel-rule payload **hash**, corridor, amount **band** rather than exact amount (multi-org means other orgs see what you write).

Two hard rules: Postgres `Transfer.screeningStatus` is **authoritative for the gate** — a payout waits on the Postgres row, never on a Fabric commit, so a Fabric outage degrades auditability, not availability. And no balance, no amount arithmetic, no money state on Fabric.

Note `getKycFromFabric` is currently **dead code** — nothing ever reads back from the ledger. Add verification reads.

**Frontend:** fiat-only UI. Remove the 7-currency token dropdown, the burn-signing flow, and the dead unreachable routes (`apps/web/src/App.tsx:164-166` render `<Home/>` for `/payment-app`, `/comprehensive-testing`, `/offramp-testing`).

---

## 6. Architecture rules that hold throughout

### 6.1 Where money logic runs

**`apps/api` — never initiates an irreversible external action inside a request.** It writes durable intent; the worker executes. This is what makes the system crash-safe: a dying API process can lose at most a response, never a payment.

Yes in the API: idempotency middleware, auth + `requireApprovedKyc`, Zod validation, quote creation (reads rates from Postgres, no HTTP), quote→transfer binding, recipient CRUD, webhook receipt (verify, persist, outbox, 200), reads, admin actions that *enqueue*.

No in the API: any call to Bridge/Razorpay/Solana, any FX HTTP fetch, any retry loop, any ledger posting that depends on an external call.

**`apps/worker` — all outbound money calls.** New queues alongside the existing `fabric-writes`: `fx-poll`, `outbox-dispatch`, `webhook-project`, `collection`, `treasury`, `payout`, `payout-reconcile`, `recon`, `sweeper`, `notify`.

### 6.2 Transactional outbox

**Never `queue.add()` inside a DB transaction** — the transaction can roll back after the job is queued, and the worker then processes a transfer that doesn't exist. Insert `OutboxMessage` in the same transaction; a dispatcher polls and enqueues with a deterministic `jobId` (which BullMQ dedupes).

This also fixes an existing bug: `apps/api/src/kyc/service.ts:54` calls `fabricQueue.add()` right after `prisma.kycRecord.update()`, outside a transaction — a crash between them loses the Fabric write.

### 6.3 Exactly-once vs at-least-once

BullMQ is at-least-once; nothing changes that. Exactly-once **effects** come from four mechanisms, and every effectful job must name which it relies on:

| Mechanism | Guarantees |
|---|---|
| Provider idempotency key (write-ahead) | Partner executes once even if we send twice |
| `LedgerJournal @@unique(kind, sourceKind, sourceRef)` | A journal posts once even if projected N times |
| State guard `WHERE state=? AND version=?` | A transition applies once; concurrent losers no-op |
| `IdempotencyRecord` unique | An API request creates one resource |

**`payout:submit` is configured `attempts: 1`** — retries are handled explicitly by state, not by BullMQ. Letting a queue auto-retry a money-moving job is the legacy bug with better ergonomics.

Effectful jobs (`payout:submit`, `treasury:submit-transfer`, `collection:refund`) additionally take a `pg_advisory_xact_lock` on the transfer id, though the state guard is the actual correctness mechanism.

### 6.4 Polling is not optional

Bridge's sandbox fires **no payment webhooks**, and no production webhook system is 100% reliable. Every leg with an outstanding provider reference is polled on a decaying schedule (10s → 30s → 2m → 10m → 30m up to SLA). **Poll and webhook results go through the same projection function with the same rank guard**, so they cannot disagree — and so the sandbox E2E test exercises the same code path as production.

---

## 7. Combined timeline

```
Month 0     M0 security + secrets rotation      │ Email IFSCA re clause 13 exemption
                                                │ Counsel on the 4 questions (§4.1)
                                                │ Testing Partner MoU conversations
Month 1     M1 ledger, M2 FX                    │ Draft application
Month 1-2   M3 quotes, M4 idempotency           │ SUBMIT PRELIMINARY ──┐
Month 2-3   M5 state machine, M6 providers      │  (≤30d assessment)   │
Month 3     M7 treasury, M8 reconciliation      │ Final Application + fee
Month 3-4   M9 compliance surface, M10 Fabric   │  (≤60d examination)
Month 4-5   Harden, test, demo-ready            │ In-Principle → conditions (≤30d)
Month ~5    ▼ LIMITED USE AUTHORISATION → Testing Stage (12mo, +6mo)
```

Engineering has roughly the length of the approval process to become demo-ready — a comfortable runway, **provided M0 starts now**.

---

## 8. Decisions needed

| # | Decision | Recommendation |
|---|---|---|
| D1 | `BigInt` minor units vs `Decimal(28,8)` for money | BigInt minor units. If Decimal is preferred, the exact-multiple `CHECK` is mandatory |
| D2 | `TreasuryLeg` 1:1 per transfer vs batched | 1:1 first for auditability; batching is a later migration, not a patch |
| D3 | Who absorbs FX movement on a refund | **We do** — refund the exact source amount collected, post the delta to `revenue:fx_pnl`. Real P&L impact; makes flaky-partner risk visible |
| D4 | Collection intent created sync in API or async in worker | Worker + short client poll, keeping "API never calls partners" absolute |
| D5 | Exact amounts vs amount bands on Fabric | Bands + hashes — multi-org means other orgs see what you write |
| D6 | Step-up re-auth above a value threshold | Yes, above a corridor-configured amount |
| D7 | **Self-custody USDC on Solana vs partner-held custody** | `M2_USDC_SETTLEMENT_PLAN.md` assumes a self-custody Solana keypair; this architecture points at partner custody. Very different key-management, insurance, and regulatory postures. **Settle before `TreasuryProvider` is implemented** |
| D8 | One collection partner per corridor? | A Razorpay outage would stop the India corridor. Consider multiple enabled providers selected at *quote* time (still pinned per transfer, so no double-pay risk) once the first corridor is live |

**One thing that could not be verified:** the exact shape of Bridge's fee accounting (netted from the payout vs billed separately) and its webhook signature scheme. The fee journals and the Bridge `verifyWebhook` implementation both depend on it. **One `dry_run` transfer plus one captured sandbox webhook settles both** — worth doing before finalizing the ledger's fee journals.

---

## 9. Verification

**Unit** — FX refuses to return a rate without provenance; a rate outside the corridor band is rejected; the ledger rejects unbalanced journals *at the database*; the state machine rejects every illegal edge; HMAC fails on tampered body and wrong signature; `Money` addition throws on currency mismatch.

**Integration** — full transfer against simulated adapters, both directions; webhook replay deduped; out-of-order webhook ranked and ignored; idempotency key returns the original result rather than double-charging; partner timeout leaves the transfer in `indeterminate` and the lookup job resolves it correctly.

**Negative / failure** — collection-ok + payout-fail produces a correct reversal; an ambiguous payout is *never* re-sent without a lookup; expired quote rejected; unknown FX pair hard-fails; unreadable partner balance blocks the payout rather than passing.

**Reconciliation** — inject drift deliberately and confirm detection, correct break classification, and circuit-breaker activation.

**Security** — the KYC webhook rejects unsigned and bad-signature requests; the app refuses to boot without `JWT_SECRET`; no money endpoint is reachable without approved KYC (route-manifest test); suspended users are blocked.

**End-to-end** — `docker compose up` (Postgres + Redis) + Fabric test-network, run API + worker, execute a full simulated transfer, then verify the ledger balances per currency, the `LedgerCheckpoint` matches, the Fabric compliance record exists, and the Postgres mirror agrees.

---

## 10. Never again

Patterns that must not reappear, in any form, for any reason:

- Self-issued tokens labeled as, or standing in for, a real currency
- Any customer wallet holding, buying, or burning a crypto asset
- Minting or burning by Nivix
- An FX code path that can return a fallback or default rate
- A signature-verification bypass — for test keys, missing signatures, or any environment
- A synthetic balance returned when a real balance cannot be read
- Re-sending a money-moving request after an ambiguous response
- Endpoint rotation on retry
- Money state in JSON files or in-memory maps
- A treasury private key on disk, or auto-generated
- Bank details or credentials in logs
- Funding stablecoin purchases with LRS or other restricted outward remittance

Also out of scope: reviving any part of the mint/burn mechanic, the 6 unused currency tokens, the dormant `treasury-manager.js` threshold logic (superseded by M7/M8), and going live in any corridor before its legal gate clears.

---

*Sources: IFSCA FinTech Sandbox Framework (16 Mar 2026) and FAQ (07 Aug 2026), read in full from ifsca.gov.in — clause numbers cite the framework. Bridge API documentation at apidocs.bridge.xyz. Codebase findings from direct file reads at the paths and line numbers cited. This is a build plan, not legal advice — §4.1 must go to counsel.*
