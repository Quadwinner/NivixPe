const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const RazorpayXPayouts = require('./razorpayx-payouts');

/**
 * Fiat Payout Service
 * Handles real money transfers to recipients via payout APIs
 * Supports multiple payout providers: Cashfree, PayU, Instamojo, RazorpayX
 */
class FiatPayoutService {
    constructor() {
        // Debug environment variables
        console.log('🔍 Fiat Payout Service - Environment Variables:');
        console.log('CASHFREE_CLIENT_ID:', process.env.CASHFREE_CLIENT_ID ? 'SET' : 'NOT SET');
        console.log('CASHFREE_CLIENT_SECRET:', process.env.CASHFREE_CLIENT_SECRET ? 'SET' : 'NOT SET');
        console.log('NODE_ENV:', process.env.NODE_ENV);
        
        const cashfreeApiVersion = 'v1'; // Use v1 API - this is working!
        this.providers = {
            razorpayx: {
                name: 'RazorpayX Payouts',
                baseUrl: 'https://api.razorpay.com/v1',
                enabled: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
                credentials: {
                    keyId: process.env.RAZORPAY_KEY_ID,
                    keySecret: process.env.RAZORPAY_KEY_SECRET,
                    accountNumber: process.env.RAZORPAY_ACCOUNT_NUMBER
                }
            },
            razorpay: {
                name: 'Razorpay (Payment Gateway Only)',
                baseUrl: 'https://api.razorpay.com/v1',
                enabled: false, // Legacy - use RazorpayX for payouts
                credentials: {
                    keyId: process.env.RAZORPAY_KEY_ID,
                    keySecret: process.env.RAZORPAY_KEY_SECRET
                }
            },
            cashfree: {
                name: 'Cashfree Payouts v1',
                baseUrl: process.env.CASHFREE_BASE_URL || (
                    process.env.NODE_ENV === 'production'
                        ? 'https://payout-api.cashfree.com'
                        : 'https://payout-gamma.cashfree.com'
                ),
                apiVersion: cashfreeApiVersion,
                sandboxUrl: 'https://payout-gamma.cashfree.com',
                enabled: false, // DISABLED - Using RazorpayX for payouts
                credentials: {
                    clientId: process.env.CASHFREE_CLIENT_ID,
                    clientSecret: process.env.CASHFREE_CLIENT_SECRET
                }
            },
            payu: {
                name: 'PayU Payouts',
                baseUrl: process.env.PAYU_BASE_URL || 'https://payouts.payu.in/api/v1',
                enabled: false, // Disabled - using Cashfree only
                credentials: {
                    merchantId: process.env.PAYU_MERCHANT_ID,
                    apiKey: process.env.PAYU_API_KEY
                }
            },
            instamojo: {
                name: 'Instamojo Payouts',
                baseUrl: 'https://api.instamojo.com/v2',
                enabled: true, // PRIMARY payout provider (Cashfree failing)
                credentials: {
                    clientId: process.env.INSTAMOJO_CLIENT_ID,
                    clientSecret: process.env.INSTAMOJO_CLIENT_SECRET
                }
            }
        };
        
        this.payoutHistory = new Map();
        // Short-lived auth token cache for Cashfree
        this._cashfreeToken = null;
        this._cashfreeTokenExpiry = 0; // epoch ms
        // Public key (2FA) support
        this._cashfreePublicKeyPem = process.env.CASHFREE_PUBLIC_KEY_PEM || null;
        if (!this._cashfreePublicKeyPem && process.env.CASHFREE_PUBLIC_KEY_PATH && fs.existsSync(process.env.CASHFREE_PUBLIC_KEY_PATH)) {
            try {
                this._cashfreePublicKeyPem = fs.readFileSync(process.env.CASHFREE_PUBLIC_KEY_PATH, 'utf8');
                console.log('🔐 Loaded Cashfree public key for 2FA signature');
            } catch (e) {
                console.warn('⚠️ Failed to load Cashfree public key:', e.message);
            }
        } else {
            if (this._cashfreePublicKeyPem) {
                console.log('🔐 Loaded Cashfree public key from env for 2FA signature');
            } else {
                console.log('ℹ️ No Cashfree public key provided - proceeding without X-Cf-Signature');
            }
        }
        
        // Initialize RazorpayX Payouts if enabled
        if (this.providers.razorpayx.enabled) {
            this.razorpayxPayouts = new RazorpayXPayouts();
            console.log('🔧 RazorpayX Payouts configured');
        }
        
        console.log('💸 Fiat Payout Service initialized');
        // Configure Cashfree when enabled
        if (this.providers.cashfree.enabled) {
        if (process.env.NODE_ENV === 'production') {
                this.providers.cashfree.apiVersion = 'v1';
                this.providers.cashfree.baseUrl = 'https://payout-api.cashfree.com';
        } else {
                this.providers.cashfree.apiVersion = 'v1';
                this.providers.cashfree.baseUrl = 'https://payout-gamma.cashfree.com';
        }
            console.log('🔧 Cashfree v1 configured →', this.providers.cashfree);
        }
    }

