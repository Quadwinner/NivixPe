const { Connection, PublicKey, Transaction, SystemProgram } = require('@solana/web3.js');
const { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const anchor = require('@project-serum/anchor');
const ExchangeRateService = require('./exchange-rate-service');

/**
 * USDC Stablecoin Bridge for Cross-Border Payments
 * Handles conversion between local currencies and USDC
 */
class USDCBridge {
    constructor() {
        this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        // USDC mint address on Devnet
        this.usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
        this.exchangeRateService = new ExchangeRateService();
        this.initialized = false;
    }

    /**
     * Initialize USDC bridge
     */
    async initialize() {
        try {
            console.log('💲 Initializing USDC Bridge...');
            
            // Verify USDC mint exists
            const mintInfo = await this.connection.getAccountInfo(this.usdcMint);
            if (!mintInfo) {
                throw new Error('USDC mint not found on devnet');
            }

            // Store connection and mint for token operations
            console.log(`💰 USDC Mint verified: ${this.usdcMint.toString()}`);
            
            console.log('✅ USDC Bridge initialized');
            console.log(`💰 USDC Mint: ${this.usdcMint.toString()}`);
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.error('❌ USDC Bridge initialization failed:', error);
            throw error;
        }
    }

    /**
     * Convert local currency to USDC
     * Uses existing liquidity pools for conversion
     */
    async convertToUSDC(fromCurrency, amount, userWallet) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log(`💱 Converting ${amount} ${fromCurrency} to USDC`);

            // Get current exchange rate from liquidity pools
            const exchangeRate = await this.getExchangeRate(fromCurrency, 'USDC');
            const usdcAmount = amount * exchangeRate;

            // Execute swap through liquidity pool
            const swapResult = await this.executePoolSwap(
                fromCurrency, 
                'USDC', 
                amount, 
                userWallet
            );

            return {
                success: true,
                fromCurrency,
                toCurrency: 'USDC',
                inputAmount: amount,
                outputAmount: usdcAmount,
                exchangeRate,
                transactionSignature: swapResult.signature,
                usdcTokenAccount: swapResult.usdcTokenAccount
            };
        } catch (error) {
            console.error('❌ Currency to USDC conversion failed:', error);
            throw error;
        }
    }

    /**
     * Convert USDC to local currency
     */
    async convertFromUSDC(toCurrency, usdcAmount, userWallet) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log(`💱 Converting ${usdcAmount} USDC to ${toCurrency}`);

            // Get current exchange rate from liquidity pools
            const exchangeRate = await this.getExchangeRate('USDC', toCurrency);
            const localAmount = usdcAmount * exchangeRate;

            // Execute swap through liquidity pool
            const swapResult = await this.executePoolSwap(
                'USDC',
                toCurrency, 
                usdcAmount, 
                userWallet
            );

            return {
                success: true,
                fromCurrency: 'USDC',
                toCurrency,
                inputAmount: usdcAmount,
                outputAmount: localAmount,
                exchangeRate,
                transactionSignature: swapResult.signature,
                localTokenAccount: swapResult.localTokenAccount
            };
        } catch (error) {
            console.error('❌ USDC to currency conversion failed:', error);
            throw error;
        }
    }

    /**
     * Get real-time exchange rate using the robust exchange rate service
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            return await this.exchangeRateService.getExchangeRate(fromCurrency, toCurrency);
        } catch (error) {
            console.error('❌ Exchange rate lookup failed:', error);
            throw error;
        }
    }

    /**
     * Execute swap through liquidity pool
     */
    async executePoolSwap(fromCurrency, toCurrency, amount, userWallet) {
        try {
            console.log(`🔄 Executing pool swap: ${amount} ${fromCurrency} → ${toCurrency}`);

            // Use existing anchor liquidity client for the swap
            const anchorClient = require('../solana/anchor-liquidity-client');
            
            if (!anchorClient.initialized) {
                await anchorClient.initialize();
            }

            // Execute the swap
            const swapResult = await anchorClient.performSwap(
                fromCurrency,
                toCurrency,
                amount,
                userWallet
            );

            return {
                success: true,
                signature: swapResult.signature,
                inputAmount: amount,
                outputAmount: swapResult.outputAmount,
                usdcTokenAccount: swapResult.toTokenAccount,
                localTokenAccount: swapResult.toTokenAccount
            };
        } catch (error) {
            console.error('❌ Pool swap execution failed:', error);
            throw error;
        }
    }

    /**
     * Transfer USDC to partner off-ramp
     */
    async transferToPartner(usdcAmount, partnerAddress, transactionId) {
        try {
            console.log(`📤 Transferring ${usdcAmount} USDC to partner: ${partnerAddress}`);

            if (!this.initialized) {
                await this.initialize();
            }

            // Validate partner address
            let partnerPublicKey;
            try {
                partnerPublicKey = new PublicKey(partnerAddress);
            } catch (error) {
                throw new Error('Invalid partner address');
            }

            // Get associated token address for partner
            const partnerTokenAccount = await getAssociatedTokenAddress(
                this.usdcMint,
                partnerPublicKey
            );

            // This would require the treasury wallet's keypair to sign
            // For now, we'll return the transaction details
            return {
                success: true,
                amount: usdcAmount,
                currency: 'USDC',
                partnerAddress,
                partnerTokenAccount: partnerTokenAccount.toString(),
                transactionId,
                status: 'READY_TO_TRANSFER',
                instructions: 'Transfer requires treasury wallet signature'
            };
        } catch (error) {
            console.error('❌ Partner transfer preparation failed:', error);
            throw error;
        }
    }

    /**
     * Get USDC balance for an account
     */
    async getUSDCBalance(walletAddress) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const walletPublicKey = new PublicKey(walletAddress);
            const tokenAccounts = await this.connection.getTokenAccountsByOwner(
                walletPublicKey,
                { mint: this.usdcMint }
            );

            if (tokenAccounts.value.length === 0) {
                return 0;
            }

            // Get token account info from the first USDC token account
            const accountInfo = await this.connection.getTokenAccountBalance(
                tokenAccounts.value[0].pubkey
            );

            // USDC has 6 decimal places
            return parseFloat(accountInfo.value.amount) / Math.pow(10, accountInfo.value.decimals);
        } catch (error) {
            console.error('❌ USDC balance check failed:', error);
            return 0;
        }
    }

    /**
     * Create USDC token account for user
     */
    async createUSDCAccount(userWallet) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log(`🏦 Creating USDC account for: ${userWallet}`);

            const userPublicKey = new PublicKey(userWallet);
            const tokenAccount = await getAssociatedTokenAddress(
                this.usdcMint,
                userPublicKey
            );

            return {
                success: true,
                tokenAccount: tokenAccount.toString(),
                mint: this.usdcMint.toString(),
                owner: userWallet
            };
        } catch (error) {
            console.error('❌ USDC account creation failed:', error);
            throw error;
        }
    }

    /**
     * Get USDC price from external oracle
     */
    async getUSDCPrice() {
        try {
            // USDC should be ~$1, but we can get real-time price from oracles
            // For now, return 1.00 as USDC is pegged to USD
            return {
                price: 1.00,
                currency: 'USD',
                source: 'PEGGED',
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error('❌ USDC price lookup failed:', error);
            return {
                price: 1.00,
                currency: 'USD',
                source: 'DEFAULT',
                lastUpdated: new Date()
            };
        }
    }

    /**
     * Monitor USDC transaction status
     */
    async monitorTransaction(signature) {
        try {
            console.log(`👀 Monitoring USDC transaction: ${signature}`);

            const confirmation = await this.connection.confirmTransaction(signature);
            
            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            const transaction = await this.connection.getTransaction(signature);
            
            return {
                signature,
                status: 'CONFIRMED',
                blockTime: transaction?.blockTime ? new Date(transaction.blockTime * 1000) : new Date(),
                slot: confirmation.context.slot,
                confirmations: 1
            };
        } catch (error) {
            console.error('❌ Transaction monitoring failed:', error);
            throw error;
        }
    }

    /**
     * Calculate optimal routing for currency conversion
     */
    async calculateOptimalRoute(fromCurrency, toCurrency, amount) {
        try {
            console.log(`🗺️ Calculating optimal route: ${fromCurrency} → ${toCurrency}`);

            // Try direct conversion first
            try {
                const directRate = await this.getExchangeRate(fromCurrency, toCurrency);
                const estimatedOutput = amount * directRate;
                
                return {
                    route: 'DIRECT',
                    path: [fromCurrency, toCurrency],
                    estimatedOutput,
                    fees: amount * 0.003, // 0.3% fee
                    steps: 1,
                    exchangeRate: directRate
                };
            } catch (directError) {
                console.log('⚠️ Direct route not available, trying via USDC');
            }

            // Try route through USDC
            if (fromCurrency !== 'USDC' && toCurrency !== 'USDC') {
                try {
                    const fromToUSDCRate = await this.getExchangeRate(fromCurrency, 'USDC');
                    const usdcToTargetRate = await this.getExchangeRate('USDC', toCurrency);
                    
                    const usdcAmount = amount * fromToUSDCRate;
                    const finalAmount = usdcAmount * usdcToTargetRate;

                    return {
                        route: 'VIA_USDC',
                        path: [fromCurrency, 'USDC', toCurrency],
                        estimatedOutput: finalAmount,
                        fees: amount * 0.006, // 0.3% per swap, 2 swaps
                        steps: 2,
                        intermediateAmount: usdcAmount,
                        exchangeRates: {
                            step1: fromToUSDCRate,
                            step2: usdcToTargetRate
                        }
                    };
                } catch (usdcError) {
                    console.error('⚠️ USDC route also failed:', usdcError.message);
                }
            }

            throw new Error(`No route available for ${fromCurrency} → ${toCurrency}`);
        } catch (error) {
            console.error('❌ Route calculation failed:', error);
            throw error;
        }
    }
}

module.exports = USDCBridge;


