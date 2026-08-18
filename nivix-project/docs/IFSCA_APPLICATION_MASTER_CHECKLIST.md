# IFSCA Sandbox Application — Complete Requirements & Build Plan

**Created:** 2026-08-09
**Primary sources:** IFSCA FinTech Sandbox Framework (Circular 16 Mar 2026) + **FAQ (07 Aug 2026) including Annexure I "Supporting Documents – Checklist"**, both extracted and read in full
**Supersedes the timeline in:** `NIVIX_SANDBOX_SPRINT_PLAN.md`

---

## 0. Two findings that change the timeline

I previously planned toward "application-ready by ~5 September." Having now read **Annexure I of the FAQ** — the official supporting-documents checklist — two items make that target unachievable for the *Final* Application, and one is a hard external dependency.

### 🔴 Finding 1 — A CERT-In empanelled VAPT audit is required

> **Annexure I, item 11(v):** "**Security Assessment Report / VAPT Audit Report and Certificate by CERT-In empanelled auditor**"

This is a formal penetration test by a government-empanelled auditor. Implications:

- **It cannot be self-certified.** Only a CERT-In empanelled firm can issue it.
- **It requires stable, feature-complete code.** Auditing a half-built system produces findings you then have to fix and re-test.
- **Lead time is weeks, not days** — engagement, scheduling, testing, report, remediation, re-test.
- **It costs money.** Budget needs allocating.

This is now the **critical path item** for the Final Application. It also retroactively justifies M0: shipping a system to a CERT-In auditor with an unauthenticated webhook endpoint and a committed treasury key would produce a damning report.

### 🔴 Finding 2 — Audited financials for the last 3 financial years

> **Annexure I, item 14:** "Audited Financials for the **last 3 financial years**"

NivixPe Private Limited may not have three years of audited financials. **This needs checking immediately** with your CA. If unavailable, the likely paths are: submit what exists (since incorporation), or seek a relaxation under clause 13 — the same mechanism as the stablecoin question. Either way, it must be raised in the application rather than left as a gap for IFSCA to find.

### ⚠️ Also noted — an inconsistency in IFSCA's own documents

FAQ Q9 cites the **"IFSCA Fee Circular dated April 08, 2025"**; Annexure I item 10 cites the **"IFSCA Fee Circular dated March 02, 2026"**. Confirm the operative circular and current fee before paying — worth including in the pre-application email.

---

## 1. The two-stage structure (and why this is manageable)

The heavy Annexure I checklist appears to attach primarily to the **Final Application**, not the Preliminary. Item 5 references *"the complete **CAF** and all Annexures"* — and per FAQ Q8, the CAF (Common Application Form) is the Stage 2 document.

| | Stage 1 — Preliminary | Stage 2 — Final |
|---|---|---|
| Purpose | IFSCA assesses **suitability of the idea** | Full authorisation review |
| Form | Preliminary Application template (on the IFSCA website) | **CAF** + all Annexures |
| Fee | None stated | Payable on submission |
| Annexure I docs | Likely **not** required in full | Required |
| IFSCA clock | ≤30 days | ≤60 days → In-Principle Approval |
| Then | Acceptance unlocks Stage 2 | ≤30 days to satisfy conditions → **Limited Use Authorisation** |

> **You cannot submit a Final Application without an accepted Preliminary Application** (FAQ Q8, explicit).

**This is the key to the schedule.** The Preliminary Application is a proposal document — no VAPT, no CAF, no full document pack. It can go in early September. The 30-day assessment window then runs *while* you complete the build, commission the VAPT, and assemble the document pack for Stage 2.

**🔲 ACTION (this week):** download the actual **Preliminary Application template** and the **CAF** from the IFSCA website / SWIT portal and confirm precisely what Stage 1 requires. Everything above is inference from the FAQ; the templates are authoritative. This is the single highest-value hour of admin work available right now.

---

## 2. Complete Annexure I checklist — status, owner, lead time

All documents must be **signed and stamped by the Authorised Representative** per the Board Resolution at item 4.

