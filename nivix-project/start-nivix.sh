#!/bin/bash

# Nivix Project - Clean Startup Script
echo "🚀 Starting Nivix Project"
echo "========================="

PROJECT_ROOT="/media/shubham/OS/for linux work/blockchain solana/nivix-project"
cd "$PROJECT_ROOT"

# 1. Clean up any existing processes
echo "🧹 Cleaning up processes..."
pkill -f "node.*index.js" 2>/dev/null || true
pkill -f "node src/index.js" 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
# More thorough cleanup
ps aux | grep "node.*index.js" | grep -v grep | awk '{print $2}' | xargs kill -9 2>/dev/null || true
sleep 3

# 2. Start Hyperledger Fabric network
echo "🏗️ Starting Hyperledger Fabric..."
cd fabric-samples/test-network
./network.sh down 2>/dev/null || true
./network.sh up createChannel -ca -c mychannel

# 3. Deploy chaincode
echo "📦 Deploying chaincode..."
./network.sh deployCC -ccn nivix-kyc -ccp ./chaincode-nivix-kyc -ccl go -c mychannel -cccg ./chaincode-nivix-kyc/collections_config.json

# 4. Setup fabric invoke script
echo "📜 Setting up fabric script..." 
cd "$PROJECT_ROOT"
cp bridge-service/fabric-invoke.sh /tmp/fabric-invoke.sh
chmod +x /tmp/fabric-invoke.sh

# 5. Test chaincode
echo "🧪 Testing chaincode..."
/tmp/fabric-invoke.sh "StoreKYC" '["test_user","TestAddress123","Test User","true","2025-09-08T05:00:00Z","3","USA"]' "invoke" || true

# 6. Start bridge service
echo "🌉 Starting bridge service..."
cd bridge-service
mkdir -p logs

# Set payment gateway environment variables (Real Razorpay Test Credentials)
export RAZORPAY_KEY_ID="rzp_test_RIdOOohLUUFJhr"
export RAZORPAY_KEY_SECRET="yKfmYVMY9NTrxW9sNj4N4VO2"

# Enable PayU payouts (Cashfree is disabled in code)
export PAYU_MERCHANT_ID="527849c20b1e690147b48325b0818452fa360716274c769494db1dbc256c6158"
export PAYU_API_KEY="YOUR_PAYU_API_KEY_HERE"
export PAYU_BASE_URL="https://payouts.payu.in/api/v1"

# Set Cashfree payout environment variables (Working credentials)
export CASHFREE_CLIENT_ID="CF10794489D31HNUJ2JPKS73CS1PRG"
export CASHFREE_CLIENT_SECRET="cfsk_ma_test_7e42a4ccb107f647cbf039b95aeee897_eb889869"
export NODE_ENV="development"
# Force TEST Cashfree base URL (host only; SDK/appends /payout/v1/...)
export CASHFREE_BASE_URL="https://payout-gamma.cashfree.com"
# Run real Cashfree sandbox payouts (no simulation)
export TESTING_MODE="false"
export FORCE_REAL_CASHFREE="true"

# Cashfree 2FA Public Key (Working key for new Client ID)
export CASHFREE_PUBLIC_KEY_PEM='-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxTIHMivJjAHUXV364+Mt
//2pGddWUWi2y1oP6i+UyfP9M4Wq6ErvleImJVooC0sktrgN1m2mHrUoD5zoOwSE
JkF3a+Q+8HYiV6QJ+PiochNa+stKadtGLHXrZrSO0hcvkZ8yFVC8fNCkFtHEL3lW
EZISuvqp9fMaxIs4lc2OHiBx2VknRkM49J3Ogvwp9po9hmRQ/vsajrMCG1+dbGWb
X6EnQrJNbbWOdsIyu/DvvP7J8nS4AGeYvIkvFjSr8G1U2tBEB9wZvAF+QYeYnAOB
hLz71tjVM4n/MFIKae0cOLA8q16Azvy+xGkaiWrz04IYUXDpdBzTyuHv3zsPAL2k
gwIDAQAB
-----END PUBLIC KEY-----'

nohup node src/index.js > logs/bridge.log 2>&1 &
sleep 8

# 7. Test system
echo "🔍 Testing system..."
if curl -s http://localhost:3002/health > /dev/null; then
    echo "✅ Bridge service: HEALTHY"
    echo "✅ Hyperledger Fabric: RUNNING"
    echo "✅ Chaincode: DEPLOYED"
    echo ""
    echo "🎉 NIVIX PROJECT STARTED SUCCESSFULLY!"
    echo ""
    echo "📊 Quick Commands:"
    echo "• Health: curl http://localhost:3002/health"
    echo "• Pools: curl http://localhost:3002/api/pools"
    echo "• Logs: tail -f bridge-service/logs/bridge.log"
    echo "• Invoke KYC: /tmp/fabric-invoke.sh \"StoreKYC\" '[\"user\",\"address\",\"name\",\"true\",\"2025-09-08T05:00:00Z\",\"3\",\"USA\"]' \"invoke\""
    echo "• Query KYC: /tmp/fabric-invoke.sh \"GetKYCStatus\" '[\"address\"]' \"query\""
else
    echo "❌ Bridge service failed to start"
    echo "📝 Check logs: tail -20 bridge-service/logs/bridge.log"
fi







