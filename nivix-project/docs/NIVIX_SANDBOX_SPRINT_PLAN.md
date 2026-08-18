# NIVIX — 4-Week Sprint to Sandbox-Application-Ready

**Created:** 2026-08-09
**Build starts:** Sunday 9 August 2026
**Target:** Friday/Saturday 4–5 September 2026
**Detail reference:** `NIVIX_MASTER_BUILD_PLAN.md` (full M0–M10 spec) · `IFSCA_SANDBOX_READINESS_PLAN.md` (clause-level regulatory detail)

---

## The target, stated precisely

**Sandbox-application-ready**, meaning two deliverables by ~Sept 5:

1. **Preliminary Application submitted** via the SWIT portal (`swit.ifsca.gov.in`)
2. **A working end-to-end simulated transfer** — demo-able, and concrete enough to describe in the application

This is *not* "sandbox testing complete." IFSCA's review clock is statutory and runs after submission: ≤30 days preliminary assessment, ≤60 days final examination, ≤30 days to satisfy In-Principle conditions. Testing begins on the far side of that. Submitting early is the only lever that moves the authorisation date.

The deferred build work (M7–M10) lands *during* those review windows. That is what the review time is for.

---

## Scope: M0 → M6

| Milestone | Delivers |
|---|---|
| **M0** | Security remediation + secrets rotation |
| **M1** | Double-entry ledger core |
| **M2** | FX engine (no-fallback-by-construction) |
| **M3** | Quotes + corridor config |
| **M4** | Idempotency + webhook intake |
| **M5** | Transfer state machine |
| **M6** | Provider interfaces + simulated adapters → **end-to-end demo** |

**End state:** fiat in → ledger-recorded → quote with locked rate + provenance → transfer driven through a state machine → fiat out, all against simulated adapters, with the existing Fabric compliance write already wired.

### Deferred past the application (blocked on external processes, not effort)

| Milestone | Blocked on |
|---|---|
| **M7** Treasury (USDC transfers) | Custody provider onboarding, Circle Mint KYB |
| **M8** Reconciliation + circuit breakers | Needs real partner statements to reconcile against |
| **M9** Sandbox compliance surface | Should follow counsel's read of clauses 19–26 |
| **M10** Fabric transfer events + frontend | Depends on M7 shape |

### Not cut, even under deadline

Three things stay in scope regardless of schedule pressure, because a money-loss incident during testing is a **clause 32 revocation risk** that costs far more than the days saved:

- The ledger balanced-journal invariant, enforced at the database
- Write-ahead idempotency keys
- The `indeterminate` state and its lookup-only exit

---

## Week 1 — Aug 9 (Sun) → Aug 15 (Sat) · M0 + M1

### M0 — Security remediation

Ordered by exploitability. Nothing else starts until this lands.

**Secrets (do first, independently of code):**
- Rotate: Solana treasury keypair, Razorpay/Cashfree credentials, SSH key
- `git rm --cached` the tracked secrets: `data/treasury-keypair.json`, `bridge-service/.env.production`, `.env.staging`, `.env.backup`, both `WALLETS_REGISTRY.json`, `nivixpemain.pem`
- Fix `.gitignore` to cover every pattern; verify with `git ls-files`
- **History rewrite deferred** to a deliberate session — it force-pushes and breaks existing clones. Once keys are rotated the committed copies are dead weight, not a live risk.

**Code (all verified locations):**

| Fix | File |
|---|---|
| Real HMAC over **raw bytes** with `timingSafeEqual`; mock provider constructible only when `NODE_ENV !== 'production'`; `createKycProvider()` throws at boot in prod if it would return the mock | `apps/api/src/kyc/provider.ts:37-40,51-55` |
| Mount webhook routes with `express.raw()` **before** global `express.json()`; parse only after verification | `apps/api/src/index.ts:9` |
| Delete the attacker-controlled `req.body.userId` identity fallback | `apps/api/src/routes/kyc.ts:39` |
| Remove the `JWT_SECRET` fallback so `required()` actually throws; audit every other `?? ''` credential default; Zod-validate all config at boot | `apps/api/src/config.ts:21` |
| Add `helmet`, `cors` (explicit allowlist), tiered rate limiting, terminal 4-arg error handler | `apps/api/src/index.ts:8-18` |
| Wrap every async handler so Express 4 catches rejections | `apps/api/src/routes/*.ts` |
| Mount `requireApprovedKyc` / `requireRole` — currently written but never used | `apps/api/src/middleware/auth.ts:20,30` |
| Check `User.status` in `requireAuth`; add `tokenVersion` for revocation | `apps/api/src/middleware/auth.ts:6` |
| pino `redact` for `authorization`, `x-signature`, `password`, `pii`, `accountNumber`, `ifsc`, `vpa`, `token`, `*.secret` | `apps/api/src/index.ts:10` |
| Add `User.fullName`; stop writing the user's **email** into the compliance ledger's name field | `apps/api/src/kyc/service.ts:58` |
| `vitest.config.ts` + first real specs, so `npm test` stops passing against zero files | `apps/api/` |

