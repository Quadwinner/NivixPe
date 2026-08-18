# 💰 NIVIX — Money Flow & Architecture Report

**Version:** 1.0
**Date:** 2026-07-13
**Purpose:** Investor pitch reference + development guide
**Classification:** Internal — Investor & Development Team

---

## 1. Executive Summary

Nivix is a cross-border payment platform that settles international transfers in **under 2 seconds** at a cost **under $1**, compared to traditional banking rails (3–5 days, $25–45). It achieves this by using **USDC stablecoin on Solana** as the settlement layer, while licensed **fiat-only partners** handle local currency collection and payout on each end.

**The one-line model:**

> Fiat partners handle local currency. Nivix owns a pre-funded USDC treasury on Solana. When payment is confirmed, we release USDC — it settles in 2 seconds — and the destination partner pays out local fiat. We own the treasury, the routing, and the compliance layer.

---

## 2. Core Architecture — Who Does What

| Entity | Holds | Role |
|---|---|---|
| **On-ramp fiat partner** (Razorpay/Cashfree) | Local fiat (INR) only | Collects sender's payment, confirms to Nivix |
| **Nivix** | **USDC treasury pool** (Solana) | Releases USDC when fiat confirmed; receives USDC back on off-ramp; orchestrates + compliance |
| **Off-ramp fiat partner** (Cashfree/Circle Mint) | Local fiat (USD/EUR) only | Receives equivalent fiat from Nivix, pays recipient's bank |
| **Hyperledger Fabric** (multi-org) | KYC + compliance records | Immutable, private, tamper-proof audit trail |
| **Solana** (public chain) | USDC settlement transactions | Fast, cheap, publicly verifiable money movement |

**Key design principle:**

> Nivix **never issues its own token**. The asset on-chain is always **Circle's USDC** — regulated, 1:1 backed by US Treasuries, accepted globally. Fiat partners **never touch crypto**. They operate purely in local currency. This separation is what keeps the platform legal under IFSCA.

---

## 3. Step-by-Step Money Flow

### 3.1 India → USA corridor (primary example)

```
SENDER              FIAT PARTNER          NIVIX TREASURY         FIAT PARTNER         RECIPIENT
(India)             (Razorpay/Cashfree)   (USDC, Solana)         (Circle/Cashfree)    (USA)
  │                      │                      │                      │                 │
  │─── ① Pays ₹8,300 ──▶│                      │                      │                 │
  │    (UPI/IMPS/NEFT)   │                      │                      │                 │
  │                      │── ② Confirms ───────▶│                      │                 │
  │                      │   "₹8,300 received"  │                      │                 │
  │                      │   (webhook)          │                      │                 │
  │                      │                      │── ③ Sends 100 USDC ─▶│                 │
  │                      │                      │   (Solana, 2 sec)    │                 │
  │                      │                      │                      │── ④ Pays $99 ──▶│
  │                      │                      │                      │   (wire/ACH)    │
  │                      │                      │                      │                 │
  │◀──────────── ⑤ Confirmation + receipt ──────────────────────────────────────────────▶│
```

### 3.2 Step-by-step explanation

| Step | What happens | Who does it | Time | Risk holder |
|------|-------------|-------------|------|-------------|
| **①** | Sender pays ₹8,300 via UPI/bank transfer | **Razorpay/Cashfree** (licensed, RBI-regulated) | Instant | Fiat partner |
| **②** | Payment confirmed via webhook to Nivix | **Nivix API** verifies signature | Seconds | Nivix |
| **③** | Nivix releases 100 USDC from treasury → off-ramp partner on Solana | **Nivix treasury** (our wallet) | **~2 seconds** | Nivix (custody) |
| **④** | Off-ramp partner converts USDC to fiat, pays recipient's bank | **Circle Mint / Cashfree** (licensed) | Minutes–hours | Fiat partner |
| **⑤** | Both parties receive confirmation + transaction receipt | **Nivix** (via app) | Instant | — |

### 3.3 What Nivix records (compliance trail)

Every transaction writes to **Hyperledger Fabric** (multi-org, tamper-proof):
- Sender KYC status + risk score
- Sanctions screening result
- Transaction details (amount, corridor, FX rate, partners)
- Compliance approval
- Timestamp + endorsing organizations

---

## 4. The USDC Treasury Model

### 4.1 What the treasury is

- A **Solana wallet** holding real USDC (Circle-issued, 1:1 backed)
- **Pre-funded** with company/investor capital
- **Nivix-controlled** (multisig + HSM in production)
- The "engine" that makes instant settlement possible

### 4.2 How it stays funded (self-balancing)

