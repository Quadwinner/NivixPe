const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { getAssociatedTokenAddress } = require('@solana/spl-token');
const fs = require('fs').promises;
const path = require('path');

/**
 * Real Treasury Balance Fetcher
 * Fetches actual token balances from Solana blockchain
 */
class RealTreasuryFetcher {
    constructor() {
        this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        this.treasuryWallet = null;
        this.mintAccounts = null;
        
        // Real-time exchange rates (in production, fetch from API)
        this.exchangeRates = {
            'USD': 1.0,
            'EUR': 1.10,
            'GBP': 1.27,
            'INR': 0.012,
            'JPY': 0.0067,
            'CAD': 0.74,
            'AUD': 0.66
        };
        
        console.log('💰 Real Treasury Fetcher initialized');
    }

    /**
     * Initialize treasury wallet and mint accounts
     */
    async initialize() {
        try {
            // Load bridge wallet (which has mint authority)
            const walletPath = path.join(__dirname, '../../wallet/bridge-wallet.json');
            const walletData = await fs.readFile(walletPath, 'utf8');
            const secretKey = JSON.parse(walletData);
            this.treasuryWallet = Keypair.fromSecretKey(new Uint8Array(secretKey));
            
            // Load mint accounts
            const mintAccountsPath = path.join(__dirname, '../../data/mint-accounts.json');
            const mintData = await fs.readFile(mintAccountsPath, 'utf8');
            this.mintAccounts = JSON.parse(mintData);
            
            console.log(`💰 Treasury wallet loaded: ${this.treasuryWallet.publicKey.toString()}`);
            console.log(`🪙 Loaded ${Object.keys(this.mintAccounts).filter(key => key.endsWith('Mint')).length} token mints`);
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize treasury fetcher:', error.message);
            return false;
        }
    }

