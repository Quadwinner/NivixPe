#!/bin/bash

# 🧹 Production Cleanup Script
# Removes unnecessary code and prepares for production

echo "🧹 Starting Production Cleanup..."

# Create backup directory
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

echo "📦 Creating backup in $BACKUP_DIR..."

# Backup files before deletion
cp -r src/cross-border $BACKUP_DIR/ 2>/dev/null || echo "⚠️ Cross-border directory not found"
cp -r src/solana/simple-pool-client.js $BACKUP_DIR/ 2>/dev/null || echo "⚠️ Simple pool client not found"
cp -r src/solana/anchor-liquidity-client.js $BACKUP_DIR/ 2>/dev/null || echo "⚠️ Anchor liquidity client not found"
cp -r src/solana/direct-liquidity-client.js $BACKUP_DIR/ 2>/dev/null || echo "⚠️ Direct liquidity client not found"

echo "🗑️ Removing unnecessary code..."

# Remove cross-border service
rm -rf src/cross-border/
echo "✅ Removed cross-border service"

# Remove pool clients
rm -f src/solana/simple-pool-client.js
rm -f src/solana/anchor-liquidity-client.js  
rm -f src/solana/direct-liquidity-client.js
echo "✅ Removed pool clients"

# Remove cross-border frontend
rm -f ../frontend/nivix-pay-old/src/pages/CrossBorderPayments.tsx
echo "✅ Removed cross-border frontend"

echo "🔧 Updating index.js to remove pool imports..."

# Create a script to clean up index.js
cat > cleanup_index.js << 'EOF'
const fs = require('fs');

// Read the index.js file
let content = fs.readFileSync('src/index.js', 'utf8');

// Remove cross-border imports
content = content.replace(/const crossBorderService = require\('\.\/cross-border\/cross-border-payment-service'\);\n/g, '');

// Remove pool client imports
content = content.replace(/const simplePoolClient = require\('\.\/solana\/simple-pool-client'\);\n/g, '');
content = content.replace(/const anchorLiquidityClient = require\('\.\/solana\/anchor-liquidity-client'\);\n/g, '');

// Remove cross-border API endpoints
const crossBorderStart = content.indexOf('// ==================== CROSS-BORDER PAYMENTS ====================');
if (crossBorderStart !== -1) {
    const crossBorderEnd = content.indexOf('// Start the server', crossBorderStart);
    if (crossBorderEnd !== -1) {
        content = content.substring(0, crossBorderStart) + content.substring(crossBorderEnd);
    }
}

// Remove pool API endpoints
content = content.replace(/\/\/ ==================== SIMPLE POOL ====================.*?\/\/ ==================== HEALTH CHECK ====================/gs, '// ==================== HEALTH CHECK ====================');

// Write the cleaned content
fs.writeFileSync('src/index.js', content);
console.log('✅ Cleaned up index.js');
EOF

node cleanup_index.js
rm cleanup_index.js

echo "📝 Creating production configuration..."

# Create production environment file
cat > .env.production << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=3002

# Solana Mainnet
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# Exchange Rate APIs
EXCHANGE_RATE_API_KEY=your_exchangerate_api_key
CURRENCY_API_KEY=your_currency_api_key
FIXER_API_KEY=your_fixer_api_key
ORACLE_API_KEY=your_oracle_api_key

# Production Payment Gateways
RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_LIVE_SECRET
CASHFREE_CLIENT_ID=CF_LIVE_CLIENT_ID
CASHFREE_CLIENT_SECRET=cfsk_ma_live_YOUR_LIVE_SECRET
CASHFREE_BASE_URL=https://payout-api.cashfree.com

# Production Treasury Wallet
SOLANA_TREASURY_PRIVATE_KEY_PROD=YOUR_PRODUCTION_TREASURY_PRIVATE_KEY

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nivix_production
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=YOUR_PRODUCTION_JWT_SECRET
ENCRYPTION_KEY=YOUR_PRODUCTION_ENCRYPTION_KEY

# Exchange Rate Settings
CACHE_TIMEOUT=300000
MAX_RETRIES=3
RATE_TIMEOUT=5000
EOF

echo "✅ Created production environment file"

echo "📊 Creating production exchange rate service..."

# Update the production exchange rate service
cat > src/services/production-exchange-rate-service.js << 'EOF'
const axios = require('axios');

class ProductionExchangeRateService {
    constructor() {
        this.apiKey = process.env.EXCHANGE_RATE_API_KEY;
        this.oracleKey = process.env.ORACLE_API_KEY;
        this.cache = new Map();
        this.cacheTimeout = parseInt(process.env.CACHE_TIMEOUT) || 5 * 60 * 1000; // 5 minutes
        this.maxRetries = parseInt(process.env.MAX_RETRIES) || 3;
        this.timeout = parseInt(process.env.RATE_TIMEOUT) || 5000;
    }

