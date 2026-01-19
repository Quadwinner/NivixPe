#!/bin/bash

# Nivix Project - Server Setup Script
echo "🚀 Setting up Nivix Project on Server"
echo "======================================"

PROJECT_ROOT="/root/blockchain solana/nivix-project"
cd "$PROJECT_ROOT" || { echo "❌ Project directory not found!"; exit 1; }

# 1. Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    apt-get update
    apt-get install -y docker.io docker-compose-v2
    systemctl enable docker
    systemctl start docker
    usermod -aG docker root
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# 2. Install Go
echo "🔧 Installing Go..."
if ! command -v go &> /dev/null; then
    apt-get install -y golang-go
    echo "✅ Go installed: $(go version)"
else
    echo "✅ Go already installed: $(go version)"
fi

# 3. Install Node.js (v18+)
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'v' -f2 | cut -d'.' -f1)" -lt 18 ]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    echo "✅ Node.js installed: $(node -v)"
else
    echo "✅ Node.js already installed: $(node -v)"
fi

# 4. Install jq (for JSON parsing in scripts)
echo "🔧 Installing jq..."
apt-get install -y jq

# 5. Update start-nivix.sh with correct paths
echo "📝 Updating start-nivix.sh paths..."
sed -i "s|PROJECT_ROOT=\"/media/shubham/OS/for linux work/blockchain solana/nivix-project\"|PROJECT_ROOT=\"/root/blockchain solana/nivix-project\"|g" start-nivix.sh

# 6. Update fabric-invoke.sh with correct paths
echo "📝 Updating fabric-invoke.sh paths..."
if [ -f "bridge-service/fabric-invoke.sh" ]; then
    sed -i "s|/media/shubham/OS/for linux work/blockchain solana/nivix-project|/root/blockchain solana/nivix-project|g" bridge-service/fabric-invoke.sh
fi

# 7. Install bridge-service dependencies
echo "📦 Installing bridge-service dependencies..."
if [ -d "bridge-service" ]; then
    cd bridge-service
    npm install
    cd ..
    echo "✅ Bridge service dependencies installed"
fi

# 8. Install frontend dependencies (if exists)
echo "📦 Installing frontend dependencies..."
if [ -d "frontend/nivix-pay" ]; then
    cd frontend/nivix-pay
    npm install
    cd ../../..
    echo "✅ Frontend dependencies installed"
fi

# 9. Copy fabric-invoke.sh to /tmp
echo "📝 Setting up fabric-invoke.sh helper..."
if [ -f "bridge-service/fabric-invoke.sh" ]; then
    cp bridge-service/fabric-invoke.sh /tmp/fabric-invoke.sh
    chmod +x /tmp/fabric-invoke.sh
    echo "✅ Helper script installed"
fi

# 10. Make start script executable
chmod +x start-nivix.sh
chmod +x stop-nivix.sh 2>/dev/null || true

echo ""
echo "✅ Server setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Run: ./start-nivix.sh"
echo "2. Check logs: tail -f bridge-service/logs/bridge.log"
echo "3. Test health: curl http://localhost:3002/health"