    /**
     * Fetch real token balances from Solana blockchain
     */
    async getRealTreasuryBalances() {
        try {
            if (!this.treasuryWallet || !this.mintAccounts) {
                await this.initialize();
            }

            const balances = {};
            const currencies = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'CAD', 'AUD'];
            
            console.log('🔍 Fetching real treasury balances from Solana...');
            
            for (const currency of currencies) {
                const mintKey = `${currency.toLowerCase()}Mint`;
                const tokenAccountKey = `${currency.toLowerCase()}TokenAccount`;
                
                if (this.mintAccounts[mintKey]) {
                    try {
                        console.log(`📊 Fetching ${currency} balance...`);
                        
                        const mintAddress = this.mintAccounts[mintKey];
                        const mintPubkey = new PublicKey(mintAddress);
                        
                        // Get associated token account for treasury wallet
                        const treasuryTokenAccount = await getAssociatedTokenAddress(
                            mintPubkey,
                            this.treasuryWallet.publicKey
                        );
                        
                        // Fetch actual balance from blockchain
                        let balance = 0;
                        let accountExists = false;
                        
                        try {
                            const accountInfo = await this.connection.getTokenAccountBalance(treasuryTokenAccount);
                            balance = accountInfo.value.uiAmount || 0;
                            accountExists = true;
                            
                            console.log(`✅ ${currency}: ${balance} tokens`);
                        } catch (accountError) {
                            console.warn(`⚠️ ${currency} token account not found or empty`);
                            balance = 0;
                            accountExists = false;
                        }
                        
                        // Calculate USD value using exchange rates
                        const usdValue = balance * (this.exchangeRates[currency] || 1.0);
                        
                        balances[currency] = {
                            balance: balance,
                            usd_value: Math.round(usdValue * 100) / 100,
                            mint_address: mintAddress,
                            token_account: treasuryTokenAccount.toString(),
                            account_exists: accountExists,
                            exchange_rate: this.exchangeRates[currency],
                            last_updated: new Date().toISOString(),
                            source: 'solana_blockchain'
                        };
                        
                    } catch (error) {
                        console.error(`❌ Failed to fetch ${currency} balance:`, error.message);
                        balances[currency] = {
                            balance: 0,
                            usd_value: 0,
                            error: error.message,
                            mint_address: this.mintAccounts[mintKey],
                            source: 'error',
                            last_updated: new Date().toISOString()
                        };
                    }
                } else {
                    console.warn(`⚠️ No mint address found for ${currency}`);
                    balances[currency] = {
                        balance: 0,
                        usd_value: 0,
                        error: 'Mint address not configured',
                        source: 'configuration_missing',
                        last_updated: new Date().toISOString()
                    };
                }
            }
            
            const totalLiquidity = Object.values(balances)
                .reduce((total, bal) => total + (bal.usd_value || 0), 0);
            
            console.log(`💰 Total treasury liquidity: $${totalLiquidity.toLocaleString()}`);
            
            return {
                balances,
                total_liquidity_usd: totalLiquidity,
                treasury_wallet: this.treasuryWallet.publicKey.toString(),
                last_updated: new Date().toISOString(),
                source: 'real_blockchain_data'
            };
            
        } catch (error) {
            console.error('❌ Failed to fetch real treasury balances:', error.message);
            return this.getFallbackBalances();
        }
    }

    /**
     * Get individual token balance
     */
    async getTokenBalance(currency) {
        try {
            const mintKey = `${currency.toLowerCase()}Mint`;
            
            if (!this.mintAccounts[mintKey]) {
                throw new Error(`Mint address not found for ${currency}`);
            }
            
            const mintAddress = this.mintAccounts[mintKey];
            const mintPubkey = new PublicKey(mintAddress);
            
            const treasuryTokenAccount = await getAssociatedTokenAddress(
                mintPubkey,
                this.treasuryWallet.publicKey
            );
            
            const accountInfo = await this.connection.getTokenAccountBalance(treasuryTokenAccount);
            const balance = accountInfo.value.uiAmount || 0;
            
            return {
                currency,
                balance,
                usd_value: balance * (this.exchangeRates[currency] || 1.0),
                mint_address: mintAddress,
                token_account: treasuryTokenAccount.toString(),
                source: 'solana_blockchain'
            };
            
        } catch (error) {
            return {
                currency,
                balance: 0,
                usd_value: 0,
                error: error.message,
                source: 'error'
            };
        }
    }

    /**
     * Check if treasury has sufficient balance for withdrawal
     */
    async checkSufficientBalance(currency, amount) {
        try {
            const tokenBalance = await this.getTokenBalance(currency);
            return {
                sufficient: tokenBalance.balance >= amount,
                current_balance: tokenBalance.balance,
                requested_amount: amount,
                shortfall: Math.max(0, amount - tokenBalance.balance)
            };
        } catch (error) {
            return {
                sufficient: false,
                error: error.message,
                current_balance: 0,
                requested_amount: amount
            };
        }
    }

    /**
     * Get treasury statistics
     */
    async getTreasuryStats() {
        const balanceData = await this.getRealTreasuryBalances();
        
        const stats = {
            total_currencies: Object.keys(balanceData.balances).length,
            total_liquidity_usd: balanceData.total_liquidity_usd,
            active_accounts: 0,
            empty_accounts: 0,
            error_accounts: 0
        };
        
        for (const balance of Object.values(balanceData.balances)) {
            if (balance.error) {
                stats.error_accounts++;
            } else if (balance.balance > 0) {
                stats.active_accounts++;
            } else {
                stats.empty_accounts++;
            }
        }
        
        return stats;
    }

    /**
     * Fallback balances when blockchain is unreachable
     */
    getFallbackBalances() {
        return {
            balances: {
                USD: { balance: 'offline', usd_value: 0, error: 'Blockchain unavailable', source: 'fallback' },
                EUR: { balance: 'offline', usd_value: 0, error: 'Blockchain unavailable', source: 'fallback' },
                INR: { balance: 'offline', usd_value: 0, error: 'Blockchain unavailable', source: 'fallback' },
                GBP: { balance: 'offline', usd_value: 0, error: 'Blockchain unavailable', source: 'fallback' },
                JPY: { balance: 'offline', usd_value: 0, error: 'Blockchain unavailable', source: 'fallback' },
                CAD: { balance: 'offline', usd_value: 0, error: 'Blockchain unavailable', source: 'fallback' },
                AUD: { balance: 'offline', usd_value: 0, error: 'Blockchain unavailable', source: 'fallback' }
            },
            total_liquidity_usd: 0,
            treasury_wallet: 'offline',
            last_updated: new Date().toISOString(),
            source: 'fallback_offline'
        };
    }

    /**
     * Test blockchain connectivity
     */
    async testConnection() {
        try {
            const health = await this.connection.getHealth();
            const slot = await this.connection.getSlot();
            
            return {
                connected: true,
                health: health,
                current_slot: slot,
                endpoint: this.connection.rpcEndpoint,
                test_time: new Date().toISOString()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                endpoint: this.connection.rpcEndpoint,
                test_time: new Date().toISOString()
            };
        }
    }
}

module.exports = RealTreasuryFetcher;




