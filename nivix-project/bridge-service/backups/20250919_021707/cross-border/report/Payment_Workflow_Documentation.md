# Payment Workflow Documentation
## NivixPe Cross-Border Payment System

**Version:** 1.0  
**Date:** March 29, 2026  
**Author:** Product & Engineering Teams

---

## 1. Overview

This document describes the complete workflow for cross-border payments in the NivixPe system, from user initiation to final settlement.

---

## 2. User Journey

### 2.1 Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER INITIATES PAYMENT                    │
│  - Opens app/website                                         │
│  - Connects wallet (Phantom, Solflare, etc.)                │
│  - Navigates to "Send Money" section                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   ENTER PAYMENT DETAILS                      │
│  1. Select source currency (e.g., USD)                      │
│  2. Enter amount (e.g., 100)                                │
│  3. Select destination currency (e.g., INR)                 │
│  4. Enter recipient wallet address or select from contacts  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   SYSTEM VALIDATION                          │
│  ✓ Check user KYC status                                    │
│  ✓ Verify transaction limits                                │
│  ✓ Check wallet balance                                     │
│  ✓ Validate recipient address                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   DISPLAY QUOTE                              │
│  Exchange Rate: 1 USD = 83.5 INR                           │
│  You Send: 100 USD                                          │
│  Recipient Gets: 8,350 INR                                  │
│  Transaction Fee: 0.50 USD                                  │
│  Network Fee: 0.00025 SOL                                   │
│  Total: 100.50 USD                                          │
│  Estimated Time: < 5 seconds                                │
│                                                              │
│  [Cancel]  [Confirm Payment]                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   USER CONFIRMS                              │
│  - Reviews details                                           │
│  - Clicks "Confirm Payment"                                 │
│  - Wallet prompts for approval                              │
│  - User approves in wallet                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   COMPLIANCE CHECKS                          │
│  ✓ AML screening (sender & recipient)                       │
│  ✓ Sanctions list check                                     │
│  ✓ Transaction monitoring rules                             │
│  ✓ Velocity checks                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   BLOCKCHAIN TRANSACTION                     │
│  1. Create transaction with 2 instructions:                 │
│     a) Transfer 100 USD from sender to treasury             │
│     b) Mint 8,350 INR to recipient                          │
│  2. Sign with treasury wallet                               │
│  3. Submit to Solana network                                │
│  4. Wait for confirmation                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   TRANSACTION CONFIRMED                      │
│  ✓ Transaction hash: 5J8...                                 │
│  ✓ Confirmation time: 1.2 seconds                           │
│  ✓ Status: Success                                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   POST-TRANSACTION                           │
│  1. Update database records                                 │
│  2. Send notification to sender                             │
│  3. Send notification to recipient                          │
│  4. Generate receipt                                        │
│  5. Update analytics                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   PAYMENT COMPLETE                           │
│  ✅ Payment successful!                                      │
│  Transaction ID: TXN_123456                                 │
│  [View Receipt]  [Send Another]  [Done]                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Workflow Steps

### 3.1 Step 1: User Authentication

**Purpose:** Verify user identity and establish session

**Process:**
1. User opens application
2. Clicks "Connect Wallet"
3. Selects wallet provider (Phantom, Solflare, Ledger, etc.)
4. Wallet prompts for connection approval
5. User approves connection
6. System retrieves wallet public key
7. System checks if user exists in database
8. If new user, create account record
9. Generate JWT session token
10. Store session in Redis cache

**Technical Implementation:**
```javascript
// Frontend
const connectWallet = async () => {
    const { solana } = window;
    if (!solana) {
        alert('Please install a Solana wallet');
        return;
    }
    
    const response = await solana.connect();
    const publicKey = response.publicKey.toString();
    
    // Send to backend for authentication
    const authResponse = await fetch('/api/auth/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: publicKey })
    });
    
    const { token } = await authResponse.json();
    localStorage.setItem('authToken', token);
};
```

**Success Criteria:**
- Wallet connected successfully
- User record created/retrieved
- Session token generated
- User redirected to dashboard

**Error Handling:**
- Wallet not installed → Show installation instructions
- Connection rejected → Show retry option
- Network error → Show error message and retry

---

### 3.2 Step 2: Payment Initiation

**Purpose:** Collect payment details from user

**Process:**
1. User navigates to "Send Money" page
2. System displays currency selection
3. User selects source currency (e.g., USD)
4. User enters amount (e.g., 100)
5. System validates amount:
   - Minimum: $10
   - Maximum: Based on KYC tier
   - Available balance check
