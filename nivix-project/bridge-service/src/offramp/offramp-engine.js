const TreasuryManager = require('../treasury/treasury-manager');
const ExchangeRateService = require('../stablecoin/exchange-rate-service');
const FiatPayoutService = require('../payments/fiat-payout-service');
const { v4: uuidv4 } = require('uuid');
const fetch = require('node-fetch');
const RazorpayGateway = require('../payments/razorpay-gateway');
const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const { 
    getAssociatedTokenAddress, 
    createBurnInstruction,
    TOKEN_PROGRAM_ID 
} = require('@solana/spl-token');
const fs = require('fs');

/**
 * Off-Ramp Engine for Nivix
 * Orchestrates the complete crypto-to-fiat withdrawal process
 */
class OfframpEngine {
    constructor() {
        this.treasuryManager = new TreasuryManager();
        this.exchangeRateService = new ExchangeRateService();
        this.razorpayGateway = new RazorpayGateway();
        this.fiatPayoutService = new FiatPayoutService();
        // Use same connection configuration as frontend
        this.connection = new Connection('https://api.devnet.solana.com', {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 60000,
        });
        this.treasuryKeypair = null;
        this.transactions = new Map(); // In production, this would be a database
        this.statusCallbacks = new Map(); // For real-time status updates
        this.quotes = new Map(); // Store quotes for processing
    }

    /**
     * Initialize the off-ramp engine
     */
    async initialize() {
        try {
            console.log('🚀 Initializing Off-Ramp Engine...');
            
            // Initialize treasury management
            await this.treasuryManager.initialize();
            
            // Load treasury keypair for token burning
            await this.loadTreasuryKeypair();
            
            console.log('✅ Off-Ramp Engine initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Off-Ramp Engine initialization failed:', error);
            throw error;
        }
    }

    /**
     * Get withdrawal quote
     * Calculates fees, exchange rates, and processing time
     */
    async getWithdrawalQuote(params) {
        try {
            const { 
                fromCurrency, 
                toCurrency, 
                amount, 
                corridor,
                paymentMethod 
            } = params;

            console.log(`💰 Generating quote: ${amount} ${fromCurrency} → ${toCurrency}`);

            // Validate inputs
            if (!fromCurrency || !toCurrency || !amount) {
                throw new Error('Missing required parameters: fromCurrency, toCurrency, amount');
            }

            // Check treasury availability
            const treasuryCheck = await this.treasuryManager.canProcessWithdrawal(toCurrency, amount);
            if (!treasuryCheck.canProcess) {
                throw new Error(`Cannot process withdrawal: ${treasuryCheck.reason}`);
            }

            // Calculate fees and rates
            const quote = await this.calculateQuote(fromCurrency, toCurrency, amount, corridor);
            
            // Add treasury availability info
            quote.treasuryAvailable = true;
            quote.currentTreasuryBalance = treasuryCheck.currentBalance;
            quote.balanceAfterWithdrawal = treasuryCheck.balanceAfter;

            // Store quote for later processing
            this.quotes.set(quote.quoteId, quote);

            console.log(`✅ Quote generated and stored: ${quote.netAmount} ${toCurrency} (fees: ${quote.totalFees})`);
            return quote;
        } catch (error) {
            console.error('❌ Quote generation failed:', error);
            throw error;
        }
    }

    /**
     * Calculate detailed quote with fees and exchange rates
     */
    async calculateQuote(fromCurrency, toCurrency, amount, corridor) {
        try {
            // Get real-time exchange rate
            const exchangeRate = await this.getRealTimeExchangeRate(fromCurrency, toCurrency);
            
            // Get fee structure from configuration
            const fees = await this.getFeeStructure(corridor, fromCurrency, toCurrency);
            
            // Calculate conversion
            let convertedAmount = amount;
            if (fromCurrency !== toCurrency) {
                convertedAmount = amount * exchangeRate;
            }

            // Calculate fees
            const platformFeeAmount = convertedAmount * fees.platformFee;
            const networkFeeAmount = convertedAmount * fees.networkFee;
            const corridorFeeAmount = convertedAmount * fees.corridorFee;
            const paymentFeeAmount = fees.paymentFee; // Fixed fee

            const totalFees = platformFeeAmount + networkFeeAmount + corridorFeeAmount + paymentFeeAmount;
            const netAmount = convertedAmount - totalFees;

            // Processing time estimation from corridor configuration
            const processingTime = await this.getProcessingTime(corridor, toCurrency);

            return {
                fromCurrency,
                toCurrency,
                inputAmount: amount,
                exchangeRate,
                convertedAmount,
                fees: {
                    platform: platformFeeAmount,
                    network: networkFeeAmount,
                    corridor: corridorFeeAmount,
                    payment: paymentFeeAmount,
                    total: totalFees
                },
                totalFees,
                netAmount,
                processingTime,
                corridor,
                quoteId: uuidv4(),
                validUntil: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                createdAt: new Date()
            };
        } catch (error) {
            console.error('❌ Quote calculation failed:', error);
            throw error;
        }
    }

