# IFSCA Pre-Application Query — Email Draft

**To:** fe-sandbox@ifsca.gov.in
**Purpose:** Confirm framework scope before committing to a formal application
**Status:** DRAFT — review the notes at the bottom before sending

---

## Subject line

```
Pre-application query — FinTech Sandbox Framework: scope for stablecoin-settled cross-border payments
```

---

## Email body

Dear Sir / Madam,

We are writing to seek preliminary guidance before submitting a Preliminary Application under the IFSCA FinTech Sandbox Framework (Circular F.No. 505/IFSCA-FTec0FTEF/1/2023 dated March 16, 2026).

**About us**

NivixPe Private Limited is an early-stage financial technology company incorporated in India and incubated at the Bennett University Hatchery. We are developing a cross-border payments solution intended to reduce the cost and settlement time of international remittances.

**The proposed solution**

Our proposed architecture is as follows:

- A **licensed payment partner** collects funds from the sender in local currency. Senders and recipients transact **only in fiat currency** at both ends.
- Settlement between the two payment legs is effected using **USDC**, a fully-reserved stablecoin issued by Circle, held in our own treasury. Customers do not purchase, hold, or transact in any digital asset at any point.
- A **licensed payment partner in the destination jurisdiction** pays the recipient in their local currency.
- Identity verification and compliance records are maintained on a permissioned **Hyperledger Fabric** distributed ledger operated on a multi-organisation basis, providing a tamper-evident audit trail.

We note that Appendix 1 of the Framework includes Payment Services and Payment & Settlement Systems, and that Appendix 2 includes solutions leveraging Distributed Ledger Technology as well as tokenization support services.

**Our queries**

1. **Scope of permissible activity.** We would be grateful for guidance on whether the use of a third-party-issued, fully-reserved stablecoin as an internal settlement mechanism — where no customer holds or transacts in a digital asset — falls within the scope of activities that may be tested under the FinTech Regulatory Sandbox. If such an arrangement would require a specific relaxation or exemption under clause 13 of the Framework, we would welcome any indication of how such a request should be framed in our application.

2. **Post-testing authorisation pathway.** Noting that under clause 29 the Limited Use Authorisation and any associated exemptions expire at the end of the Testing Stage, we would be grateful for guidance on the authorisation category under which a solution of this nature would be expected to seek authorisation following a successful test, so that we may address clause 12(k) and 12(l) appropriately in our application.

We would also be glad to arrange a discussion at your convenience if that would be a more suitable way to address these questions.

We are conscious that this enquiry precedes a formal application and appreciate your time in considering it.

Yours faithfully,

**[Your full name]**
[Designation]
NivixPe Private Limited
[Phone] | [Email]
[CIN, if you wish to include it]

---

## Before you send — please check these

**Fill in / verify:**
- [ ] Your name, designation, phone, and the email you want replies to
- [ ] Company name exactly as registered (I have used "NivixPe Private Limited" — confirm this matches your incorporation certificate)
- [ ] Whether to include your CIN — recommended, it signals a real registered entity
- [ ] Confirm the Bennett University Hatchery incubation is current and accurately described

**Deliberate choices I made, which you may want to change:**

1. **I did not reference any earlier report submitted to IFSCA.** Project documents mention a report having been submitted, but I could not verify what that submission was, in what form, or through what channel. Referencing a prior filing inaccurately in a regulator-facing email is a bad first impression. If you have a specific acknowledgement or reference number, add a line — it genuinely helps. If it was an academic or investor-facing report that merely discussed the IFSCA route, leave this out.

2. **I framed question 1 as "is this within scope" rather than "will you grant us an exemption."** A regulator cannot pre-commit to granting an exemption outside a formal application, so asking directly would likely get a non-answer. Asking about scope, and how to frame the request, is answerable and more useful to you.

3. **I did not claim the sandbox permits stablecoin settlement.** It does not say so — the words "stablecoin," "crypto," and "virtual digital asset" appear nowhere in the Framework. The email states what the Framework *does* list (Payment Services, DLT, tokenization support services) and asks where our use case sits. This is the honest framing and it is also the one most likely to get a substantive reply.

4. **I emphasised that no customer holds a digital asset.** This is the single most important fact about your architecture from a regulatory standpoint, and it is what distinguishes your proposal from a retail crypto service.

5. **I kept it short and did not describe the technology stack in detail.** Save that for the application. The purpose of this email is to get two questions answered.

6. **I did not name a specific corridor or partner.** Adding "India–United States" and a named partner would make it more concrete, but also invites questions you cannot yet answer definitively. Add them only if you are confident.

**What not to add:**
- Do not describe the current prototype or its self-minted tokens. That mechanism is being replaced and is not what you are proposing to test.
- Do not state or imply that any regulator has approved or endorsed the approach.
- Do not attach the investor brief — it contains a claim that the sandbox "permits a stablecoin-settled pilot," which the Framework does not support.

**After sending:** log the date sent and any reference number in this file. Their reply materially affects the build plan, so it should be recorded alongside it.
