# 🏛️ NIVIX — IFSC Legal & End-to-End Build Plan

**Version:** 1.0
**Date:** 2026-06-25
**Owner:** NivixPe Private Limited (Bennett University Hatchery)
**Regulatory home:** GIFT City IFSC, regulated by **IFSCA**
**Status of this document:** Strategic plan — *legal-first*. Replaces the "production-ready" framing in `NIVIX_MASTER_DOCUMENTATION.md` with a realistic, law-aligned roadmap.

> ⚠️ **Not legal advice.** Every item marked **[VERIFY-LAWYER]** must be confirmed with a qualified IFSCA/FEMA fintech lawyer before you act on it. The exact capital, scope, and corridor rules are set by IFSCA on a case-by-case basis.

---

## 0. The one-paragraph thesis

Mainland India bans converting INR → crypto for cross-border remittance under FEMA. **GIFT City IFSC is the legal door:** it is treated as **non-resident / a foreign jurisdiction for FEMA**, so transactions through it are non-resident-to-non-resident and mainland FX restrictions don't apply. IFSCA is the single-window regulator. The realistic entry point for an early-stage team is the **IFSCA FinTech Regulatory Sandbox** (which legally allows a stablecoin-settled cross-border pilot with limited customers), graduating into a **VDA registration and/or Payment Services authorization** as you scale. The technical re-architecture (USDC instead of a self-minted token, licensed on/off-ramp partners, a real database instead of Hyperledger) is what makes the platform *defensible* under that licence.

---

## 1. Legal foundation — what IFSC/IFSCA actually gives us

### 1.1 Why GIFT City solves the FEMA blocker
- IFSC is treated as **"non-resident"** for foreign-exchange purposes. A flow from outside India into the IFSC is a **non-resident-to-non-resident** transaction, so mainland India's FEMA restrictions **do not apply** to it.
- IFSCA is a **single-window, light-touch, principle-based regulator** for all financial activity inside GIFT City.
- Incentives: **100% foreign ownership**, and **up to a 20-year tax holiday** (Budget 2026 doubled it from 10).

### 1.2 The two legal tracks (do not confuse them)

| Track | Licence/route | What it permits | Hard limit |
|---|---|---|---|
| **A — Fiat PSP** | IFSCA (Payment Services) Regulations, 2024 | Account issuance / **e-money**, escrow, **cross-border money transfer**, merchant acquisition | Wallets hold **fiat only** (USD/EUR/GBP/SGD). **No crypto in the wallet.** |
| **B — VDA / Sandbox** | IFSCA FinTech Regulatory Sandbox (issued 16 Mar 2026) → IFSCA-registered VDA platform (recognised in Budget 2025-26) | **Legally experiment with stablecoin / tokenized settlement** with limited real customers for a limited time | Time-boxed, capped customers; full licence required to scale |

➡️ **Nivix keeps the blockchain/USDC rail, so our entry is Track B (Sandbox).** Track A is the model we graduate the *fiat legs* into later.

### 1.3 Two honesty checks (do not skip)
1. **GIFT City is not a loophole for mainland retail INR.** A resident Indian sending rupees still goes through **LRS / AD banks**. So our compliant corridors are **foreign↔foreign, IFSC↔abroad, NRI & B2B**, OR we attach a **FIU-IND-registered VDASP / AD-bank partner** for any INR on-ramp leg.
2. **We cannot get a full PSP licence as a student team upfront.** It needs a GIFT-IFSC incorporated entity, business presence, and an IFSCA-set security deposit/capital **[VERIFY-LAWYER]**. The **sandbox is designed precisely so we don't need that on day one.**

### 1.4 Compliance obligations we design for from day 1
- **KYC/AML** on every customer (vendor-based — see §5).
- **PMLA / FIU-IND** reporting posture; **STR** (suspicious transaction reports) capability.
- **Travel Rule** message exchange above thresholds for the crypto leg.
- **Sanctions screening** at each hop (real list, not the test patterns currently in the code).
- **Data protection (DPDPA 2023)** — consent, minimization, breach notification.
- **5-year record retention.**

---

## 2. Target operating model

**Decision required in Phase 0 [VERIFY-LAWYER]:** pick ONE primary corridor + customer to launch. Recommended order of legal ease:

1. **B2B cross-border settlement (easiest)** — businesses paying suppliers/contractors abroad. Counterparties are entities → KYB is cleaner, no retail-FEMA friction.
2. **NRI / foreign-to-India inbound** — leverages IFSC non-resident status.
3. **Retail remittance (hardest)** — needs licensed local fiat partners on both ends.

