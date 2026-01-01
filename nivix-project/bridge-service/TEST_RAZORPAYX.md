# RazorpayX Payout Test Guide

## Quick Test

Run the test script to verify RazorpayX payout integration:

```bash
cd bridge-service
node test-razorpayx-payout.js
```

## What the Test Does

1. ✅ **Configuration Check** - Verifies API keys and account number
2. ✅ **Account Balance** - Checks RazorpayX account balance
3. ✅ **Create Contact** - Creates a test beneficiary contact
4. ✅ **Create Fund Account** - Links bank account to contact
5. ✅ **Create Payout** - Initiates ₹1 test payout
6. ✅ **Check Status** - Verifies payout status

## Expected Output

### Success:
```
✅ PAYOUT TEST SUCCESSFUL!
📊 Payout Details:
   Payout ID: pout_xxxxx
   Status: processed
   Amount: ₹1.00
```

### Failure:
```
❌ PAYOUT TEST FAILED!
Error: [error message]
```

## Test Configuration

The test uses:
- **Amount**: ₹1 (minimum for testing)
- **Beneficiary**: Test User (test@example.com)
- **Bank Account**: 1234567890 / SBIN0000001

## Troubleshooting

### Error: "API credentials not configured"
**Fix**: Check `.env` file has:
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_ACCOUNT_NUMBER`

### Error: "Account balance is zero"
**Fix**: Add funds to RazorpayX test account via Dashboard

### Error: "Account number not configured"
**Fix**: Set `RAZORPAY_ACCOUNT_NUMBER=2323230040290482` in `.env`

### Error: "Failed to fetch balance"
**Fix**: 
- Verify account number is correct
- Check API keys are valid
- Ensure account is activated

## Custom Test

To test with different beneficiary details, edit `test-razorpayx-payout.js`:

```javascript
const testBeneficiary = {
    name: 'Your Name',
    email: 'your@email.com',
    phone: '9876543210',
    bank_account: {
        account_number: 'your_account_number',
        ifsc_code: 'your_ifsc_code',
        account_holder_name: 'Your Name'
    }
};
```

## Next Steps

After successful test:
1. ✅ Integration is working
2. ✅ Test on your website with real transactions
3. ✅ Monitor RazorpayX Dashboard for payouts
4. ✅ Check account balance deductions

---

**Note**: Test mode uses dummy balance - no real money is deducted in test mode.







