#!/bin/bash

# Deploy Frontend to Server - Production Setup
echo "🚀 Deploying Frontend to Server"
echo "================================"

PROJECT_ROOT="/root/blockchain solana/nivix-project"
FRONTEND_DIR="$PROJECT_ROOT/frontend/nivix-pay-old"
BUILD_DIR="$FRONTEND_DIR/build"
NGINX_DIR="/var/www/nivix-frontend"

# 1. Install nginx if not installed
echo "📦 Installing nginx..."
if ! command -v nginx &> /dev/null; then
    apt-get update
    apt-get install -y nginx
    systemctl enable nginx
    systemctl start nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# 2. Build the React app
echo "🔨 Building React app..."
cd "$FRONTEND_DIR"

# Set production API URL
export REACT_APP_BRIDGE_URL="http://143.110.183.14:3002"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build for production
npm run build

if [ ! -d "build" ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build completed"

# 3. Copy build files to nginx directory
echo "📁 Setting up nginx directory..."
mkdir -p "$NGINX_DIR"
cp -r "$BUILD_DIR"/* "$NGINX_DIR"/
chown -R www-data:www-data "$NGINX_DIR"

# 4. Configure nginx
echo "⚙️ Configuring nginx..."
cat > /etc/nginx/sites-available/nivix-frontend << 'EOF'
server {
    listen 80;
    server_name 143.110.183.14;

    root /var/www/nivix-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/nivix-frontend /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx configuration
nginx -t

# Reload nginx
systemctl reload nginx

# 5. Open port 80 in firewall
echo "🔥 Configuring firewall..."
ufw allow 80/tcp
ufw allow 443/tcp

echo ""
echo "✅ Frontend deployed successfully!"
echo ""
echo "🌐 Access your frontend at:"
echo "   http://143.110.183.14"
echo ""
echo "📝 To update the frontend, run this script again after making changes."