The treasury does NOT need refilling after every transaction. It works like a float:

```
WHEN SENDER PAYS (India → USA):
  ₹ comes IN → Nivix bank account (INR grows)
  USDC goes OUT → off-ramp partner (treasury shrinks)

WHEN TRAFFIC GOES THE OTHER WAY (USA → India):
  $ comes IN → off-ramp sends USDC back (treasury grows)
  ₹ goes OUT → Nivix pays via Cashfree (INR shrinks)

NET EFFECT: Two-way traffic = treasury self-balances
```

### 4.3 Rebalancing strategy

| Scenario | Action | Frequency |
|---|---|---|
| **Two-way corridors** (India↔USA) | Self-balancing — no action needed | Automatic |
| **One-sided traffic** (90% India→USA) | Convert accumulated INR → buy USDC | Weekly/monthly |
| **Treasury < 30% capacity** | Auto-trigger: buy USDC from collected fiat | Automatic (threshold-based) |
| **Treasury < 10% capacity** | Emergency alert to ops; pause large transfers | Rare |

### 4.4 Treasury economics

```
Starting treasury:        $50,000 USDC (pre-funded)
Daily volume capacity:    ~$50,000 (1x turnover)
                          ~$150,000 (3x turnover with rebalance)

Revenue per $100 transfer:
  Platform fee:           $0.30–$0.50  (0.3–0.5%)
  FX spread:             $0.30–$0.50
  ─────────────────────────────────────
  Gross margin/tx:        $0.60–$1.00

At 10,000 tx/month ($1M volume):
  Monthly revenue:        $6,000–$10,000
  Annual revenue:         $72,000–$120,000
```

---

## 5. Why This Design (vs. alternatives)

### 5.1 Why real USDC (not our own token)?

| Own token | Real USDC (our choice) |
|---|---|
| Need a stablecoin licence (GENIUS Act/MiCA/IFSCA) | Circle already licensed |
| Must prove 1:1 reserves with audits | Circle does that |
| Worthless outside our platform | Universally accepted |
| Off-ramp partners won't accept it | Every partner accepts USDC |
| Regulators ask "where's the backing?" | Backing = Circle's US Treasuries |

### 5.2 Why fiat-only partners (not crypto partners)?

| Crypto on-ramp partner | Fiat-only partner (our choice) |
|---|---|
| Partner holds USDC → we depend on their reserves | We hold our own treasury → full control |
| Partner takes margin on INR→USDC conversion | We control the conversion margin |
| More middlemen = more cost | Fewer hops = cheaper |
| We don't control settlement timing | We release USDC the instant fiat is confirmed |

### 5.3 Why our own treasury pool?

| No treasury (pass-through only) | Own treasury (our choice) |
|---|---|
| Must wait for partner to convert + send USDC | **Instant** — USDC is already in our wallet |
| Settlement depends on partner's speed | Settlement depends only on Solana (2 sec) |
| Less margin control | We control the full spread |
| Partner outage = system down | Treasury gives us buffer + independence |

---

## 6. Dual-Blockchain Architecture

### 6.1 Why two blockchains?

| Concern | Solution | Why not just one? |
|---|---|---|
| **Money settlement** (public, verifiable) | **Solana** (USDC transfers) | Must be public so reserves are auditable by anyone |
| **Compliance records** (private, tamper-proof) | **Hyperledger Fabric** (multi-org) | KYC/PII data CANNOT be on a public chain (illegal) |

### 6.2 What goes where

```
SOLANA (public):                    HYPERLEDGER FABRIC (private, multi-org):
• USDC transfer transactions        • KYC status + risk scores
• Treasury balance (verifiable)      • Sanctions screening results
• Proof of reserves                  • Transaction compliance approvals
• Transaction signatures             • Audit trail (who approved what)
• Anyone can verify                  • Only authorized parties can read
```

### 6.3 The fraud-safety guarantee

Hyperledger Fabric is run **multi-org** (Nivix + independent endorser). This means:
- **No single party** (including Nivix) can alter compliance records
- Every KYC approval requires **endorsement from both organizations**
- If Nivix tried to fake a record → the independent endorser rejects it
- This is the same guarantee that FTX/collapsed exchanges lacked

---

## 7. Revenue Model

| Revenue stream | Source | Typical margin |
|---|---|---|
| **Platform fee** | Flat % per transaction | 0.3–0.5% |
| **FX spread** | Difference between locked user rate and market rate | 0.2–0.5% |
| **Treasury yield** | USDC in treasury earns interest (Circle offers ~4.5% APY on large holdings) | ~4.5% APY on idle pool |
| **Volume incentives** | Fiat partners offer rebates at volume tiers | Variable |

