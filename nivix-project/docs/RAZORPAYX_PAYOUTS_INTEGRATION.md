# RazorpayX Payouts Integration Plan

## Overview

This document outlines the integration of RazorpayX Payouts API into the Nivix Pay off-ramp system. RazorpayX Payouts allows direct bank transfers and UPI payments from your RazorpayX account to beneficiaries.

**Documentation Reference**: [RazorpayX Payouts Docs](https://razorpay.com/docs/x/payouts/)

## Architecture

### Workflow

RazorpayX Payouts follows a 3-step workflow:

1. **Create Contact** - Register the beneficiary (person or institution)
2. **Create Fund Account** - Link payment method (bank account or UPI) to the contact
3. **Create Payout** - Transfer money from RazorpayX account to fund account

### Integration Points

- **Service**: `bridge-service/src/payments/razorpayx-payouts.js`
- **Integration**: `bridge-service/src/payments/fiat-payout-service.js`
- **Usage**: Automatically selected as primary provider when credentials are configured

## Setup Requirements

### 1. RazorpayX Account Setup

1. Sign up for RazorpayX Dashboard: https://dashboard.razorpay.com/
2. Complete account activation and KYC verification
3. Add funds to your RazorpayX account
4. Note your **Account Number** (found in RazorpayX Dashboard)

### 2. Environment Variables

Add these to your `.env` file:

```bash
# RazorpayX Payouts Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_ACCOUNT_NUMBER=your_razorpayx_account_number
```

**Where to find credentials:**
- **Key ID & Secret**: Razorpay Dashboard → Settings → API Keys
- **Account Number**: RazorpayX Dashboard → Account Details

### 3. Account Pre-funding

For production, you must pre-fund your RazorpayX account:
- Add funds via bank transfer or other supported methods
- Minimum balance required depends on payout amounts
- Fees and taxes are deducted from account balance

## Features Implemented

### ✅ Core Features

- **Contact Management**: Automatic creation and retrieval of contacts
- **Fund Account Management**: Support for bank accounts and UPI IDs
- **Payout Creation**: Full payout workflow with automatic mode selection
- **Status Tracking**: Real-time payout status checking
- **Payout Cancellation**: Cancel payouts in queued/pending/scheduled states
- **Multiple Payout Modes**: IMPS, NEFT, RTGS, UPI, Amazonpay

### ✅ Payout Modes

| Mode | Amount Limit | Processing Time | Availability |
|------|-------------|----------------|--------------|
| **IMPS** | Up to ₹5 lakh | Instant (2 min) | 24x7 |
| **NEFT** | No limit | 2 hours | Business hours |
| **RTGS** | Above ₹2 lakh | 30 minutes | Business hours |
| **UPI** | Up to ₹5 lakh | Instant (2 min) | 24x7 |
| **Amazonpay** | Varies | Varies | 24x7 |

### ✅ Automatic Mode Selection

The system automatically selects the optimal payout mode based on:
- **Amount**: 
  - ≤ ₹5 lakh → IMPS (instant)
  - > ₹5 lakh → NEFT or RTGS
- **Account Type**:
  - UPI ID → UPI mode
  - Bank Account → IMPS/NEFT/RTGS based on amount

## API Usage

### Direct Usage

```javascript
const RazorpayXPayouts = require('./razorpayx-payouts');
const razorpayx = new RazorpayXPayouts();

// Complete payout flow (recommended)
const result = await razorpayx.processCompletePayout(
    {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '9876543210',
        bank_account: {
            account_number: '1234567890',
            ifsc_code: 'SBIN0000001',
            account_holder_name: 'John Doe'
        }
    },
    1000, // Amount in INR
    'payout', // Purpose
    'nivix_txn_123' // Reference ID
);
```

### Step-by-Step Usage

```javascript
// Step 1: Create Contact
const contact = await razorpayx.createContact({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '9876543210',
    type: 'customer'
});

// Step 2: Create Fund Account
const fundAccount = await razorpayx.createFundAccount({
    contactId: contact.id,
    accountType: 'bank_account',
    accountDetails: {
        name: 'John Doe',
        account_number: '1234567890',
        ifsc: 'SBIN0000001'
    }
});

// Step 3: Create Payout
const payout = await razorpayx.createPayout({
    fundAccountId: fundAccount.id,
    amount: 1000,
    currency: 'INR',
    mode: 'IMPS',
    purpose: 'payout',
    referenceId: 'nivix_txn_123',
    narration: 'Nivix payout to John Doe'
});
```

## Integration with Off-ramp Flow

RazorpayX Payouts is automatically integrated into the off-ramp flow:

1. **User burns tokens** → Solana transaction
2. **System gets quote** → Exchange rate calculation
3. **System selects provider** → RazorpayX (if configured) or fallback to Cashfree
4. **System processes payout** → Contact → Fund Account → Payout
5. **System returns result** → Payout ID, status, estimated completion

### Provider Priority

The system selects providers in this order:
1. **RazorpayX** (if credentials configured)
2. **Cashfree** (fallback)
3. **Instamojo** (fallback)
4. **PayU** (fallback)

## Payout States

| State | Description | Actions Available |
|-------|-------------|-------------------|
| **queued** | Payout queued for processing | Cancel |
| **pending** | Payout pending approval | Cancel |
| **processing** | Payout being processed | None |
| **processed** | Payout completed successfully | None |
| **cancelled** | Payout cancelled | None |
| **failed** | Payout failed | None |
| **reversed** | Payout reversed (refunded) | None |

## Error Handling

### Common Errors

1. **Insufficient Balance**
   - Error: Account balance too low
   - Solution: Add funds to RazorpayX account

2. **Invalid Fund Account**
   - Error: Fund account validation failed
   - Solution: Verify bank account/UPI details

3. **KYC Not Complete**
   - Error: Account activation required
   - Solution: Complete KYC in RazorpayX Dashboard

4. **Invalid Credentials**
   - Error: Authentication failed
   - Solution: Verify API keys in environment variables

## Testing

### Test Mode

RazorpayX provides a test mode for development:
- Use test API keys from Razorpay Dashboard
- Test payouts won't transfer real money
- Verify all workflows before production

### Test Scenarios

1. **Bank Account Payout**
   ```javascript
   // Test with valid bank account details
   ```

2. **UPI Payout**
   ```javascript
   // Test with valid UPI ID
   ```

3. **Payout Cancellation**
   ```javascript
   // Test cancelling queued payout
   ```

## Webhook Integration

RazorpayX sends webhooks for payout status updates:

```javascript
// Verify webhook signature
const isValid = razorpayx.verifyWebhookSignature(
    webhookPayload,
    webhookSignature,
    webhookSecret
);

if (isValid) {
    // Process webhook
    const payoutStatus = webhookPayload.event;
    // Update payout status in database
}
```

## Monitoring & Logging

### Logs to Monitor

- `✅ Contact created: {contactId}`
- `✅ Fund account created: {fundAccountId}`
- `✅ Payout created: {payoutId}, Status: {status}`
- `❌ RazorpayX payout failed: {error}`

### Metrics to Track

- Payout success rate
- Average processing time
- Failed payout reasons
- Provider usage distribution

## Production Checklist

- [ ] RazorpayX account activated and KYC verified
- [ ] API credentials configured in environment
- [ ] Account number configured
- [ ] Account pre-funded with sufficient balance
- [ ] Test payouts verified in test mode
- [ ] Webhook endpoint configured (if using webhooks)
- [ ] Error handling tested
- [ ] Monitoring and logging set up
- [ ] Fallback providers configured (Cashfree, etc.)

## Support & Documentation

- **RazorpayX Dashboard**: https://dashboard.razorpay.com/
- **API Documentation**: https://razorpay.com/docs/x/payouts/
- **Support**: Contact Razorpay support for account issues

## Migration from Cashfree

If migrating from Cashfree to RazorpayX:

1. Configure RazorpayX credentials
2. Test payouts in test mode
3. Gradually route new payouts to RazorpayX
4. Monitor success rates
5. Keep Cashfree as fallback initially

## Cost Structure

- **IMPS**: ₹2-5 per transaction
- **NEFT**: ₹2-5 per transaction
- **RTGS**: ₹25-50 per transaction
- **UPI**: Usually free or minimal fees
- Fees deducted from RazorpayX account balance

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for all secrets
3. **Verify webhook signatures** before processing
4. **Implement rate limiting** for payout requests
5. **Monitor for suspicious activity**
6. **Use HTTPS** for all API calls
7. **Rotate API keys** periodically

## Troubleshooting

### Payout Stuck in Processing

1. Check RazorpayX Dashboard for status
2. Verify account balance
3. Check for any account restrictions
4. Contact Razorpay support if needed

### Payout Failed

1. Check error message in logs
2. Verify beneficiary details
3. Check account balance
4. Verify fund account is active
5. Review RazorpayX Dashboard for details

## Next Steps

1. **Configure credentials** in environment variables
2. **Test in test mode** with sample payouts
3. **Monitor initial payouts** in production
4. **Set up webhooks** for status updates (optional)
5. **Implement retry logic** for failed payouts (optional)

---

**Last Updated**: Integration completed and ready for testing
**Status**: ✅ Implementation Complete