**Exit criteria:** webhook rejects unsigned and bad-signature requests · app refuses to boot without `JWT_SECRET` · route-manifest test proves no money path lacks its guards · `npm test` runs real specs.

### M1 — Ledger core

**Money representation (decision taken — integer minor units):** amounts are `BigInt` minor units, never float, never an unqualified `amount` column. Every amount travels as a triple — `<name>AmountMinor` + `<name>Currency` + `<name>Scale` — with a DB `CHECK` that they are all-or-nothing null. FX rates `Decimal(24,12)`; spread as `Int` basis points. `Asset.scale` capped at 9 by `CHECK`.

Rationale: matches the rails (Razorpay takes paise, USDC is 6dp) and makes it structurally impossible to record a fraction of a paisa no bank can settle.

**Models:** `Asset`, `LedgerAccount`, `LedgerJournal`, `LedgerEntry`, `LedgerAccountBalance`, `LedgerCheckpoint`.

**Raw-SQL constraints in the migration** (Prisma cannot express these):
- `LedgerEntry.amount_minor > 0` — sign lives in `direction`, never in the amount
- **A `DEFERRABLE` constraint trigger asserting every journal balances per currency.** The single most important line in the schema. In TypeScript it eventually gets bypassed by a backfill; in the database it cannot be.
- Append-only triggers on `LedgerEntry`, `LedgerJournal`, `TransferEvent` + `REVOKE UPDATE, DELETE` from the app role
- `LedgerJournal @@unique(kind, sourceKind, sourceRef)` — makes journal posting idempotent, which is what makes at-least-once webhook delivery safe

**Exit criteria:** a property test generating random journals confirms they either balance or are rejected **by the database**.

---

## Week 2 — Aug 16 → Aug 22 · M2 + M3

### M2 — FX engine

Four independent layers so the legacy `1.0` fallback (`bridge-service/src/stablecoin/exchange-rate-service.js:382`, an ~83× mispay on INR→USD) cannot recur:

1. **The type has no room for a fallback.** `resolveMidRate()` returns a discriminated union — `{ok:true,…}` or `{ok:false, reason:'no_source'|'stale'|'dispersion_exceeded'|'band_violation'|'pair_unsupported'}`. No `number` return, so nothing to default to. **No `fallbackRates` object anywhere in the repo**; CI greps for `fallbackRate|hardcodedRate|\|\| 1\.0` and fails the build. Same-currency is a *separate* function, never a `rate = 1` short-circuit.
2. **Policy over multiple sources.** Reads `FxRateObservation` rows written by a poller — never an HTTP call in the request path. ≥2 enabled sources within `maxAgeSeconds`, pairwise dispersion under threshold, mid = median. Failed evaluations persisted with a non-`ok` `policyResult` so refusals are auditable.
3. **Corridor sanity band.** `Corridor.minRate/maxRate` — a rate of `1.0` on IN-US is 80× outside the band and fails as `band_violation`. Catches inverted-direction and unit errors.
4. **Direction is named, not inferred.** Explicit `baseCurrency`/`quoteCurrency` plus literal `rateDirection = "dst_per_src"`. Inversion is one audited helper with a property test.

**Models:** `FxRateSource`, `FxRateObservation` (immutable, with raw payload + sha), `FxRateDecision` (immutable, with `observationIds` provenance).

### M3 — Quotes + corridor config

`Corridor` is the unit of "adding a country": currencies, provider keys, rate band, fees, amount limits, quote TTL, enable flag.

`Quote` carries src/dst amounts, `fxRateDecisionId` provenance, frozen `midRate`, explicit `spreadBps`, stored `effectiveRate`, itemized fees, `roundingRemainderMinor`, hard `validUntil`, and `transferId @unique` — which is the entire single-use enforcement, with no application-level race.

**Exit criteria:** an unknown pair hard-fails · a rate outside the band is rejected · an expired quote cannot bind · a quote cannot bind twice.

---

## Week 3 — Aug 23 → Aug 29 · M4 + M5

### M4 — Idempotency + webhook intake

**Our API:** `Idempotency-Key` **required** (not optional) on `POST /transfers`, `/refunds`, `/recipients`. Same key + different payload → `422`. Completed → replay the stored response. **The response must be stored in the same transaction as the business write** — otherwise a crash between them yields a duplicate on retry.