**Entity structure (target):**
- `NivixPe Pvt Ltd` (mainland) = product/engineering + India fiat partnerships.
- `Nivix IFSC` (GIFT City entity) = the regulated payment/VDA entity, formed after In-Principle Approval.

---

## 3. End-to-end roadmap (legal + technical in lockstep)

> Each phase has **Legal**, **Technical**, and an **Exit Gate**. Do not start the next phase until the gate is met. Timeline assumes a small team starting 2026-07.

### Phase 0 — Validate & decide (Weeks 1–4)
**Legal**
- [ ] Engage an IFSCA/FEMA fintech lawyer. **[VERIFY-LAWYER]**
- [ ] Confirm: can we run a stablecoin-settled pilot via the IFSCA FinTech Sandbox? Which corridor/customer keeps us inside FEMA?
- [ ] Confirm exact sandbox eligibility, application contents, and any security deposit.
- [ ] Lock the launch corridor + customer (§2).

**Technical**
- [ ] Freeze new feature work on the demo. Tag current state as `v0-poc-devnet`.
- [ ] Remove committed secrets from git history (`bridge-service/.env`, `.env.backup`) and rotate the test keys.
- [ ] Write the "honest status" addendum to existing docs (POC, not production).

**Exit gate:** Lawyer confirms a viable sandbox path + corridor; secrets purged.

---

### Phase 1 — Enter the IFSCA FinTech Sandbox (Months 1–3)
**Legal**
- [ ] Prepare and submit the **IFSCA FinTech Sandbox application** (business model, risk controls, customer cap, test duration, exit plan).
- [ ] Draft Terms of Service, Privacy Policy (DPDPA), KYC/AML policy.
- [ ] Line up a **FIU-registered VDASP / licensed on-ramp partner** for any INR leg (e.g. Onmeta/Transak-type) **[VERIFY-LAWYER]**.

**Technical** (the re-architecture — see §4 and §6)
- [ ] Replace self-minted SPL token with **real USDC** settlement.
- [ ] Stand up **Postgres** (or managed DB) for orders, users, ledger; remove JSON-file state.
- [ ] Integrate a **KYC/AML vendor** (Sumsub / HyperVerge) for verification; **keep Hyperledger Fabric** as the compliance/audit ledger but re-deploy it **multi-org** (≥1 independent endorser) and remove the plaintext fallback.
- [ ] Integrate **licensed on/off-ramp partner APIs**; delete the simulated treasury and mock AMM.
- [ ] Real **sanctions/Travel-Rule** integration.
- [ ] Secrets in a vault; environment-driven mainnet/devnet switch.

**Exit gate:** Sandbox admission granted; re-architected stack passes an internal end-to-end test on a limited corridor.

---

### Phase 2 — Run the live pilot (Months 3–9)
**Legal**
- [ ] Operate within sandbox limits (customer cap, value cap, duration).
- [ ] File required reports; demonstrate KYC/AML/STR controls work.
- [ ] Collect evidence for the full-licence application.

**Technical**
- [ ] Move the settlement leg to **mainnet USDC** (only when sandbox terms allow).
- [ ] Observability: audit logging, reconciliation jobs, alerting.
- [ ] Security review / external audit of the smart contract and bridge.
- [ ] Real admin dashboard (replace the empty mock methods).

**Exit gate:** Clean pilot results, zero critical compliance findings, reconciliation proven.

---

### Phase 3 — Graduate to a full licence & scale (Months 9–18+)
**Legal**
- [ ] Incorporate the **GIFT-IFSC entity** after **In-Principle Approval**.
- [ ] Apply for **IFSCA VDA registration and/or Payment Services authorization** for the fiat legs; meet capital/security-deposit requirements **[VERIFY-LAWYER]**.
- [ ] Claim the IFSC tax holiday; finalize banking relationships.

**Technical**
- [ ] Add corridors one at a time, each with a compliant local fiat partner.
- [ ] Scale infra (HA, load testing, DR), formal key-management/HSM.

**Exit gate:** Authorization granted; first non-sandbox corridor live.

---

## 4. What we keep, change, and cut (mapped to the real codebase)