**Total take rate per transaction: 0.5–1.0%**
(vs. traditional remittance: 5–10%)

---

## 8. Legal & Regulatory Structure

| Aspect | Status |
|---|---|
| **Legal home** | GIFT City IFSC, Gujarat (regulated by IFSCA) |
| **FEMA status** | IFSC = "non-resident" jurisdiction → mainland FX restrictions don't apply |
| **Entry route** | IFSCA FinTech Regulatory Sandbox (permits stablecoin-settled pilot with real customers) |
| **Report submitted to IFSCA** | ✅ Yes |
| **Company** | NivixPe Private Limited (Bennett University Hatchery) |
| **Tax benefit** | Up to 20-year tax holiday in GIFT City (Budget 2026) |
| **KYC/AML** | Hyperledger Fabric (multi-org) + KYC vendor (Sumsub/HyperVerge) |
| **Data protection** | DPDPA 2023 compliant; PII in Fabric private data collections |

**The rule that keeps us legal:**
> Nivix orchestrates and records. Licensed fiat partners handle local currency. We hold USDC (not fiat). IFSCA sandbox permits stablecoin settlement within its jurisdiction.

---

## 9. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Settlement** | Solana + USDC (Circle) | Fast, cheap, public money movement |
| **Compliance ledger** | Hyperledger Fabric (multi-org) | Private, tamper-proof KYC/audit records |
| **Backend** | Node.js + TypeScript (Express, Prisma, BullMQ) | API + async job processing |
| **Database** | PostgreSQL | Operational data + fast-query mirror of Fabric |
| **Queue** | Redis + BullMQ | Job queue (Fabric writes, webhooks, retries) |
| **Frontend** | React + Material-UI | User interface |
| **On-ramp** | Razorpay / Cashfree API | INR collection |
| **Off-ramp** | Cashfree Payouts / Circle Mint API | Fiat payout (INR/USD/EUR) |
| **KYC** | Sumsub / HyperVerge | Identity verification |
| **Hosting** | AWS (Managed Blockchain, RDS, ElastiCache) — local Docker for now | Infrastructure |

---

## 10. Current Status & Roadmap

### 10.1 What's working today (demonstrated)

- ✅ End-to-end transfer: sender pays INR → tokens settle → recipient gets fiat (Cashfree)
- ✅ KYC flow (submit, verify, admin dashboard)
- ✅ Hyperledger Fabric running (2-org, KYC chaincode)
- ✅ Frontend with full transfer wizard (KYC check → recipient → amount → processing → receipt)
- ✅ Report submitted to IFSCA

### 10.2 What's being built (Phase 1 — identity + compliance backbone)

- 🔄 Clean TypeScript monorepo (apps/api, apps/worker, packages/shared) — scaffolded
- 🔄 Postgres + Redis (Docker, running locally)
- 🔄 Auth (register/login/JWT/roles)
- 🔄 KYC vendor integration (Sumsub sandbox)
- 🔄 Multi-org Hyperledger Fabric (hardened chaincode, private data collections)
- 🔄 Provider interfaces (SecretsProvider, Encryptor) for AWS migration

### 10.3 Roadmap

| Phase | Duration | Delivers |
|---|---|---|
| **Phase 1** — Identity + compliance | 6 weeks | Auth, KYC vendor, multi-org Fabric, audit trail |
| **Phase 2** — Money movement | 6 weeks | USDC settlement, on-ramp (Razorpay), off-ramp (Cashfree/Circle), quotes/FX |
| **Phase 3** — Sandbox pilot | 4 weeks | Deploy to IFSCA sandbox, limited live transactions, reports to IFSCA |
| **Phase 4** — Scale | Ongoing | Additional corridors, more partners, full IFSCA licence |

---

## 11. Competitive Comparison

| | Traditional (SWIFT/banks) | Wise/Remitly | **Nivix** |
|---|---|---|---|
| **Settlement time** | 3–5 days | 1–2 days | **~2 seconds** |
| **Fee** | $25–45 | $5–15 | **< $1** |
| **Transparency** | Opaque | Some tracking | **Fully on-chain (public)** |
| **Audit trail** | Internal bank records | Internal | **Blockchain (tamper-proof)** |
| **Availability** | Business hours | 24/7 | **24/7** |
| **Minimum transfer** | Often $500+ | $1 | **$1** |

---

## 12. Risk Management