    /**
     * Build v2 headers with optional public-key signature (2FA)
     */
    buildCashfreeV2Headers() {
        const baseHeaders = {
            'Content-Type': 'application/json',
            'X-Client-Id': this.providers.cashfree.credentials.clientId,
            'X-Client-Secret': this.providers.cashfree.credentials.clientSecret
        };
        try {
            if (this._cashfreePublicKeyPem) {
                const timestamp = Math.floor(Date.now() / 1000).toString();
                const data = `${this.providers.cashfree.credentials.clientId}.${timestamp}`;
                const encrypted = crypto.publicEncrypt({
                    key: this._cashfreePublicKeyPem,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                }, Buffer.from(data, 'utf8'));
                const signature = encrypted.toString('base64');
                return { ...baseHeaders, 'X-Cf-Signature': signature, 'X-Cf-Timestamp': timestamp };
            }
        } catch (e) {
            console.warn('⚠️ Failed generating X-Cf-Signature, sending without it:', e.message);
        }
        return baseHeaders;
    }

    /**
     * Build v1 authorize headers with optional public-key signature (2FA)
     * per docs: https://www.cashfree.com/docs/api-reference/payouts/v1/authorize
     */
    buildCashfreeV1AuthHeaders() {
        const baseHeaders = {
            'Content-Type': 'application/json',
            'X-Client-Id': this.providers.cashfree.credentials.clientId,
            'X-Client-Secret': this.providers.cashfree.credentials.clientSecret
        };
        try {
            if (this._cashfreePublicKeyPem) {
                const timestamp = Math.floor(Date.now() / 1000).toString();
                const data = `${this.providers.cashfree.credentials.clientId}.${timestamp}`;
                const encrypted = crypto.publicEncrypt({
                    key: this._cashfreePublicKeyPem,
                    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                    oaepHash: 'sha256'
                }, Buffer.from(data, 'utf8'));
                const signature = encrypted.toString('base64');
                return { ...baseHeaders, 'X-Cf-Signature': signature };
            }
        } catch (e) {
            console.warn('⚠️ Failed generating X-Cf-Signature for v1 auth:', e.message);
        }
        return baseHeaders;
    }

    /**
     * Generate Cashfree v1 auth token using HMAC-SHA256 signature
     * Following the working pattern from Cashfree documentation
     */
    generateCashfreeAuthToken() {
        const timestamp = Math.floor(Date.now() / 1000);
        const body = `${this.providers.cashfree.credentials.clientId}.${timestamp}`;
        const signature = crypto
            .createHmac('sha256', this.providers.cashfree.credentials.clientSecret)
            .update(body)
            .digest('base64');
        
        return `${body}.${signature}`;
    }