| Area | Current file(s) | Action | Why |
|---|---|---|---|
| Settlement token | `solana/nivix_protocol/.../lib.rs` (self-mint, fixed-rate swap) | **CHANGE** → settle in **USDC**; reduce custom program to escrow/memo/transfer-tracking only | Self-minting = unlicensed stablecoin; USDC removes that liability |
| Liquidity pools / AMM | `bridge-service/src/solana/anchor-liquidity-client.js` (mock IDL) | **CUT** | Mock, not real; FX belongs with licensed partners |
| Treasury | `bridge-service/src/treasury/treasury-manager.js` (`convertToStablecoin` placeholder, `reserveFunds` console.log) | **CUT/REPLACE** with partner-held liquidity + DB ledger | We should not run an unlicensed money pool |
| KYC / compliance ledger | `fabric-samples/.../nivix-kyc.go`, `kyc-data-store.json` | **KEEP Fabric (contractual deliverable) → upgrade to genuinely MULTI-ORG**; PII in private data collections; add a KYC vendor for verification; **delete the plaintext `kyc-data-store.json` fallback** | Dual-blockchain is a funded pitch pillar; multi-org makes it real (not theater) and gives the fraud-safety guarantee |
| On-ramp | `bridge-service/src/onramp/onramp-engine.js` | **CHANGE** → call licensed partner; deliver USDC | Razorpay becomes the *India fiat partner leg*, not the core |
| Off-ramp | `bridge-service/src/offramp/offramp-engine.js` | **CHANGE** → licensed payout partner; remove mock token addresses | Real payout, real backing |
| API server | `bridge-service/src/index.js` (2,707 lines, many `(simulated)` paths) | **REFACTOR** → remove simulated endpoints, add real DB + auth | Production correctness |
| Secrets | `bridge-service/.env`, `.env.backup` (committed) | **CUT from git** + rotate + vault | Security hygiene |
| Network | hardcoded `api.devnet.solana.com` | **CHANGE** → env-driven, mainnet for pilot | Production readiness |

**Keep:** the overall flow, the USDC-on-Solana settlement concept, the API structure, the KYC *flow* (not its storage), the Razorpay integration (repositioned as one fiat partner).

---

## 5. Target end-to-end architecture (the "right way")

```
                ┌──────────────────────────────────────────────┐
                │            Nivix IFSC (regulated)            │
                └──────────────────────────────────────────────┘
 Sender (KYC'd)                                                   Recipient (KYB/KYC'd)
     │                                                                   ▲
     ▼                                                                   │
[Local fiat in]            [Stablecoin settlement]              [Local fiat out]
 Licensed on-ramp   ─USDC─►  USDC on Solana (mainnet)  ─USDC─►   Licensed off-ramp
 partner (e.g. India        custody + transfer +                partner (destination
 FIU-VDASP / AD bank)       memo/tracking program              country, licensed)
     │                              │                                    │
     └──────────────┬───────────────┴───────────────┬────────────────────┘
                    ▼                                ▼
            KYC/AML vendor                  Postgres ledger + reconciliation
        (Sumsub/HyperVerge)               (orders, users, txns, audit trail)
                    │                                ▲
                    └──── Sanctions + Travel Rule + STR/FIU reporting ────┘
```

**Recommended stack**
- **Settlement:** USDC on Solana (Circle); minimal on-chain program for transfer/memo/escrow only.
- **On/off-ramp:** licensed partners per corridor (India: FIU-registered VDASP/AD bank; global: Circle/Bridge/BVNK-type orchestration). **[VERIFY-LAWYER]**
- **KYC/AML:** Sumsub or HyperVerge.
- **Data:** Postgres (managed), Redis for cache/queues.
- **Backend:** keep Node/Express, refactored; secrets in a vault (e.g. AWS Secrets Manager).
- **Frontend:** existing React app, cleaned up.
- **Infra:** containerized, HA, audit logging, monitoring.

---

## 6. Money flow — who is licensed at each hop

1. **In:** Sender funds via a **licensed on-ramp partner** → partner delivers **USDC** to Nivix-controlled address. *(Nivix never touches unlicensed fiat custody.)*
2. **Settle:** USDC transfer on Solana, recorded in the **DB ledger** with full audit trail + Travel-Rule data.
3. **Out:** **Licensed off-ramp partner** in the destination country converts USDC → local fiat → recipient bank.
4. **Compliance:** KYC at onboarding, sanctions at each hop, STR/FIU reporting, 5-year retention.

**The rule:** Nivix orchestrates and records; **licensed partners hold fiat and bear the money-transmitter risk.** This is what keeps us inside the sandbox and, later, an IFSCA licence.

---