**Keys to partners — write-ahead.** The inversion the legacy code missed: persist the key *before* the request leaves the process.
```
key = `nvx_${legKind}_${legId}_${attemptSeq}`
```
(1) `UPDATE leg SET state='submitting', submitStartedAt=now() WHERE state='ready' AND version=?` → **commit**; (2) POST with the key; (3) 2xx → store ref; (4) definitive 4xx → `failed`; (5) timeout/5xx → **`indeterminate`, never retry in-process**.

If the process dies between 1 and 3, `submitStartedAt IS NOT NULL AND providerRef IS NULL` is a *detectable* ambiguous state. `attemptSeq` increments **only on a definitive failure** — enforced by requiring a `DefiniteFailure` value as the function argument. **No endpoint rotation on retry, ever** (`razorpayx-payouts.js:270-298`).

**Inbound webhooks — verify sync, process async:** verify HMAC over raw bytes → persist `ProviderWebhookEvent` with exact bytes → insert `OutboxMessage` in the same transaction → return `200`. Dedupe on `(provider, providerEventId)` and `(provider, bodySha256)`. **Ordering guard:** rank each event against the leg's current state; a lower-ranked late event is ignored, not applied — otherwise an out-of-order delivery regresses a completed payout. Unmatched events are quarantined + alerted, never dropped.

**Transactional outbox:** never `queue.add()` inside a DB transaction — the transaction can roll back after the job is queued. This also fixes an existing bug at `apps/api/src/kyc/service.ts:54`.

### M5 — Transfer state machine

Three leg sub-machines (`CollectionLeg`, `TreasuryLeg`, `PayoutLeg`) drive one derived `Transfer` state. Legs hold the truth; the transfer state is a projection.

**The three hard paths:**
- *Collection ok, payout failed* → retryable only on a **definitive** negative (`attemptSeq++`, fresh key); otherwise `refund_pending` + reversing journals
- *Payout ambiguous* → `indeterminate`. **The only exit is a provider lookup by our idempotency key** — never a re-send. `indeterminate` has **no edge** back to submitting that skips the lookup. This is what prevents double-paying.
- *Stuck surfacing* → per-state `stateDeadlineAt` + a sweeper, **plus** an independent aggregate check on `SUM(liability:customer_payable)` age, which fires even if per-transfer deadline logic breaks

**Enforcement:** one module owns the transition table; `transition()` rejects unlisted edges, does `UPDATE … WHERE state=$from AND version=$v` failing on 0 rows, and appends a `TransferEvent`. **No other code path writes `Transfer.state`.**

---

## Week 4 — Aug 30 → Sep 5 · M6 + demo

### M6 — Provider interfaces + simulated adapters

**The `ProviderResult` union is the core type:**
```ts
type ProviderResult<T> =
  | { ok: true;  data: T; raw: unknown }
  | { ok: false; kind: 'definitive';        retryable: false; … }  // didn't happen — safe to re-attempt with a new key
  | { ok: false; kind: 'ambiguous';         lookupHint?: string; … } // DON'T KNOW — never re-send
  | { ok: false; kind: 'transport_precall'; … }                     // never left our process — safe to retry as-is
```
The legacy code had one `success: false` for all three, which is exactly how a retry becomes a double payment.

**Three interfaces:** `CollectionProvider`, `PayoutProvider`, `TreasuryProvider`. The last one deliberately has **no `mint`, `burn`, or `issue` method** — the constraint lives in the type system.

**Capability gating:** `supportsStatusLookupByIdempotencyKey` asserted at boot; startup **fails** without it, because a provider that can't answer "did you receive key K?" makes `indeterminate` unresolvable.

`getBalance()` returns a real value or `ok:false` — **unknown means the pre-flight check fails.** Deleting the legacy `999999999` fake balance (`razorpayx-payouts.js:362-373`) is the highest-value line of the port.

**Routing decided once, at quote time**, and pinned to the leg. The legacy execution-time fallback chain meant a retry could hit a different provider under a different idempotency namespace.

**Simulated adapters** implementing all three interfaces, plus a webhook simulator — necessary regardless, since **Bridge's sandbox fires no payment webhooks**.

**Patterns reused from the legacy code** (good ideas, reimplemented properly): provider registry with `enabled: !!(creds)` (`fiat-payout-service.js:25-78`); RazorpayX Contact→FundAccount→Payout with rail selection by amount (`razorpayx-payouts.js:473,412`); deterministic beneficiary fingerprint `sha256(account|ifsc|name)` as an *internal* key only; append-only step log (`order-manager.js:47-97`).

