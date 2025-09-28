#!/bin/bash

echo "🚀 Deploying to Production..."

# Load production environment
export $(cat .env.production | xargs)

# Install dependencies
npm install --production

# Start with PM2
pm2 start src/index.js --name "nivix-bridge-production" --env production

echo "✅ Production deployment complete!"
echo "📊 Check status: pm2 status"
echo "📝 View logs: pm2 logs nivix-bridge-production"
