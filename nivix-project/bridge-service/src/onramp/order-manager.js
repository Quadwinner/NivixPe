const fs = require('fs');
const path = require('path');

/**
 * Order Management System for On-ramp
 * Tracks the flow: User pays fiat → System delivers crypto
 */
class OrderManager {
    constructor() {
        this.ordersFile = path.join(__dirname, '../data/onramp-orders.json');
        this.orders = new Map();
        this.initialized = false;
    }

    async initialize() {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.ordersFile);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Load existing orders
            await this.loadOrders();
            this.initialized = true;
            console.log('📋 Order Manager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Order Manager:', error.message);
            throw error;
        }
    }

    /**
     * Create a new on-ramp order
     */
    async createOrder(orderData) {
        try {
            if (!this.initialized) {
                throw new Error('Order Manager not initialized');
            }

            const orderId = this.generateOrderId();
            const timestamp = new Date().toISOString();

            const order = {
                id: orderId,
                status: 'pending_payment',
                createdAt: timestamp,
                updatedAt: timestamp,
                
                // User details
                userAddress: orderData.userAddress,
                userEmail: orderData.userEmail || null,
                userPhone: orderData.userPhone || null,
                
                // Fiat payment details
                fiatAmount: orderData.fiatAmount,
                fiatCurrency: orderData.fiatCurrency,
                
                // Crypto delivery details
                cryptoAmount: orderData.cryptoAmount,
                cryptoCurrency: orderData.cryptoCurrency,
                cryptoTokenMint: orderData.cryptoTokenMint,
                
                // Exchange rate at time of order
                exchangeRate: orderData.exchangeRate,
                
                // Payment details (filled after payment)
                razorpayOrderId: null,
                razorpayPaymentId: null,
                paymentMethod: null,
                
                // Delivery details (filled after crypto transfer)
                transactionSignature: null,
                deliveredAt: null,

                // Automated transfer fields
                automatedTransfer: orderData.automatedTransfer || false,
                recipientDetails: orderData.recipientDetails || null,
                transferType: orderData.transferType || null,
                burnRequired: false,
                readyForBurn: false,
                offrampOrderId: null,
                mintTransactionHash: null,
                automatedTransferStatus: null,

                // Tracking
                steps: [{
                    step: 'order_created',
                    status: 'completed',
                    timestamp: timestamp,
                    message: 'Order created successfully'
                }],

                // Metadata
                metadata: orderData.metadata || {}
            };

            this.orders.set(orderId, order);
            await this.saveOrders();

            console.log('✅ Order created:', orderId);
            return {
                success: true,
                order: order
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
     * Update order with payment details
     */
    async updateOrderPayment(orderId, paymentData) {
        try {
            const order = this.orders.get(orderId);
            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            order.razorpayOrderId = paymentData.razorpayOrderId;
            order.razorpayPaymentId = paymentData.razorpayPaymentId;
            order.paymentMethod = paymentData.paymentMethod;
            order.status = paymentData.status === 'captured' ? 'payment_confirmed' : 'payment_failed';
            order.updatedAt = new Date().toISOString();

            // Add step
            order.steps.push({
                step: 'payment_processed',
                status: order.status === 'payment_confirmed' ? 'completed' : 'failed',
                timestamp: order.updatedAt,
                message: paymentData.status === 'captured' 
                    ? 'Payment confirmed successfully' 
                    : `Payment failed: ${paymentData.errorDescription || 'Unknown error'}`
            });

            await this.saveOrders();
            console.log(`💳 Order ${orderId} payment updated:`, order.status);
            
            return {
                success: true,
                order: order
            };

        } catch (error) {
            console.error('❌ Failed to update order payment:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Update order with crypto delivery details
     */
    async updateOrderDelivery(orderId, deliveryData) {
        try {
            const order = this.orders.get(orderId);
            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            order.transactionSignature = deliveryData.transactionSignature;
            order.deliveredAt = new Date().toISOString();

            // If this is an automated transfer, set status to 'processing' to indicate burn is needed
            if (order.automatedTransfer && order.burnRequired) {
                order.status = 'processing'; // Waiting for user burn confirmation
            } else {
                order.status = 'completed'; // Regular onramp completed
            }

            order.updatedAt = order.deliveredAt;

            // Add step
            order.steps.push({
                step: 'crypto_delivered',
                status: 'completed',
                timestamp: order.deliveredAt,
                message: `Crypto delivered successfully. Transaction: ${deliveryData.transactionSignature}`
            });

            await this.saveOrders();
            console.log(`🚀 Order ${orderId} completed with transaction:`, deliveryData.transactionSignature);
            
            return {
                success: true,
                order: order
            };

        } catch (error) {
            console.error('❌ Failed to update order delivery:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get order by ID
     */
    getOrder(orderId) {
        const order = this.orders.get(orderId);
        if (!order) {
            return {
                success: false,
                error: 'Order not found'
            };
        }

        return {
            success: true,
            order: order
        };
    }

    /**
     * Update order with additional data (like automated transfer flags)
     */
    async updateOrder(orderId, updateData) {
        try {
            const order = this.orders.get(orderId);
            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            // Update order fields
            Object.keys(updateData).forEach(key => {
                order[key] = updateData[key];
            });

            order.updatedAt = new Date().toISOString();
            await this.saveOrders();

            console.log(`📝 Order ${orderId} updated with:`, Object.keys(updateData));

            return {
                success: true,
                order: order
            };

        } catch (error) {
            console.error('❌ Failed to update order:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get orders by user address
     */
    getUserOrders(userAddress) {
        const userOrders = Array.from(this.orders.values())
            .filter(order => order.userAddress === userAddress)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            success: true,
            orders: userOrders
        };
    }

    /**
     * Get orders by status
     */
    getOrdersByStatus(status) {
        const statusOrders = Array.from(this.orders.values())
            .filter(order => order.status === status)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            success: true,
            orders: statusOrders
        };
    }

    /**
     * Mark order as failed
     */
    async markOrderFailed(orderId, reason) {
        try {
            const order = this.orders.get(orderId);
            if (!order) {
                throw new Error(`Order not found: ${orderId}`);
            }

            order.status = 'failed';
            order.updatedAt = new Date().toISOString();

            // Add step
            order.steps.push({
                step: 'order_failed',
                status: 'failed',
                timestamp: order.updatedAt,
                message: `Order failed: ${reason}`
            });

            await this.saveOrders();
            console.log(`❌ Order ${orderId} marked as failed:`, reason);
            
            return {
                success: true,
                order: order
            };

        } catch (error) {
            console.error('❌ Failed to mark order as failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get all orders
     */
    getAllOrders() {
        const orders = Array.from(this.orders.values())
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return {
            success: true,
            orders: orders
        };
    }

    /**
     * Get order statistics
     */
    getOrderStats() {
        const orders = Array.from(this.orders.values());
        const stats = {
            total: orders.length,
            pending_payment: 0,
            payment_confirmed: 0,
            completed: 0,
            failed: 0,
            totalFiatVolume: 0,
            totalCryptoVolume: 0
        };

        orders.forEach(order => {
            stats[order.status] = (stats[order.status] || 0) + 1;
            
            if (order.status === 'completed') {
                stats.totalFiatVolume += parseFloat(order.fiatAmount);
                stats.totalCryptoVolume += parseFloat(order.cryptoAmount);
            }
        });

        return {
            success: true,
            stats: stats
        };
    }

    /**
     * Generate unique order ID
     */
    generateOrderId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        return `onramp_${timestamp}_${random}`;
    }

    /**
     * Load orders from file
     */
    async loadOrders() {
        try {
            if (fs.existsSync(this.ordersFile)) {
                const data = fs.readFileSync(this.ordersFile, 'utf8');
                const ordersArray = JSON.parse(data);
                
                ordersArray.forEach(order => {
                    this.orders.set(order.id, order);
                });
                
                console.log(`📂 Loaded ${ordersArray.length} existing orders`);
            } else {
                console.log('📂 No existing orders file found, starting fresh');
            }
        } catch (error) {
            console.error('❌ Failed to load orders:', error.message);
        }
    }

    /**
     * Save orders to file
     */
    async saveOrders() {
        try {
            const ordersArray = Array.from(this.orders.values());
            fs.writeFileSync(this.ordersFile, JSON.stringify(ordersArray, null, 2));
        } catch (error) {
            console.error('❌ Failed to save orders:', error.message);
        }
    }
}

module.exports = OrderManager;