6. User selects destination currency (e.g., INR)
7. User enters recipient address or selects from saved contacts
8. System validates recipient address format
9. System fetches current exchange rate
10. System calculates expected output amount
11. System displays quote to user

**UI Components:**
```
┌─────────────────────────────────────┐
│  Send Money                         │
├─────────────────────────────────────┤
│  From                               │
│  ┌─────────────┐  ┌──────────────┐ │
│  │ USD ▼       │  │ 100.00       │ │
│  └─────────────┘  └──────────────┘ │
│  Balance: 500.00 USD                │
│                                     │
│  To                                 │
│  ┌─────────────┐  ┌──────────────┐ │
│  │ INR ▼       │  │ 8,350.00     │ │
│  └─────────────┘  └──────────────┘ │
│                                     │
│  Recipient                          │
│  ┌───────────────────────────────┐ │
│  │ 9xKXtg2CW87d97TXJSDpbD5j...   │ │
│  └───────────────────────────────┘ │
│  [📋 Paste]  [📖 Contacts]         │
│                                     │
│  ─────────────────────────────────  │
│  Exchange Rate: 1 USD = 83.5 INR   │
│  Fee: 0.50 USD                      │
│  ─────────────────────────────────  │
│                                     │
│  [Continue]                         │
└─────────────────────────────────────┘
```

**Validation Rules:**
```javascript
const validatePayment = (amount, currency, userTier) => {
    // Minimum amount
    if (amount < 10) {
        return { valid: false, error: 'Minimum amount is $10' };
    }
    
    // Maximum based on KYC tier
    const limits = {
        0: 1000,
        1: 10000,
        2: 50000,
        3: Infinity
    };
    
    if (amount > limits[userTier]) {
        return { valid: false, error: `Maximum amount for your tier is $${limits[userTier]}` };
    }
    
    // Check balance
    const balance = await getBalance(currency);
    if (amount > balance) {
        return { valid: false, error: 'Insufficient balance' };
    }
    
    return { valid: true };
};
```

---

### 3.3 Step 3: Quote Display

**Purpose:** Show user exact exchange rate and fees

**Process:**
1. System fetches real-time exchange rate
2. System calculates output amount
3. System calculates fees:
   - Transaction fee: 0.5% (min $1, max $50)
   - Network fee: Current Solana gas price
4. System displays comprehensive quote
5. Quote is valid for 30 seconds
6. Timer shows remaining validity time
7. User reviews quote
8. User clicks "Confirm Payment"

**Quote Calculation:**
```javascript
const generateQuote = async (fromCurrency, toCurrency, amount) => {
    // Get exchange rate
    const rate = await getExchangeRate(fromCurrency, toCurrency);
    
    // Calculate output amount
    const outputAmount = amount * rate;
    
    // Calculate transaction fee (0.5%, min $1, max $50)
    let transactionFee = amount * 0.005;
    transactionFee = Math.max(1, Math.min(50, transactionFee));
    
    // Get network fee
    const networkFee = await getSolanaGasPrice();
    
    // Total cost
    const totalCost = amount + transactionFee;
    
    return {
        fromAmount: amount,
        fromCurrency,
        toAmount: outputAmount,
        toCurrency,
        exchangeRate: rate,
        transactionFee,
        networkFee,
        totalCost,
        validUntil: Date.now() + 30000, // 30 seconds
        quoteId: generateQuoteId()
    };
};
```

**Quote Display:**
```
┌─────────────────────────────────────┐
│  Payment Summary                    │
├─────────────────────────────────────┤
│  You Send                           │
│  100.00 USD                         │
│                                     │
│  Exchange Rate                      │
│  1 USD = 83.5 INR                   │
│  (Updates in 28 seconds)            │
│                                     │
│  Recipient Gets                     │
│  8,350.00 INR                       │
│                                     │
│  ─────────────────────────────────  │
│  Transaction Fee    0.50 USD        │
│  Network Fee        0.00025 SOL     │
│  ─────────────────────────────────  │
│  Total Cost         100.50 USD      │
│                                     │
│  Estimated Time: < 5 seconds        │
│                                     │
│  [Back]  [Confirm Payment]          │
└─────────────────────────────────────┘
```

---

### 3.4 Step 4: Compliance Checks

**Purpose:** Ensure regulatory compliance (AML/KYC)