| # | Item | Status | Owner | Lead time |
|---|---|---|---|---|
| 1 | **Incorporation + Commencement of Business** — Certificate of Incorporation AND Certificate of Commencement of Business | Should exist | You / CS | Retrieval |
| 2 | **Constitutional documents** — MoA and AoA | Should exist | You / CS | Retrieval |
| 3 | Certificate of Good Standing | **N/A** — foreign entities only | — | — |
| 4 | **Board Resolution** authorising: (i) application to IFSCA, (ii) setting up an IFSC unit if applicable, (iii) pursuing different business activities if applicable, **(iv) appointment of a Designated Director for AML/CTF/KYC compliance** | **To draft** | You + CS | Board meeting — **schedule now** |
| 5 | Signed and stamped CAF + all Annexures | Stage 2 | You | After Stage 1 acceptance |
| 6 | **Self-attested Proof of Identity + Address (KYC)** for: founders, executive directors, authorised signatory, and **persons exercising control** | **To collect** | You | Days |
| 7 | **DIN / DPIN** for all directors / designated partners | Should exist | You / CS | Retrieval |
| 8 | **Latest shareholding pattern** in IFSCA's prescribed format (instrument, shareholder name, nationality/country of registration, amount invested + currency, % holding as on date) — for the applicant **and** any holding/subsidiary/associate company | **To prepare** | You / CS | Days |
| 9 | **KYC for shareholders ≥10% and persons exercising control** — including, where an entity holds ≥10%, its own shareholding break-up **and** KYC of its UBO | **To collect** | You | Days — **can be slow if investors are entities** |
| 10 | **Application fee payment proof** — SWIFT MT 103 or UTR number | Stage 2 | You | On submission |
| 11 | **Technical documents** — see §3 below | **Build + write** | Me (build) / joint (docs) | **VAPT is weeks** |
| 12 | **Pitch deck / concept note** — technicalities and roadmap, business model in the GIFT IFSC context, **employment planned in GIFT IFSC** | **To write** | You | Days |
| 13 | **Business plan with financial projections** | **To write** | You | Days–weeks |
| 14 | **Audited financials, last 3 FYs** | ⚠️ **May not exist — check with CA now** | You / CA | **Unknown — could be blocking** |
| 15 | **MoUs / Agreements / LOI with Financial Institutions** for sandbox testing | **To secure** | You | **Weeks — longest commercial lead time** |
| 16 | Regulatory licences / authorisations held | Likely none yet | You | — |
| 17 | Details of pilots conducted | Your existing prototype demo may qualify | You | Days |

### Item 11 broken out — the technical pack

| Sub-item | Source |
|---|---|
| (i) Technical architecture **including deployment diagram** | Build output — I produce this |
| (ii) Technology stack: front-end, back-end, middleware, database | Build output |
| (iii) Usage of AI / ML / **DLT / Blockchain** | Build output — Solana + Hyperledger Fabric |
| (iv) Intellectual property rights, applied or granted | You — likely none |
| (v) **VAPT report + certificate by CERT-In empanelled auditor** | 🔴 **External — commission early** |
| (vi) ISO certificates, other assessments | You — likely none |
| (vii) **Technology Readiness Level** of the proposed product | Joint — stated honestly against the build state |

---

## 3. FRS vs FIS — worth understanding before you commit

FAQ Q4 reveals something material:

> FSEs operating under the **FIS** are exempt from **clause 20** (user consent and compensation disclosure) **and clause 28** (books of accounts and currency requirements).

Clause 28 is the INR restriction. So:

| | **FRS** (Regulatory Sandbox) | **FIS** (Innovation Sandbox) |
|---|---|---|
| Real customers | **Yes** — limited set, live | **No** — isolated from live market, uses data provided by IFSC financial institutions |
| Clause 28 (foreign-currency-only) | **Applies** | **Exempt** |
| Clause 20 (consent/compensation) | Applies | Exempt |
| Physical IFSC presence | Not generally required; **required if holding customer funds** needing an IBU account | Not required |