## 7. Security & key management (replacing current practice)
- [ ] Purge `.env`/keys from git history; rotate all keys.
- [ ] Secrets in a managed vault — never in JSON files or repo.
- [ ] Treasury/settlement keys → multisig + HSM before mainnet scale.
- [ ] Encrypt PII at rest; TLS everywhere; RBAC on admin.
- [ ] External smart-contract + pen-test audit before non-sandbox launch.

---

## 8. Indicative cost & resourcing **[VERIFY-LAWYER / estimates]**
| Item | When | Rough order |
|---|---|---|
| Fintech lawyer (initial) | Phase 0 | engagement fee |
| Sandbox application | Phase 1 | mostly time + legal |
| KYC/AML vendor | Phase 1+ | per-verification pricing |
| On/off-ramp partners | Phase 1+ | per-transaction fees |
| GIFT-IFSC entity + capital/security deposit | Phase 3 | IFSCA-set **[VERIFY]** |
| Audit (security + smart contract) | Phase 2 | one-time |

*Treat exact figures as unknown until the lawyer + IFSCA confirm.*

---

## 9. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Misreading FEMA/IFSC scope | Lawyer sign-off on corridor before launch; start B2B/foreign-to-foreign |
| Sandbox rejection | Strong KYC/AML controls + clear customer cap + exit plan in application |
| Partner dependency | Multi-partner per corridor; abstract behind one internal interface |
| Stablecoin/regulatory shift (USDC jurisdictional versions) | Use Circle's compliant USDC; monitor MiCA/GENIUS-style changes |
| Over-building | Cut Fabric/AMM/treasury now; orchestrate, don't operate |

---

## 10. Immediate next steps (this week)
1. [ ] Book the IFSCA/FEMA lawyer consult (Phase 0).
2. [ ] Decide launch corridor + customer (recommend **B2B cross-border**).
3. [ ] Purge committed secrets from git + rotate keys.
4. [ ] Open Circle (USDC) and a KYC-vendor sandbox account to start integration.
5. [ ] Relabel existing docs as "POC / devnet" to protect credibility.

---

## 11. Questions to bring to the lawyer
1. Can we run a **stablecoin-settled cross-border pilot via the IFSCA FinTech Sandbox**? What's the application scope and customer/value cap?
2. Which **corridor + customer type** keeps us cleanly inside FEMA (B2B vs NRI vs retail)?
3. For any **INR leg**, do we need a FIU-registered VDASP/AD-bank partner, and which structures are compliant?
4. What are the **eligibility, capital, and security-deposit** requirements for the eventual PSP/VDA authorization?
5. What **KYC/AML/Travel-Rule/STR** obligations apply during the sandbox vs full licence?
6. Timeline and cost for **In-Principle Approval → GIFT-IFSC entity → Final Authorization**?

---

## 12. References
- IFSC as foreign jurisdiction for FEMA + PSP categories — Cyril Amarchand, *FIG Paper 49: IFSC, GIFT City – A New Legal Frontier for Cross-Border Payments* (Aug 2025): https://corporate.cyrilamarchandblogs.com/2025/08/fig-paper-no-49-ifsc-gift-city-a-new-legal-frontier-for-cross-border-payments/
- IFSCA Payment Services Regulations 2024 — categories, "no crypto in wallet", In-Principle → Final Authorization: https://www.giftcfo.com/post/unlocking-payment-service-opportunities-in-gift-city-faqs-on-ifsca-ps-regulations
- IFSCA FinTech Regulatory Sandbox (issued 16 Mar 2026): https://indiajuris.com/newsletters/the-new-2026-ifsca-fintech-sandbox-framework/
- Budget 2025-26 recognition of IFSCA-registered VDA platforms + tokenization: https://www.ainvest.com/news/india-emerging-tokenised-financial-infrastructure-strategic-investment-opportunities-blockchain-partners-2511/
- GIFT City tax benefits (20-year holiday, 100% foreign ownership): https://clevercoins.org/gift-city-investment-tax-benefits/
- Mainland FEMA limits on INR→stablecoin remittance: https://sriyaent.com/stablecoins-and-cross-border-transactions-understanding-fema-compliance-risks-for-indian-businesses/
- Stablecoin reserve/licensing norms (USDC vs self-issued): https://sumsub.com/blog/global-stablecoin-compliance-guide/

---

*End of plan. Legal-first, sandbox-entry, USDC-settled. Confirm every **[VERIFY-LAWYER]** item before acting.*