    /**
     * Get exchange rate with multiple fallbacks
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            // Same currency
            if (fromCurrency === toCurrency) {
                return 1.0;
            }

            // Check cache first
            const cacheKey = `${fromCurrency}_${toCurrency}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📊 Using cached rate: ${fromCurrency}/${toCurrency} = ${cached.rate}`);
                return cached.rate;
            }

            // Try multiple sources
            let rate = null;

            // 1. Try Oracle (most accurate)
            try {
                rate = await this.getOracleRate(fromCurrency, toCurrency);
                if (rate) {
                    console.log(`🔮 Oracle rate: ${fromCurrency}/${toCurrency} = ${rate}`);
                }
            } catch (error) {
                console.warn('⚠️ Oracle rate failed:', error.message);
            }

            // 2. Try External API
            if (!rate) {
                try {
                    rate = await this.getExternalAPIRate(fromCurrency, toCurrency);
                    if (rate) {
                        console.log(`🌐 API rate: ${fromCurrency}/${toCurrency} = ${rate}`);
                    }
                } catch (error) {
                    console.warn('⚠️ External API rate failed:', error.message);
                }
            }

            // 3. Fallback to hardcoded rates
            if (!rate) {
                rate = this.getFallbackRate(fromCurrency, toCurrency);
                console.log(`📋 Fallback rate: ${fromCurrency}/${toCurrency} = ${rate}`);
            }

            // Cache the rate
            this.cache.set(cacheKey, {
                rate: rate,
                timestamp: Date.now()
            });

            return rate;

        } catch (error) {
            console.error(`❌ Exchange rate error for ${fromCurrency}/${toCurrency}:`, error);
            return this.getFallbackRate(fromCurrency, toCurrency);
        }
    }

    /**
     * Get rate from Oracle (Chainlink, Pyth, etc.)
     */
    async getOracleRate(fromCurrency, toCurrency) {
        if (!this.oracleKey) return null;

        try {
            // Example: Chainlink Oracle
            const response = await axios.get(`https://api.chainlink.com/v1/exchangerates/${fromCurrency}/${toCurrency}`, {
                headers: { 'Authorization': `Bearer ${this.oracleKey}` },
                timeout: this.timeout
            });

            return response.data.rate;
        } catch (error) {
            console.warn(`⚠️ Oracle rate failed for ${fromCurrency}/${toCurrency}:`, error.message);
            return null;
        }
    }

    /**
     * Get rate from External API
     */
    async getExternalAPIRate(fromCurrency, toCurrency) {
        if (!this.apiKey) return null;

        try {
            // Primary: ExchangeRate-API
            const response = await axios.get(`https://v6.exchangerate-api.com/v6/${this.apiKey}/latest/${fromCurrency}`, {
                timeout: this.timeout
            });

            return response.data.rates[toCurrency];
        } catch (error) {
            console.warn(`⚠️ External API rate failed for ${fromCurrency}/${toCurrency}:`, error.message);
            return null;
        }
    }

    /**
     * Fallback hardcoded rates
     */
    getFallbackRate(fromCurrency, toCurrency) {
        const rates = {
            'USD': { 'EUR': 0.91, 'INR': 83.5, 'GBP': 0.79, 'JPY': 150, 'CAD': 1.35, 'AUD': 1.52 },
            'EUR': { 'USD': 1.10, 'INR': 91.8, 'GBP': 0.87, 'JPY': 165, 'CAD': 1.48, 'AUD': 1.67 },
            'INR': { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0095, 'JPY': 1.8, 'CAD': 0.016, 'AUD': 0.018 },
            'GBP': { 'USD': 1.27, 'EUR': 1.15, 'INR': 105.4, 'JPY': 190, 'CAD': 1.71, 'AUD': 1.92 },
            'JPY': { 'USD': 0.0067, 'EUR': 0.0061, 'INR': 0.56, 'GBP': 0.0053, 'CAD': 0.009, 'AUD': 0.010 },
            'CAD': { 'USD': 0.74, 'EUR': 0.68, 'INR': 61.8, 'GBP': 0.58, 'JPY': 111, 'AUD': 1.13 },
            'AUD': { 'USD': 0.66, 'EUR': 0.60, 'INR': 55.3, 'GBP': 0.52, 'JPY': 99, 'CAD': 0.89 }
        };

        return rates[fromCurrency]?.[toCurrency] || 1.0;
    }

    /**
     * Get health status
     */
    async getHealthStatus() {
        const sources = {
            oracle: !!this.oracleKey,
            api: !!this.apiKey,
            cache: this.cache.size
        };

        return {
            healthy: sources.oracle || sources.api,
            sources: sources,
            lastUpdate: new Date().toISOString(),
            cacheSize: this.cache.size
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Exchange rate cache cleared');
    }
}

module.exports = new ProductionExchangeRateService();
EOF

echo "✅ Created production exchange rate service"

echo "📋 Creating production deployment script..."

cat > deploy-production.sh << 'EOF'
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
EOF

chmod +x deploy-production.sh

echo "✅ Created production deployment script"

echo "📊 Summary:"
echo "✅ Removed cross-border service"
echo "✅ Removed pool clients"  
echo "✅ Removed cross-border frontend"
echo "✅ Cleaned up index.js"
echo "✅ Created production environment"
echo "✅ Created production exchange rate service"
echo "✅ Created deployment script"
echo "📦 Backup created in: $BACKUP_DIR"

echo ""
echo "🎯 Next Steps:"
echo "1. Update .env.production with your API keys"
echo "2. Run: ./deploy-production.sh"
echo "3. Monitor: pm2 logs nivix-bridge-production"
echo ""
echo "🧹 Production cleanup complete!"




