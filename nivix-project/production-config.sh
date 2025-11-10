#!/bin/bash

# Production Environment Configuration
export NODE_ENV="production"
export PORT=3002

# Solana Mainnet
export SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
export SOLANA_NETWORK="mainnet-beta"

# Production Payment Gateways
export RAZORPAY_KEY_ID="rzp_live_YOUR_LIVE_KEY_ID"
export RAZORPAY_KEY_SECRET="YOUR_LIVE_SECRET"
export CASHFREE_CLIENT_ID="CF_LIVE_CLIENT_ID"
export CASHFREE_CLIENT_SECRET="cfsk_ma_live_YOUR_LIVE_SECRET"
export CASHFREE_BASE_URL="https://payout-api.cashfree.com"

# Production Treasury Wallet
export SOLANA_TREASURY_PRIVATE_KEY_PROD="YOUR_PRODUCTION_TREASURY_PRIVATE_KEY"

# Exchange Rate APIs
export EXCHANGE_RATE_API_KEY="YOUR_EXCHANGE_RATE_API_KEY"
export ORACLE_API_KEY="YOUR_ORACLE_API_KEY"

# Database
export DATABASE_URL="postgresql://user:password@localhost:5432/nivix_production"
export REDIS_URL="redis://localhost:6379"

# Security
export JWT_SECRET="YOUR_PRODUCTION_JWT_SECRET"
export ENCRYPTION_KEY="YOUR_PRODUCTION_ENCRYPTION_KEY"

echo "🚀 Production environment configured!"