**Recommendation: FRS.** You need real transfers with real customers to prove the product; FIS cannot do that. But note that FRS is what brings the INR restriction — which is why the application leads with the **inbound (USA→India)** corridor, where the entity receives foreign currency and a licensed domestic partner handles the INR payout.

---

## 4. Revised timeline — honest version

```
AUG  W1  Aug 9-15    BUILD: M0 security + M1 ledger
         ADMIN: download Preliminary template + CAF (authoritative scope)
                board meeting → Board Resolution (item 4)
                CA: do 3 years of audited financials exist? (item 14)
                start Testing Partner MoU conversations (item 15)
                send pre-application email to fe-sandbox@ifsca.gov.in
                shortlist CERT-In empanelled auditors, get quotes (item 11v)

AUG  W2  Aug 16-22   BUILD: M2 FX engine + M3 quotes
         ADMIN: collect KYC pack (items 6, 7, 9), shareholding pattern (item 8)
                draft pitch deck (item 12) + business plan (item 13)

AUG  W3  Aug 23-29   BUILD: M4 idempotency + M5 state machine
         ADMIN: draft Preliminary Application against the real template

AUG  W4  Aug 30-Sep 5 BUILD: M6 providers + M7a REAL USDC on devnet → DEMO
         ▶ SUBMIT PRELIMINARY APPLICATION            ← the milestone that starts the clock
                                                        Everything below runs during their 30 days

SEP      Sep 5 - Oct 5  IFSCA assesses Preliminary (≤30 days)
         BUILD: M8 reconciliation, M9 compliance surface, M10 frontend
                → code freeze for audit
         ADMIN: ▶ COMMISSION VAPT AUDIT (needs stable code — this is why it lands here)
                assemble the full Annexure I document pack

OCT      Preliminary accepted → prepare CAF
         VAPT remediation + re-test if findings
         ▶ SUBMIT FINAL APPLICATION + fee

OCT-DEC  IFSCA examines Final (≤60 days) → In-Principle Approval
         ≤30 days to satisfy conditions (may require the Testing Partner MoU)
         ▶ LIMITED USE AUTHORISATION → Testing Stage begins (12 months, +6 extension)
```

**What is genuinely achievable by ~5 September:** Preliminary Application submitted + a working demo with real USDC settlement on devnet.

**What is not:** the Final Application. The VAPT audit alone makes that structurally impossible, and it is the correct sequencing anyway — you want the audit run against complete, frozen code, not a moving target.

---

## 5. Build plan — M0 to M7a

Full specification with file paths and line numbers is in `NIVIX_MASTER_BUILD_PLAN.md`. Summary and sequence:

### W1 — M0 Security (blocking) + M1 Ledger

**M0 — secrets first, independent of code:**
- Rotate: Solana treasury keypair, Razorpay/Cashfree credentials, SSH key
- `git rm --cached` the tracked secrets: `data/treasury-keypair.json`, `bridge-service/.env.production` / `.staging` / `.backup`, both `WALLETS_REGISTRY.json`, `nivixpemain.pem`
- Fix `.gitignore`; verify with `git ls-files`
- History rewrite **deferred** to a deliberate session (force-push breaks existing clones; once rotated, the committed copies are dead weight)

**M0 — code:**

