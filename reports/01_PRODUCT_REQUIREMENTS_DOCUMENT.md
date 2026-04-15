# NIVIXPE - PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Document Version:** 1.0  
**Date:** March 30, 2026  
**Company:** NivixPe Private Limited  
**Incubated at:** Bennett Hatchery, Bennett University  
**Project Status:** Development Phase (Solana Devnet)

---

## EXECUTIVE SUMMARY

### Product Vision
NivixPe is a blockchain-powered cross-border payment platform that enables fast, secure, and compliant international money transfers at a fraction of traditional costs. By leveraging Solana's high-performance blockchain and Hyperledger Fabric's private compliance ledger, NivixPe provides a seamless bridge between fiat currencies and digital assets.

### Market Opportunity
- **Global Remittance Market:** $700+ billion annually
- **Average Transaction Fee:** 6-7% (traditional services)
- **Average Settlement Time:** 3-5 business days
- **Target Reduction:** <1% fees, <2 minutes settlement

### Product Goals
1. Enable instant cross-border payments with minimal fees
2. Ensure regulatory compliance through integrated KYC/AML
3. Provide seamless fiat-to-crypto and crypto-to-fiat conversion
4. Support multiple currencies and payment corridors
5. Deliver superior user experience compared to traditional services

---

## PRODUCT OVERVIEW

### Core Value Proposition
**"Send money globally in minutes, not days, at 1/10th the cost"**

### Key Differentiators
1. **Speed:** Sub-2-minute settlement vs 3-5 days traditional
2. **Cost:** <1% platform fee vs 6-7% traditional fees
3. **Transparency:** Real-time tracking on blockchain
4. **Compliance:** Built-in KYC/AML via Hyperledger Fabric
5. **Accessibility:** 24/7 availability, no banking hours restriction



## TARGET USERS

### Primary User Segments

#### 1. Individual Remittance Senders
- **Profile:** Migrant workers sending money home
- **Pain Points:** High fees, slow transfers, limited access
- **Use Case:** Monthly salary remittance to family
- **Volume:** $200-$2,000 per transaction

#### 2. Small Business Owners
- **Profile:** E-commerce sellers, freelancers
- **Pain Points:** International payment delays, currency conversion fees
- **Use Case:** Receiving payments from international clients
- **Volume:** $500-$10,000 per transaction

#### 3. Crypto-Savvy Users
- **Profile:** Early adopters comfortable with digital wallets
- **Pain Points:** Difficulty converting crypto to fiat
- **Use Case:** Cashing out crypto holdings to local currency
- **Volume:** $100-$50,000 per transaction

### User Personas

**Persona 1: Maria - Domestic Worker in UAE**
- Age: 32, sends $500/month to Philippines
- Needs: Low fees, reliable delivery, easy to use
- Tech Comfort: Medium (uses smartphone apps)

**Persona 2: Raj - Freelance Developer in India**
- Age: 28, receives $2,000/month from US clients
- Needs: Fast settlement, competitive rates, professional interface
- Tech Comfort: High (comfortable with crypto wallets)

**Persona 3: Sarah - E-commerce Seller in UK**
- Age: 35, processes $10,000/month international sales
- Needs: Bulk payments, compliance, accounting integration
- Tech Comfort: Medium-High (uses business software)

---

## FUNCTIONAL REQUIREMENTS

### FR-1: User Registration & KYC

#### FR-1.1: Account Creation
- User can register with email and phone number
- System generates unique user ID
- Email verification required
- Phone OTP verification required

#### FR-1.2: KYC Submission
- **Level 1 KYC (Basic):**
  - Full name, date of birth, nationality
  - Email and phone verification
  - Transaction limit: $1,000/day