| Risk | Mitigation |
|---|---|
| **Treasury depletion** (one-sided traffic) | Auto-rebalance at 30% threshold; alert at 10% |
| **USDC de-peg** | Circle is the most regulated stablecoin (US Treasuries backing); monitor; diversify to EURC if needed |
| **Partner outage** | Multiple partners per corridor; provider interface = swappable |
| **Regulatory change** | IFSCA sandbox gives us legal cover; proactive compliance; ready to add corridor-specific licences |
| **Fraud / money laundering** | KYC on every user; sanctions screening; transaction limits; multi-org Fabric (can't be altered) |
| **Key compromise** | Multisig + HSM for treasury; secrets in vault; least privilege |

---

## 13. Key Metrics (targets)

| Metric | Target |
|---|---|
| End-to-end transfer time | < 15 minutes (including fiat legs) |
| USDC settlement | < 5 seconds |
| Platform fee | 0.3–0.5% |
| Treasury backing ratio | ≥ 100% always |
| Uptime | 99.9% |
| KYC approval rate | > 90% |
| Compliance audit (Fabric) integrity | 100% verifiable |

---

## 14. Investor FAQ

**Q: Where does the money actually come from?**
> From our pre-funded USDC treasury. When sender pays INR, the INR goes to our bank account via the fiat partner. We release the equivalent USDC from our Solana treasury. The treasury refills naturally from two-way traffic + periodic INR→USDC conversion.

**Q: What does Nivix own/control?**
> The USDC treasury, the orchestration layer (routing, quotes, reconciliation), and the compliance engine (Hyperledger audit trail). We do NOT hold customer fiat directly, do NOT issue our own token, and do NOT take unhedged FX risk.

**Q: How do you make money?**
> Platform fee (0.3–0.5%) + FX spread (0.2–0.5%) + treasury yield (~4.5% APY on idle USDC). At $1M monthly volume: $6,000–$10,000/month revenue.

**Q: Why Solana? Why not just SWIFT?**
> Speed: 2 seconds vs 3–5 days. Cost: $0.001 vs $25–45. Transparency: public ledger vs opaque internal records. And it's 24/7 — no banking hours.

**Q: Why Hyperledger? You already have Solana.**
> Different jobs. Solana = PUBLIC (money trail, anyone can verify reserves). Hyperledger = PRIVATE (KYC/PII data, only authorized parties see it). Public money + private compliance = dual-blockchain.

**Q: Is this legal?**
> Yes — structured under GIFT City IFSC (treated as non-resident for FEMA), regulated by IFSCA. Entering the IFSCA FinTech Sandbox. Report already submitted. 20-year tax holiday.

**Q: Do you need to refill the treasury every time?**
> No. Two-way corridors self-balance. One-sided traffic = periodic rebalance (weekly/monthly, not per-transaction). Auto-threshold alerts handle it.

**Q: What if USDC loses its peg?**
> Circle's USDC is the most regulated stablecoin — backed 1:1 by US Treasuries and bank deposits, audited monthly by Deloitte. A de-peg would affect the entire crypto industry, not just us. We monitor in real-time and can pause operations instantly.

**Q: What's your moat?**
> 1) IFSCA regulatory position (first-mover in GIFT City for stablecoin remittance). 2) Dual-blockchain compliance (hard to replicate, regulators love it). 3) Treasury model gives us instant settlement — most competitors still wait for partner conversion. 4) Multi-corridor routing engine (cheapest path per transfer).

---

## 15. One-Slide Summary

```
╔══════════════════════════════════════════════════════════════════╗
║                    NIVIX — HOW MONEY MOVES                      ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   SENDER (₹)                                     RECIPIENT ($)  ║
║      │                                                ▲          ║
║      ▼                                                │          ║
║   [Fiat Partner]  ──▶  NIVIX TREASURY  ──▶  [Fiat Partner]      ║
║   collects INR         releases USDC        pays out USD         ║
║                        (Solana, 2 sec)                           ║
║                                                                  ║
╠══════════════════════════════════════════════════════════════════╣
║   TRADITIONAL         vs          NIVIX                          ║
║   3–5 days                        2 seconds                      ║
║   $25–45 fee                      < $1 fee                       ║
║   Opaque                          Public chain = verifiable      ║
║   Manual compliance               Blockchain audit (Hyperledger) ║
╠══════════════════════════════════════════════════════════════════╣
║   Legal: GIFT City IFSC · IFSCA Sandbox · Report submitted      ║
║   Stack: Solana (USDC) + Hyperledger Fabric (compliance)         ║
║   Revenue: 0.5–1% per transaction + treasury yield               ║
╚══════════════════════════════════════════════════════════════════╝
```

---

*End of report. This document serves as both investor pitch reference and development architecture guide. All technical details align with `NIVIX_TECHNICAL_PRD.md` and `IFSC_LEGAL_AND_BUILD_PLAN.md`.*