### Demo assembly

`docker compose up` → Postgres + Redis · Fabric test-network up · API + worker running · execute a full simulated transfer · verify: ledger balances per currency, `LedgerCheckpoint` matches, Fabric compliance record exists, Postgres mirror agrees.

---

## Parallel track — Application (owner: you, not the build)

Runs alongside. Not blocked by code, and the highest-leverage item is available today.

| # | Item | When |
|---|---|---|
| 1 | **Email `fe-sandbox@ifsca.gov.in`** — is a clause 13 exemption for stablecoin settlement of customer value plausible? And what authorization category follows a successful test? | **Today.** Free, and a "no" redirects the architecture before four weeks are spent on it |
| 2 | **Counsel on the four questions** (`IFSCA_SANDBOX_READINESS_PLAN.md` §8) — the clause 13 exemption, whether clause 28(i) permits the inbound model, whether clause 40 physical presence is triggered, whether the TechFin Regulations 2025 apply instead | W1 |
| 3 | **Testing Partner MoU/LoI** — clause 15 may make this a precondition for authorisation; longest lead time of anything | Start W1 |
| 4 | Confirm eligibility limb: NivixPe (Companies Act) / DPIIT startup / Bennett Hatchery incubator affiliation | W1 |
| 5 | Confirm fees per the IFSCA Fee Circular dated 08 Apr 2025 | W1 |
| 6 | **Draft the application** — clause 12 wants test scenarios, risk strategy, self-proposed Boundary Conditions, user disclosures + consent design, grievance redressal, **explicitly specified exemptions sought**, deployment *and* exit strategy, IFSC market-exploration intent | W2–W3 |
| 7 | Bridge sandbox + KYB · Razorpay/Cashfree cross-border discussion · Circle Mint KYB · custody provider | W1–W4 (their clock) |
| 8 | **Submit Preliminary Application** | **~Sep 5** |

### Two framework facts that shape the application

**Lead with inbound (USA→India).** Clause 28(i): the sandbox entity may transact **only in foreign currency** — INR is permitted solely for its own administrative expenses. Outbound requires receiving customer INR, which the clause bars. Inbound is also the larger corridor. *The code stays direction-agnostic; the application leads with inbound.*

**Propose your own Boundary Conditions.** There are no published customer or volume caps — clause 3(d) sets them per entity in the authorisation letter. A well-reasoned self-imposed limit is evidence of the "risk measured/graded testing conditions" IFSCA scores on (clause 12, criterion e).

---

## Decisions taken (override any time)

| Decision | Call | Why |
|---|---|---|
| Money type | **Integer minor units** (`BigInt`) | Matches the rails; unpayable fractions become structurally impossible |
| Secrets | **Rotate + untrack + gitignore now**, history rewrite deferred | Non-destructive, unblocks immediately; rotated keys make committed copies dead weight |
| Corridor | Code direction-agnostic; **application leads with inbound** | Clause 28(i) |
| Partner strategy | **Simulated adapters behind real interfaces**, sandbox swapped in later | Bridge sandbox fires no payment webhooks anyway |

## Still open (needed before M7, not before tomorrow)

- **D7 — self-custody USDC on Solana vs partner-held custody.** `M2_USDC_SETTLEMENT_PLAN.md` assumes a self-custody keypair; this architecture points at partner custody. Materially different key-management, insurance, and regulatory postures. Settle before `TreasuryProvider` is implemented.
- Bridge's fee accounting shape (netted vs billed separately) and webhook signature scheme — **one `dry_run` transfer plus one captured sandbox webhook settles both.** Needed before the ledger's fee journals are final.

---

## Honest risk register

| Risk | Mitigation |
|---|---|
| 4 weeks is tight for M0–M6 | M7–M10 are already deferred to the review windows. If further slip occurs, cut M6's simulated *webhook* simulator before cutting anything in M0/M1. |
| Counsel unavailable in W1 | The build proceeds regardless — the architecture doesn't change based on their answer; only the *application content* does |
| Clause 13 exemption refused | Why item 1 is today's task. Discovering this in September rather than August is the expensive order. |
| Testing Partner MoU slips | Doesn't block the Preliminary Application — clause 15 attaches it to the **In-Principle** stage, which is 90+ days out |
| Secrets rotation breaks the running legacy prototype | Expected. The prototype is being replaced; rotate anyway. |

---

*Schedule overlay on `NIVIX_MASTER_BUILD_PLAN.md` — that document holds the full M0–M10 specification and all file:line citations. Clause references are to the IFSCA FinTech Sandbox Framework dated 16 March 2026.*