- **Level 2 KYC (Enhanced):**
  - Government-issued ID (passport, driver's license, national ID)
  - Proof of address (utility bill, bank statement)
  - Selfie verification
  - Transaction limit: $10,000/day

- **Level 3 KYC (Business):**
  - Business registration documents
  - Tax identification number
  - Beneficial ownership information
  - Transaction limit: $100,000/day

#### FR-1.3: KYC Verification
- Admin review dashboard for KYC submissions
- Automated risk scoring (1-5 scale)
- Document verification workflow
- Approval/rejection with reason codes
- User notification on status change



### FR-2: Wallet Management

#### FR-2.1: Wallet Connection
- Support for Phantom wallet
- Support for Solflare wallet
- Support for Ledger hardware wallet
- Automatic wallet detection
- Secure connection via Solana Wallet Adapter

#### FR-2.2: Wallet Operations
- View SOL balance
- View SPL token balances (USD, INR, EUR, GBP, JPY, CAD, AUD)
- Transaction history display
- Export transaction records (CSV, PDF)
- Multiple wallet support per user

#### FR-2.3: Security Features
- Transaction signing required for all operations
- Wallet disconnection option
- Session timeout (30 minutes inactivity)
- Suspicious activity alerts

### FR-3: On-Ramp (Fiat to Crypto)

#### FR-3.1: Order Creation
- User selects fiat currency (INR, USD, EUR, GBP)
- User enters fiat amount
- System displays equivalent crypto amount
- Real-time exchange rate calculation
- Fee breakdown display (platform fee, payment gateway fee)
- Order expiry time (15 minutes)

#### FR-3.2: Payment Processing
- Integration with Razorpay payment gateway
- Support for multiple payment methods:
  - Credit/Debit cards
  - UPI (India)
  - Net banking
  - Wallets (Paytm, PhonePe, Google Pay)
- Payment confirmation via webhook
- Signature verification for security

#### FR-3.3: Token Delivery
- Automatic token minting to user wallet
- Associated Token Account (ATA) creation if needed
- Blockchain transaction confirmation
- Transaction ID generation
- Email/SMS notification on completion

#### FR-3.4: Order Management
- View pending orders
- View completed orders
- View failed orders with reason
- Order cancellation (before payment)
- Refund processing for failed transactions



### FR-4: Off-Ramp (Crypto to Fiat)

#### FR-4.1: Withdrawal Request
- User selects crypto currency to withdraw
- User enters withdrawal amount
- System displays equivalent fiat amount
- Real-time exchange rate calculation
- Fee breakdown display
- Minimum withdrawal amount: $10 equivalent

#### FR-4.2: Bank Account Management
- Add bank account details
- Verify bank account (micro-deposit or instant verification)
- Support for multiple bank accounts
- Default bank account selection
- Bank account deletion

#### FR-4.3: Payout Processing
- Token burning from user wallet
- Treasury routing decision (direct vs hybrid)
- Integration with RazorpayX for payouts
- Support for multiple payout modes:
  - UPI (instant, up to ₹5 lakh)
  - IMPS (instant, up to ₹5 lakh)
  - NEFT (2 hours, no limit)
  - RTGS (30 minutes, above ₹2 lakh)
- Payout status tracking
- Email/SMS notification on completion

#### FR-4.4: Withdrawal Limits
- Daily withdrawal limit based on KYC level
- Monthly withdrawal limit
- Per-transaction limits
- Velocity checks for fraud prevention

### FR-5: Currency Exchange & Liquidity Pools

#### FR-5.1: Currency Swap
- User selects source currency
- User selects destination currency
- User enters amount to swap
- System displays exchange rate and fees
- Slippage tolerance setting (0.5%, 1%, 2%, 5%)
- Minimum received amount guarantee

#### FR-5.2: Liquidity Pool Information
- List all available pools
- Display pool liquidity depth
- Show 24-hour volume
- Display current exchange rate
- Show pool fee rate
- Historical rate charts

#### FR-5.3: Pool Operations
- Swap execution via Solana smart contract
- Automatic best route selection
- Multi-hop swaps if needed
- Transaction confirmation
- Receipt generation



### FR-6: Cross-Border Transfers

#### FR-6.1: Transfer Initiation
- User enters recipient wallet address or email
- User selects amount and currency
- System calculates fees and exchange rate
- Recipient receives notification
- Transfer memo/note support (optional)

#### FR-6.2: Transfer Execution
- KYC verification check for sender
- AML screening for transaction
- Token transfer via Solana blockchain
- Automatic currency conversion if needed
- Transaction confirmation (finalized status)

#### FR-6.3: Transfer Tracking
- Real-time status updates
- Blockchain explorer link
- Estimated completion time
- Push notifications on status change
- Transaction receipt with all details

### FR-7: Compliance & Reporting

#### FR-7.1: Transaction Monitoring
- Real-time AML screening
- Suspicious activity detection
- Velocity checks
- Geographic risk assessment
- Automated alerts for high-risk transactions

#### FR-7.2: Regulatory Reporting
- Transaction history export
- Tax reporting documents
- Compliance audit trail
- Regulatory filing support
- Data retention (7 years minimum)

#### FR-7.3: User Privacy
- GDPR compliance
- Data encryption at rest and in transit
- Right to be forgotten implementation
- Data access request handling
- Privacy policy acceptance

---

## NON-FUNCTIONAL REQUIREMENTS

### NFR-1: Performance

#### NFR-1.1: Response Time
- API response time: <200ms (95th percentile)
- Page load time: <2 seconds
- Transaction confirmation: <10 seconds
- Database query time: <100ms

#### NFR-1.2: Throughput
- Support 1,000 concurrent users
- Process 100 transactions per second
- Handle 10,000 API requests per minute
- Scale to 100,000 daily active users

#### NFR-1.3: Availability
- System uptime: 99.9% (8.76 hours downtime/year)
- Planned maintenance windows: <4 hours/month
- Disaster recovery time: <1 hour
- Data backup frequency: Every 6 hours



### NFR-2: Security

#### NFR-2.1: Authentication & Authorization
- Multi-factor authentication (MFA) support
- JWT-based session management
- Role-based access control (RBAC)
- API key authentication for integrations
- Session timeout after 30 minutes inactivity

#### NFR-2.2: Data Security
- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- Secure key management (AWS KMS or HashiCorp Vault)
- PII data encryption
- Secure password hashing (bcrypt, 12 rounds)

#### NFR-2.3: Transaction Security
- Payment signature verification (HMAC SHA256)
- Blockchain transaction confirmation requirements
- Mint authority validation
- Withdrawal address whitelisting
- Transaction amount limits

#### NFR-2.4: Infrastructure Security
- DDoS protection (Cloudflare or AWS Shield)
- Web Application Firewall (WAF)
- Regular security audits
- Penetration testing (quarterly)
- Vulnerability scanning (weekly)

### NFR-3: Scalability

#### NFR-3.1: Horizontal Scaling
- Stateless API design
- Load balancer support
- Auto-scaling based on CPU/memory
- Database read replicas
- Caching layer (Redis)

#### NFR-3.2: Database Scaling
- Database sharding support
- Connection pooling
- Query optimization
- Index management
- Archive old data (>1 year)

#### NFR-3.3: Blockchain Scaling
- Multiple RPC endpoints
- RPC load balancing
- Transaction batching
- Optimistic confirmations
- Fallback to alternative networks

### NFR-4: Reliability

#### NFR-4.1: Error Handling
- Graceful degradation
- Retry mechanisms with exponential backoff
- Circuit breaker pattern
- Fallback services
- Comprehensive error logging

#### NFR-4.2: Monitoring & Alerting
- Real-time system monitoring
- Application performance monitoring (APM)
- Log aggregation (ELK stack or similar)
- Alert on critical errors
- Health check endpoints

#### NFR-4.3: Disaster Recovery
- Regular backups (every 6 hours)
- Backup retention (30 days)
- Disaster recovery plan documented
- Recovery time objective (RTO): <1 hour
- Recovery point objective (RPO): <6 hours



### NFR-5: Usability

#### NFR-5.1: User Interface
- Responsive design (mobile, tablet, desktop)
- Accessibility compliance (WCAG 2.1 Level AA)
- Multi-language support (English, Hindi, Spanish, Arabic)
- Intuitive navigation
- Consistent design system

#### NFR-5.2: User Experience
- Onboarding flow completion: <5 minutes
- Transaction completion: <3 clicks
- Clear error messages
- Progress indicators for long operations
- Help documentation and FAQs

#### NFR-5.3: Mobile Experience
- Progressive Web App (PWA) support
- Touch-optimized interface
- Offline capability for viewing history
- Push notifications
- Biometric authentication support

### NFR-6: Compliance

#### NFR-6.1: Regulatory Compliance
- KYC/AML compliance (FATF guidelines)
- GDPR compliance (EU users)
- PCI DSS compliance (payment data)
- SOC 2 Type II certification (target)
- Local regulations per jurisdiction

#### NFR-6.2: Audit Trail
- Immutable transaction logs
- User action logging
- Admin action logging
- Compliance event logging
- Log retention: 7 years minimum

#### NFR-6.3: Data Residency
- Data localization per jurisdiction
- Cross-border data transfer compliance
- Data sovereignty requirements
- Regional data centers

---

## TECHNICAL ARCHITECTURE

### System Components

#### 1. Frontend Layer
- **Technology:** React 18.2.0, TypeScript, Material-UI
- **Hosting:** AWS S3 + CloudFront or Vercel
- **Features:** Wallet integration, responsive design, PWA

#### 2. API Gateway (Bridge Service)
- **Technology:** Node.js 18+, Express.js
- **Hosting:** AWS EC2 or ECS
- **Features:** REST API, WebSocket support, rate limiting

#### 3. Blockchain Layer
- **Solana:** Payment settlement, token operations
- **Hyperledger Fabric:** KYC/AML compliance ledger
- **Smart Contracts:** Anchor framework (Rust)

#### 4. Payment Gateway
- **Razorpay:** On-ramp (payment collection)
- **RazorpayX:** Off-ramp (payouts)
- **Mode:** Test environment (development), Live (production)

#### 5. Database Layer
- **Primary:** PostgreSQL (user data, transactions)
- **Cache:** Redis (session, rate limiting)
- **Search:** Elasticsearch (transaction search)

#### 6. Infrastructure
- **Cloud Provider:** AWS
- **Container Orchestration:** Docker, Kubernetes (optional)
- **CI/CD:** GitHub Actions or GitLab CI
- **Monitoring:** Prometheus, Grafana, Sentry



---

## USER STORIES

### Epic 1: User Onboarding

**US-1.1:** As a new user, I want to register with my email and phone number so that I can create an account.  
**Acceptance Criteria:**
- Email validation required
- Phone OTP verification required
- Unique user ID generated
- Welcome email sent

**US-1.2:** As a registered user, I want to complete KYC verification so that I can use the platform.  
**Acceptance Criteria:**
- Multi-step KYC form (personal info, address, documents)
- Document upload support (passport, ID, proof of address)
- Selfie verification
- Status tracking (pending, approved, rejected)

**US-1.3:** As a user, I want to connect my Solana wallet so that I can send and receive crypto.  
**Acceptance Criteria:**
- Support for Phantom and Solflare wallets
- Secure wallet connection
- Display wallet address and balance
- Disconnect wallet option

### Epic 2: On-Ramp (Fiat to Crypto)

**US-2.1:** As a user, I want to buy crypto with fiat currency so that I can use it for transfers.  
**Acceptance Criteria:**
- Select fiat currency and amount
- View real-time exchange rate
- See fee breakdown
- Complete payment via Razorpay
- Receive tokens in wallet within 10 seconds

**US-2.2:** As a user, I want to track my on-ramp orders so that I know the status of my purchases.  
**Acceptance Criteria:**
- View pending orders
- View completed orders
- View failed orders with reason
- Transaction ID and blockchain link provided

### Epic 3: Off-Ramp (Crypto to Fiat)

**US-3.1:** As a user, I want to withdraw crypto to my bank account so that I can access fiat currency.  
**Acceptance Criteria:**
- Select crypto currency and amount
- View real-time exchange rate
- See fee breakdown
- Add/select bank account
- Receive fiat within 2 hours (IMPS/UPI)

**US-3.2:** As a user, I want to manage my bank accounts so that I can receive withdrawals.  
**Acceptance Criteria:**
- Add multiple bank accounts
- Verify bank account
- Set default bank account
- Delete bank account

### Epic 4: Cross-Border Transfers

**US-4.1:** As a user, I want to send money internationally so that I can support my family abroad.  
**Acceptance Criteria:**
- Enter recipient wallet address or email
- Select amount and currency
- View fees and exchange rate
- Confirm transfer
- Receive confirmation within 2 minutes

**US-4.2:** As a user, I want to track my transfers so that I know when they are completed.  
**Acceptance Criteria:**
- Real-time status updates
- Blockchain explorer link
- Push notifications
- Transaction receipt

### Epic 5: Currency Exchange

**US-5.1:** As a user, I want to swap between different currencies so that I can optimize my holdings.  
**Acceptance Criteria:**
- Select source and destination currency
- View exchange rate and fees
- Set slippage tolerance
- Execute swap
- Receive confirmation

**US-5.2:** As a user, I want to view available liquidity pools so that I can choose the best rates.  
**Acceptance Criteria:**
- List all pools
- Display liquidity depth
- Show 24-hour volume
- Display current rate
- Historical rate charts

---

## SUCCESS METRICS

### Key Performance Indicators (KPIs)

#### Business Metrics
- **Monthly Active Users (MAU):** Target 10,000 in Year 1
- **Transaction Volume:** Target $10M in Year 1
- **Average Transaction Size:** $500-$1,000
- **Customer Acquisition Cost (CAC):** <$50
- **Customer Lifetime Value (LTV):** >$500
- **LTV:CAC Ratio:** >10:1

#### Product Metrics
- **On-Ramp Success Rate:** >95%
- **Off-Ramp Success Rate:** >90%
- **Average Transaction Time:** <2 minutes
- **User Retention (30-day):** >40%
- **Daily Active Users (DAU):** >1,000

#### Technical Metrics
- **API Uptime:** >99.9%
- **API Response Time (p95):** <200ms
- **Transaction Confirmation Time:** <10 seconds
- **Error Rate:** <0.1%
- **Support Ticket Resolution Time:** <24 hours



---

## ROADMAP

### Phase 1: MVP (Months 1-3) - COMPLETED ✅
- ✅ User registration and KYC
- ✅ Wallet integration (Phantom, Solflare)
- ✅ On-ramp (INR to crypto via Razorpay)
- ✅ Basic token operations
- ✅ Hyperledger Fabric KYC ledger
- ✅ Solana smart contracts deployment

### Phase 2: Core Features (Months 4-6) - IN PROGRESS ⏳
- ⏳ Off-ramp (crypto to INR via RazorpayX)
- ⏳ Multi-currency support (USD, EUR, GBP, JPY, CAD, AUD)
- ⏳ Liquidity pools and currency swaps
- ⏳ Cross-border transfer optimization
- ⏳ Mobile-responsive UI improvements
- ⏳ Transaction history and reporting

### Phase 3: Scale & Optimize (Months 7-9)
- ⬜ Additional payment corridors (US, EU, UK)
- ⬜ Bulk payment support for businesses
- ⬜ API for third-party integrations
- ⬜ Advanced analytics dashboard
- ⬜ Referral program
- ⬜ Customer support chat integration

### Phase 4: Enterprise Features (Months 10-12)
- ⬜ White-label solution for partners
- ⬜ Treasury management dashboard
- ⬜ Automated compliance reporting
- ⬜ Multi-signature wallet support
- ⬜ Advanced fraud detection
- ⬜ Institutional-grade API

---

## RISKS & MITIGATION

### Technical Risks

**Risk 1: Blockchain Network Congestion**
- **Impact:** High transaction fees, slow confirmations
- **Probability:** Medium
- **Mitigation:** Use Solana (high throughput), implement priority fees, fallback to alternative networks

**Risk 2: Smart Contract Vulnerabilities**
- **Impact:** Loss of funds, security breach
- **Probability:** Low
- **Mitigation:** Security audits, bug bounty program, insurance coverage

**Risk 3: Payment Gateway Downtime**
- **Impact:** Unable to process on-ramp/off-ramp
- **Probability:** Low
- **Mitigation:** Multiple payment gateway integrations, status page, user notifications

### Business Risks

**Risk 4: Regulatory Changes**
- **Impact:** Compliance requirements, operational restrictions
- **Probability:** Medium
- **Mitigation:** Legal counsel, compliance monitoring, flexible architecture

**Risk 5: Market Competition**
- **Impact:** Loss of market share, pricing pressure
- **Probability:** High
- **Mitigation:** Differentiation through speed and cost, superior UX, strategic partnerships

**Risk 6: Liquidity Constraints**
- **Impact:** Unable to fulfill large withdrawals
- **Probability:** Medium
- **Mitigation:** Treasury management, partner network, dynamic routing

### Operational Risks

**Risk 7: Fraud and Money Laundering**
- **Impact:** Regulatory penalties, reputation damage
- **Probability:** Medium
- **Mitigation:** KYC/AML compliance, transaction monitoring, risk scoring

**Risk 8: Customer Support Overload**
- **Impact:** Poor user experience, negative reviews
- **Probability:** Medium
- **Mitigation:** Self-service documentation, chatbot, scalable support team

---

## DEPENDENCIES

### External Dependencies
1. **Solana Network:** Blockchain availability and performance
2. **Razorpay:** Payment gateway uptime and API stability
3. **Hyperledger Fabric:** Compliance ledger infrastructure
4. **AWS:** Cloud infrastructure availability
5. **Third-party APIs:** Exchange rate providers, KYC verification services

### Internal Dependencies
1. **Smart Contract Deployment:** Required before on-ramp/off-ramp
2. **KYC System:** Required before user transactions
3. **Treasury Setup:** Required before off-ramp operations
4. **Liquidity Pools:** Required for currency swaps
5. **Monitoring Infrastructure:** Required for production deployment

---

## ASSUMPTIONS

1. **Regulatory:** Current crypto regulations remain stable during development
2. **Technical:** Solana network maintains high performance and low fees
3. **Business:** Users are willing to adopt crypto-based payment solutions
4. **Market:** Demand for low-cost remittance services continues to grow
5. **Partnerships:** Payment gateway partnerships remain active and cost-effective

---

## CONSTRAINTS

### Technical Constraints
- Must use Solana devnet for initial testing
- Limited to Razorpay test environment until production approval
- Hyperledger Fabric requires dedicated infrastructure
- Mobile app development deferred to Phase 3

### Business Constraints
- Initial launch limited to India market
- Transaction limits based on KYC level
- Minimum transaction amount: $10 equivalent
- Maximum transaction amount: $10,000 per transaction (KYC Level 2)

### Resource Constraints
- Development team: 2-3 developers
- Budget: Limited to operational costs
- Timeline: 12 months to full production launch
- Infrastructure: AWS free tier initially, scale as needed

---

## APPROVAL & SIGN-OFF

**Product Owner:** _____________________  
**Technical Lead:** _____________________  
**Compliance Officer:** _____________________  
**Date:** March 30, 2026

---

**Document Control:**
- Version: 1.0
- Last Updated: March 30, 2026
- Next Review: June 30, 2026
- Classification: Internal Use Only

