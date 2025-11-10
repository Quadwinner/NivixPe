/**
 * Production Readiness Validation Script
 * Validates that the system is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

class ProductionValidator {
    constructor() {
        this.issues = [];
        this.warnings = [];
        this.passes = [];
    }

    /**
     * Run all production readiness checks
     */
    async validate() {
        console.log('🔍 Running Production Readiness Validation...');
        console.log('═'.repeat(60));

        await this.checkEnvironmentVariables();
        await this.checkTokenMints();
        await this.checkConfigurationFiles();
        await this.checkMockDataElimination();
        await this.checkNetworkConfiguration();
        await this.checkSecurityConfiguration();

        this.generateReport();
    }

    /**
     * Check required environment variables
     */
    async checkEnvironmentVariables() {
        console.log('\n1️⃣ Checking Environment Variables...');

        const required = [
            'NODE_ENV',
            'SOLANA_RPC_ENDPOINT',
            'RAZORPAY_KEY_ID',
            'RAZORPAY_KEY_SECRET',
            'EXCHANGE_RATE_API_KEY'
        ];

        const recommended = [
            'DB_HOST',
            'DB_USER',
            'DB_PASSWORD',
            'RAZORPAY_WEBHOOK_SECRET',
            'EXCHANGE_RATE_CACHE_TTL'
        ];

        for (const envVar of required) {
            if (!process.env[envVar]) {
                this.issues.push(`Missing required environment variable: ${envVar}`);
            } else {
                this.passes.push(`Environment variable set: ${envVar}`);
            }
        }

        for (const envVar of recommended) {
            if (!process.env[envVar]) {
                this.warnings.push(`Recommended environment variable not set: ${envVar}`);
            } else {
                this.passes.push(`Recommended environment variable set: ${envVar}`);
            }
        }

        // Check NODE_ENV
        if (process.env.NODE_ENV !== 'production') {
            this.warnings.push(`NODE_ENV is '${process.env.NODE_ENV}' - should be 'production' for deployment`);
        }
    }

    /**
     * Check token mints are real and accessible
     */
    async checkTokenMints() {
        console.log('\n2️⃣ Checking Token Mints...');

        const treasuryDataPath = path.join(__dirname, '../data/treasury-token-mints.json');

        if (fs.existsSync(treasuryDataPath)) {
            try {
                const treasuryData = JSON.parse(fs.readFileSync(treasuryDataPath, 'utf8'));
                const currencies = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'CAD', 'AUD'];

                for (const currency of currencies) {
                    if (treasuryData.treasuryMints[currency] && treasuryData.treasuryMints[currency].mint) {
                        this.passes.push(`Token mint exists for ${currency}: ${treasuryData.treasuryMints[currency].mint}`);
                    } else {
                        this.issues.push(`Missing token mint for ${currency}`);
                    }
                }

                // Check treasury wallet
                if (treasuryData.treasuryWallet) {
                    this.passes.push(`Treasury wallet configured: ${treasuryData.treasuryWallet}`);
                } else {
                    this.issues.push('Treasury wallet not configured');
                }

            } catch (error) {
                this.issues.push(`Failed to parse treasury token mints: ${error.message}`);
            }
        } else {
            this.issues.push('Treasury token mints file not found');
        }
    }

    /**
     * Check configuration files
     */
    async checkConfigurationFiles() {
        console.log('\n3️⃣ Checking Configuration Files...');

        const configFiles = [
            '../data/treasury-config.json',
            '../data/treasury-keypair.json',
            'src/config/production-config.js'
        ];

        for (const configFile of configFiles) {
            const filePath = path.join(__dirname, configFile);
            if (fs.existsSync(filePath)) {
                this.passes.push(`Configuration file exists: ${configFile}`);
            } else {
                this.issues.push(`Missing configuration file: ${configFile}`);
            }
        }
    }

    /**
     * Check for remaining mock data
     */
    async checkMockDataElimination() {
        console.log('\n4️⃣ Checking Mock Data Elimination...');

        const checkPatterns = [
            { pattern: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', description: 'Old mock AUD token' },
            { pattern: 'return \\[\\]', description: 'Empty array returns' },
            { pattern: 'return \\{\\}', description: 'Empty object returns' },
            { pattern: 'mock|Mock|MOCK', description: 'Mock references' },
            { pattern: 'dummy|Dummy|DUMMY', description: 'Dummy references' },
            { pattern: 'test.*data|TEST.*DATA', description: 'Test data references' }
        ];

        const filesToCheck = [
            'src/onramp/onramp-engine.js',
            'src/offramp/offramp-engine.js',
            'src/admin/operations-dashboard.js',
            'src/admin/real-treasury-fetcher.js'
        ];

        for (const file of filesToCheck) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');

                for (const check of checkPatterns) {
                    const regex = new RegExp(check.pattern, 'gi');
                    const matches = content.match(regex);

                    if (matches) {
                        this.warnings.push(`Found ${check.description} in ${file}: ${matches.length} instances`);
                    } else {
                        this.passes.push(`No ${check.description} found in ${file}`);
                    }
                }
            }
        }
    }

    /**
     * Check network configuration
     */
    async checkNetworkConfiguration() {
        console.log('\n5️⃣ Checking Network Configuration...');

        const solanaEndpoint = process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';

        if (solanaEndpoint.includes('mainnet')) {
            this.passes.push(`Solana endpoint configured for mainnet: ${solanaEndpoint}`);
        } else if (solanaEndpoint.includes('devnet')) {
            this.warnings.push(`Solana endpoint is devnet (${solanaEndpoint}) - should be mainnet for production`);
        } else {
            this.issues.push(`Unknown Solana endpoint: ${solanaEndpoint}`);
        }

        // Check for localhost references
        const filesToCheck = ['src/index.js', 'src/admin/real-treasury-fetcher.js'];
        for (const file of filesToCheck) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                if (content.includes('localhost') || content.includes('127.0.0.1')) {
                    this.warnings.push(`File ${file} contains localhost references`);
                }
            }
        }
    }

    /**
     * Check security configuration
     */
    async checkSecurityConfiguration() {
        console.log('\n6️⃣ Checking Security Configuration...');

        // Check if sensitive files are secured
        const sensitiveFiles = [
            '../data/treasury-keypair.json',
            'wallet/bridge-wallet.json'
        ];

        for (const file of sensitiveFiles) {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                const permissions = (stats.mode & parseInt('777', 8)).toString(8);

                if (permissions === '600' || permissions === '400') {
                    this.passes.push(`Secure permissions on ${file}: ${permissions}`);
                } else {
                    this.warnings.push(`Insecure permissions on ${file}: ${permissions} (should be 600 or 400)`);
                }
            }
        }

        // Check environment-based security
        if (process.env.NODE_ENV === 'production') {
            const securityEnvVars = [
                'RAZORPAY_WEBHOOK_SECRET',
                'JWT_SECRET',
                'API_SECRET_KEY'
            ];

            for (const envVar of securityEnvVars) {
                if (!process.env[envVar]) {
                    this.warnings.push(`Production security variable not set: ${envVar}`);
                }
            }
        }
    }

    /**
     * Generate validation report
     */
    generateReport() {
        console.log('\n' + '═'.repeat(60));
        console.log('🎯 PRODUCTION READINESS VALIDATION REPORT');
        console.log('═'.repeat(60));

        console.log(`\n✅ PASSES: ${this.passes.length}`);
        if (this.passes.length > 0) {
            this.passes.forEach(pass => console.log(`  ✅ ${pass}`));
        }

        console.log(`\n⚠️ WARNINGS: ${this.warnings.length}`);
        if (this.warnings.length > 0) {
            this.warnings.forEach(warning => console.log(`  ⚠️ ${warning}`));
        }

        console.log(`\n❌ CRITICAL ISSUES: ${this.issues.length}`);
        if (this.issues.length > 0) {
            this.issues.forEach(issue => console.log(`  ❌ ${issue}`));
        }

        console.log('\n' + '═'.repeat(60));

        if (this.issues.length === 0 && this.warnings.length === 0) {
            console.log('🎉 PRODUCTION READY! ✅');
            console.log('All checks passed - system is ready for production deployment');
        } else if (this.issues.length === 0) {
            console.log('⚠️ PRODUCTION READY WITH WARNINGS ⚠️');
            console.log('No critical issues found, but some warnings should be addressed');
        } else {
            console.log('❌ NOT PRODUCTION READY ❌');
            console.log(`${this.issues.length} critical issues must be resolved before production deployment`);
        }

        console.log('\n📋 NEXT STEPS:');
        if (this.issues.length > 0) {
            console.log('1. Fix all critical issues listed above');
            console.log('2. Re-run validation script');
            console.log('3. Address warnings before final deployment');
        } else {
            console.log('1. Address any warnings');
            console.log('2. Perform final integration testing');
            console.log('3. Deploy to production environment');
        }

        return {
            isProductionReady: this.issues.length === 0,
            hasWarnings: this.warnings.length > 0,
            summary: {
                passes: this.passes.length,
                warnings: this.warnings.length,
                issues: this.issues.length
            }
        };
    }
}

// Run validation if this file is executed directly
if (require.main === module) {
    const validator = new ProductionValidator();
    validator.validate()
        .then(() => {
            const result = validator.generateReport();
            process.exit(result.isProductionReady ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Validation failed:', error);
            process.exit(1);
        });
}

module.exports = ProductionValidator;