**Process:**
1. Check user KYC status
2. Verify transaction within limits
3. Screen sender against sanctions lists
4. Screen recipient against sanctions lists
5. Check transaction monitoring rules:
   - Structuring detection
   - Velocity checks
   - High-risk jurisdiction
   - Unusual patterns
6. Calculate risk score
7. If high risk, flag for manual review
8. If blocked, reject transaction
9. If approved, proceed to blockchain

**Compliance Flow:**
```
Transaction Submitted
        ↓
┌─────────────────────┐
│ KYC Status Check    │
│ - Tier 0: $1K limit │
│ - Tier 1: $10K limit│
│ - Tier 2: $50K limit│
└─────────────────────┘
        ↓
┌─────────────────────┐
│ Sanctions Screening │
│ - OFAC SDN          │
│ - UN Consolidated   │
│ - EU/UK Lists       │
└─────────────────────┘
        ↓
┌─────────────────────┐
│ Transaction Rules   │
│ - Structuring       │
│ - Velocity          │
│ - Geographic risk   │
│ - Pattern analysis  │
└─────────────────────┘
        ↓
┌─────────────────────┐
│ Risk Scoring        │
│ Low: 0-30           │
│ Medium: 31-70       │
│ High: 71-100        │
└─────────────────────┘
        ↓
    Decision
        ├─→ Approve (Low/Medium risk)
        ├─→ Review (High risk)
        └─→ Block (Sanctions hit)
```

**Implementation:**
```javascript
const performComplianceChecks = async (sender, recipient, amount, currency) => {
    // 1. KYC check
    const senderKYC = await getUserKYCStatus(sender);
    if (!senderKYC.verified) {
        return { approved: false, reason: 'KYC verification required' };
    }
    
    // 2. Transaction limit check
    const limit = getTransactionLimit(senderKYC.tier);
    if (amount > limit) {
        return { approved: false, reason: 'Transaction exceeds limit' };
    }
    
    // 3. Sanctions screening
    const senderScreen = await screenSanctions(sender);
    if (senderScreen.isMatch) {
        await createAlert('SANCTIONS_HIT', sender);
        return { approved: false, reason: 'Compliance block' };
    }
    
    const recipientScreen = await screenSanctions(recipient);
    if (recipientScreen.isMatch) {
        await createAlert('SANCTIONS_HIT', recipient);
        return { approved: false, reason: 'Compliance block' };
    }
    
    // 4. Transaction monitoring
    const monitoringResult = await checkMonitoringRules(sender, recipient, amount);
    if (monitoringResult.flagged) {
        await createAlert(monitoringResult.alertType, sender);
        if (monitoringResult.block) {
            return { approved: false, reason: 'Transaction blocked' };
        }
    }
    
    // 5. Risk scoring
    const riskScore = calculateRiskScore(sender, recipient, amount, currency);
    if (riskScore > 70) {
        await createAlert('HIGH_RISK', sender);
        return { approved: false, reason: 'Manual review required' };
    }
    
    return { approved: true, riskScore };
};
```

---

### 3.5 Step 5: Blockchain Transaction

**Purpose:** Execute payment on Solana blockchain

**Process:**
1. Create Solana transaction
2. Add instruction 1: Transfer from sender to treasury
3. Add instruction 2: Mint tokens to recipient
4. Get recent blockhash
5. Set fee payer (treasury wallet)
6. Sign transaction with treasury wallet
7. Submit transaction to Solana network
8. Wait for confirmation (confirmed commitment level)
9. Verify transaction success
10. Record transaction hash

**Transaction Construction:**
```javascript
const executeBlockchainTransaction = async (sender, recipient, fromCurrency, toCurrency, fromAmount, toAmount) => {
    try {
        // Get token accounts
        const senderFromAccount = await getAssociatedTokenAddress(
            getMintAddress(fromCurrency),
            new PublicKey(sender)
        );
        
        const recipientToAccount = await getAssociatedTokenAddress(
            getMintAddress(toCurrency),
            new PublicKey(recipient)
        );
        
        const treasuryFromAccount = await getTreasuryTokenAccount(fromCurrency);
        const treasuryToAccount = await getTreasuryTokenAccount(toCurrency);
        
        // Convert to micro-units
        const fromAmountUnits = Math.floor(fromAmount * 1_000_000);
        const toAmountUnits = Math.floor(toAmount * 1_000_000);
        
        // Create transaction
        const transaction = new Transaction();
        
        // Instruction 1: Transfer from sender to treasury
        transaction.add(
            createTransferInstruction(
                senderFromAccount,
                treasuryFromAccount,
                new PublicKey(sender),
                fromAmountUnits
            )
        );
        
        // Instruction 2: Mint to recipient
        transaction.add(
            createMintToInstruction(
                getMintAddress(toCurrency),
                recipientToAccount,
                treasuryKeypair.publicKey,
                toAmountUnits
            )
        );
        
        // Set transaction properties
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = treasuryKeypair.publicKey;
        
        // Sign and send
        const signature = await connection.sendTransaction(
            transaction,
            [treasuryKeypair],
            { skipPreflight: false, preflightCommitment: 'confirmed' }
        );
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        
        console.log('✅ Transaction confirmed:', signature);
        
        return {
            success: true,
            transactionHash: signature,
            confirmationTime: Date.now()
        };
        
    } catch (error) {
        console.error('❌ Transaction failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
};
```

