const crypto = require('crypto');
const https = require('https');

/**
 * Razorpay Payment Gateway Integration
 * Handles UPI and bank transfers for India corridor
 */
class RazorpayGateway {
    constructor() {
        // Load API credentials from environment variables
        this.apiKey = process.env.RAZORPAY_KEY_ID;
        this.apiSecret = process.env.RAZORPAY_KEY_SECRET;
        this.baseUrl = 'https://api.razorpay.com/v1';
        
        if (!this.apiKey || !this.apiSecret) {
            console.warn('⚠️ Razorpay credentials not found in environment variables');
            console.warn('   Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
        }
    }

    /**
     * Process direct transfer (UPI/IMPS/NEFT)
     */
    async processTransfer(params) {
        const { amount, currency, beneficiary, transactionId } = params;
        
        try {
            console.log(`🇮🇳 Processing Razorpay transfer: ${amount} ${currency}`);
            
            // Validate inputs
            this.validateTransferParams(params);
            
            // Create payout request
            const payoutData = this.buildPayoutRequest(params);
            
            // Make API call to Razorpay
            const result = await this.makeRazorpayRequest('/payouts', 'POST', payoutData);
            
            return {
                success: true,
                route: this.determineRoute(beneficiary),
                reference: result.id,
                status: this.mapRazorpayStatus(result.status),
                estimatedCompletion: this.getEstimatedCompletion(beneficiary),
                razorpayResponse: result
            };
        } catch (error) {
            console.error('❌ Razorpay transfer failed:', error);
            throw new Error(`Razorpay transfer failed: ${error.message}`);
        }
    }

    /**
     * Process hybrid transfer (not applicable for Razorpay direct)
     */
    async processHybridTransfer(params) {
        // For India, we use direct transfers, not hybrid
        // This would redirect to processTransfer
        return await this.processTransfer(params);
    }

    /**
     * Validate transfer parameters
     */
    validateTransferParams(params) {
        const { amount, currency, beneficiary, transactionId } = params;
        
        if (!amount || amount <= 0) {
            throw new Error('Invalid amount');
        }
        
        if (currency !== 'INR') {
            throw new Error('Razorpay only supports INR transfers');
        }
        
        if (!beneficiary) {
            throw new Error('Beneficiary details required');
        }
        
        // Validate UPI ID or bank account
        if (beneficiary.upiId) {
            if (!this.isValidUpiId(beneficiary.upiId)) {
                throw new Error('Invalid UPI ID format');
            }
        } else if (beneficiary.accountNumber) {
            if (!beneficiary.accountNumber || !beneficiary.ifscCode) {
                throw new Error('Bank account number and IFSC code required');
            }
        } else {
            throw new Error('Either UPI ID or bank account details required');
        }
        
        if (!transactionId) {
            throw new Error('Transaction ID required');
        }
    }

    /**
     * Build payout request for Razorpay API
     */
    buildPayoutRequest(params) {
        const { amount, currency, beneficiary, transactionId } = params;
        
        // Convert amount to paise (Razorpay uses smallest currency unit)
        const amountInPaise = Math.round(amount * 100);
        
        const payoutData = {
            account_number: this.getAccountNumber(), // Your Razorpay account
            amount: amountInPaise,
            currency: currency,
            mode: this.determineMode(beneficiary),
            purpose: 'payout',
            queue_if_low_balance: false,
            reference_id: transactionId,
            narration: `Nivix payout ${transactionId}`
        };

        // Add beneficiary details based on type
        if (beneficiary.upiId) {
            payoutData.fund_account = {
                account_type: 'vpa',
                vpa: {
                    address: beneficiary.upiId
                },
                contact: {
                    name: beneficiary.name || 'Beneficiary',
                    email: beneficiary.email,
                    contact: beneficiary.phone,
                    type: 'customer'
                }
            };
        } else {
            payoutData.fund_account = {
                account_type: 'bank_account',
                bank_account: {
                    name: beneficiary.name,
                    account_number: beneficiary.accountNumber,
                    ifsc: beneficiary.ifscCode
                },
                contact: {
                    name: beneficiary.name,
                    email: beneficiary.email,
                    contact: beneficiary.phone,
                    type: 'customer'
                }
            };
        }

        return payoutData;
    }

    /**
     * Make authenticated request to Razorpay API
     */
    async makeRazorpayRequest(endpoint, method, data) {
        if (!this.apiKey || !this.apiSecret) {
            throw new Error('Razorpay API credentials not configured');
        }

        return new Promise((resolve, reject) => {
            const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
            const postData = JSON.stringify(data);
            
            const options = {
                hostname: 'api.razorpay.com',
                path: `/v1${endpoint}`,
                method: method,
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(responseData);
                        
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(parsed);
                        } else {
                            reject(new Error(`API Error: ${parsed.error?.description || responseData}`));
                        }
                    } catch (error) {
                        reject(new Error(`Parse Error: ${error.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request Error: ${error.message}`));
            });

            if (method === 'POST' || method === 'PUT') {
                req.write(postData);
            }
            
            req.end();
        });
    }

    /**
     * Get Razorpay account number from configuration
     */
    getAccountNumber() {
        // This should be loaded from configuration
        return process.env.RAZORPAY_ACCOUNT_NUMBER || '2323230041626905';
    }

    /**
     * Determine transfer mode based on beneficiary
     */
    determineMode(beneficiary) {
        if (beneficiary.upiId) {
            return 'UPI';
        } else {
            return 'IMPS'; // Can be IMPS, NEFT, or RTGS based on amount and time
        }
    }

    /**
     * Determine route description
     */
    determineRoute(beneficiary) {
        if (beneficiary.upiId) {
            return 'UPI';
        } else {
            return 'IMPS/NEFT';
        }
    }

    /**
     * Map Razorpay status to our internal status
     */
    mapRazorpayStatus(razorpayStatus) {
        const statusMap = {
            'queued': 'PENDING',
            'pending': 'PROCESSING',
            'processed': 'COMPLETED',
            'cancelled': 'CANCELLED',
            'failed': 'FAILED',
            'reversed': 'FAILED'
        };
        
        return statusMap[razorpayStatus] || 'UNKNOWN';
    }

    /**
     * Get estimated completion time
     */
    getEstimatedCompletion(beneficiary) {
        if (beneficiary.upiId) {
            // UPI is usually instant
            return new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
        } else {
            // IMPS/NEFT can take longer
            return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        }
    }

    /**
     * Validate UPI ID format
     */
    isValidUpiId(upiId) {
        // Basic UPI ID validation (format: user@bank)
        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9.\-_]{2,64}$/;
        return upiRegex.test(upiId);
    }

    /**
     * Check payout status
     */
    async checkPayoutStatus(payoutId) {
        try {
            const result = await this.makeRazorpayRequest(`/payouts/${payoutId}`, 'GET');
            
            return {
                id: result.id,
                status: this.mapRazorpayStatus(result.status),
                amount: result.amount / 100, // Convert from paise
                currency: result.currency,
                createdAt: new Date(result.created_at * 1000),
                utr: result.utr, // UTR number for bank transfers
                failureReason: result.failure_reason
            };
        } catch (error) {
            console.error('❌ Status check failed:', error);
            throw error;
        }
    }

    /**
     * Cancel payout (if possible)
     */
    async cancelPayout(payoutId) {
        try {
            const result = await this.makeRazorpayRequest(`/payouts/${payoutId}/cancel`, 'POST');
            
            return {
                success: true,
                status: this.mapRazorpayStatus(result.status),
                id: result.id
            };
        } catch (error) {
            console.error('❌ Payout cancellation failed:', error);
            throw error;
        }
    }

    /**
     * Get account balance
     */
    async getAccountBalance() {
        try {
            const result = await this.makeRazorpayRequest('/accounts/balance', 'GET');
            
            return {
                balance: result.balance / 100, // Convert from paise
                currency: 'INR',
                lastUpdated: new Date()
            };
        } catch (error) {
            console.error('❌ Balance check failed:', error);
            throw error;
        }
    }

    /**
     * Webhook signature verification
     */
    verifyWebhookSignature(payload, signature, secret) {
        const expectedSignature = crypto
            .createHmac('sha256', secret || this.apiSecret)
            .update(payload)
            .digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
}

module.exports = RazorpayGateway;


