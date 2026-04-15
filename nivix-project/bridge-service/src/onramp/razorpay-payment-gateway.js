const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * Razorpay Payment Gateway for On-ramp (Collecting payments from users)
 * This is different from the off-ramp gateway which pays out to users
 */
class RazorpayPaymentGateway {
    constructor() {
        this.environment = (process.env.RAZORPAY_ENV || '').trim().toLowerCase();
        this.keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
        this.keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
        
        if (!this.keyId || !this.keySecret) {
            console.warn('⚠️ Razorpay credentials not configured - on-ramp payments will be disabled');
            this.enabled = false;
            return;
        }

        const environmentValidationError = this.validateCredentialEnvironment();
        if (environmentValidationError) {
            console.error(`❌ ${environmentValidationError}`);
            this.enabled = false;
            return;
        }
        
        this.enabled = true;
        
        console.log('🔑 Razorpay Payment Gateway initialized for on-ramp');
        console.log('🔍 Key ID:', this.maskCredential(this.keyId, 10));
        console.log('🔍 Razorpay environment:', this.environment || 'not_set');
    }

    maskCredential(value, visibleChars = 6) {
        if (!value) return 'NOT SET';
        if (value.length <= visibleChars) return `${value}***`;
        return `${value.substring(0, visibleChars)}...`;
    }

    validateCredentialEnvironment() {
        if (!this.environment) {
            return null;
        }

        if (this.environment === 'test' && !this.keyId.startsWith('rzp_test_')) {
            return 'RAZORPAY_ENV is set to test but RAZORPAY_KEY_ID is not a test key (expected prefix: rzp_test_)';
        }

        if ((this.environment === 'live' || this.environment === 'production') && !this.keyId.startsWith('rzp_live_')) {
            return 'RAZORPAY_ENV is set to live/production but RAZORPAY_KEY_ID is not a live key (expected prefix: rzp_live_)';
        }

        return null;
    }

    /**
     * Create a payment order for user to pay fiat and receive crypto
     */
    async createPaymentOrder(orderDetails) {
        if (!this.enabled) {
            return {
                success: false,
                error: 'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables with your test credentials from https://dashboard.razorpay.com'
            };
        }
        
        try {
            const {
                amount,          // Amount in smallest currency unit (e.g., paise for INR)
                currency,        // Currency code (INR, USD, etc.)
                userAddress,     // Solana wallet address to receive crypto
                cryptoAmount,    // Amount of crypto user will receive
                cryptoToken,     // Token mint address
                orderId         // Internal order ID
            } = orderDetails;

            // Create Razorpay order
            const razorpayOrder = {
                amount: amount,
                currency: currency,
                receipt: `onramp_${orderId}`,
                notes: {
                    user_address: userAddress,
                    crypto_amount: cryptoAmount,
                    crypto_token: cryptoToken,
                    order_type: 'onramp'
                }
            };

            console.log('📝 Creating Razorpay payment order:', {
                amount: amount,
                currency: currency,
                receipt: razorpayOrder.receipt
            });

            // Make API call to Razorpay
            const response = await this.makeRazorpayRequest('POST', '/orders', razorpayOrder);

            if (response.id) {
                console.log('✅ Razorpay payment order created:', response.id);
                return {
                    success: true,
                    orderId: response.id,
                    amount: response.amount,
                    currency: response.currency,
                    receipt: response.receipt,
                    status: response.status,
                    keyId: this.keyId // Frontend needs this for payment
                };
            } else {
                throw new Error('Invalid response from Razorpay');
            }

        } catch (error) {
            console.error('❌ Failed to create Razorpay payment order:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Verify payment signature from Razorpay webhook
     */
    verifyPaymentSignature(paymentId, orderId, signature) {
        try {
            const body = orderId + '|' + paymentId;
            const expectedSignature = crypto
                .createHmac('sha256', this.keySecret)
                .update(body.toString())
                .digest('hex');
            
            return expectedSignature === signature;
        } catch (error) {
            console.error('❌ Payment signature verification failed:', error.message);
            return false;
        }
    }

    /**
     * Verify webhook signature from Razorpay
     */
    verifyWebhookSignature(payload, signature, secret) {
        try {
            const expectedSignature = crypto
                .createHmac('sha256', secret || this.keySecret)
                .update(payload)
                .digest('hex');
            
            return expectedSignature === signature;
        } catch (error) {
            console.error('❌ Webhook signature verification failed:', error.message);
            return false;
        }
    }

    /**
     * Get payment details from Razorpay
     */
    async getPaymentDetails(paymentId) {
        try {
            console.log('🔍 Fetching payment details for:', paymentId);
            const response = await this.makeRazorpayRequest('GET', `/payments/${paymentId}`);
            
            return {
                success: true,
                payment: response
            };
        } catch (error) {
            console.error('❌ Failed to fetch payment details:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get order details from Razorpay
     */
    async getOrderDetails(orderId) {
        try {
            console.log('🔍 Fetching order details for:', orderId);
            const response = await this.makeRazorpayRequest('GET', `/orders/${orderId}`);
            
            return {
                success: true,
                order: response
            };
        } catch (error) {
            console.error('❌ Failed to fetch order details:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Make HTTP request to Razorpay API
     */
    async makeRazorpayRequest(method, endpoint, data = null) {
        const url = `https://api.razorpay.com/v1${endpoint}`;
        const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
        
        const options = {
            method: method,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            const errorText = await response.text();

            if (response.status === 401) {
                throw new Error(
                    `Razorpay authentication failed (401). Verify RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET pair and RAZORPAY_ENV (${this.environment || 'not_set'}). Key ID: ${this.maskCredential(this.keyId, 10)}. Razorpay response: ${errorText}`
                );
            }

            throw new Error(`Razorpay API error (${response.status}): ${errorText}`);
        }
        
        return await response.json();
    }

    /**
     * Generate payment form HTML for frontend integration
     */
    generatePaymentForm(orderDetails) {
        const {
            orderId,
            amount,
            currency,
            name,
            description,
            userAddress,
            callbackUrl
        } = orderDetails;

        return `
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
        var options = {
            "key": "${this.keyId}",
            "amount": "${amount}",
            "currency": "${currency}",
            "name": "Nivix Pay",
            "description": "${description}",
            "order_id": "${orderId}",
            "callback_url": "${callbackUrl}",
            "prefill": {
                "name": "${name}",
                "contact": ""
            },
            "notes": {
                "user_address": "${userAddress}"
            },
            "theme": {
                "color": "#3399cc"
            }
        };
        var rzp1 = new Razorpay(options);
        rzp1.open();
        </script>
        `;
    }
}

module.exports = RazorpayPaymentGateway;







