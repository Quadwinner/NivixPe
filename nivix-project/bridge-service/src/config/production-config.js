/**
 * Production Configuration Module
 * Centralizes all production-ready configurations
 * Eliminates mock/dummy/hardcoded values
 */

const fs = require('fs');
const path = require('path');

class ProductionConfig {
    constructor() {
        this.environment = process.env.NODE_ENV || 'development';
        this.isProduction = this.environment === 'production';

        // Load treasury token mints from real data
        this.treasuryTokenMints = this.loadTreasuryTokenMints();

        console.log(`🔧 ProductionConfig initialized for ${this.environment} environment`);
        if (!this.isProduction) {
            console.warn('⚠️ WARNING: Running in non-production mode');
        }
    }

    /**
     * Load real treasury token mint addresses
     */
    loadTreasuryTokenMints() {
        try {
            const treasuryDataPath = path.join(__dirname, '../../../data/treasury-token-mints.json');

            if (fs.existsSync(treasuryDataPath)) {
                const treasuryData = JSON.parse(fs.readFileSync(treasuryDataPath, 'utf8'));
                const tokenMints = {};

                for (const [currency, mintInfo] of Object.entries(treasuryData.treasuryMints)) {
                    tokenMints[currency.toUpperCase()] = mintInfo.mint;
                }

                console.log(`✅ Loaded ${Object.keys(tokenMints).length} real token mints from treasury data`);
                return tokenMints;
            } else {
                console.error('❌ Treasury token mints file not found - cannot operate in production mode');
                if (this.isProduction) {
                    throw new Error('Production mode requires real treasury token mints');
                }
                return this.getFallbackTokenMints();
            }
        } catch (error) {
            console.error('❌ Failed to load treasury token mints:', error);
            if (this.isProduction) {
                throw error;
            }
            return this.getFallbackTokenMints();
        }
    }

    /**
     * Get fallback token mints for development only
     */
    getFallbackTokenMints() {
        console.warn('⚠️ Using fallback token mints - NOT FOR PRODUCTION');
        return {
            'USD': '6bnA6PbiAnqZyxxd9VAhUAE7yJdUsyHfF5vD3GrFshRb',
            'EUR': 'GDxSRBr59UF8bYZ8YXY1badddmRuQm1NtiQ2drK6m9mA',
            'INR': 'ByNvp4hVCKp3nXnzkp1eKc4NAe2JHoZZwW7SUA7rVf8y',
            'GBP': '9wkz628K5jw25vuAVn7copdnLHn4K5RYime6onJNR7de',
            'JPY': 'DCC4kACrBDhpNYDxRAQ1RyJjtQEYtdksGihupVFXuNCm',
            'CAD': 'G59pYLNCdw2XhPP96L8kh5rdciCDhmdcuWcuW4DedVBM',
            'AUD': 'CKdEAXrwxZnBN4LKdZPj6bHs9dh1axFPiYLS66kyX5CB'
        };
    }

    /**
     * Get token mint address for currency
     */
    getTokenMint(currency) {
        const mint = this.treasuryTokenMints[currency.toUpperCase()];
        if (!mint) {
            throw new Error(`Token mint not found for currency: ${currency}`);
        }
        return mint;
    }

    /**
     * Get Solana RPC endpoint
     */
    getSolanaRpcEndpoint() {
        if (this.isProduction) {
            // Production should use mainnet
            return process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
        } else {
            // Development can use devnet
            return process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
        }
    }

    /**
     * Get exchange rate fallback values (only for emergency fallback)
     */
    getEmergencyExchangeRates() {
        if (this.isProduction) {
            console.error('❌ Emergency exchange rates should NOT be used in production');
            throw new Error('Production systems must use real-time exchange rates');
        }

        console.warn('⚠️ Using emergency fallback exchange rates - NOT FOR PRODUCTION');
        return {
            'INR_USD': 0.012,
            'USD_EUR': 0.85,
            'USD_GBP': 0.79,
            'USD_JPY': 149.50,
            'USD_CAD': 1.35,
            'USD_AUD': 1.52
        };
    }

    /**
     * Get production-ready exchange rate service configuration
     */
    getExchangeRateConfig() {
        return {
            primary_api: process.env.EXCHANGE_RATE_PRIMARY_API || 'https://api.exchangerate-api.com/v4/latest/',
            secondary_api: process.env.EXCHANGE_RATE_SECONDARY_API || 'https://api.fixer.io/latest',
            api_key: process.env.EXCHANGE_RATE_API_KEY,
            cache_ttl: parseInt(process.env.EXCHANGE_RATE_CACHE_TTL) || 300, // 5 minutes
            stale_threshold: parseInt(process.env.EXCHANGE_RATE_STALE_THRESHOLD) || 600, // 10 minutes
            timeout: parseInt(process.env.EXCHANGE_RATE_TIMEOUT) || 5000 // 5 seconds
        };
    }

    /**
     * Get payment gateway configurations
     */
    getPaymentGatewayConfig() {
        return {
            razorpay: {
                key_id: process.env.RAZORPAY_KEY_ID,
                key_secret: process.env.RAZORPAY_KEY_SECRET,
                webhook_secret: process.env.RAZORPAY_WEBHOOK_SECRET,
                environment: this.isProduction ? 'live' : 'test'
            },
            // Add other payment gateways here
        };
    }

    /**
     * Get database configuration
     */
    getDatabaseConfig() {
        if (this.isProduction) {
            return {
                type: 'postgresql', // Or your production database
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME,
                username: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                ssl: true,
                pool: {
                    min: 5,
                    max: 20
                }
            };
        } else {
            return {
                type: 'file_storage', // Development fallback
                path: './data/'
            };
        }
    }

    /**
     * Validate production readiness
     */
    validateProductionReadiness() {
        const issues = [];

        // Check required environment variables
        const requiredEnvVars = [
            'SOLANA_RPC_ENDPOINT',
            'EXCHANGE_RATE_API_KEY',
            'RAZORPAY_KEY_ID',
            'RAZORPAY_KEY_SECRET'
        ];

        if (this.isProduction) {
            for (const envVar of requiredEnvVars) {
                if (!process.env[envVar]) {
                    issues.push(`Missing required environment variable: ${envVar}`);
                }
            }

            // Check if using mainnet
            const rpcEndpoint = this.getSolanaRpcEndpoint();
            if (!rpcEndpoint.includes('mainnet')) {
                issues.push('Solana RPC endpoint must be mainnet for production');
            }

            // Check if all token mints are loaded
            const currencies = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'CAD', 'AUD'];
            for (const currency of currencies) {
                try {
                    this.getTokenMint(currency);
                } catch (error) {
                    issues.push(`Missing token mint for ${currency}`);
                }
            }
        }

        return issues;
    }

    /**
     * Get all currency codes
     */
    getSupportedCurrencies() {
        return Object.keys(this.treasuryTokenMints);
    }

    /**
     * Check if environment is production-ready
     */
    isProductionReady() {
        const issues = this.validateProductionReadiness();
        return issues.length === 0;
    }
}

// Singleton instance
const productionConfig = new ProductionConfig();

module.exports = productionConfig;