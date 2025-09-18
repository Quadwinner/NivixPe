# 🔑 Razorpay Setup Guide for Nivix Bridge

## Quick Setup Steps

### 1. Create Razorpay Account
1. Visit: https://dashboard.razorpay.com/signup
2. Sign up with your email and phone number
3. Complete email and phone verification
4. Submit basic business details (can use test details for development)

### 2. Get Test API Keys
1. **Login** to Razorpay Dashboard
2. **Switch to Test Mode** (toggle in top-left corner)
3. Navigate: **Settings** → **API Keys** 
4. Click **"Generate Test Key"**
5. **Copy both credentials:**
   - **Key ID**: `rzp_test_xxxxxxxxxx` 
   - **Key Secret**: `xxxxxxxxxxxxxxxx`

### 3. Configure Environment Variables

Replace the dummy credentials in your startup command:

```bash
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service"

export NODE_ENV=development
export CASHFREE_CLIENT_ID="CF10794489D31HNUJ2JPKS73CS1PRG"
export CASHFREE_CLIENT_SECRET="cfsk_ma_test_7e42a4ccb107f647cbf039b95aeee897_eb889869"
export RAZORPAY_KEY_ID="your_real_key_id_here"
export RAZORPAY_KEY_SECRET="your_real_key_secret_here"

npm start
```

### 4. Test Payment Flow
Once configured, test the onramp flow:
1. Create order: `POST /api/onramp/create-order`
2. Create payment: `POST /api/onramp/create-payment`
3. Use Razorpay test cards for payment

### 5. Razorpay Test Cards
For testing payments, use these test card numbers:
- **Success**: `4111 1111 1111 1111`
- **Failure**: `4000 0000 0000 0002`
- **CVV**: Any 3 digits
- **Expiry**: Any future date

## 🚨 Security Notes
- Never commit real credentials to git
- Use environment variables only
- Test mode credentials are safe for development
- Switch to Live mode only for production

## 📞 Support
If you need help with Razorpay account setup:
- Razorpay Support: https://razorpay.com/support/
- Documentation: https://razorpay.com/docs/

---

Once you have your real Razorpay credentials, replace the dummy values in your startup command and restart the service.