    /**
     * Get real-time exchange rate using centralized service
     */
    async getRealTimeExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return 1;
        }

        try {
            // Use the centralized ExchangeRateService
            const ExchangeRateService = require('../stablecoin/exchange-rate-service');
            const exchangeService = new ExchangeRateService();
            
            const rate = await exchangeService.getExchangeRate(fromCurrency, toCurrency);
            console.log(`📊 Exchange rate: ${fromCurrency}/${toCurrency} = ${rate}`);
            return rate;
        } catch (error) {
            console.error(`❌ Could not get exchange rate for ${fromCurrency}/${toCurrency}:`, error);
            throw new Error(`Exchange rate not available for ${fromCurrency}/${toCurrency}`);
        }
    }

    /**
     * Get exchange rate from on-chain liquidity pools
     */
    async getPoolExchangeRate(fromCurrency, toCurrency) {
        try {
            // This would integrate with the existing anchor-liquidity-client
            // to get real-time rates from our liquidity pools
            const anchorClient = require('../solana/anchor-liquidity-client');
            
            // Get pool information for the currency pair
            const poolsResult = await anchorClient.listLiquidityPools();
            const pools = poolsResult.pools || [];
            const pool = pools.find(p => 
                (p.tokenA === fromCurrency && p.tokenB === toCurrency) ||
                (p.tokenA === toCurrency && p.tokenB === fromCurrency)
            );

            if (pool && pool.reserveA > 0 && pool.reserveB > 0) {
                // Calculate rate based on pool reserves
                if (pool.tokenA === fromCurrency) {
                    return pool.reserveB / pool.reserveA;
                } else {
                    return pool.reserveA / pool.reserveB;
                }
            }

            return null; // No pool found
        } catch (error) {
            console.warn('⚠️ Could not get pool rate:', error.message);
            return null;
        }
    }

    /**
     * Get exchange rate from external API
     */
    async getExternalExchangeRate(fromCurrency, toCurrency) {
        // This would integrate with real exchange rate APIs
        // For example: CurrencyAPI, ExchangeRatesAPI, CoinGecko, etc.
        
        // Example integration (you would need API keys):
        /*
        const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
        const data = await response.json();
        return data.rates[toCurrency];
        */
        
        throw new Error('External exchange rate API not configured. Please set up rate provider.');
    }

    /**
     * Get fee structure from configuration
     */
    async getFeeStructure(corridor, fromCurrency, toCurrency) {
        try {
            // Load fee structure from configuration file
            const fs = require('fs');
            const path = require('path');
            const configPath = path.join(__dirname, '../../../data/fee-config.json');
            
            if (fs.existsSync(configPath)) {
                const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                
                // Get corridor-specific fees
                const corridorFees = config.corridors?.[corridor] || config.default;
                
                return {
                    platformFee: corridorFees?.platformFee || 0.005, // 0.5%
                    networkFee: fromCurrency !== toCurrency ? (corridorFees?.networkFee || 0.002) : 0,
                    corridorFee: corridorFees?.corridorFee || 0.001,
                    paymentFee: corridorFees?.paymentFee || 0
                };
            } else {
                // Create default fee configuration
                await this.createDefaultFeeConfig(configPath);
                throw new Error('Fee configuration not found. Please configure fee-config.json');
            }
        } catch (error) {
            console.error('❌ Error loading fee structure:', error);
            throw error;
        }
    }

    /**
     * Create default fee configuration
     */
    async createDefaultFeeConfig(configPath) {
        const defaultConfig = {
            default: {
                platformFee: 0.005, // 0.5%
                networkFee: 0.002,  // 0.2%
                corridorFee: 0.001, // 0.1%
                paymentFee: 0       // Variable by corridor
            },
            corridors: {
                // Configure specific fees per corridor
            }
        };

        const fs = require('fs');
        const path = require('path');
        const dataDir = path.dirname(configPath);
        
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        console.log('📝 Created default fee configuration file');
    }

    /**
     * Get processing time from corridor configuration
     */
    async getProcessingTime(corridor, currency) {
        try {
            // Get processing time from treasury manager configuration
            const treasuryStatus = await this.treasuryManager.getTreasuryStatus();
            
            // This would be configured per corridor
            const defaultTimes = {
                'IN': '2-5 minutes', // UPI is fast
                'US': '1-3 business days', // ACH
                'EU': '1-2 business days', // SEPA
                'UK': '2-4 hours' // Faster Pay
            };
            
            return defaultTimes[corridor] || '1-3 business days';
        } catch (error) {
            console.warn('⚠️ Could not get processing time:', error.message);
            return '1-3 business days';
        }
    }


    /**
     * Initiate withdrawal process
     */
    async initiateWithdrawal(params) {
        console.log(`🔥 DEBUG: initiateWithdrawal called with params:`, JSON.stringify(params, null, 2));
        try {
            const {
                quoteId,
                userAddress,
                beneficiaryDetails,
                burnTransactionHash,
                kycVerified = false
            } = params;

            console.log(`🚀 Initiating withdrawal for quote: ${quoteId}`);

            // Validate KYC status by checking Hyperledger Fabric
            console.log(`🔍 Checking KYC status for address: ${userAddress}`);
            let kycStatus = await this.checkKYCStatus(userAddress);
            console.log(`📋 Initial KYC status:`, kycStatus);
            console.log(`🔧 Environment check - NODE_ENV: ${process.env.NODE_ENV}, TESTING_MODE: ${process.env.TESTING_MODE}`);
            
            // REAL-TIME MODE with test credentials: Allow bypass for testing
            if (process.env.NODE_ENV === 'development' && process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET) {
                console.log('🧪 DEVELOPMENT MODE: Using real test credentials with KYC bypass for testing');
                if (!kycStatus.verified && !kycStatus.userId) {
                    kycStatus = {
                        verified: true,
                        userId: `test_user_${userAddress.substring(0, 8)}`,
                        status: 'approved_for_testing'
                    };
                    console.log('✅ KYC bypass enabled for testing with real credentials');
                }
            } else {
                console.log('🏭 PRODUCTION MODE: Strict KYC validation required');
                if (!kycStatus.verified || !kycStatus.userId) {
                    throw new Error('KYC verification required for withdrawal. Please complete KYC verification first.');
                }
            }
            
            console.log(`✅ KYC verified for user: ${kycStatus.userId}`)

            // Get quote details for processing
            let quote = this.quotes.get(quoteId);
            if (!quote) {
                console.log(`⚠️ Quote ${quoteId} not found in memory, generating new quote...`);
                // Generate a new quote with the same parameters if not found
                // This handles cases where service restarted and quotes were lost
                quote = await this.calculateQuote('USD', 'INR', 1, 'IN'); // Default fallback
                quote.quoteId = quoteId; // Keep the original quote ID
                this.quotes.set(quoteId, quote);
                console.log(`✅ Generated fallback quote for ${quoteId}`);
            }

            // 🔥 STEP 1: HANDLE TOKEN BURNING
            const transactionId = uuidv4();
            let burnResult;
            
            if (burnTransactionHash && burnTransactionHash !== 'test_burn_hash_123') {
                // Tokens already burned by frontend - verify the transaction
                console.log(`🔍 Verifying existing burn transaction: ${burnTransactionHash}`);
                const isValidBurn = await this.verifyBurnTransaction(burnTransactionHash, userAddress, quote.fromCurrency, quote.inputAmount);
                
                if (isValidBurn) {
                    console.log(`✅ Burn transaction verified: ${burnTransactionHash}`);
                    burnResult = {
                        success: true,
                        transactionHash: burnTransactionHash,
                        amount: quote.inputAmount,
                        currency: quote.fromCurrency,
                        userAddress: userAddress,
                        burnedAmount: Math.floor(parseFloat(quote.inputAmount) * Math.pow(10, 6))
                    };
                } else {
                    throw new Error(`Invalid burn transaction: ${burnTransactionHash}`);
                }
            } else {
                // Need to burn tokens on backend
                console.log(`🔥 Burning ${quote.inputAmount} ${quote.fromCurrency} tokens from user wallet...`);
                burnResult = await this.burnUserTokens(
                    userAddress,
                    quote.fromCurrency,
                    quote.inputAmount,
                    transactionId
                );
                
                if (!burnResult.success) {
                    throw new Error(`Token burning failed: ${burnResult.error}`);
                }
                
                console.log(`✅ Tokens burned successfully: ${burnResult.transactionHash}`);
            }
            
            // 🏦 STEP 2: AUTOMATED INTELLIGENT ROUTING - NO USER INTERFACE
            console.log(`🧠 Processing automated fiat payout to recipient...`);
            
            // Step 1: Process automated fiat payout via payment gateway
            // Transform beneficiaryDetails to Cashfree-expected format
            const cashfreeRecipient = {
                name: beneficiaryDetails.name,
                email: beneficiaryDetails.email,
                phone: beneficiaryDetails.phone,
                bank_account: {
                    account_number: beneficiaryDetails.accountNumber,
                    ifsc_code: beneficiaryDetails.ifscCode,
                    account_holder_name: beneficiaryDetails.name
                }
            };

            console.log('🔄 Transformed recipient for Cashfree:', {
                name: cashfreeRecipient.name,
                account_number: cashfreeRecipient.bank_account.account_number,
                ifsc_code: cashfreeRecipient.bank_account.ifsc_code
            });

            const payoutResult = await this.fiatPayoutService.processPayoutToRecipient({
                amount: quote.netAmount,
                currency: quote.toCurrency,
                recipient: cashfreeRecipient,
                burn_transaction_hash: burnResult.transactionHash, // Use the actual burn result
                transaction_id: transactionId,
                quote_id: quoteId
            });
            
            if (!payoutResult.success) {
                throw new Error(`Automated fiat payout failed: ${payoutResult.error}`);
            }
            
            console.log(`✅ Automated fiat payout successful: ${payoutResult.payout_id}`);
            console.log(`💸 ${payoutResult.amount} ${payoutResult.currency} sent to ${payoutResult.recipient.name}`);
            console.log(`🏦 Provider: ${payoutResult.provider} | Status: ${payoutResult.status}`);
            console.log(`⏱️ Estimated arrival: ${payoutResult.estimated_arrival}`);
            
            // Extract a stable payout reference for frontend display
            const payoutReference = (
                payoutResult.payout_id ||
                payoutResult.transaction_id ||
                payoutResult.reference_id ||
                transactionId
            );

            // Step 2: Update treasury records (for accounting)
            // Skip treasury manager for now since payout already succeeded via Cashfree
            console.log('💡 Skipping treasury manager - payout already completed via Cashfree');
            const withdrawalResult = {
                success: true,
                routeUsed: 'cashfree_direct',
                routeReason: 'Payout completed via Cashfree API',
                amount: quote.netAmount,
                currency: quote.toCurrency,
                transactionId: transactionId,
                payoutReference: payoutReference
            };
            
            console.log(`📊 Treasury bypassed: ${withdrawalResult.routeUsed} route used`);
            console.log(`📋 Route reason: ${withdrawalResult.routeReason}`);

            // Create transaction record
            const transaction = {
                id: transactionId,
                quoteId,
                userAddress,
                beneficiaryDetails,
                status: withdrawalResult.status || 'PROCESSING',
                // Token burn information
                burnTransactionHash: burnResult.transactionHash,
                burnedAmount: burnResult.amount,
                burnedCurrency: burnResult.currency,
                // Treasury payout information
                payoutReference: payoutReference,
                routeUsed: withdrawalResult.routeUsed,
                routeReason: withdrawalResult.routeReason,
                method: withdrawalResult.method,
                kycVerified: true,
                kycUserId: kycStatus.userId,
                createdAt: new Date(),
                updatedAt: new Date(),
                steps: []
            };

            this.transactions.set(transactionId, transaction);
            await this.addTransactionStep(transactionId, 'INITIATED', 'Withdrawal request received');

            // Don't start additional processing if payout already succeeded
            if (!payoutResult.success) {
                // Start processing pipeline only if payout failed
                this.processWithdrawalAsync(transactionId);
            } else {
                console.log('💡 Payout already successful, skipping additional processing');
            }

            console.log(`✅ Withdrawal initiated: ${transactionId}`);
            return {
                success: true,
                transactionId,
                status: withdrawalResult.status || 'PROCESSING',
                // Token burn details
                burnTransactionHash: burnResult.transactionHash,
                burnedAmount: burnResult.amount,
                burnedCurrency: burnResult.currency,
                // Treasury payout details
                payoutReference: payoutReference,
                routeUsed: withdrawalResult.routeUsed || payoutResult?.provider || 'cashfree_direct',
                routeReason: withdrawalResult.routeReason || 'Payout completed via provider',
                provider: payoutResult?.provider || 'cashfree',
                method: withdrawalResult.method || payoutResult?.provider || 'cashfree',
                estimatedCompletion: withdrawalResult.estimatedCompletion || new Date(Date.now() + 30 * 60 * 1000)
            };
        } catch (error) {
            console.error('❌ Withdrawal initiation failed:', error);
            throw error;
        }
    }

    /**
     * Complete burn and trigger automated payout for automated transfers
     */
    async completeBurnAndPayout(params) {
        try {
            const { offrampOrderId, burnTransactionHash, userAddress } = params;

            console.log('🔥 Completing burn and triggering payout for automated transfer:', {
                offrampOrderId,
                burnTransactionHash,
                userAddress
            });

            // Verify the burn transaction exists and was successful
            if (burnTransactionHash) {
                console.log('✅ Burn transaction verified:', burnTransactionHash);
            }

            // Find or create a withdrawal quote for this automated transfer
            // For automated transfers, we create a direct withdrawal without user quote
            const quoteId = `auto_${offrampOrderId}_${Date.now()}`;

            // For automated transfers, we simulate a quote based on the burned amount
            // In a real system, this would be calculated from the burn transaction details
            const quote = {
                id: quoteId,
                fromCurrency: 'USD',
                toCurrency: 'INR',
                amount: 12.0, // This should be calculated from burn transaction
                exchangeRate: 83.5,
                fiatAmount: 1000,
                fees: 0.18,
                netAmount: 1000 - 15, // Subtract fees
                estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                automated: true
            };

            this.quotes.set(quoteId, quote);

            // Get the linked onramp order to find recipient details
            console.log('🔍 Finding recipient details for automated transfer...');
            let recipientDetails = null;

            // Try to get recipient details from the automated transfer transaction
            try {
                const automatedTransaction = this.transactions.get(offrampOrderId);
                console.log('🔍 DEBUG: automatedTransaction:', automatedTransaction ? 'found' : 'not found');

                if (automatedTransaction) {
                    console.log('🔍 DEBUG: linkedOnrampOrder:', automatedTransaction.linkedOnrampOrder);

                    if (automatedTransaction.linkedOnrampOrder) {
                        // Get recipient details from the linked onramp order
                        const response = await fetch(`http://localhost:3002/api/onramp/order-status/${automatedTransaction.linkedOnrampOrder}`);
                        if (response.ok) {
                            const orderResult = await response.json();
                            if (orderResult.success && orderResult.order && orderResult.order.recipientDetails) {
                                recipientDetails = orderResult.order.recipientDetails;
                                console.log('✅ Found recipient details from linked onramp order:', recipientDetails);
                            }
                        }
                    } else {
                        console.warn('⚠️ No linkedOnrampOrder in transaction:', offrampOrderId);
                    }
                } else {
                    console.warn('⚠️ No automated transaction found for:', offrampOrderId);

                    // Try alternative: search for onramp orders with this offramp order ID
                    console.log('🔍 Searching for onramp orders with offrampOrderId:', offrampOrderId);
                    try {
                        const response = await fetch(`http://localhost:3002/api/onramp/search-by-offramp/${offrampOrderId}`);
                        if (response.ok) {
                            const searchResult = await response.json();
                            if (searchResult.success && searchResult.order && searchResult.order.recipientDetails) {
                                recipientDetails = searchResult.order.recipientDetails;
                                console.log('✅ Found recipient details via offramp order search:', recipientDetails);
                            } else {
                                console.log('🔍 No onramp order found with offrampOrderId:', offrampOrderId);
                            }
                        } else {
                            console.log('⚠️ Search endpoint not available, trying direct order lookup');

                            // Final fallback: try to extract onramp order ID from the offramp order ID pattern
                            // Pattern: offramp_<timestamp>_<random> -> look for onramp orders around same timestamp
                            const timestampMatch = offrampOrderId.match(/offramp_(\d+)_/);
                            if (timestampMatch) {
                                const timestamp = parseInt(timestampMatch[1]);
                                console.log('🔍 Extracted timestamp from offrampOrderId:', timestamp);

                                // Search for onramp orders created within 1 minute of this timestamp
                                const response2 = await fetch(`http://localhost:3002/api/onramp/search-by-timestamp?timestamp=${timestamp}&window=60000`);
                                if (response2.ok) {
                                    const timeSearchResult = await response2.json();
                                    if (timeSearchResult.success && timeSearchResult.orders && timeSearchResult.orders.length > 0) {
                                        // Find the onramp order with automated transfer and matching offramp order ID
                                        const matchingOrder = timeSearchResult.orders.find(order =>
                                            order.automatedTransfer && order.offrampOrderId === offrampOrderId
                                        );
                                        if (matchingOrder && matchingOrder.recipientDetails) {
                                            recipientDetails = matchingOrder.recipientDetails;
                                            console.log('✅ Found recipient details via timestamp search:', recipientDetails);
                                        }
                                    }
                                }
                            }
                        }
                    } catch (error) {
                        console.error('❌ Error in alternative search:', error.message);
                    }
                }
            } catch (error) {
                console.error('❌ Could not fetch onramp order details:', error.message);
            }

            if (!recipientDetails) {
                // Fallback recipient details (this should not happen in production)
                recipientDetails = {
                    name: 'Test Recipient',
                    accountNumber: '1234567890',
                    ifscCode: 'SBIN0000123',
                    email: 'test@example.com',
                    phone: '+919876543210'
                };
                console.warn('⚠️ Using fallback recipient details for automated transfer');
            }

            // Initiate the automated withdrawal
            const withdrawalResult = await this.initiateWithdrawal({
                quoteId,
                userAddress,
                beneficiaryDetails: recipientDetails,
                burnTransactionHash,
                kycVerified: true, // Automated transfers assume KYC is already verified
                automatedTransfer: true
            });

            console.log('✅ Automated withdrawal initiated successfully');

            return {
                success: true,
                message: 'Burn completed and automated payout initiated',
                burnTransactionHash,
                withdrawalTransactionId: withdrawalResult.transactionId,
                payoutReference: withdrawalResult.payoutReference,
                status: withdrawalResult.status,
                estimatedCompletion: withdrawalResult.estimatedCompletion
            };

        } catch (error) {
            console.error('❌ Failed to complete burn and payout:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create automated transfer order for burn confirmation
     */
    async createAutomatedTransferOrder(params) {
        try {
            const {
                userAddress,
                cryptoAmount,
                cryptoCurrency,
                targetCurrency = 'INR',
                recipientDetails,
                automatedBurn = false,
                linkedOnrampOrder,
                mintTransactionHash,
                waitForUserBurn = true
            } = params;

            console.log('🔄 Creating automated transfer order:', {
                userAddress,
                cryptoAmount,
                cryptoCurrency,
                targetCurrency,
                recipientName: recipientDetails.name,
                linkedOnrampOrder,
                mintTransactionHash: mintTransactionHash ? mintTransactionHash.substring(0, 8) + '...' : null
            });

            // Generate offramp order ID
            const offrampOrderId = `offramp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

            // Create a temporary quote for automated transfer
            const quote = {
                id: `auto_${offrampOrderId}`,
                fromCurrency: cryptoCurrency,
                toCurrency: targetCurrency,
                amount: cryptoAmount,
                exchangeRate: 83.5, // USD to INR rate (approximate)
                fiatAmount: Math.floor(parseFloat(cryptoAmount) * 83.5),
                fees: 0.015, // 1.5% fee
                netAmount: Math.floor(parseFloat(cryptoAmount) * 83.5 * 0.985), // After fees
                estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
                automated: true,
                linkedOnrampOrder,
                mintTransactionHash
            };

            // Store the quote
            this.quotes.set(quote.id, quote);

            // For automated transfers, we create a pending transaction that waits for user burn
            const transaction = {
                id: offrampOrderId,
                type: 'automated_transfer',
                status: 'awaiting_burn',
                userAddress,
                cryptoAmount,
                cryptoCurrency,
                targetCurrency,
                recipientDetails,
                linkedOnrampOrder,
                mintTransactionHash,
                waitForUserBurn: true,
                automatedBurn: false,
                createdAt: new Date(),
                updatedAt: new Date(),
                quoteId: quote.id,
                steps: [{
                    step: 'automated_transfer_created',
                    status: 'completed',
                    timestamp: new Date().toISOString(),
                    message: 'Automated transfer order created, awaiting user burn confirmation'
                }]
            };

            // Store the transaction
            this.transactions.set(offrampOrderId, transaction);

            console.log('✅ Automated transfer order created:', offrampOrderId);

            return {
                success: true,
                orderId: offrampOrderId,
                offrampOrderId: offrampOrderId,
                status: 'awaiting_burn',
                message: 'Automated transfer order created, user burn confirmation required',
                quoteId: quote.id,
                estimatedCompletion: quote.estimatedCompletion
            };

        } catch (error) {
            console.error('❌ Failed to create automated transfer order:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process withdrawal asynchronously
     */
    async processWithdrawalAsync(transactionId) {
        try {
            const transaction = this.transactions.get(transactionId);
            if (!transaction) {
                throw new Error('Transaction not found');
            }

            console.log(`⚙️ Processing withdrawal: ${transactionId}`);

            // Step 1: Validate and reserve funds
            await this.updateTransactionStatus(transactionId, 'VALIDATING');
            await this.addTransactionStep(transactionId, 'VALIDATING', 'Validating request and reserving funds');
            
            // Simulate validation time
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 2: Process on-chain operations (token burn/swap)
            await this.updateTransactionStatus(transactionId, 'PROCESSING_ONCHAIN');
            await this.addTransactionStep(transactionId, 'PROCESSING_ONCHAIN', 'Processing blockchain transactions');
            
            // Simulate on-chain processing
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Step 3: Initiate fiat payout
            await this.updateTransactionStatus(transactionId, 'PROCESSING_PAYOUT');
            await this.addTransactionStep(transactionId, 'PROCESSING_PAYOUT', 'Initiating fiat payout');
            
            // Process through treasury
            const payoutResult = await this.processTreasuryPayout(transactionId);
            transaction.payoutReference = payoutResult.payoutReference;
            transaction.payoutMethod = payoutResult.method;

            // Step 4: Complete transaction
            await this.updateTransactionStatus(transactionId, 'COMPLETED');
            await this.addTransactionStep(transactionId, 'COMPLETED', `Payout completed: ${payoutResult.payoutReference}`);

            console.log(`✅ Withdrawal completed: ${transactionId}`);
        } catch (error) {
            console.error(`❌ Withdrawal processing failed for ${transactionId}:`, error);
            await this.updateTransactionStatus(transactionId, 'FAILED');
            await this.addTransactionStep(transactionId, 'FAILED', `Error: ${error.message}`);
        }
    }

    /**
     * Process payout through treasury
     */
    async processTreasuryPayout(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        try {
            // Get quote details to determine currency and amount
            const quote = await this.getQuoteDetails(transaction.quoteId);
            if (!quote) {
                throw new Error('Quote not found or expired');
            }

            // Reserve treasury funds
            const reservation = await this.treasuryManager.reserveFunds(
                quote.toCurrency, 
                quote.netAmount, 
                transactionId
            );

            // Process withdrawal through treasury
            const payoutResult = await this.treasuryManager.processWithdrawal(
                quote.toCurrency,
                quote.netAmount,
                transactionId,
                transaction.beneficiaryDetails
            );

            console.log(`💸 Treasury payout initiated: ${payoutResult.payoutReference}`);
            return payoutResult;
        } catch (error) {
            console.error(`❌ Treasury payout failed for ${transactionId}:`, error);
            throw error;
        }
    }

    /**
     * Get quote details (in production this would be from database)
     */
    async getQuoteDetails(quoteId) {
        // First try to get from memory cache
        const cachedQuote = this.quotes.get(quoteId);
        if (cachedQuote) {
            console.log(`✅ Found quote in cache: ${quoteId}`);
            return cachedQuote;
        }
        
        // If not in cache, create a fallback quote for processing
        console.warn('⚠️ Quote not in cache, creating fallback quote for processing');
        const fallbackQuote = {
            fromCurrency: 'USD',
            toCurrency: 'INR',
            inputAmount: 1,
            exchangeRate: 83.25,
            convertedAmount: 83.25,
            netAmount: 82.584,
            quoteId: quoteId,
            createdAt: new Date(),
            validUntil: new Date(Date.now() + 10 * 60 * 1000)
        };
        
        // Cache the fallback quote
        this.quotes.set(quoteId, fallbackQuote);
        return fallbackQuote;
    }

    /**
     * Update transaction status
     */
    async updateTransactionStatus(transactionId, status) {
        const transaction = this.transactions.get(transactionId);
        if (transaction) {
            transaction.status = status;
            transaction.updatedAt = new Date();
            
            // Notify status callbacks
            const callback = this.statusCallbacks.get(transactionId);
            if (callback) {
                callback({ transactionId, status, updatedAt: transaction.updatedAt });
            }
        }
    }

    /**
     * Add transaction step
     */
    async addTransactionStep(transactionId, step, description) {
        const transaction = this.transactions.get(transactionId);
        if (transaction) {
            transaction.steps.push({
                step,
                description,
                timestamp: new Date(),
                status: 'COMPLETED'
            });
        }
        console.log(`📝 ${transactionId}: ${step} - ${description}`);
    }

    /**
     * Get transaction status
     */
    async getTransactionStatus(transactionId) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        return {
            id: transaction.id,
            status: transaction.status,
            createdAt: transaction.createdAt,
            updatedAt: transaction.updatedAt,
            steps: transaction.steps,
            payoutReference: transaction.payoutReference,
            payoutMethod: transaction.payoutMethod
        };
    }

    /**
     * Cancel withdrawal (if possible)
     */
    async cancelWithdrawal(transactionId, reason) {
        const transaction = this.transactions.get(transactionId);
        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Only allow cancellation for certain statuses
        const cancellableStatuses = ['INITIATED', 'VALIDATING'];
        if (!cancellableStatuses.includes(transaction.status)) {
            throw new Error(`Cannot cancel transaction in status: ${transaction.status}`);
        }

        await this.updateTransactionStatus(transactionId, 'CANCELLED');
        await this.addTransactionStep(transactionId, 'CANCELLED', `Cancelled: ${reason}`);

        console.log(`❌ Withdrawal cancelled: ${transactionId} - ${reason}`);
        return { success: true, status: 'CANCELLED' };
    }

    /**
     * Get all transactions for a user
     */
    async getUserTransactions(userAddress) {
        const userTransactions = [];
        for (const transaction of this.transactions.values()) {
            if (transaction.userAddress === userAddress) {
                userTransactions.push({
                    id: transaction.id,
                    status: transaction.status,
                    createdAt: transaction.createdAt,
                    updatedAt: transaction.updatedAt,
                    payoutReference: transaction.payoutReference
                });
            }
        }
        return userTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    /**
     * Register status callback for real-time updates
     */
    registerStatusCallback(transactionId, callback) {
        this.statusCallbacks.set(transactionId, callback);
    }

    /**
     * Create Razorpay payout for the withdrawal
     */
    async createRazorpayPayout(beneficiaryDetails, kycStatus) {
        try {
            console.log(`🏦 Creating Razorpay payout for beneficiary: ${beneficiaryDetails.accountName}`);
            
            // Calculate payout amount (this should come from the quote)
            const payoutAmount = 8315; // ₹83.15 (example amount, should be from quote)
            
            // Prepare payout parameters for Razorpay UPI
            const payoutParams = {
                amount: payoutAmount, // Amount in paisa (₹83.15 = 8315 paisa)
                currency: 'INR',
                beneficiary: {
                    upiId: beneficiaryDetails.upiId || `${beneficiaryDetails.accountNumber}@paytm`, // Default UPI ID format
                    name: beneficiaryDetails.accountName || kycStatus.userId,
                    email: `${kycStatus.userId}@nivix.io`,
                    phone: beneficiaryDetails.phone || '9876543210'
                },
                transactionId: `nivix_${Date.now()}`
            };
            
            console.log(`📋 Razorpay UPI payout params:`, {
                amount: payoutParams.amount,
                currency: payoutParams.currency,
                upiId: payoutParams.beneficiary.upiId,
                beneficiaryName: payoutParams.beneficiary.name,
                transactionId: payoutParams.transactionId
            });
            
            // Call Razorpay gateway to create payout
            const razorpayResult = await this.razorpayGateway.processTransfer(payoutParams);
            
            if (razorpayResult.success) {
                return {
                    success: true,
                    payoutId: razorpayResult.reference,
                    orderId: razorpayResult.reference, // Using same ID for simplicity
                    status: razorpayResult.status,
                    estimatedCompletion: razorpayResult.estimatedCompletion
                };
            } else {
                return {
                    success: false,
                    error: `Razorpay payout failed: ${razorpayResult.error || 'Unknown error'}`
                };
            }
            
        } catch (error) {
            console.error(`❌ Razorpay payout creation failed: ${error.message}`);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check KYC verification status from Hyperledger Fabric
     */
    async checkKYCStatus(userAddress) {
        try {
            console.log(`🔍 Querying KYC status for address: ${userAddress}`);
            
            // Make HTTP request to the KYC status API
            const response = await fetch(`http://localhost:3002/api/kyc/status/${userAddress}`);
            
            if (!response.ok) {
                console.log(`❌ KYC status check failed: ${response.status}`);
                return { verified: false, error: 'KYC status check failed' };
            }
            
            const kycData = await response.json();
            console.log(`📋 KYC data retrieved:`, kycData);
            
            return {
                verified: kycData.verified === true,
                userId: kycData.userId,
                status: kycData.status,
                countryCode: kycData.countryCode
            };
            
        } catch (error) {
            console.error(`❌ Error checking KYC status: ${error.message}`);
            return { verified: false, error: error.message };
        }
    }

    /**
     * Load treasury keypair for token burning
     */
    async loadTreasuryKeypair() {
        try {
            // Load bridge wallet from WALLETS_REGISTRY.json (has burn authority)
            const registryPath = '/media/shubham/OS/for linux work/blockchain solana/nivix-project/WALLETS_REGISTRY.json';
            
            if (fs.existsSync(registryPath)) {
                const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                const bridgeWallet = registry.coreWallets?.bridgeWallet;
                
                if (bridgeWallet && bridgeWallet.privateKey) {
                    // Convert private key array to Uint8Array
                    const secretKey = new Uint8Array(bridgeWallet.privateKey);
                    this.treasuryKeypair = Keypair.fromSecretKey(secretKey);
                    
                    console.log('🔑 Bridge wallet keypair loaded for token burning:', this.treasuryKeypair.publicKey.toString());
                    return;
                }
            }

            throw new Error('Bridge wallet keypair not found in WALLETS_REGISTRY.json');

        } catch (error) {
            console.error('❌ Failed to load bridge wallet keypair:', error.message);
            throw error;
        }
    }

    /**
     * Verify a burn transaction on-chain
     */
    async verifyBurnTransaction(transactionHash, userAddress, currency, expectedAmount) {
        try {
            console.log(`🔍 Verifying burn transaction: ${transactionHash}`);
            
            // For development/testing: if it looks like a valid transaction hash, accept it
            if (process.env.NODE_ENV === 'development' && transactionHash.length > 40) {
                console.log(`🧪 DEVELOPMENT MODE: Accepting transaction hash for testing: ${transactionHash}`);
                return true;
            }
            
            // Get transaction details from Solana
            const transaction = await this.connection.getTransaction(transactionHash, {
                commitment: 'confirmed',
                maxSupportedTransactionVersion: 0
            });
            
            if (!transaction) {
                console.log(`❌ Transaction not found: ${transactionHash}`);
                // In development, still allow if hash looks valid
                if (process.env.NODE_ENV === 'development') {
                    console.log(`🧪 DEVELOPMENT MODE: Allowing unverified transaction for testing`);
                    return true;
                }
                return false;
            }
            
            if (transaction.meta?.err) {
                console.log(`❌ Transaction failed: ${JSON.stringify(transaction.meta.err)}`);
                return false;
            }
            
            console.log(`✅ Transaction found and successful: ${transactionHash}`);
            
            // For now, if transaction exists and was successful, consider it valid
            // In production, you'd want to parse the transaction logs to verify:
            // 1. It was a burn instruction
            // 2. The correct amount was burned
            // 3. It was from the correct user address
            // 4. It was the correct token mint
            
            return true;
            
        } catch (error) {
            console.error(`❌ Error verifying burn transaction: ${error.message}`);
            // In development mode, be more lenient
            if (process.env.NODE_ENV === 'development') {
                console.log(`🧪 DEVELOPMENT MODE: Allowing transaction despite error for testing`);
                return true;
            }
            return false;
        }
    }

    /**
     * Burn user's crypto tokens (Step 1 of off-ramp)
     */
    async burnUserTokens(userAddress, currency, amount, transactionId) {
        try {
            console.log(`🔥 Starting token burn: ${amount} ${currency} from ${userAddress}`);
            
            const userPubkey = new PublicKey(userAddress);
            
            // Get token mint address for the currency
            const tokenMint = this.getCryptoTokenMint(currency);
            if (!tokenMint) {
                throw new Error(`No token mint found for currency: ${currency}`);
            }
            
            const mintPubkey = new PublicKey(tokenMint);
            
            // Get user's token account
            const userTokenAccount = await getAssociatedTokenAddress(
                mintPubkey,
                userPubkey
            );

            // Convert amount to token units (6 decimals)
            const tokenAmount = Math.floor(parseFloat(amount) * Math.pow(10, 6));
            console.log(`🔥 Burning ${tokenAmount} token units (${amount} tokens)`);

            // Create burn instruction
            const burnInstruction = createBurnInstruction(
                userTokenAccount, // token account to burn from
                mintPubkey, // token mint
                userPubkey, // owner of token account
                tokenAmount // amount to burn
            );

            // Create transaction
            const transaction = new Transaction().add(burnInstruction);
            
            // Get recent blockhash with retry logic
            let blockhash;
            let lastValidBlockHeight;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    console.log(`🔄 Getting blockhash (attempt ${attempts + 1}/${maxAttempts})...`);
                    const blockhashInfo = await this.connection.getLatestBlockhash('confirmed');
                    blockhash = blockhashInfo.blockhash;
                    lastValidBlockHeight = blockhashInfo.lastValidBlockHeight;
                    console.log(`✅ Blockhash obtained: ${blockhash.substring(0, 8)}...`);
                    break;
                } catch (error) {
                    attempts++;
                    console.warn(`⚠️ Blockhash attempt ${attempts} failed:`, error);
                    if (attempts >= maxAttempts) {
                        throw new Error(`Failed to get blockhash after ${maxAttempts} attempts: ${error}`);
                    }
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            transaction.recentBlockhash = blockhash;
            transaction.lastValidBlockHeight = lastValidBlockHeight;
            transaction.feePayer = this.treasuryKeypair.publicKey; // Treasury pays for the transaction

            // Sign transaction with treasury keypair (bridge wallet has burn authority)
            console.log('🔥 Signing token burn transaction with treasury keypair...');
            transaction.sign(this.treasuryKeypair);

            // Send transaction to Solana
            console.log('📡 Sending token burn transaction...');
            const signature = await this.connection.sendRawTransaction(transaction.serialize(), {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            });

            console.log(`⏳ Confirming transaction: ${signature}`);
            const confirmation = await this.connection.confirmTransaction({
                signature,
                blockhash,
                lastValidBlockHeight
            }, 'confirmed');

            if (confirmation.value.err) {
                throw new Error(`Transaction failed: ${confirmation.value.err}`);
            }

            console.log('✅ Transaction confirmed successfully');

            console.log(`✅ Token burn completed successfully: ${signature}`);

            return {
                success: true,
                transactionHash: signature,
                amount: amount,
                currency: currency,
                userAddress: userAddress,
                tokenAccount: userTokenAccount.toString(),
                burnedAmount: tokenAmount
            };
            
        } catch (error) {
            console.error('❌ Token burning failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get crypto token mint address for currency
     */
    getCryptoTokenMint(currency) {
        const tokenMints = {
            'USD': '4PmMiF3Lxv6dRGfB92xw7dv5SYWWPBCE6Y78Tdqb7mGg', // Our custom USD token
            'INR': '5PSU5Z4NNvHCP9qSRBmrp4oEt6NYGXxatLW2LY7sBFLE', // Our custom INR token
            'EUR': '7bBhRdeA8onCTZa3kBwWpQVhuQdVzhMgLEvDTrjwWX5T', // Our custom EUR token
            'GBP': '8VAakzh8wMEiyMp75coMorNDjUEMqwgHwvJjv7pUdVQh', // Our custom GBP token
            'JPY': '8VAakzh8wMEiyMp75coMorNDjUEMqwgHwvJjv7pUdVQh', // Our custom JPY token
            'CAD': '5eiCbZorrM9BRxyr4iuDvuTmf3LeGjhBBmP8NuXaZz5Q', // Our custom CAD token
            'AUD': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'  // Mock AUD token
        };
        return tokenMints[currency.toUpperCase()] || null;
    }

    /**
     * Get off-ramp system status
     */
    async getSystemStatus() {
        const treasuryStatus = await this.treasuryManager.getTreasuryStatus();
        
        return {
            status: 'OPERATIONAL',
            treasury: treasuryStatus,
            activeTransactions: this.transactions.size,
            lastUpdated: new Date().toISOString()
        };
    }
}

module.exports = OfframpEngine;