| Fix | Location |
|---|---|
| Real HMAC over **raw bytes** with `timingSafeEqual`; mock provider only when `NODE_ENV !== 'production'`; `createKycProvider()` throws at boot in prod | `apps/api/src/kyc/provider.ts:37-40,51-55` |
| Mount webhook routes with `express.raw()` **before** `express.json()`; parse only after verification | `apps/api/src/index.ts:9` |
| Delete the attacker-controlled `req.body.userId` identity fallback | `apps/api/src/routes/kyc.ts:39` |
| Remove the `JWT_SECRET` fallback; audit every `?? ''` credential default; Zod-validate config at boot | `apps/api/src/config.ts:21` |
| `helmet`, `cors` allowlist, tiered rate limiting, terminal 4-arg error handler | `apps/api/src/index.ts:8-18` |
| Wrap async handlers (Express 4 doesn't catch rejections; zero try/catch exist) | `apps/api/src/routes/*.ts` |
| Mount `requireApprovedKyc` / `requireRole` — written but never used | `apps/api/src/middleware/auth.ts:20,30` |
| Check `User.status` in `requireAuth`; add `tokenVersion` | `apps/api/src/middleware/auth.ts:6` |
| pino `redact` for credentials, signatures, PII, bank details | `apps/api/src/index.ts:10` |
| Add `User.fullName`; stop writing **email** into the compliance ledger's name field | `apps/api/src/kyc/service.ts:58` |
| `vitest.config.ts` + real specs (currently passes against zero files) | `apps/api/` |

**M1 — Ledger.** Money as **integer minor units** (`BigInt`) — every amount travels as `AmountMinor` + `Currency` + `Scale`. Models: `Asset`, `LedgerAccount`, `LedgerJournal`, `LedgerEntry`, `LedgerAccountBalance`, `LedgerCheckpoint`.

Raw-SQL constraints in the migration (Prisma can't express these):
- `amount_minor > 0` — sign lives in `direction`
- **`DEFERRABLE` trigger asserting every journal balances per currency** — in TypeScript this eventually gets bypassed by a backfill; in the database it cannot be
- Append-only triggers + `REVOKE UPDATE, DELETE` from the app role
- `LedgerJournal @@unique(kind, sourceKind, sourceRef)` — makes posting idempotent, which is what makes at-least-once webhook delivery safe

### W2 — M2 FX + M3 Quotes

**M2 —** four layers making the legacy `1.0` fallback (`exchange-rate-service.js:382`, an ~83× mispay) impossible: return type is a union with **no `number` variant**; ≥2 sources within a freshness window with dispersion checks; per-corridor sanity band; direction named not inferred. CI greps for `\|\| 1\.0` and fails the build.

**M3 —** `Corridor` as the unit of "adding a country". `Quote` with rate provenance, explicit `spreadBps`, itemized fees, hard `validUntil`, and `transferId @unique` for single-use enforcement at the DB level.

### W3 — M4 Idempotency + M5 State machine

**M4 —** `Idempotency-Key` required on money endpoints; response stored in the **same transaction** as the business write. Partner keys are **write-ahead**: persist before the request leaves the process, so a crash yields a *detectable* ambiguous state. `attemptSeq` increments only on a definitive failure. Webhooks: verify sync (raw bytes) → persist → outbox → 200; dedupe; **ordering guard** so a late lower-ranked event can't regress a completed payout.

**M5 —** three leg sub-machines driving one derived transfer state. **`indeterminate` has no exit except a provider lookup by our idempotency key** — that's what prevents double-paying. Sweeper on `stateDeadlineAt` plus an independent aggregate check on held-customer-money age.

### W4 — M6 Providers + M7a Real USDC on devnet

**M6 —** `CollectionProvider`, `PayoutProvider`, `TreasuryProvider`. The `ProviderResult` union separates `definitive` / `ambiguous` / `transport_precall` — the legacy code had one `success:false` for all three, which is how a retry becomes a double payment. `TreasuryProvider` deliberately has **no mint/burn/issue method**. `getBalance()` returns a real value or `ok:false`, and unknown means the pre-flight check **fails** (deleting the legacy fake `999999999` is the highest-value line of the port).

**M7a — real USDC transfers on Solana devnet.** Revised in — previously deferred, which was a mis-scope. USDC settlement *is* the innovation; demoing it simulated would be demoing the unremarkable part. Real `createTransferInstruction`, real balance reads, two wallets, Circle's devnet USDC mint. No external dependency, ~2–3 days.

Note this is new code — the legacy prototype has **no working SPL transfer path** anywhere (only mint and burn), so there is nothing to port.

**Deferred to the review window (M7b, M8–M10):** production custody (multisig/MPC), Circle Mint KYB, mainnet, reconciliation, compliance UI, frontend polish.

**Demo:** `docker compose up` → Fabric test-network → API + worker → full transfer: fiat in (simulated) → ledger → quote → **real USDC moves on devnet, verifiable in a block explorer** → fiat out (simulated) → Fabric compliance record. Verify ledger balances per currency, `LedgerCheckpoint` matches, Postgres mirror agrees.

---

## 6. Immediate actions — this week

**Highest value first:**

1. **🔲 Download the Preliminary Application template + CAF** from the IFSCA website / SWIT portal. Everything in §1–2 about stage split is inference from the FAQ; the templates are authoritative and may change the plan.
2. **🔲 Ask your CA: do we have 3 years of audited financials?** (Annexure I item 14.) If not, this needs a clause 13 relaxation request — and knowing now is much better than in October.
3. **🔲 Schedule the board meeting** for the Board Resolution (item 4), including appointing a **Designated Director for AML/CTF/KYC**.
4. **🔲 Send the pre-application email** — draft in `IFSCA_PRE_APPLICATION_EMAIL_DRAFT.md`. Add a third question: confirm which Fee Circular is operative (Apr 2025 vs Mar 2026 — their own documents disagree).
5. **🔲 Shortlist CERT-In empanelled VAPT auditors, get quotes and lead times.** Engage in September; knowing the cost and calendar now protects the timeline.
6. **🔲 Start Testing Partner MoU conversations** (item 15) — longest commercial lead time on the list.
7. **🔲 Begin the KYC document pack** (items 6, 7, 9) — slow if any investor is an entity rather than an individual, because their UBO KYC is needed too.

**Build:** M0 starts tomorrow (Aug 9). Not blocked by any of the above.

---

## 7. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| **No 3 years of audited financials** | 🔴 High | Check with CA immediately; prepare a clause 13 relaxation request if absent |
| **VAPT audit lead time / cost** | 🔴 High | Shortlist and quote now; commission in September against frozen code; it sits in the review window by design |
| **Stablecoin exemption refused (clause 13)** | 🔴 High | Pre-application email is the cheap way to find out. Note M0–M6 survive unchanged either way — only the `TreasuryProvider` adapter changes |
| Testing Partner MoU slips | 🟡 Medium | Doesn't block the Preliminary; clause 15 attaches it at the **In-Principle** stage, 90+ days out |
| Investor-entity UBO KYC is slow | 🟡 Medium | Start item 9 this week |
| Preliminary template demands more than expected | 🟡 Medium | Action item 1 resolves this within the hour |
| Fee circular ambiguity | 🟢 Low | Confirm in the email; fee is Stage 2 anyway |
| VAPT findings force rework | 🟡 Medium | This is precisely what M0 pre-empts — most VAPT findings on a Node API are exactly the class of issue M0 fixes |

---

## 8. What I got wrong, corrected here

Stated plainly so the record is accurate:

1. **I said the sandbox "permits a stablecoin-settled pilot"** in `NIVIX_INVESTOR_TECHNICAL_BRIEF.pdf`. The Framework never mentions stablecoins, crypto, or VDAs. It permits DLT and tokenization *support services* as technology. The route is a clause 13 exemption request that may be refused. **The investor brief still contains this claim and should be corrected before further sharing.**
2. **I deferred all USDC work (M7) past the application.** Wrong — the devnet transfer piece has no external dependency and is the actual innovation being demonstrated. Now M7a in W4.
3. **I did not know about the VAPT requirement or the 3-year audited financials requirement.** Both are in Annexure I of the FAQ, which I only located and read at this point. Both materially affect the timeline, and the VAPT is now the critical path item for Stage 2.

---

*Sources: IFSCA FinTech Sandbox Framework, Circular F.No. 505/IFSCA-FTec0FTEF/1/2023 (16 Mar 2026), 16pp; FAQs on the IFSCA FinTech Sandbox Framework (07 Aug 2026), 23pp including Annexure I — both retrieved from ifsca.gov.in and read in full via text extraction. Codebase findings from direct file reads at the cited paths and line numbers. This is a build and application plan, not legal advice.*