**Transaction Timeline:**
```
T+0ms:    Transaction created
T+50ms:   Transaction signed
T+100ms:  Transaction submitted to network
T+400ms:  Transaction included in block
T+800ms:  Transaction confirmed (confirmed commitment)
T+12s:    Transaction finalized (32 blocks)
```

---

### 3.6 Step 6: Post-Transaction Processing

**Purpose:** Update records and notify users

**Process:**
1. Update transaction status in database
2. Update user balances
3. Update treasury liquidity records
4. Generate transaction receipt
5. Send push notification to sender
6. Send push notification to recipient
7. Send email confirmation (if enabled)
8. Update analytics dashboard
9. Log transaction for compliance
10. Clear cached data

**Database Updates:**
```javascript
const updateTransactionRecords = async (transactionData) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insert transaction record
        await client.query(`
            INSERT INTO transactions (
                transaction_hash, sender_id, recipient_id,
                from_currency, to_currency, from_amount, to_amount,
                exchange_rate, fee_amount, status, confirmed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `, [
            transactionData.hash,
            transactionData.senderId,
            transactionData.recipientId,
            transactionData.fromCurrency,
            transactionData.toCurrency,
            transactionData.fromAmount,
            transactionData.toAmount,
            transactionData.exchangeRate,
            transactionData.fee,
            'completed'
        ]);
        
        // Update sender balance
        await client.query(`
            UPDATE user_balances
            SET balance = balance - $1, updated_at = NOW()
            WHERE user_id = $2 AND currency = $3
        `, [transactionData.fromAmount, transactionData.senderId, transactionData.fromCurrency]);
        
        // Update recipient balance
        await client.query(`
            UPDATE user_balances
            SET balance = balance + $1, updated_at = NOW()
            WHERE user_id = $2 AND currency = $3
        `, [transactionData.toAmount, transactionData.recipientId, transactionData.toCurrency]);
        
        await client.query('COMMIT');
        
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
};
```

**Notification System:**
```javascript
const sendNotifications = async (transactionData) => {
    // Push notification to sender
    await sendPushNotification(transactionData.senderId, {
        title: 'Payment Sent',
        body: `You sent ${transactionData.fromAmount} ${transactionData.fromCurrency} to ${transactionData.recipientAddress}`,
        data: { transactionId: transactionData.id }
    });
    
    // Push notification to recipient
    await sendPushNotification(transactionData.recipientId, {
        title: 'Payment Received',
        body: `You received ${transactionData.toAmount} ${transactionData.toCurrency}`,
        data: { transactionId: transactionData.id }
    });
    
    // Email confirmation
    if (transactionData.senderEmail) {
        await sendEmail(transactionData.senderEmail, {
            subject: 'Payment Confirmation',
            template: 'payment-confirmation',
            data: transactionData
        });
    }
};
```

---

## 4. Error Handling Workflows

### 4.1 Insufficient Balance

**Scenario:** User tries to send more than available balance

**Workflow:**
```
User enters amount > balance
        ↓
System validates amount
        ↓
Validation fails
        ↓
Display error message:
"Insufficient balance. You have 50 USD, but trying to send 100 USD"
        ↓
Suggest actions:
- Reduce amount
- Add funds to wallet
        ↓
User corrects amount or adds funds
        ↓
Retry payment
```

---

### 4.2 Transaction Limit Exceeded

**Scenario:** User exceeds daily/monthly limit

**Workflow:**
```
User submits payment
        ↓
System checks velocity limits
        ↓
Limit exceeded
        ↓
Display error message:
"Daily limit exceeded. You've sent $9,500 today. Your daily limit is $10,000."
        ↓
Suggest actions:
- Wait until tomorrow
- Upgrade KYC tier
- Split into smaller transactions
        ↓
User takes action
```

---

### 4.3 Blockchain Transaction Failure

**Scenario:** Transaction fails on blockchain

**Workflow:**
```
Transaction submitted to blockchain
        ↓
Transaction fails (network congestion, insufficient SOL for gas, etc.)
        ↓
System detects failure
        ↓
Automatic retry (up to 3 attempts)
        ↓
If still fails:
        ↓
Refund user (if funds were debited)
        ↓
Display error message:
"Transaction failed. Your funds have been refunded. Please try again."
        ↓
Log error for investigation
        ↓
User can retry payment
```

---

### 4.4 Compliance Block

**Scenario:** Transaction blocked by compliance checks

**Workflow:**
```
User submits payment
        ↓
Compliance checks run
        ↓
Sanctions hit or high-risk flag
        ↓
Transaction blocked
        ↓
Display generic message:
"We're unable to process this transaction. Please contact support."
        ↓
Create compliance alert
        ↓
Notify compliance team
        ↓
Manual review by compliance officer
        ↓
Decision:
├─→ Approve: Whitelist and allow transaction
├─→ Request info: Contact user for additional information
└─→ Reject: Close account if necessary
```

---

## 5. Admin Workflows

### 5.1 Manual Transaction Review

**Purpose:** Review flagged transactions

**Workflow:**
```
Transaction flagged by automated system
        ↓
Alert created in compliance dashboard
        ↓
Compliance officer assigned
        ↓
Officer reviews:
- Transaction details
- User profile
- Transaction history
- External data sources
        ↓
Officer makes decision:
├─→ Approve: Clear flag, allow transaction
├─→ Request info: Contact user
└─→ File SAR: Report to authorities
        ↓
Document decision
        ↓
Update transaction status
        ↓
Notify user (if applicable)
```

---

### 5.2 Treasury Rebalancing

**Purpose:** Maintain liquidity across currencies

**Workflow:**
```
Daily automated check
        ↓
Analyze currency balances
        ↓
Identify imbalances:
- USD: 80% of target (need more)
- INR: 150% of target (excess)
        ↓
Calculate rebalancing needs
        ↓
Execute rebalancing:
- Buy USD with INR on exchange
- Transfer to treasury wallet
        ↓
Update treasury records
        ↓
Generate rebalancing report
        ↓
Notify treasury manager
```

---

## 6. Integration Workflows

### 6.1 Bank Withdrawal

**Purpose:** Allow users to withdraw to bank account

**Workflow:**
```
User requests withdrawal
        ↓
Select currency and amount
        ↓
Enter bank account details
        ↓
System validates bank account
        ↓
Calculate withdrawal fee
        ↓
User confirms withdrawal
        ↓
Burn tokens from user wallet
        ↓
Initiate bank transfer (via RazorpayX or similar)
        ↓
Wait for bank confirmation (1-3 business days)
        ↓
Update withdrawal status
        ↓
Notify user when complete
```

---

### 6.2 Exchange Rate Update

**Purpose:** Keep exchange rates current

**Workflow:**
```
Cron job runs every 60 seconds
        ↓
Fetch rates from multiple sources:
- CoinGecko API
- Binance API
- Forex API
        ↓
Calculate weighted average
        ↓
Apply spread (0.3%)
        ↓
Update Redis cache
        ↓
Broadcast to connected clients (WebSocket)
        ↓
Log rate change for analytics
```

---

## 7. Monitoring Workflows

### 7.1 Transaction Monitoring

**Purpose:** Detect and respond to issues

**Workflow:**
```
Real-time monitoring
        ↓
Track metrics:
- Transaction success rate
- Average confirmation time
- Error rate
- Queue depth
        ↓
If anomaly detected:
        ↓
Trigger alert
        ↓
Notify on-call engineer
        ↓
Engineer investigates
        ↓
Take corrective action:
- Restart service
- Scale up resources
- Switch RPC endpoint
        ↓
Document incident
        ↓
Post-mortem review
```

---

## 8. Conclusion

This workflow documentation provides a comprehensive guide to all payment processes in the NivixPe Cross-Border Payment System. Each workflow is designed for efficiency, security, and regulatory compliance.

**Key Takeaways:**
- Average payment time: < 5 seconds
- Success rate: > 99%
- Comprehensive error handling
- Regulatory compliance at every step
- Real-time monitoring and alerts

---

**Document Owner:** Product Team  
**Last Updated:** March 29, 2026  
**Next Review:** June 29, 2026