    /**
     * Get Cashfree v1 bearer token from API
     * https://www.cashfree.com/docs/payouts/cashgram/integration/cashgram-integration
     */
    async getCashfreeAuthToken() {
        const now = Date.now();
        
        // Return cached token if still valid (with 30s buffer)
        if (this._cashfreeToken && now < this._cashfreeTokenExpiry - 30_000) {
            console.log('🔐 Using cached Cashfree v1 token');
            return this._cashfreeToken;
        }
        
        try {
            // Use exact format from official documentation
            const authUrl = `${this.providers.cashfree.baseUrl}/payout/v1/authorize`;
            console.log(`🔐 Cashfree v1 auth: requesting token from ${authUrl}`);
            console.log(`🔐 Using Client ID: ${this.providers.cashfree.credentials.clientId}`);
            
            const response = await axios.post(authUrl, {}, {
                headers: {
                    'X-Client-Id': this.providers.cashfree.credentials.clientId,
                    'X-Client-Secret': this.providers.cashfree.credentials.clientSecret,
                    'cache-control': 'no-cache'
                },
                timeout: 15000
            });
            
            console.log('🔍 Auth response status:', response.status);
            console.log('🔍 Auth response:', JSON.stringify(response.data, null, 2));

            if (response.data?.status !== 'SUCCESS') {
                throw new Error(`Authentication failed: ${response.data?.message || 'Unknown error'}`);
            }

            const token = response.data?.data?.token;
            if (!token) {
                throw new Error(`No token found in Cashfree auth response`);
            }
            
            this._cashfreeToken = token;
            // Use expiry from response or default to 5 minutes
            const expiry = response.data?.data?.expiry;
            this._cashfreeTokenExpiry = expiry ? expiry * 1000 : (now + 5 * 60 * 1000);

            console.log(`✅ Cashfree v1 bearer token obtained, expires at: ${new Date(this._cashfreeTokenExpiry)}`);
            return token;
            
        } catch (error) {
            console.error('❌ Cashfree v1 authentication failed:', error.response?.data || error.message);
            throw new Error(`Cashfree authentication failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Create idempotent beneficiary on Cashfree v1 API
     * https://www.cashfree.com/docs/payouts/payouts/introduction
     */
    async ensureCashfreeBeneficiary(beneDetails, bearerToken) {
        // v1 API: use bearer token and /addBeneficiary endpoint
        // Deterministic beneId using account + ifsc + name
        const hash = crypto.createHash('sha256')
            .update(`${beneDetails.bankAccount}|${beneDetails.ifsc}|${beneDetails.name}`)
            .digest('hex')
            .substring(0, 20);
        const beneId = `nivix_${hash}`;
        
        console.log(`🏦 Adding Cashfree v1 beneficiary: ${beneId}`);
        console.log(`🔍 Beneficiary details:`, JSON.stringify(beneDetails, null, 2));
        
        const url = `${this.providers.cashfree.baseUrl}/payout/v1/addBeneficiary`;
        
        try {
            const beneficiaryPayload = {
                beneId: beneId,
                name: beneDetails.name,
                email: beneDetails.email,
                phone: beneDetails.phone,
                bankAccount: beneDetails.bankAccount,
                ifsc: beneDetails.ifsc,
                address1: beneDetails.address1 || 'India'
            };
            
            console.log(`🔍 Sending v1 beneficiary payload:`, JSON.stringify(beneficiaryPayload, null, 2));
            
            const response = await axios.post(url, beneficiaryPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Client-Id': this.providers.cashfree.credentials.clientId,
                    'Authorization': `Bearer ${bearerToken}`
                },
                timeout: 10000
            });
            
            console.log(`🔍 Add beneficiary v1 response status:`, response.status);
            console.log(`🔍 Add beneficiary v1 response:`, JSON.stringify(response.data, null, 2));
            
            // Check if beneficiary was added successfully or already exists
            if (response.data?.status === 'SUCCESS' || 
                response.data?.subCode === '200' || 
                response.data?.subCode === '409' ||
                response.status === 200) {
                console.log(`✅ Beneficiary ${beneId} ready for transfer`);
                return beneId;
            }
            
            // If response indicates beneficiary already exists, that's also fine
            console.log(`✅ Beneficiary ${beneId} processed (status: ${response.data?.status})`);
            return beneId;
            
        } catch (error) {
            const status = error.response?.status;
            const errorData = error.response?.data;
            
            console.log(`⚠️ Beneficiary v1 creation response:`, JSON.stringify(errorData, null, 2));
            
            // If beneficiary already exists (409 Conflict), that's acceptable
            if (status === 409 || errorData?.subCode === '409' || errorData?.message?.includes('already exists')) {
                console.log(`✅ Beneficiary ${beneId} already exists - proceeding`);
                return beneId;
            }
            
            // Log warning but proceed - requestTransfer will validate the beneficiary
            console.warn(`⚠️ Cashfree v1 addBeneficiary warning (status ${status}):`, errorData || error.message);
            console.log(`🔄 Proceeding with beneficiary ID: ${beneId} - transfer will validate`);
            return beneId;
        }
    }

    /**
     * Process fiat payout to recipient after token burn
     * @param {Object} payoutRequest - Payout details
     * @returns {Object} Payout result
     */
    async processPayoutToRecipient(payoutRequest) {
        try {
            console.log(`💸 Processing fiat payout: ${payoutRequest.amount} ${payoutRequest.currency}`);
            
            const payoutId = this.generatePayoutId();
            
            // Validate payout request
            const validation = this.validatePayoutRequest(payoutRequest);
            if (!validation.valid) {
                throw new Error(`Invalid payout request: ${validation.error}`);
            }
            
            // Select best payout provider
            const provider = this.selectOptimalProvider(payoutRequest);
            
            // Process payout via selected provider
            let payoutResult;
            switch (provider) {
                case 'razorpayx':
                    console.log('🚀 Using RazorpayX for payout (NOT Cashfree)');
                    payoutResult = await this.processRazorpayXPayout(payoutRequest, payoutId);
                    break;
                case 'cashfree':
                    console.error('❌ ERROR: Cashfree should be disabled! Forcing RazorpayX instead...');
                    // Force RazorpayX even if Cashfree was selected
                    if (this.providers.razorpayx.enabled && this.providers.razorpayx.credentials.keyId) {
                        console.log('🔄 Switching to RazorpayX...');
                        payoutResult = await this.processRazorpayXPayout(payoutRequest, payoutId);
                    } else {
                        throw new Error('RazorpayX not available. Please configure RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_ACCOUNT_NUMBER');
                    }
                    break;
                case 'payu':
                    payoutResult = await this.processPayUPayout(payoutRequest, payoutId);
                    break;
                case 'instamojo':
                    payoutResult = await this.processInstamojoPayout(payoutRequest, payoutId);
                    break;
                default:
                    throw new Error(`Unsupported payout provider: ${provider}`);
            }
            
            // Store payout record
            const payoutRecord = {
                payout_id: payoutId,
                provider: provider,
                request: payoutRequest,
                result: payoutResult,
                status: payoutResult.success ? 'completed' : 'failed',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.payoutHistory.set(payoutId, payoutRecord);
            
            console.log(`✅ Payout ${payoutResult.success ? 'successful' : 'failed'}: ${payoutId}`);
            
            return {
                success: payoutResult.success,
                payout_id: payoutId,
                provider: provider,
                amount: payoutRequest.amount,
                currency: payoutRequest.currency,
                recipient: payoutRequest.recipient,
                transaction_id: payoutResult.transaction_id,
                status: payoutResult.status,
                message: payoutResult.message,
                error: payoutResult.success ? null : (payoutResult.error || payoutResult.message || 'Unknown payout error'),
                estimated_arrival: payoutResult.estimated_arrival || 'Within 24 hours',
                fees: payoutResult.fees || 0
            };
            
        } catch (error) {
            console.error('❌ Fiat payout failed:', error.message);
            return {
                success: false,
                error: error.message,
                payout_id: null,
                status: 'failed'
            };
        }
    }

    /**
     * Process payout via RazorpayX Payouts API
     */
    async processRazorpayXPayout(payoutRequest, payoutId) {
        try {
            console.log('💳 Processing RazorpayX payout...');
            
            if (!this.razorpayxPayouts) {
                throw new Error('RazorpayX Payouts not initialized');
            }

            // Prepare beneficiary data for RazorpayX
            const beneficiaryData = {
                name: payoutRequest.recipient.name,
                email: payoutRequest.recipient.email,
                phone: payoutRequest.recipient.phone,
                bank_account: payoutRequest.recipient.bank_account,
                upiId: payoutRequest.recipient.upiId
            };

            // Process complete payout flow (Contact → Fund Account → Payout)
            const result = await this.razorpayxPayouts.processCompletePayout(
                beneficiaryData,
                payoutRequest.amount,
                'payout', // payout purpose
                payoutId
            );

            if (!result.success) {
                throw new Error(result.error || 'RazorpayX payout failed');
            }

            return {
                success: true,
                transaction_id: result.payoutId,
                status: result.status,
                message: `Payout initiated via RazorpayX (${result.mode})`,
                provider_response: result.razorpayResponse,
                estimated_arrival: this.formatEstimatedArrival(result.estimatedCompletion),
                fees: 0, // RazorpayX fees are deducted from account balance
                mode: result.mode
            };

        } catch (error) {
            console.error('❌ RazorpayX payout failed:', error.message);
            return {
                success: false,
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * Format estimated arrival time
     */
    formatEstimatedArrival(date) {
        if (!date) return 'Within 24 hours';
        const now = new Date();
        const diff = date - now;
        const minutes = Math.round(diff / (1000 * 60));
        
        if (minutes < 60) {
            return `Within ${minutes} minutes`;
        } else if (minutes < 1440) {
            const hours = Math.round(minutes / 60);
            return `Within ${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return 'Within 24 hours';
        }
    }

    /**
     * Process payout via Instamojo Payouts API
     */
    async processInstamojoPayout(payoutRequest, payoutId) {
        try {
            console.log('💳 Processing Instamojo payout...');
            
            // Get Instamojo auth token
            const authToken = await this.getInstamojoAuthToken();
            
            // Create payout request
            const payoutData = {
                purpose: 'payout',
                amount: payoutRequest.amount,
                currency: payoutRequest.currency,
                buyer_name: payoutRequest.recipient.name,
                email: payoutRequest.recipient.email || 'recipient@example.com',
                phone: payoutRequest.recipient.phone || '9999999999',
                redirect_url: 'https://nivix.com/payout-success',
                webhook_url: 'https://nivix.com/webhook/instamojo',
                allow_repeated_payments: false,
                send_email: false,
                send_sms: false,
                notes: {
                    payout_id: payoutId,
                    burn_hash: payoutRequest.burn_transaction_hash,
                    transaction_id: payoutRequest.transaction_id
                }
            };
            
            const response = await axios.post(
                `${this.providers.instamojo.baseUrl}/payment-requests/`,
                payoutData,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            return {
                success: true,
                transaction_id: response.data.id,
                status: response.data.status,
                message: 'Payout initiated via Instamojo',
                provider_response: response.data
            };
            
        } catch (error) {
            console.error('❌ Instamojo payout failed:', error.message);
            return {
                success: false,
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * Get Instamojo authentication token
     */
    async getInstamojoAuthToken() {
        const response = await axios.post(
            `${this.providers.instamojo.baseUrl}/oauth2/token/`,
            {
                grant_type: 'client_credentials',
                client_id: this.providers.instamojo.credentials.clientId,
                client_secret: this.providers.instamojo.credentials.clientSecret
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        return response.data.access_token;
    }

    /**
     * Process payout via Cashfree Payouts API
     * Using correct Cashfree API format
     */
    async processCashfreePayout(payoutRequest, payoutId) {
        try {
            console.log('💰 Processing Cashfree payout...');
            console.log('🔍 Using Cashfree sandbox URL:', this.providers.cashfree.baseUrl);
            console.log('🔍 Cashfree Client ID:', this.providers.cashfree.credentials.clientId);
            
            // Use real Cashfree API based on official documentation
            console.log('💰 Processing real Cashfree payout using official API...');

            // Optional SDK-only mode (uses Cashfree SDK instead of REST)
            if (false && process.env.CASHFREE_SDK_MODE === 'true') {
                console.log('🧩 CASHFREE_SDK_MODE enabled: using Cashfree SDK path');
                const cfSdk = require('cashfree-sdk');
                const { Payouts } = cfSdk;
                if (!Payouts) {
                    throw new Error('cashfree-sdk Payouts API not available');
                }

                const publicKey = this._cashfreePublicKeyPem;
                // Use the correct static Init method
                Payouts.Init({
                    env: process.env.NODE_ENV === 'production' ? 'PROD' : 'TEST',
                    clientId: this.providers.cashfree.credentials.clientId,
                    clientSecret: this.providers.cashfree.credentials.clientSecret,
                    ...(publicKey ? { publicKey } : {})
                });

                // Some SDK builds do not expose explicit Authorize; they auto-handle auth.
                try {
                    const authorize = Payouts.Authorize || Payouts.authorize;
                    if (authorize) {
                        await authorize();
                        console.log('✅ Cashfree SDK authorize succeeded');
                    } else {
                        console.log('ℹ️ Cashfree SDK authorize API not present, proceeding');
                    }
                } catch (e) {
                    console.warn('⚠️ Cashfree SDK authorize warning:', e?.response?.data || e?.message || e);
                }

                // SDK-only flow: Add beneficiary then request transfer using SDK methods
                const beneModule = Payouts.Beneficiary || Payouts.beneficiaries;
                const transfersModule = Payouts.Transfers || Payouts.transfers;

                const addBeneFn =
                    beneModule.AddBeneficiary || beneModule.addBeneficiary ||
                    beneModule.Add || beneModule.add;
                const reqTransferFn =
                    transfersModule.RequestTransfer || transfersModule.requestTransfer ||
                    transfersModule.Request || transfersModule.request;

                if (!addBeneFn || !reqTransferFn) {
                    throw new Error('cashfree-sdk required APIs not available (Beneficiary.AddBeneficiary / Transfers.RequestTransfer)');
                }

                // Create deterministic beneId similar to REST flow
                const hash = crypto.createHash('sha256')
                    .update(`${payoutRequest.recipient.bank_account.account_number}|${payoutRequest.recipient.bank_account.ifsc_code}|${payoutRequest.recipient.name}`)
                    .digest('hex')
                    .substring(0, 20);
                const beneId = `nivix_${hash}`;

                console.log(`🏦 [SDK] Adding beneficiary: ${beneId}`);
                try {
                    await addBeneFn.call(beneModule, {
                        beneId,
                        name: payoutRequest.recipient.name,
                        email: payoutRequest.recipient.email || 'test@nivix.com',
                        phone: payoutRequest.recipient.phone || '9000000001',
                        bankAccount: payoutRequest.recipient.bank_account.account_number,
                        ifsc: payoutRequest.recipient.bank_account.ifsc_code,
                        address1: payoutRequest.recipient.address || 'India'
                    });
                } catch (e) {
                    const msg = (e && (e.response?.data?.message || e.message)) || '';
                    if (/already exists/i.test(msg)) {
                        console.log(`✅ [SDK] Beneficiary exists, proceeding`);
                    } else {
                        throw e;
                    }
                }

                console.log('🔁 [SDK] Requesting transfer...');
                const sdkTransferRes = await reqTransferFn.call(transfersModule, {
                    beneId,
                    transferId: payoutId,
                    amount: String(parseFloat(payoutRequest.amount).toFixed(2)),
                    transferMode: 'banktransfer',
                    remarks: `Nivix off-ramp payout: ${payoutRequest.burn_transaction_hash?.substring(0, 16) || 'N/A'}`
                });

                return {
                    success: true,
                    transaction_id: payoutId,
                    status: 'INITIATED',
                    message: 'Payout initiated via Cashfree SDK',
                    provider_response: sdkTransferRes,
                    estimated_arrival: 'Within 2-4 hours'
                };
            }
            
            // Simulation mode - DISABLED as requested
            /*
            if (process.env.TESTING_MODE === 'true') {
                console.log('🧪 TESTING MODE: Simulating Cashfree payout...');
                
                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const simulatedResponse = {
                    success: true,
                    transaction_id: `CF_TEST_${payoutId}`,
                    status: 'SUCCESS',
                    message: 'Payout initiated via Cashfree (SIMULATED)',
                    fees: 5.00,
                    estimated_arrival: 'Within 2-4 hours (TEST MODE)',
                    provider_response: {
                        status: 'SUCCESS',
                        message: 'Test payout processed successfully',
                        data: {
                            transferId: `CF_TEST_${payoutId}`,
                            status: 'SUCCESS',
                            charges: 5.00
                        }
                    },
                    error: null
                };
                
                console.log('✅ Simulated Cashfree payout successful:', JSON.stringify(simulatedResponse, null, 2));
                return simulatedResponse;
            }
            */
            
            // Real Cashfree v1 API call - authentication works with v1
            console.log(`💰 Processing Cashfree v1 payout with working authentication...`);
            console.log(`🔍 Using Cashfree v1 endpoint: ${this.providers.cashfree.baseUrl}`);

            // Step 1: Prepare beneficiary details per Cashfree v1 documentation
            const beneDetails = {
                name: payoutRequest.recipient.name,
                email: payoutRequest.recipient.email || 'test@nivix.com',
                phone: payoutRequest.recipient.phone || '9876543210',
                bankAccount: payoutRequest.recipient.bank_account.account_number,
                ifsc: payoutRequest.recipient.bank_account.ifsc_code,
                address1: payoutRequest.recipient.address || 'India'
            };
            
            console.log('🔍 Prepared beneficiary details:', JSON.stringify(beneDetails, null, 2));
            
            // Step 2: Get auth token for v1 API
            const bearerToken = await this.getCashfreeAuthToken();

            // Step 3: Compute deterministic beneId immediately and ensure beneficiary in background (non-blocking)
            const hash = crypto.createHash('sha256')
                .update(`${beneDetails.bankAccount}|${beneDetails.ifsc}|${beneDetails.name}`)
                .digest('hex')
                .substring(0, 20);
            const beneId = `nivix_${hash}`;
            if (process.env.CASHFREE_CREATE_BENEFICIARY_BG !== 'false') {
                (async () => {
                    try {
                        await this.ensureCashfreeBeneficiary(beneDetails, bearerToken);
                        console.log(`ℹ️ Beneficiary ensured in background: ${beneId}`);
                    } catch (e) {
                        console.warn('⚠️ Background ensure beneficiary failed:', e.message);
                    }
                })();
            }

            // Step 5: Create Cashgram using official API format
            console.log(`🚀 Creating Cashfree Cashgram using official API format...`);

            let transferResponse;
            try {
                // Use exact URL format from official documentation
                const cashgramUrl = `${this.providers.cashfree.baseUrl}/payout/v1/createCashgram`;
                console.log(`Creating Cashgram via: ${cashgramUrl}`);

                // Format date as YYYY/M/D (no padding) as per working format
                const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                const linkExpiry = `${expiryDate.getFullYear()}/${expiryDate.getMonth() + 1}/${expiryDate.getDate()}`;

                const amountForCashgram = Number.parseFloat(payoutRequest.amount || 0).toFixed(2);
                const cashgramData = {
                    cashgramId: `cf${Date.now()}`, // Use format from docs: cf6
                    amount: amountForCashgram, // Ensure decimal format: "1.00"
                    name: beneDetails.name,
                    email: beneDetails.email,
                    phone: beneDetails.phone,
                    linkExpiry: linkExpiry, // Format: "2025/9/15" (no padding)
                    remarks: "Nivix crypto to fiat payout", // Simple, valid remarks
                    notifyCustomer: 1 // Send to customer
                };

                console.log('Cashgram payload (official format):', JSON.stringify(cashgramData, null, 2));

                transferResponse = await axios.post(cashgramUrl, cashgramData, {
                    headers: {
                        'Accept': '*/*',
                        'Authorization': `Bearer ${bearerToken}`,
                        'Content-Type': 'application/json'
                    },
                        timeout: 30000
                });
                console.log('✅ Cashgram created successfully!');

            } catch (error) {
                const status = error.response?.status;
                const errorData = error.response?.data;
                console.log(`❌ Cashfree Cashgram creation failed with status ${status}:`, JSON.stringify(errorData, null, 2));

                // Handle specific Cashgram API errors
                if (status === 403) {
                    throw new Error(`Cashfree authentication failed: ${errorData?.message || 'Invalid credentials or token'}. Please check your Client ID and Client Secret.`);
                }

                if (status === 400) {
                    throw new Error(`Cashfree API validation error: ${errorData?.message || 'Invalid request format'}`);
                }

                if (status === 401) {
                    throw new Error(`Cashfree unauthorized: ${errorData?.message || 'Invalid or expired token'}`);
                }

                    throw error;
            }
            
            console.log('✅ Cashfree Cashgram response status:', transferResponse.status);
            console.log('✅ Cashfree Cashgram response data:', JSON.stringify(transferResponse.data, null, 2));
            
            // Step 6: Process Cashgram response according to official docs
            const responseData = transferResponse.data;
            
            // Handle Cashgram API response - check for SUCCESS status and subCode 200
            if (responseData.status !== 'SUCCESS' || responseData.subCode !== '200') {
                    const errorMessage = responseData.message || 'Unknown Cashfree error';
                    const errorCode = responseData.subCode || 'N/A';
                throw new Error(`Cashfree Cashgram Error: ${errorMessage} (Code: ${errorCode})`);
            }
            
            // Extract data from successful response
            const cashgramInfo = responseData.data || {};
            
            return {
                success: true,
                transaction_id: cashgramInfo.referenceId ? `CG_${cashgramInfo.referenceId}` : payoutId,
                status: 'SUCCESS',
                message: 'Cashgram created successfully via Cashfree',
                fees: 0, // Cashgram typically has no fees for the sender
                estimated_arrival: 'Instant (Cashgram link sent to customer)',
                provider_response: responseData,
                cashgram_link: cashgramInfo.cashgramLink,
                reference_id: cashgramInfo.referenceId,
                error: null
            };
            
        } catch (error) {
            console.error('❌ Cashfree payout failed:', error.response?.data || error.message);
            console.error('❌ Full error response:', JSON.stringify(error.response, null, 2));
            
            // No simulation mode - use real Cashfree API only
            
            // Enrich error with IP if IP-not-whitelisted
            const msg = error.response?.data?.message || error.message || '';
            const ipMatch = msg.match(/current ip is\s+([0-9.]+)/i);
            const ipText = ipMatch ? ` (Server IP: ${ipMatch[1]} - whitelist this in Cashfree)` : '';
            return {
                success: false,
                error: `${msg}${ipText}`.trim(),
                status: 'failed',
                provider_response: error.response?.data
            };
        }
    }


    /**
     * Process internal transfer via Cashfree
     * For transferring funds between Cashfree accounts
     */
    async processCashfreeInternalTransfer(payoutRequest, payoutId) {
        try {
            console.log('🔄 Processing Cashfree internal transfer...');
            
            // Get Cashfree auth token
            const authToken = await this.getCashfreeAuthToken();
            
            // Internal transfer request format
            const transferData = {
                transferId: payoutId,
                amount: payoutRequest.amount,
                remarks: `Nivix internal transfer for token burn: ${payoutRequest.burn_transaction_hash?.substring(0, 16) || 'N/A'}`
            };
            
            const response = await axios.post(
                `${this.providers.cashfree.baseUrl}/internalTransfer`,
                transferData,
                {
                    headers: {
                        'Authorization': `Bearer ${authToken}`,
                        'Content-Type': 'application/json',
                        'X-Client-Id': this.providers.cashfree.credentials.clientId,
                        'X-Client-Secret': this.providers.cashfree.credentials.clientSecret
                    }
                }
            );
            
            console.log('✅ Cashfree internal transfer response:', response.data);
            
            return {
                success: true,
                transaction_id: response.data.data?.transferId || payoutId,
                status: response.data.status || 'SUCCESS',
                message: 'Internal transfer completed via Cashfree',
                provider_response: response.data
            };
            
        } catch (error) {
            console.error('❌ Cashfree internal transfer failed:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message,
                status: 'failed'
            };
        }
    }

    /**
     * Process payout via PayU Payouts API
     */
    async processPayUPayout(payoutRequest, payoutId) {
        try {
            console.log('💳 Processing PayU payout...');
            
            // PayU payout implementation
            const payoutData = {
                merchantId: this.providers.payu.credentials.merchantId,
                amount: payoutRequest.amount,
                currency: payoutRequest.currency,
                beneficiaryName: payoutRequest.recipient.name,
                beneficiaryAccount: payoutRequest.recipient.bank_account.account_number,
                beneficiaryIFSC: payoutRequest.recipient.bank_account.ifsc_code,
                transferId: payoutId,
                purpose: 'payout'
            };
            
            // Generate PayU hash
            const hash = this.generatePayUHash(payoutData);
            payoutData.hash = hash;
            
            const payuUrl = `${this.providers.payu.baseUrl}/payout`;
            console.log('🔗 PayU URL:', payuUrl);
            const response = await axios.post(
                payuUrl,
                payoutData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.providers.payu.credentials.apiKey}`
                    }
                }
            );
            
            return {
                success: true,
                transaction_id: response.data.transactionId,
                status: response.data.status,
                message: 'Payout initiated via PayU',
                provider_response: response.data
            };
            
        } catch (error) {
            console.error('❌ PayU payout failed:', error.message);
              if (error.code === 'ENOTFOUND' || /getaddrinfo ENOTFOUND/i.test(error.message || '')) {
                  console.error('❌ DNS resolution failed for PayU host:', this.providers.payu.baseUrl);
              }
            return {
                success: false,
                error: error.message,
                status: 'failed'
            };
        }
    }

    /**
     * Validate payout request
     */
    validatePayoutRequest(request) {
        console.log('🔍 DEBUG: Validating payout request:', JSON.stringify(request, null, 2));
        
        const required = ['amount', 'currency', 'recipient'];
        
        for (const field of required) {
            if (!request[field]) {
                return { valid: false, error: `Missing required field: ${field}` };
            }
        }
        
        console.log('🔍 DEBUG: Recipient structure:', JSON.stringify(request.recipient, null, 2));
        
        // Validate recipient details - check multiple possible name fields
        const recipientName = request.recipient.name || 
                             request.recipient.accountName ||
                             request.recipient.account_holder_name ||
                             request.recipient.bank_account?.account_holder_name;
        
        if (!recipientName) {
            console.log('❌ No recipient name found in any expected fields');
            return { valid: false, error: 'Recipient name is required (checked name, accountName, account_holder_name, bank_account.account_holder_name)' };
        }
        
        console.log('✅ Recipient name found:', recipientName);
        
        if (!request.recipient.bank_account) {
            return { valid: false, error: 'Recipient bank account is required' };
        }
        
        const bankAccount = request.recipient.bank_account;

        // Debug bank account validation
        console.log('🔍 DEBUG: Bank account validation:', {
            account_number: bankAccount.account_number,
            ifsc_code: bankAccount.ifsc_code,
            account_holder_name: bankAccount.account_holder_name,
            has_account_number: !!bankAccount.account_number,
            has_ifsc_code: !!bankAccount.ifsc_code,
            has_account_holder_name: !!bankAccount.account_holder_name
        });

        if (!bankAccount.account_number || !bankAccount.ifsc_code || !bankAccount.account_holder_name) {
            console.log('❌ Bank account validation failed:', {
                missing_account_number: !bankAccount.account_number,
                missing_ifsc_code: !bankAccount.ifsc_code,
                missing_account_holder_name: !bankAccount.account_holder_name
            });
            return { valid: false, error: 'Complete bank account details are required' };
        }
        
        // Validate amount
        if (request.amount <= 0 || request.amount > 200000) {
            return { valid: false, error: 'Amount must be between ₹1 and ₹2,00,000' };
        }
        
        return { valid: true };
    }

    /**
     * Select optimal payout provider based on amount and availability
     */
    selectOptimalProvider(payoutRequest) {
        console.log('🔍 Selecting payout provider...');
        console.log('🔍 RazorpayX enabled:', this.providers.razorpayx.enabled);
        console.log('🔍 RazorpayX has keyId:', !!this.providers.razorpayx.credentials.keyId);
        console.log('🔍 RazorpayX has accountNumber:', !!this.providers.razorpayx.credentials.accountNumber);
        console.log('🔍 Instamojo enabled:', this.providers.instamojo.enabled);
        console.log('🔍 Cashfree enabled:', this.providers.cashfree.enabled, '(DISABLED - Using RazorpayX)');
        console.log('🔍 PayU enabled:', this.providers.payu.enabled);
        
        // Priority order: RazorpayX > Cashfree > Instamojo > PayU
        // FORCE RazorpayX if credentials are available
        if (this.providers.razorpayx.enabled && 
            this.providers.razorpayx.credentials.keyId &&
            this.providers.razorpayx.credentials.accountNumber) {
            console.log('✅ Selected RazorpayX as payout provider (PRIMARY)');
            return 'razorpayx';
        }
        
        // Cashfree is disabled - skip it
        if (false && this.providers.cashfree.enabled && this.providers.cashfree.credentials.clientId) {
            console.log('✅ Selected Cashfree as payout provider');
            return 'cashfree';
        }
        
        if (this.providers.instamojo.enabled && this.providers.instamojo.credentials.clientId) {
            console.log('✅ Selected Instamojo as payout provider');
            return 'instamojo';
        }
        
        if (this.providers.payu.enabled && this.providers.payu.credentials.merchantId) {
            console.log('✅ Selected PayU as payout provider');
            return 'payu';
        }
        
        console.log('❌ No payout provider available');
        throw new Error('No payout provider available. Please configure RazorpayX, Cashfree, PayU, or Instamojo payout credentials.');
    }

    /**
     * Get payout mode based on amount
     */
    getPayoutMode(amount) {
        if (amount <= 100000) { // Up to ₹1 lakh
            return 'IMPS'; // Instant
        } else {
            return 'NEFT'; // Next business day
        }
    }

    /**
     * Get estimated arrival time
     */
    getEstimatedArrival(mode) {
        switch (mode) {
            case 'IMPS':
            case 'UPI':
                return 'Within 30 minutes';
            case 'NEFT':
                return 'Within 2 hours';
            case 'RTGS':
                return 'Within 30 minutes';
            default:
                return 'Within 24 hours';
        }
    }

    /**
     * Generate unique payout ID
     */
    generatePayoutId() {
        return `payout_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    /**
     * Generate PayU hash
     */
    generatePayUHash(data) {
        // PayU hash generation logic
        const hashString = `${data.merchantId}|${data.transferId}|${data.amount}|${this.providers.payu.credentials.apiKey}`;
        return crypto.createHash('sha512').update(hashString).digest('hex');
    }

    /**
     * Get Cashgram status using official API
     * https://www.cashfree.com/docs/payouts/cashgram/integration/cashgram-integration
     */
    async getCashgramStatus(cashgramId) {
        try {
            const bearerToken = await this.getCashfreeAuthToken();
            const statusUrl = `${this.providers.cashfree.baseUrl}/payout/v1/getCashgramStatus?cashgramId=${cashgramId}`;
            
            console.log(`🔍 Getting Cashgram status for: ${cashgramId}`);
            
            const response = await axios.get(statusUrl, {
                headers: {
                    'Accept': '*/*',
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });
            
            console.log('Cashgram status response:', JSON.stringify(response.data, null, 2));
            
            if (response.data?.status === 'SUCCESS' && response.data?.subCode === '200') {
                return {
                    success: true,
                    cashgram_status: response.data.data?.cashgramStatus,
                    reference_id: response.data.data?.referenceId,
                    cashgram_link: response.data.data?.cashgramLink,
                    data: response.data.data
                };
            }
            
            return {
                success: false,
                error: response.data?.message || 'Failed to get Cashgram status'
            };
            
        } catch (error) {
            console.error('❌ Failed to get Cashgram status:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * Get payout status
     */
    async getPayoutStatus(payoutId) {
        const record = this.payoutHistory.get(payoutId);
        if (!record) {
            return { found: false, error: 'Payout not found' };
        }
        
        // If it's a Cashgram, get real-time status
        if (record.provider === 'cashfree' && record.result?.transaction_id?.startsWith('CG_')) {
            const cashgramId = payoutId; // Use original payout ID as cashgram ID
            const cashgramStatus = await this.getCashgramStatus(cashgramId);
            
            if (cashgramStatus.success) {
                return {
                    found: true,
                    payout_id: payoutId,
                    status: cashgramStatus.cashgram_status,
                    provider: record.provider,
                    amount: record.request.amount,
                    currency: record.request.currency,
                    recipient: record.request.recipient.name,
                    cashgram_link: cashgramStatus.cashgram_link,
                    reference_id: cashgramStatus.reference_id,
                    created_at: record.created_at,
                    updated_at: record.updated_at
                };
            }
        }
        
        // Fallback to stored record
        return {
            found: true,
            payout_id: payoutId,
            status: record.status,
            provider: record.provider,
            amount: record.request.amount,
            currency: record.request.currency,
            recipient: record.request.recipient.name,
            created_at: record.created_at,
            updated_at: record.updated_at
        };
    }

    /**
     * Get payout statistics
     */
    getPayoutStats() {
        const payouts = Array.from(this.payoutHistory.values());
        
        return {
            total_payouts: payouts.length,
            successful_payouts: payouts.filter(p => p.status === 'completed').length,
            failed_payouts: payouts.filter(p => p.status === 'failed').length,
            total_amount: payouts.reduce((sum, p) => sum + p.request.amount, 0),
            providers_used: [...new Set(payouts.map(p => p.provider))],
            success_rate: payouts.length > 0 ? (payouts.filter(p => p.status === 'completed').length / payouts.length * 100).toFixed(2) + '%' : '0%'
        };
    }
}

module.exports = FiatPayoutService;
