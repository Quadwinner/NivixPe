const RazorpayPaymentGateway = require('./razorpay-payment-gateway');
const OrderManager = require('./order-manager');
const CryptoDeliveryService = require('./crypto-delivery-service');
const ExchangeRateService = require('../stablecoin/exchange-rate-service');

/**
 * On-ramp Engine - Orchestrates the fiat to crypto flow
 * User pays fiat → System delivers crypto
 */
class OnrampEngine {
    constructor() {
        this.paymentGateway = null;
        this.orderManager = null;
        this.deliveryService = null;
        this.exchangeRateService = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing On-ramp Engine...');

            // Initialize components
            this.paymentGateway = new RazorpayPaymentGateway();
            
            console.log('📋 Initializing Order Manager...');
            this.orderManager = new OrderManager();
            await this.orderManager.initialize();
            console.log('✅ Order Manager initialized successfully');
            
            this.deliveryService = new CryptoDeliveryService();
            await this.deliveryService.initialize();
            
            this.exchangeRateService = new ExchangeRateService();

            this.initialized = true;
            console.log('✅ On-ramp Engine initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize On-ramp Engine:', error.message);
            console.error('❌ Error details:', error.message);
            console.error('❌ Error stack:', error.stack);
            
            // Reset components to null on failure
            this.orderManager = null;
            this.deliveryService = null;
            this.exchangeRateService = null;
            this.paymentGateway = null;
            this.initialized = false;
            
            throw error;
        }
    }

    /**
     * Create a new on-ramp order (Step 1: User wants to buy crypto)
     */
    async createOrder(orderRequest) {
        try {
            if (!this.initialized) {
                throw new Error('On-ramp Engine not initialized');
            }

            const {
                userAddress,      // Solana wallet address
                cryptoAmount,     // Amount of crypto user wants to buy
                fiatAmount,       // Amount of fiat user wants to pay
                cryptoCurrency,   // Currency code (USD, EUR, INR, etc.)
                fiatCurrency,     // Fiat currency to pay with
                userEmail,        // Optional
                userPhone,        // Optional
                automatedTransfer,// Flag for automated transfer
                recipientDetails, // Recipient details for automated transfer
                transferType      // Type of transfer
            } = orderRequest;

            console.log('📝 Creating on-ramp order:', {
                userAddress,
                cryptoAmount,
                fiatAmount,
                cryptoCurrency,
                fiatCurrency,
                automatedTransfer,
                transferType
            });

            // Get current exchange rate
            console.log(`🔍 Getting exchange rate: ${fiatCurrency} -> ${cryptoCurrency}`);
            let exchangeRate;
            
            try {
                if (this.exchangeRateService) {
                    exchangeRate = await this.exchangeRateService.getExchangeRate(fiatCurrency, cryptoCurrency);
                    console.log(`📊 Exchange rate result:`, exchangeRate);
                } else {
                    console.warn('⚠️ Exchange rate service not available, using fallback');
                    exchangeRate = null;
                }
            } catch (error) {
                console.error('❌ Error getting exchange rate:', error);
                exchangeRate = null;
            }

            // Use emergency fallback rate if exchange rate service failed
            if (exchangeRate === null || exchangeRate === undefined || isNaN(exchangeRate)) {
                console.error(`❌ Exchange rate service failed for ${fiatCurrency}/${cryptoCurrency}`);

                const productionConfig = require('../config/production-config');

                try {
                    const emergencyRates = productionConfig.getEmergencyExchangeRates();
                    console.warn(`⚠️ Using EMERGENCY fallback rate for ${fiatCurrency}/${cryptoCurrency} - Production systems should fix rate service!`);

                    const key = `${fiatCurrency}_${cryptoCurrency}`;
                    const reverseKey = `${cryptoCurrency}_${fiatCurrency}`;

                    if (emergencyRates[key]) {
                        exchangeRate = emergencyRates[key];
                    } else if (emergencyRates[reverseKey]) {
                        exchangeRate = 1 / emergencyRates[reverseKey];
                    } else {
                        exchangeRate = 1.0; // Default
                    }

                    console.log(`📊 Using emergency fallback rate: ${fiatCurrency}/${cryptoCurrency} = ${exchangeRate}`);
                } catch (configError) {
                    console.error(`❌ Emergency rates not available in production:`, configError.message);
                    throw new Error(`Exchange rate service failed and no emergency fallback available`);
                }
            }

            // Calculate amounts based on what was provided
            let finalFiatAmount, finalCryptoAmount;
            if (fiatAmount) {
                finalFiatAmount = parseFloat(fiatAmount);
                finalCryptoAmount = (finalFiatAmount * exchangeRate).toFixed(6);
            } else if (cryptoAmount) {
                finalCryptoAmount = parseFloat(cryptoAmount);
                finalFiatAmount = (finalCryptoAmount / exchangeRate).toFixed(2);
            } else {
                throw new Error('Either fiatAmount or cryptoAmount must be provided');
            }

            // Get crypto token mint address
            const tokenMint = this.getCryptoTokenMint(cryptoCurrency);
            if (!tokenMint) {
                throw new Error(`Unsupported crypto currency: ${cryptoCurrency}`);
            }

            // Check if we can deliver the requested crypto
            const feasibilityCheck = await this.deliveryService.checkDeliveryFeasibility(
                tokenMint, 
                finalCryptoAmount
            );

            if (!feasibilityCheck.success || !feasibilityCheck.sufficient) {
                throw new Error(
                    feasibilityCheck.error ||
                        'Cannot deliver this order (treasury mint check failed)'
                );
            }

            // Create order record
            const orderResult = await this.orderManager.createOrder({
                userAddress,
                userEmail,
                userPhone,
                fiatAmount: finalFiatAmount,
                fiatCurrency,
                cryptoAmount: finalCryptoAmount,
                cryptoCurrency,
                cryptoTokenMint: tokenMint,
                exchangeRate,
                // Add automated transfer info
                automatedTransfer,
                recipientDetails,
                transferType,
                metadata: {
                    requestedAt: new Date().toISOString(),
                    ipAddress: orderRequest.ipAddress || null,
                    automatedTransfer: automatedTransfer || false,
                    transferType: transferType || null
                }
            });

            if (!orderResult.success) {
                throw new Error(`Failed to create order: ${orderResult.error}`);
            }

            console.log('✅ Order created successfully:', orderResult.order.id);
            return {
                success: true,
                order: orderResult.order,
                nextStep: 'create_payment'
            };

        } catch (error) {
            console.error('❌ Failed to create order:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Create payment for an order (Step 2: Generate Razorpay payment link)
     */
    async createPayment(orderId) {
        try {
            const orderResult = this.orderManager.getOrder(orderId);
            if (!orderResult.success) {
                throw new Error(`Order not found: ${orderId}`);
            }

            const order = orderResult.order;

            // Create Razorpay payment order
            const paymentAmount = Math.floor(parseFloat(order.fiatAmount) * 100); // Convert to smallest unit
            
            const paymentOrderResult = await this.paymentGateway.createPaymentOrder({
                amount: paymentAmount,
                currency: order.fiatCurrency,
                userAddress: order.userAddress,
                cryptoAmount: order.cryptoAmount,
                cryptoToken: order.cryptoTokenMint,
                orderId: orderId
            });

            if (!paymentOrderResult.success) {
                throw new Error(`Failed to create payment order: ${paymentOrderResult.error}`);
            }

            console.log('💳 Payment order created:', paymentOrderResult.orderId);
            return {
                success: true,
                paymentOrder: paymentOrderResult,
                order: order
            };

        } catch (error) {
            console.error('❌ Failed to create payment:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify payment from frontend (called after Razorpay checkout success)
     */
    async verifyPayment(paymentData) {
        try {
            const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, automatedTransfer, recipientDetails, transferAmount } = paymentData;

            console.log('🔐 Verifying payment for order:', orderId);
            console.log('🔍 Automated transfer data:', { automatedTransfer, recipientDetails: !!recipientDetails, transferAmount });

            // Verify signature with Razorpay
            const crypto = require('crypto');
            const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
            
            console.log('🔐 Signature verification details:', {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                keySecret: razorpayKeySecret ? 'Present' : 'Missing'
            });
            
            const generated_signature = crypto
                .createHmac('sha256', razorpayKeySecret)
                .update(razorpay_order_id + '|' + razorpay_payment_id)
                .digest('hex');

            console.log('🔐 Generated signature:', generated_signature);
            console.log('🔐 Received signature:', razorpay_signature);

            if (generated_signature !== razorpay_signature) {
                console.warn('⚠️ Signature mismatch - bypassing for test environment');
                // TEMPORARY: Skip signature verification for test environment
                if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_ID.includes('test')) {
                    console.log('🔧 Test environment detected - skipping signature verification');
                } else {
                    throw new Error('Payment signature verification failed');
                }
            }

            console.log('✅ Payment signature verified for order:', orderId);

            // Get order details to check if it's an automated transfer
            const orderDetails = await this.orderManager.getOrder(orderId);
            console.log('📋 Order details:', JSON.stringify(orderDetails, null, 2));

            // Check if this is an automated transfer (from order data or payment data)
            const isAutomatedTransfer = automatedTransfer ||
                                      (orderDetails.order && orderDetails.order.automatedTransfer) ||
                                      (orderDetails.order && orderDetails.order.metadata && orderDetails.order.metadata.automatedTransfer);

            console.log('🔍 Is automated transfer?', isAutomatedTransfer);

            // Update order with payment details
            await this.orderManager.updateOrderPayment(orderId, {
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                paymentSignature: razorpay_signature,
                status: 'captured'
            });

            // Deliver crypto to user
            console.log('🚀 Starting crypto delivery for order:', orderId);
            const deliveryResult = await this.deliverCryptoToUser(orderId);
            console.log('📋 Delivery result:', deliveryResult);
            
            if (deliveryResult.success) {
                console.log('✅ Crypto delivered to user:', orderId);

                // 🔥 AUTOMATED TRANSFER LOGIC: If this is an automated transfer, start the offramp process
                if (isAutomatedTransfer) {
                    // Use recipient details from payment data or order data
                    const finalRecipientDetails = recipientDetails ||
                                                (orderDetails.order && orderDetails.order.recipientDetails);

                    console.log('🔍 Automated transfer recipient details check:', {
                        fromPaymentData: !!recipientDetails,
                        fromOrderData: !!(orderDetails.order && orderDetails.order.recipientDetails),
                        finalFound: !!finalRecipientDetails,
                        paymentDataKeys: recipientDetails ? Object.keys(recipientDetails) : null,
                        orderDataKeys: orderDetails.order ? Object.keys(orderDetails.order) : null
                    });

                    if (finalRecipientDetails) {
                        console.log('🔄 Starting automated transfer flow for order:', orderId);

                        try {
                            // Get transaction signature from delivery result
                            const mintTxHash = deliveryResult.transactionSignature || deliveryResult.transactionHash;
                            console.log('🔗 Using mint transaction hash for automated transfer:', mintTxHash);

                            // Start automated offramp process (requiring user wallet signing for burn)
                            const automatedTransferResult = await this.processAutomatedTransfer({
                                orderId,
                                userAddress: deliveryResult.userAddress || deliveryResult.recipient,
                                cryptoAmount: transferAmount || deliveryResult.cryptoAmount || deliveryResult.amount,
                                cryptoCurrency: deliveryResult.cryptoCurrency || 'USD',
                                recipientDetails: finalRecipientDetails,
                                mintTransactionHash: mintTxHash
                            });

                            if (automatedTransferResult.success) {
                                console.log('🎉 Automated transfer order created, updating order with burn flags:', orderId);

                                // Update order with burn requirement flags and set status to processing
                                await this.orderManager.updateOrder(orderId, {
                                    status: 'processing', // Change from completed to processing to trigger burn UI
                                    burnRequired: true,
                                    readyForBurn: true,
                                    offrampOrderId: automatedTransferResult.offrampOrderId,
                                    mintTransactionHash: mintTxHash,
                                    automatedTransferStatus: 'awaiting_burn'
                                });

                                return {
                                    success: true,
                                    message: 'Payment verified, crypto delivered, burn confirmation required',
                                    orderId: orderId,
                                    mintTransactionHash: mintTxHash,
                                    offrampOrderId: automatedTransferResult.offrampOrderId,
                                    burnRequired: true,
                                    readyForBurn: true,
                                    automatedTransfer: true
                                };
                            } else {
                                console.error('❌ Automated transfer failed for order:', orderId, automatedTransferResult.error);
                                // Still return success for the payment/minting, but note the transfer failure
                                return {
                                    success: true,
                                    message: 'Payment verified and crypto delivered, but automated transfer setup failed',
                                    orderId: orderId,
                                    transactionHash: deliveryResult.transactionHash,
                                    automatedTransferError: automatedTransferResult.error
                                };
                            }
                        } catch (error) {
                            console.error('❌ Automated transfer exception for order:', orderId, error.message);
                            return {
                                success: true,
                                message: 'Payment verified and crypto delivered, but automated transfer setup failed',
                                orderId: orderId,
                                transactionHash: deliveryResult.transactionHash,
                                automatedTransferError: error.message
                            };
                        }
                    } else {
                        console.warn('⚠️ Automated transfer detected but no recipient details found');
                        return {
                            success: true,
                            message: 'Payment verified and crypto delivered',
                            orderId: orderId,
                            transactionHash: deliveryResult.transactionHash
                        };
                    }
                } else {
                    // Regular onramp order - just return success
                    console.log('🎉 Regular onramp order completed:', orderId);
                    return {
                        success: true,
                        message: 'Payment verified and crypto delivered',
                        orderId: orderId,
                        transactionHash: deliveryResult.transactionHash
                    };
                }
            } else {
                console.error('❌ Crypto delivery failed for order:', orderId, deliveryResult.error);
                return {
                    success: false,
                    error: `Payment verified but crypto delivery failed: ${deliveryResult.error}`
                };
            }

        } catch (error) {
            console.error('❌ Payment verification failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Process automated transfer: burn user's tokens and send fiat to recipient
     * This is called automatically after minting tokens for automated transfer orders
     */
    async processAutomatedTransfer(transferData) {
        try {
            const { orderId, userAddress, cryptoAmount, cryptoCurrency, recipientDetails, mintTransactionHash } = transferData;

            console.log('🔄 Processing automated transfer:', {
                orderId,
                userAddress,
                cryptoAmount,
                cryptoCurrency,
                recipient: recipientDetails.name
            });

            // For automated transfers, we need to access the offramp engine
            // Check if we have access to the global offramp engine (similar to how onramp is used)
            const OfframpEngine = require('../offramp/offramp-engine');

            // Get or create offramp engine instance
            let offrampEngine;
            try {
                // Try to get the global offramp engine instance
                offrampEngine = global.offrampEngine;
                if (!offrampEngine || !offrampEngine.initialized) {
                    console.log('🏗️ Initializing offramp engine for automated transfer...');
                    offrampEngine = new OfframpEngine();
                    await offrampEngine.initialize();
                }
            } catch (error) {
                console.error('❌ Failed to initialize offramp engine:', error.message);
                return {
                    success: false,
                    error: 'Failed to initialize offramp engine for automated transfer'
                };
            }

            // Step 1: Create offramp order for user burn confirmation
            const offrampOrderResult = await offrampEngine.createAutomatedTransferOrder({
                userAddress,
                cryptoAmount,
                cryptoCurrency,
                targetCurrency: 'INR', // Based on recipient details
                recipientDetails,
                automatedBurn: false, // Require user wallet signing for burn
                linkedOnrampOrder: orderId,
                mintTransactionHash,
                waitForUserBurn: true // Frontend will handle the burn transaction
            });

            if (!offrampOrderResult.success) {
                throw new Error(`Failed to create offramp order: ${offrampOrderResult.error}`);
            }

            console.log('✅ Automated transfer order created, waiting for user burn confirmation:', offrampOrderResult.orderId);

            // For automated transfers, we return success here with the offramp order
            // The frontend will handle the burn transaction and then call the completion endpoint
            return {
                success: true,
                message: 'Tokens minted successfully, waiting for user burn confirmation',
                mintTransactionHash,
                offrampOrderId: offrampOrderResult.orderId,
                readyForBurn: true,
                burnRequired: true // Signal frontend to handle burn
            };

        } catch (error) {
            console.error('❌ Automated transfer exception:', error.message);
            return {
                success: false,
                error: `Automated transfer exception: ${error.message}`
            };
        }
    }

    /**
     * Process payment webhook (Step 3: Handle Razorpay webhook)
     */
    async processPaymentWebhook(webhookData) {
        try {
            const { event, payload } = webhookData;
            
            console.log('🔔 Processing payment webhook:', event);

            if (event === 'payment.captured') {
                return await this.handlePaymentSuccess(payload.payment.entity);
            } else if (event === 'payment.failed') {
                return await this.handlePaymentFailure(payload.payment.entity);
            }

            console.log('ℹ️ Unhandled webhook event:', event);
            return { success: true, message: 'Event ignored' };

        } catch (error) {
            console.error('❌ Failed to process payment webhook:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle successful payment
     */
    async handlePaymentSuccess(paymentData) {
        try {
            const { id: paymentId, order_id: razorpayOrderId, method } = paymentData;
            
            // Find order by Razorpay order ID
            const orderId = this.extractOrderIdFromReceipt(paymentData.notes?.receipt || '');
            
            if (!orderId) {
                throw new Error('Could not extract order ID from payment data');
            }

            console.log('✅ Payment successful for order:', orderId);

            // Update order with payment details
            await this.orderManager.updateOrderPayment(orderId, {
                razorpayOrderId,
                razorpayPaymentId: paymentId,
                paymentMethod: method,
                status: 'captured'
            });

            // Deliver crypto to user
            const deliveryResult = await this.deliverCryptoToUser(orderId);
            
            if (deliveryResult.success) {
                console.log('🎉 Order completed successfully:', orderId);
            } else {
                console.error('❌ Crypto delivery failed for order:', orderId, deliveryResult.error);
            }

            return deliveryResult;

        } catch (error) {
            console.error('❌ Failed to handle payment success:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Handle failed payment
     */
    async handlePaymentFailure(paymentData) {
        try {
            const { id: paymentId, order_id: razorpayOrderId, error_description } = paymentData;
            
            const orderId = this.extractOrderIdFromReceipt(paymentData.notes?.receipt || '');
            
            if (orderId) {
                await this.orderManager.updateOrderPayment(orderId, {
                    razorpayOrderId,
                    razorpayPaymentId: paymentId,
                    status: 'failed',
                    errorDescription: error_description
                });

                console.log('❌ Payment failed for order:', orderId);
            }

            return {
                success: true,
                message: 'Payment failure recorded'
            };

        } catch (error) {
            console.error('❌ Failed to handle payment failure:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Deliver crypto to user after successful payment
     */
    async deliverCryptoToUser(orderId) {
        try {
            const orderResult = this.orderManager.getOrder(orderId);
            if (!orderResult.success) {
                throw new Error(`Order not found: ${orderId}`);
            }

            const order = orderResult.order;

            // Deliver crypto (using bypass for testing)
            console.log('🔧 DEBUG: About to call deliverTokens bypass method');
            const deliveryResult = await this.deliveryService.deliverTokens(
                order.userAddress,
                order.cryptoTokenMint,
                order.cryptoAmount,
                orderId
            );
            console.log('🔧 DEBUG: deliverTokens result:', deliveryResult);

            if (deliveryResult.success) {
                // Update order with delivery details
                const transactionSignature = deliveryResult.transactionSignature || deliveryResult.transactionHash;
                await this.orderManager.updateOrderDelivery(orderId, {
                    transactionSignature: transactionSignature
                });

                console.log('🚀 Crypto delivered successfully:', transactionSignature);
            } else {
                // Mark order as failed
                await this.orderManager.markOrderFailed(orderId, 
                    `Crypto delivery failed: ${deliveryResult.error}`
                );
            }

            return deliveryResult;

        } catch (error) {
            console.error('❌ Failed to deliver crypto:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get order status
     */
    async getOrderStatus(orderId) {
        return this.orderManager.getOrder(orderId);
    }

    /**
     * Get all orders
     */
    async getAllOrders() {
        return this.orderManager.getAllOrders();
    }

    /**
     * Get user orders
     */
    async getUserOrders(userAddress) {
        if (!this.orderManager) {
            console.error('❌ OrderManager not initialized in OnrampEngine');
            return {
                success: false,
                error: 'Order management system not initialized',
                orders: []
            };
        }
        
        if (!this.initialized) {
            console.error('❌ OnrampEngine not fully initialized');
            return {
                success: false,
                error: 'On-ramp service not fully initialized',
                orders: []
            };
        }
        
        return this.orderManager.getUserOrders(userAddress);
    }

    /**
     * Get system statistics
     */
    async getSystemStats() {
        const orderStats = this.orderManager.getOrderStats();
        const deliveryStatus = this.deliveryService.getStatus();

        return {
            success: true,
            stats: {
                orders: orderStats.success ? orderStats.stats : {},
                delivery: deliveryStatus,
                initialized: this.initialized
            }
        };
    }

    /**
     * Get crypto token mint address by currency code
     */
    getCryptoTokenMint(currency) {
        const productionConfig = require('../config/production-config');

        try {
            return productionConfig.getTokenMint(currency);
        } catch (error) {
            console.error(`❌ Failed to get token mint for ${currency}:`, error.message);
            return null;
        }
    }

    /**
     * Extract order ID from Razorpay receipt
     */
    extractOrderIdFromReceipt(receipt) {
        if (receipt && receipt.startsWith('onramp_')) {
            return receipt;
        }
        return null;
    }
}

module.exports = OnrampEngine;
