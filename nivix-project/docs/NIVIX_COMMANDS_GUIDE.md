# 🚀 Nivix Project - Complete Commands Guide

## 📋 Table of Contents
1. [Quick Start Commands](#quick-start-commands)
2. [Individual Service Commands](#individual-service-commands)
3. [Testing Commands](#testing-commands)
4. [Troubleshooting Commands](#troubleshooting-commands)
5. [API Testing Commands](#api-testing-commands)
6. [Frontend Commands](#frontend-commands)

---

## 🚀 Quick Start Commands

### Start Everything (Recommended)
```bash
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project"
./start-nivix.sh
```

### Manual Start (Step by Step)
```bash
# 1. Start Hyperledger Fabric
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/fabric-samples/test-network"
./network.sh down
./network.sh up createChannel -ca -c mychannel
./network.sh deployCC -ccn nivix-kyc -ccp ./chaincode-nivix-kyc -ccl go -c mychannel -cccg ./chaincode-nivix-kyc/collections_config.json

# 2. Start Bridge Service
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service"
export NODE_ENV=development
export CASHFREE_CLIENT_ID="CF10794489D31HNUJ2JPKS73CS1PRG"
export CASHFREE_CLIENT_SECRET="cfsk_ma_test_7e42a4ccb107f647cbf039b95aeee897_eb889869"
export RAZORPAY_KEY_ID="rzp_test_RGU9V52S7OjDo2"
export RAZORPAY_KEY_SECRET="0SEhkhgU5lvcDGQC37YMvUBz"
export TESTING_MODE="false"
npm start

# 3. Start Frontend
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/frontend/nivix-pay"
npm start
```

---

## 🔧 Individual Service Commands

### Start Bridge Service Only
```bash
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service"
export NODE_ENV=development
export CASHFREE_CLIENT_ID="CF10794489D31HNUJ2JPKS73CS1PRG"
export CASHFREE_CLIENT_SECRET="cfsk_ma_test_7e42a4ccb107f647cbf039b95aeee897_eb889869"
export RAZORPAY_KEY_ID="rzp_test_RGU9V52S7OjDo2"
export RAZORPAY_KEY_SECRET="0SEhkhgU5lvcDGQC37YMvUBz"
export TESTING_MODE="false"
npm start
```

### Start Frontend Only
```bash
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/frontend/nivix-pay"
npm start
```

### Start Hyperledger Fabric Only
```bash
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/fabric-samples/test-network"
./network.sh down
./network.sh up createChannel -ca -c mychannel
./network.sh deployCC -ccn nivix-kyc -ccp ./chaincode-nivix-kyc -ccl go -c mychannel -cccg ./chaincode-nivix-kyc/collections_config.json
```

---

## 🧪 Testing Commands

### Test System Health
```bash
curl http://localhost:3002/health
```

### Test KYC Status
```bash
curl -X GET http://localhost:3002/api/kyc/status/6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5
```

### Test Liquidity Pools
```bash
curl http://localhost:3002/api/pools
```

---

## 💳 On-Ramp Testing Commands

### Create On-Ramp Order
```bash
curl -X POST http://localhost:3002/api/onramp/create-order \
  -H "Content-Type: application/json" \
  -d '{
    "userAddress": "6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5",
    "fiatAmount": 1000,
    "fiatCurrency": "INR",
    "cryptoCurrency": "USD"
  }'
```

### Create Payment for Order
```bash
curl -X POST http://localhost:3002/api/onramp/create-payment \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "onramp_1757636197763_swsbcv"
  }'
```

### Check Order Status
```bash
curl -X GET http://localhost:3002/api/onramp/order-status/onramp_1757636197763_swsbcv
```

### Get User Orders
```bash
curl -X GET http://localhost:3002/api/onramp/user-orders/6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5
```

---

## 💸 Off-Ramp Testing Commands

### Get Off-Ramp Quote
```bash
curl -X POST http://localhost:3002/api/offramp/quote \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "fromCurrency": "USD",
    "toCurrency": "INR",
    "corridor": "US-IN",
    "userAddress": "6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5"
  }'
```

### Initiate Off-Ramp Transaction
```bash
curl -X POST http://localhost:3002/api/offramp/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "quoteId": "quote_123456789",
    "userAddress": "6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5",
    "bankDetails": {
      "accountNumber": "1234567890",
      "ifscCode": "SBIN0000001",
      "accountName": "Test User",
      "accountType": "savings"
    }
  }'
```

### Check Transaction Status
```bash
curl -X GET http://localhost:3002/api/offramp/status/transaction_123456789
```

---

## 🔧 Troubleshooting Commands

### Kill All Node Processes
```bash
pkill -f "node.*index.js"
ps aux | grep "node.*index.js" | grep -v grep | awk '{print $2}' | xargs kill -9
```

### Kill Process on Specific Port
```bash
# Kill process on port 3002 (Bridge Service)
lsof -ti:3002 | xargs kill -9

# Kill process on port 3000 (Frontend)
lsof -ti:3000 | xargs kill -9
```

### Check Running Processes
```bash
ps aux | grep node
lsof -i :3002
lsof -i :3000
```

### Check Service Logs
```bash
# Bridge Service Logs
tail -f "/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service/logs/bridge.log"

# Frontend Logs (in terminal where npm start is running)
# Check the terminal where you ran npm start
```

---

## 🌐 Frontend Commands

### Start Frontend Development Server
```bash
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/frontend/nivix-pay"
npm start
```

### Build Frontend for Production
```bash
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/frontend/nivix-pay"
npm run build
```

### Install Frontend Dependencies
```bash
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/frontend/nivix-pay"
npm install
```

---

## 🔑 Environment Variables

### Required Environment Variables
```bash
export NODE_ENV=development
export CASHFREE_CLIENT_ID="CF10794489D31HNUJ2JPKS73CS1PRG"
export CASHFREE_CLIENT_SECRET="cfsk_ma_test_7e42a4ccb107f647cbf039b95aeee897_eb889869"
export RAZORPAY_KEY_ID="rzp_test_RGU9V52S7OjDo2"
export RAZORPAY_KEY_SECRET="0SEhkhgU5lvcDGQC37YMvUBz"
export TESTING_MODE="false"
```

### Optional Environment Variables
```bash
export CASHFREE_BASE_URL="https://payout-gamma.cashfree.com/payout/v2"
export FORCE_REAL_CASHFREE="true"
```

---

## 📱 Frontend URLs

### Main Application URLs
- **Frontend**: http://localhost:3000
- **Bridge Service**: http://localhost:3002
- **Health Check**: http://localhost:3002/health

### Specific Pages
- **Payment App**: http://localhost:3000/payment-app
- **Dashboard**: http://localhost:3000/
- **KYC**: http://localhost:3000/kyc
- **Liquidity Pools**: http://localhost:3000/liquidity-pools
- **Admin Dashboard**: http://localhost:3000/admin-dashboard

---

## 🧪 Test Data

### Test Wallet Address
```
6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5
```

### Test Bank Details
```json
{
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0000001",
  "accountName": "Test User",
  "accountType": "savings"
}
```

### Razorpay Test Cards
- **Success Card**: 4111 1111 1111 1111
- **CVV**: Any 3 digits
- **Expiry**: Any future date

### Cashfree Test Accounts
- **Account**: 1234567890
- **IFSC**: ICIC0000001
- **Name**: Test User

---

## 🚨 Common Issues & Solutions

### Issue: Port Already in Use
```bash
# Solution: Kill processes on ports
lsof -ti:3002 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Issue: Service Not Starting
```bash
# Solution: Check environment variables
echo $NODE_ENV
echo $CASHFREE_CLIENT_ID
echo $RAZORPAY_KEY_ID
```

### Issue: Frontend Not Loading
```bash
# Solution: Clear cache and restart
cd "/media/shubham/OS/for linux work/blockchain solana/nivix-project/frontend/nivix-pay"
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: Blockchain Connection Failed
```bash
# Solution: Check Solana RPC endpoint
curl https://api.devnet.solana.com
```

---

## 📊 Monitoring Commands

### Check System Status
```bash
# Check all services
curl http://localhost:3002/health
curl http://localhost:3000

# Check processes
ps aux | grep -E "(node|fabric)"
```

### Monitor Logs
```bash
# Bridge service logs
tail -f "/media/shubham/OS/for linux work/blockchain solana/nivix-project/bridge-service/logs/bridge.log"

# System logs
journalctl -f
```

---

## 🎯 Quick Test Sequence

### Complete On-Ramp Test
```bash
# 1. Start services
./start-nivix.sh

# 2. Create order
curl -X POST http://localhost:3002/api/onramp/create-order \
  -H "Content-Type: application/json" \
  -d '{"userAddress": "6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5", "fiatAmount": 1000, "fiatCurrency": "INR", "cryptoCurrency": "USD"}'

# 3. Create payment (use orderId from step 2)
curl -X POST http://localhost:3002/api/onramp/create-payment \
  -H "Content-Type: application/json" \
  -d '{"orderId": "ORDER_ID_FROM_STEP_2"}'

# 4. Test frontend
open http://localhost:3000/payment-app
```

### Complete Off-Ramp Test
```bash
# 1. Get quote
curl -X POST http://localhost:3002/api/offramp/quote \
  -H "Content-Type: application/json" \
  -d '{"amount": 100, "fromCurrency": "USD", "toCurrency": "INR", "corridor": "US-IN", "userAddress": "6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5"}'

# 2. Initiate transaction (use quoteId from step 1)
curl -X POST http://localhost:3002/api/offramp/initiate \
  -H "Content-Type: application/json" \
  -d '{"quoteId": "QUOTE_ID_FROM_STEP_1", "userAddress": "6G74ELnKsDCWDg7w6QCWsZ99dBweiHg55NtAwmpB2KW5", "bankDetails": {"accountNumber": "1234567890", "ifscCode": "SBIN0000001", "accountName": "Test User", "accountType": "savings"}}'

# 3. Test frontend
open http://localhost:3000/payment-app
```

---

## 📝 Notes

- **Always use the provided test credentials** for Cashfree and Razorpay
- **Test on Solana devnet** - never use mainnet for testing
- **Check logs** if services fail to start
- **Use the start-nivix.sh script** for easiest startup
- **Frontend runs on port 3000**, **Backend on port 3002**

---

*Last Updated: $(date)*
*Version: 1.0*





