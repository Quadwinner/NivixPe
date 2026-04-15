# NIVIXPE - ANTI-MONEY LAUNDERING (AML) COMPLIANCE REPORT

**Document Version:** 1.0  
**Date:** March 30, 2026  
**Company:** NivixPe Private Limited  
**Compliance Officer:** [Name]  
**Report Period:** Development Phase  
**Classification:** Confidential

---

## EXECUTIVE SUMMARY

This Anti-Money Laundering (AML) Compliance Report outlines NivixPe's comprehensive approach to preventing money laundering, terrorist financing, and other financial crimes. The report details our risk-based compliance framework, KYC procedures, transaction monitoring systems, and regulatory adherence strategies.

### Key Highlights
- **Compliance Framework:** Risk-based approach aligned with FATF recommendations
- **KYC System:** Multi-tier verification using Hyperledger Fabric private ledger
- **Transaction Monitoring:** Real-time screening and suspicious activity detection
- **Technology:** Blockchain-based immutable audit trail
- **Status:** Development phase with compliance-first architecture

---

## REGULATORY FRAMEWORK

### Applicable Regulations

#### International Standards
1. **FATF Recommendations (2012-2023)**
   - 40 Recommendations on combating money laundering
   - 9 Special Recommendations on terrorist financing
   - Risk-based approach to AML/CFT

2. **Basel Committee on Banking Supervision**
   - Customer due diligence standards
   - Enhanced due diligence for high-risk customers
   - Ongoing monitoring requirements

#### Regional Regulations

**India:**
- Prevention of Money Laundering Act (PMLA), 2002
- PMLA Rules, 2005 (as amended)
- RBI Master Direction on KYC
- SEBI (KYC Registration Agency) Regulations, 2011

**United States:**
- Bank Secrecy Act (BSA)
- USA PATRIOT Act
- FinCEN regulations for virtual currency
- OFAC sanctions compliance

**European Union:**
- 5th Anti-Money Laundering Directive (5AMLD)
- 6th Anti-Money Laundering Directive (6AMLD)
- GDPR compliance for data protection
- MiCA (Markets in Crypto-Assets) Regulation



---

## RISK ASSESSMENT

### Money Laundering Risk Factors

#### Customer Risk Factors
**High Risk:**
- Politically Exposed Persons (PEPs)
- Customers from high-risk jurisdictions (FATF blacklist/greylist)
- Customers with complex ownership structures
- Customers with unusual transaction patterns

**Medium Risk:**
- Customers from moderate-risk jurisdictions
- High-value transactions (>$10,000)
- Frequent cross-border transactions
- Cash-intensive businesses

**Low Risk:**
- Verified individual customers
- Small transaction amounts (<$1,000)
- Domestic transactions only
- Transparent source of funds

#### Product/Service Risk Factors
**High Risk:**
- Anonymous transactions (not supported)
- High-value transfers (>$50,000)
- Rapid movement of funds
- Conversion to privacy coins (not supported)

**Medium Risk:**
- Cross-border remittances
- Currency exchange services
- Business accounts
- Bulk payments

**Low Risk:**
- Peer-to-peer transfers (verified users)
- Small remittances (<$1,000)
- Domestic transactions
- Transparent blockchain transactions

#### Geographic Risk Factors
**High Risk Countries (FATF Blacklist/Greylist):**
- North Korea, Iran, Myanmar (blacklist)
- Countries under FATF monitoring
- Sanctioned jurisdictions (OFAC, UN, EU)

**Medium Risk:**
- Countries with weak AML frameworks
- High corruption perception index
- Limited financial transparency

**Low Risk:**
- FATF member countries with strong AML frameworks
- Countries with robust regulatory oversight
- Transparent financial systems

### Overall Risk Rating Matrix

| Customer Risk | Product Risk | Geographic Risk | Overall Risk | Action Required |
|---------------|--------------|-----------------|--------------|-----------------|
| High | High | High | **Critical** | Decline/Enhanced DD |
| High | High | Medium | **High** | Enhanced DD |
| High | Medium | Low | **Medium** | Enhanced DD |
| Medium | Medium | Medium | **Medium** | Standard DD |
| Low | Low | Low | **Low** | Simplified DD |

