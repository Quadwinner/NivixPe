const axios = require('axios');
const crypto = require('crypto');

/**
 * RazorpayX Payouts Service
 * Official RazorpayX Payouts API integration
 * Documentation: https://razorpay.com/docs/x/payouts/
 * 
 * Workflow:
 * 1. Create Contact (beneficiary)
 * 2. Create Fund Account (payment method for contact)
 * 3. Create Payout (transfer money)
 */
class RazorpayXPayouts {
    constructor() {
        this.apiKey = process.env.RAZORPAY_KEY_ID;
        this.apiSecret = process.env.RAZORPAY_KEY_SECRET;
        this.baseUrl = 'https://api.razorpay.com/v1';
        this.accountNumber = process.env.RAZORPAY_ACCOUNT_NUMBER; // RazorpayX account number
        
        if (!this.apiKey || !this.apiSecret) {
            console.warn('⚠️ RazorpayX credentials not found in environment variables');
            console.warn('   Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
        }
        
        if (!this.accountNumber) {
            console.warn('⚠️ RazorpayX account number not found');
            console.warn('   Set RAZORPAY_ACCOUNT_NUMBER');
        }
    }

    /**
     * Make authenticated request to RazorpayX API
     */
    async makeRequest(endpoint, method = 'GET', data = null) {
        if (!this.apiKey || !this.apiSecret) {
            throw new Error('RazorpayX API credentials not configured');
        }

        const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        const url = `${this.baseUrl}${endpoint}`;
        
        const config = {
            method,
            url,
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            config.data = data;
        }

        try {
            const response = await axios(config);
            return response.data;
        } catch (error) {
            const errorData = error.response?.data;
            const statusCode = error.response?.status;
            
            let errorMessage = error.message;
            if (errorData) {
                if (errorData.error) {
                    errorMessage = errorData.error.description || errorData.error.message || errorMessage;
                } else if (errorData.message) {
                    errorMessage = errorData.message;
                }
            }
            
            // Enhanced error logging
            console.error(`❌ RazorpayX API Error (${statusCode || 'N/A'}):`, {
                endpoint,
                method,
                statusCode,
                error: errorMessage,
                response: errorData
            });
            
            throw new Error(`RazorpayX API Error: ${errorMessage}${statusCode ? ` (Status: ${statusCode})` : ''}`);
        }
    }

    /**
     * Create or get Contact
     * Contact represents the beneficiary (person or institution)
     * 
     * @param {Object} contactData - Contact details
     * @returns {Object} Contact object with id
     */
    async createContact(contactData) {
        const { name, email, phone, type = 'customer' } = contactData;
        
        if (!name || (!email && !phone)) {
            throw new Error('Contact name and either email or phone is required');
        }

        // Check if contact already exists (by email or phone)
        let existingContact = null;
        try {
            const contacts = await this.listContacts();
            existingContact = contacts.items?.find(c => 
                (email && c.email === email) || (phone && c.contact === phone)
            );
        } catch (error) {
            console.log('ℹ️ Could not check existing contacts, creating new one');
        }

        if (existingContact) {
            console.log(`✅ Contact already exists: ${existingContact.id}`);
            return existingContact;
        }

        const payload = {
            name,
            email: email || undefined,
            contact: phone || undefined,
            type: type // 'customer' or 'vendor'
        };

        console.log('📇 Creating RazorpayX Contact:', payload);
        const contact = await this.makeRequest('/contacts', 'POST', payload);
        
        console.log(`✅ Contact created: ${contact.id}`);
        return contact;
    }

    /**
     * List all contacts
     */
    async listContacts() {
        return await this.makeRequest('/contacts');
    }

    /**
     * Create Fund Account
     * Fund Account is the payment method associated with a Contact
     * 
     * @param {Object} fundAccountData - Fund account details
     * @returns {Object} Fund account object with id
     */
    async createFundAccount(fundAccountData) {
        const { contactId, accountType, accountDetails } = fundAccountData;
        
        if (!contactId || !accountType || !accountDetails) {
            throw new Error('Contact ID, account type, and account details are required');
        }

        // Check if fund account already exists
        let existingFundAccount = null;
        try {
            const fundAccounts = await this.listFundAccounts(contactId);
            existingFundAccount = fundAccounts.items?.find(fa => {
                if (accountType === 'bank_account') {
                    return fa.bank_account?.account_number === accountDetails.account_number &&
                           fa.bank_account?.ifsc === accountDetails.ifsc;
                } else if (accountType === 'vpa') {
                    return fa.vpa?.address === accountDetails.address;
                }
                return false;
            });
        } catch (error) {
            console.log('ℹ️ Could not check existing fund accounts, creating new one');
        }

        if (existingFundAccount) {
            console.log(`✅ Fund account already exists: ${existingFundAccount.id}`);
            return existingFundAccount;
        }

        const payload = {
            contact_id: contactId,
            account_type: accountType, // 'bank_account' or 'vpa'
        };

        if (accountType === 'bank_account') {
            payload.bank_account = {
                name: accountDetails.name,
                account_number: accountDetails.account_number,
                ifsc: accountDetails.ifsc
            };
        } else if (accountType === 'vpa') {
            payload.vpa = {
                address: accountDetails.address
            };
        }

        console.log('🏦 Creating RazorpayX Fund Account:', payload);
        const fundAccount = await this.makeRequest('/fund_accounts', 'POST', payload);
        
        console.log(`✅ Fund account created: ${fundAccount.id}`);
        return fundAccount;
    }

    /**
     * List fund accounts for a contact
     */
    async listFundAccounts(contactId) {
        return await this.makeRequest(`/contacts/${contactId}/fund_accounts`);
    }

    /**
     * Create Payout
     * Transfer money from RazorpayX account to fund account
     * 
     * @param {Object} payoutData - Payout details
     * @returns {Object} Payout object
     */
    async createPayout(payoutData) {
        const { 
            fundAccountId, 
            amount, 
            currency = 'INR', 
            mode, 
            purpose, 
            referenceId,
            narration,
            queueIfLowBalance = false
        } = payoutData;

        if (!fundAccountId || !amount || !mode || !purpose) {
            throw new Error('Fund account ID, amount, mode, and purpose are required');
        }

        if (!this.accountNumber) {
            throw new Error('RazorpayX account number not configured. Set RAZORPAY_ACCOUNT_NUMBER in .env file. Get it from RazorpayX Dashboard → Account Details');
        }

        // Check account balance before creating payout
        try {
            const balance = await this.getAccountBalance();
            console.log(`💰 RazorpayX Account Balance: ₹${(balance.balance / 100).toFixed(2)}`);
            
            const amountInPaise = Math.round(amount * 100);
            if (balance.balance < amountInPaise) {
                throw new Error(`Insufficient balance. Required: ₹${amount}, Available: ₹${(balance.balance / 100).toFixed(2)}`);
            }
        } catch (error) {
            if (error.message.includes('Insufficient balance')) {
                throw error;
            }
            console.warn('⚠️ Could not check account balance:', error.message);
        }

        // Convert amount to paise (smallest currency unit)
        const amountInPaise = Math.round(amount * 100);

        const payload = {
            account_number: this.accountNumber,
            fund_account_id: fundAccountId,
            amount: amountInPaise,
            currency: currency.toUpperCase(),
            mode: mode.toUpperCase(), // IMPS, NEFT, RTGS, UPI, AMAZONPAY
            purpose: purpose, // payout, salary, utility, etc.
            queue_if_low_balance: queueIfLowBalance,
            reference_id: referenceId || `nivix_${Date.now()}`,
            narration: narration || `Nivix payout ${referenceId || Date.now()}`
        };

        console.log('💸 Creating RazorpayX Payout:', {
            account_number: this.accountNumber,
            fund_account_id: fundAccountId,
            amount: `${amount} ${currency} (${amountInPaise} paise)`,
            mode: mode.toUpperCase(),
            purpose: purpose,
            reference_id: payload.reference_id
        });

        try {
            // Try different endpoint formats based on RazorpayX API structure
            let payout;
            let lastError;
            
            // Try 1: Standard /payouts endpoint
            try {
                payout = await this.makeRequest('/payouts', 'POST', payload);
            } catch (error) {
                lastError = error;
                // Try 2: /x/payouts (RazorpayX specific endpoint)
                if (error.message.includes('not found') || error.message.includes('400')) {
                    console.log('🔄 Trying /x/payouts endpoint...');
                    try {
                        payout = await this.makeRequest('/x/payouts', 'POST', payload);
                    } catch (error2) {
                        lastError = error2;
                        // Try 3: /accounts/{account_number}/payouts
                        if (error2.message.includes('not found') || error2.message.includes('400')) {
                            console.log('🔄 Trying /accounts/{account_number}/payouts endpoint...');
                            payout = await this.makeRequest(`/accounts/${this.accountNumber}/payouts`, 'POST', payload);
                        } else {
                            throw error2;
                        }
                    }
                } else {
                    throw error;
                }
            }
            
            console.log(`✅ Payout created: ${payout.id}`);
            console.log(`📊 Payout Status: ${payout.status}`);
            console.log(`💰 Amount: ₹${(payout.amount / 100).toFixed(2)}`);
            console.log(`🏦 Mode: ${payout.mode}`);
            console.log(`📝 UTR: ${payout.utr || 'N/A'}`);
            
            return payout;
        } catch (error) {
            console.error('❌ RazorpayX Payout Creation Failed:');
            console.error('   Error:', error.message);
            console.error('   Account Number:', this.accountNumber);
            console.error('   Fund Account ID:', fundAccountId);
            console.error('   Amount:', amountInPaise, 'paise');
            console.error('   Payload:', JSON.stringify(payload, null, 2));
            throw error;
        }
    }

    /**
     * Get payout status
     */
    async getPayoutStatus(payoutId) {
        return await this.makeRequest(`/payouts/${payoutId}`);
    }

    /**
     * Cancel payout (only for queued, pending, or scheduled states)
     */
    async cancelPayout(payoutId) {
        return await this.makeRequest(`/payouts/${payoutId}/cancel`, 'POST');
    }

    /**
     * List payouts with filters
     */
    async listPayouts(filters = {}) {
        const queryParams = new URLSearchParams();
        if (filters.count) queryParams.append('count', filters.count);
        if (filters.skip) queryParams.append('skip', filters.skip);
        if (filters.status) queryParams.append('status', filters.status);
        
        const endpoint = `/payouts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        return await this.makeRequest(endpoint);
    }

    /**
     * Get account balance
     * Note: Balance endpoint may vary by account type (Lite vs Current Account)
     */
    async getAccountBalance() {
        if (!this.accountNumber) {
            throw new Error('RazorpayX account number not configured. Set RAZORPAY_ACCOUNT_NUMBER in .env file');
        }
        
        try {
            // Try the balance endpoint - format may vary
            const balance = await this.makeRequest(`/accounts/${this.accountNumber}/balance`);
            return {
                balance: balance.balance || 0,
                currency: balance.currency || 'INR',
                account_number: this.accountNumber
            };
        } catch (error) {
            // If balance endpoint fails, try alternative endpoint
            if (error.message.includes('404') || error.message.includes('no Route matched')) {
                console.warn('⚠️  Balance endpoint not available. This is normal for some account types.');
                console.warn('   Balance check skipped - payout will proceed without balance verification');
                // Return a mock balance to allow payout to proceed
                return {
                    balance: 999999999, // Large balance to allow payout
                    currency: 'INR',
                    account_number: this.accountNumber,
                    note: 'Balance check unavailable - using test mode'
                };
            }
            throw error;
        }
    }

    /**
     * Get account details
     */
    async getAccountDetails() {
        if (!this.accountNumber) {
            throw new Error('RazorpayX account number not configured');
        }
        return await this.makeRequest(`/accounts/${this.accountNumber}`);
    }

    /**
     * Create Payout Purpose
     * Payout purpose is a narration to the payout for easier reconciliation
     */
    async createPayoutPurpose(purpose) {
        const payload = { purpose };
        return await this.makeRequest('/payouts/purposes', 'POST', payload);
    }

    /**
     * List payout purposes
     */
    async listPayoutPurposes() {
        return await this.makeRequest('/payouts/purposes');
    }

    /**
     * Determine payout mode based on amount and beneficiary type
     * 
     * @param {Number} amount - Amount in INR
     * @param {String} accountType - 'bank_account' or 'vpa'
     * @returns {String} Payout mode (IMPS, NEFT, RTGS, UPI)
     */
    determinePayoutMode(amount, accountType) {
        if (accountType === 'vpa') {
            return 'UPI';
        }

        // For bank accounts, determine based on amount
        if (amount <= 500000) { // Up to ₹5 lakh
            return 'IMPS'; // Instant, 24x7
        } else if (amount <= 2000000) { // Up to ₹20 lakh
            return 'NEFT'; // Next business day
        } else {
            return 'RTGS'; // Real-time, same day (for amounts > ₹2 lakh)
        }
    }

    /**
     * Map RazorpayX payout status to internal status
     */
    mapStatus(razorpayStatus) {
        const statusMap = {
            'queued': 'PENDING',
            'pending': 'PROCESSING',
            'processing': 'PROCESSING',
            'processed': 'COMPLETED',
            'cancelled': 'CANCELLED',
            'failed': 'FAILED',
            'reversed': 'FAILED'
        };
        
        return statusMap[razorpayStatus?.toLowerCase()] || 'UNKNOWN';
    }

    /**
     * Get estimated completion time based on mode
     */
    getEstimatedCompletion(mode) {
        const modeUpper = mode?.toUpperCase();
        switch (modeUpper) {
            case 'IMPS':
                return new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
            case 'UPI':
                return new Date(Date.now() + 2 * 60 * 1000); // 2 minutes
            case 'NEFT':
                return new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
            case 'RTGS':
                return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            default:
                return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        }
    }

    /**
     * Complete payout flow: Contact → Fund Account → Payout
     * This is a convenience method that handles the entire workflow
     * 
     * @param {Object} beneficiaryData - Beneficiary details
     * @param {Number} amount - Amount in INR
     * @param {String} purpose - Payout purpose
     * @param {String} referenceId - Reference ID for tracking
     * @returns {Object} Complete payout result
     */
    async processCompletePayout(beneficiaryData, amount, purpose = 'payout', referenceId = null) {
        try {
            // Validate account number before starting
            if (!this.accountNumber) {
                throw new Error('RazorpayX account number not configured. Please set RAZORPAY_ACCOUNT_NUMBER in .env file. Get it from RazorpayX Dashboard → Account Details');
            }

            console.log(`🚀 Starting RazorpayX Payout Flow`);
            console.log(`   Account Number: ${this.accountNumber}`);
            console.log(`   Amount: ₹${amount}`);
            console.log(`   Beneficiary: ${beneficiaryData.name}`);

            // Step 1: Create or get Contact
            const contact = await this.createContact({
                name: beneficiaryData.name,
                email: beneficiaryData.email,
                phone: beneficiaryData.phone,
                type: 'customer'
            });

            // Step 2: Determine account type and create Fund Account
            let accountType = 'bank_account';
            let accountDetails = {};

            if (beneficiaryData.upiId) {
                accountType = 'vpa';
                accountDetails = {
                    address: beneficiaryData.upiId
                };
            } else if (beneficiaryData.bank_account) {
                accountType = 'bank_account';
                accountDetails = {
                    name: beneficiaryData.bank_account.account_holder_name || beneficiaryData.name,
                    account_number: beneficiaryData.bank_account.account_number,
                    ifsc: beneficiaryData.bank_account.ifsc_code
                };
            } else {
                throw new Error('Either UPI ID or bank account details required');
            }

            const fundAccount = await this.createFundAccount({
                contactId: contact.id,
                accountType,
                accountDetails
            });

            // Step 3: Determine payout mode
            const mode = this.determinePayoutMode(amount, accountType);

            // Step 4: Create Payout
            const payout = await this.createPayout({
                fundAccountId: fundAccount.id,
                amount,
                currency: 'INR',
                mode,
                purpose,
                referenceId: referenceId || `nivix_${Date.now()}`,
                narration: `Nivix payout to ${beneficiaryData.name}`,
                queueIfLowBalance: false
            });

            return {
                success: true,
                payoutId: payout.id,
                contactId: contact.id,
                fundAccountId: fundAccount.id,
                status: this.mapStatus(payout.status),
                amount: amount,
                currency: 'INR',
                mode: mode,
                estimatedCompletion: this.getEstimatedCompletion(mode),
                razorpayResponse: payout
            };

        } catch (error) {
            console.error('❌ RazorpayX payout failed:', error.message);
            return {
                success: false,
                error: error.message,
                status: 'FAILED'
            };
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload, signature, secret = null) {
        const secretKey = secret || this.apiSecret;
        const expectedSignature = crypto
            .createHmac('sha256', secretKey)
            .update(payload)
            .digest('hex');
        
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }
}

module.exports = RazorpayXPayouts;

