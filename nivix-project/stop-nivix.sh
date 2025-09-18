#!/bin/bash

# Nivix Project - Clean Stop Script
echo "🛑 Stopping Nivix Project"
echo "========================="

PROJECT_ROOT="/media/shubham/OS/for linux work/blockchain solana/nivix-project"
cd "$PROJECT_ROOT"

# 1. Stop bridge service
echo "🌉 Stopping bridge service..."
pkill -f "node src/index.js" 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

# 2. Stop Hyperledger Fabric network
echo "🏗️ Stopping Hyperledger Fabric..."
cd fabric-samples/test-network
./network.sh down 2>/dev/null || true

# 3. Clean up Docker
echo "🧹 Cleaning up Docker..."
docker container prune -f 2>/dev/null || true
docker volume prune -f 2>/dev/null || true

echo "✅ Nivix Project stopped successfully!"