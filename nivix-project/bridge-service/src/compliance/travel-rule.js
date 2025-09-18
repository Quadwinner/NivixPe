const crypto = require('crypto');

/**
 * Travel Rule Compliance Service
 * Implements FATF Travel Rule requirements for cross-border transactions
 */
class TravelRuleService {
    constructor() {
        this.thresholds = {
            // FATF recommended threshold (USD equivalent)
            international: 1000,
            domestic: 3000,
            // High-risk jurisdictions have lower thresholds
            high_risk: 500
        };
        
        this.requiredFields = {
            originator: [
                'name',
                'address', 
                'account_number',
                'date_of_birth',
                'place_of_birth',
                'customer_identification_number'
            ],
            beneficiary: [
                'name',
                'address',
                'account_number'
            ]
        };
        
        this.highRiskJurisdictions = [
            'AF', 'BY', 'MM', 'KP', 'IR', 'LY', 'ML', 'NI', 'PK', 'SO', 'SY', 'YE'
        ];
        
        this.travelRuleRecords = new Map();
        
        console.log('🛂 Travel Rule Service initialized');
    }

    /**
     * Check if transaction requires Travel Rule compliance
     * @param {Object} transaction - Transaction details
     * @returns {Object} Compliance requirement result
     */
    checkTravelRuleRequirement(transaction) {
        try {
            console.log(`🔍 Checking Travel Rule requirement for transaction: ${transaction.id || 'unknown'}`);
            
            const analysis = {
                transactionId: transaction.id,
                timestamp: new Date().toISOString(),
                amount: transaction.amount,
                currency: transaction.currency,
                originatorCountry: transaction.originatorCountry,
                beneficiaryCountry: transaction.beneficiaryCountry,
                isRequired: false,
                reason: '',
                threshold: 0,
                missingFields: [],
                riskLevel: 'low'
            };
            
            // Convert amount to USD for threshold comparison
            const usdAmount = this.convertToUSD(transaction.amount, transaction.currency);
            analysis.usdAmount = usdAmount;
            
            // Determine applicable threshold
            const applicableThreshold = this.getApplicableThreshold(
                transaction.originatorCountry,
                transaction.beneficiaryCountry
            );
            analysis.threshold = applicableThreshold;
            
            // Check if Travel Rule applies
            if (usdAmount >= applicableThreshold) {
                analysis.isRequired = true;
                analysis.reason = `Amount ${usdAmount} USD exceeds threshold ${applicableThreshold} USD`;
                
                // Check for high-risk jurisdictions
                if (this.isHighRiskJurisdiction(transaction.originatorCountry) || 
                    this.isHighRiskJurisdiction(transaction.beneficiaryCountry)) {
                    analysis.riskLevel = 'high';
                    analysis.reason += ' (high-risk jurisdiction involved)';
                }
                
                // Validate required information
                analysis.missingFields = this.validateTravelRuleData(transaction);
            } else {
                analysis.reason = `Amount ${usdAmount} USD below threshold ${applicableThreshold} USD`;
            }
            
            console.log(`🛂 Travel Rule analysis: ${analysis.isRequired ? 'REQUIRED' : 'NOT REQUIRED'} - ${analysis.reason}`);
            
            return analysis;
            
        } catch (error) {
            console.error('❌ Travel Rule check failed:', error);
            return {
                transactionId: transaction.id,
                timestamp: new Date().toISOString(),
                error: error.message,
                isRequired: true, // Err on the side of caution
                reason: 'Error during analysis - manual review required',
                riskLevel: 'unknown'
            };
        }
    }

    /**
     * Create Travel Rule message for compliant transaction
     * @param {Object} transaction - Transaction with complete data
     * @returns {Object} Travel Rule message
     */
    createTravelRuleMessage(transaction) {
        try {
            console.log(`📝 Creating Travel Rule message for transaction: ${transaction.id}`);
            
            const messageId = this.generateMessageId();
            
            const travelRuleMessage = {
                messageId,
                version: '1.0',
                timestamp: new Date().toISOString(),
                transaction: {
                    id: transaction.id,
                    amount: transaction.amount,
                    currency: transaction.currency,
                    usdAmount: this.convertToUSD(transaction.amount, transaction.currency),
                    date: transaction.date || new Date().toISOString(),
                    type: transaction.type || 'crypto_transfer'
                },
                originator: {
                    name: transaction.originator.name,
                    address: {
                        street: transaction.originator.address.street,
                        city: transaction.originator.address.city,
                        state: transaction.originator.address.state,
                        postal_code: transaction.originator.address.postal_code,
                        country: transaction.originator.address.country
                    },
                    account_number: transaction.originator.account_number || transaction.originator.wallet_address,
                    date_of_birth: transaction.originator.date_of_birth,
                    place_of_birth: transaction.originator.place_of_birth,
                    customer_id: transaction.originator.customer_identification_number,
                    vasp: {
                        name: 'Nivix Protocol',
                        registration_number: 'NIVIX-001',
                        jurisdiction: 'IN',
                        license_number: 'NIVIX-LICENSE-2025'
                    }
                },
                beneficiary: {
                    name: transaction.beneficiary.name,
                    address: {
                        street: transaction.beneficiary.address.street,
                        city: transaction.beneficiary.address.city,
                        state: transaction.beneficiary.address.state,
                        postal_code: transaction.beneficiary.address.postal_code,
                        country: transaction.beneficiary.address.country
                    },
                    account_number: transaction.beneficiary.account_number || transaction.beneficiary.wallet_address,
                    vasp: {
                        name: transaction.beneficiary.vasp_name || 'Unknown VASP',
                        registration_number: transaction.beneficiary.vasp_registration,
                        jurisdiction: transaction.beneficiary.vasp_jurisdiction
                    }
                },
                compliance: {
                    travel_rule_threshold: this.getApplicableThreshold(
                        transaction.originator.address.country,
                        transaction.beneficiary.address.country
                    ),
                    sanctions_screening: transaction.sanctions_screening || null,
                    aml_screening: transaction.aml_screening || null,
                    source_of_funds: transaction.source_of_funds || 'not_provided',
                    purpose_of_transaction: transaction.purpose || 'personal_transfer'
                },
                metadata: {
                    created_by: 'Nivix Travel Rule Service',
                    created_at: new Date().toISOString(),
                    format_version: 'FATF-TR-2025',
                    message_hash: null // Will be calculated
                }
            };
            
            // Calculate message hash for integrity
            travelRuleMessage.metadata.message_hash = this.calculateMessageHash(travelRuleMessage);
            
            // Store the message
            this.travelRuleRecords.set(messageId, travelRuleMessage);
            
            console.log(`✅ Travel Rule message created: ${messageId}`);
            
            return travelRuleMessage;
            
        } catch (error) {
            console.error('❌ Failed to create Travel Rule message:', error);
            throw new Error(`Travel Rule message creation failed: ${error.message}`);
        }
    }

    /**
     * Validate that transaction has all required Travel Rule data
     * @param {Object} transaction - Transaction to validate
     * @returns {Array} Array of missing required fields
     */
    validateTravelRuleData(transaction) {
        const missing = [];
        
        // Check originator fields
        if (!transaction.originator) {
            missing.push('originator');
        } else {
            for (const field of this.requiredFields.originator) {
                if (!this.hasNestedField(transaction.originator, field)) {
                    missing.push(`originator.${field}`);
                }
            }
        }
        
        // Check beneficiary fields
        if (!transaction.beneficiary) {
            missing.push('beneficiary');
        } else {
            for (const field of this.requiredFields.beneficiary) {
                if (!this.hasNestedField(transaction.beneficiary, field)) {
                    missing.push(`beneficiary.${field}`);
                }
            }
        }
        
        return missing;
    }

    /**
     * Check if nested field exists and has value
     */
    hasNestedField(obj, fieldPath) {
        const parts = fieldPath.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (!current || typeof current !== 'object' || !current[part]) {
                return false;
            }
            current = current[part];
        }
        
        return true;
    }

    /**
     * Get applicable Travel Rule threshold based on jurisdictions
     * @param {string} originatorCountry - ISO country code
     * @param {string} beneficiaryCountry - ISO country code
     * @returns {number} Applicable threshold in USD
     */
    getApplicableThreshold(originatorCountry, beneficiaryCountry) {
        // If either jurisdiction is high-risk, use lower threshold
        if (this.isHighRiskJurisdiction(originatorCountry) || 
            this.isHighRiskJurisdiction(beneficiaryCountry)) {
            return this.thresholds.high_risk;
        }
        
        // If both countries are the same, use domestic threshold
        if (originatorCountry === beneficiaryCountry) {
            return this.thresholds.domestic;
        }
        
        // Cross-border transaction
        return this.thresholds.international;
    }

    /**
     * Check if jurisdiction is considered high-risk
     * @param {string} countryCode - ISO country code
     * @returns {boolean} True if high-risk
     */
    isHighRiskJurisdiction(countryCode) {
        return this.highRiskJurisdictions.includes(countryCode?.toUpperCase());
    }

    /**
     * Convert amount to USD equivalent (simplified)
     * In production, use real-time exchange rates
     * @param {number} amount - Amount to convert
     * @param {string} currency - Source currency
     * @returns {number} USD equivalent
     */
    convertToUSD(amount, currency) {
        const exchangeRates = {
            'USD': 1.0,
            'EUR': 1.10,
            'GBP': 1.27,
            'INR': 0.012,
            'JPY': 0.0067,
            'CAD': 0.74,
            'AUD': 0.66
        };
        
        const rate = exchangeRates[currency?.toUpperCase()] || 1.0;
        return parseFloat((amount * rate).toFixed(2));
    }

    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `tr_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    }

    /**
     * Calculate message hash for integrity verification
     */
    calculateMessageHash(message) {
        // Remove the hash field itself from calculation
        const messageForHash = { ...message };
        delete messageForHash.metadata.message_hash;
        
        const messageString = JSON.stringify(messageForHash, Object.keys(messageForHash).sort());
        return crypto.createHash('sha256').update(messageString).digest('hex');
    }

    /**
     * Verify Travel Rule message integrity
     * @param {Object} message - Travel Rule message to verify
     * @returns {boolean} True if message is valid
     */
    verifyMessageIntegrity(message) {
        if (!message.metadata.message_hash) {
            return false;
        }
        
        const originalHash = message.metadata.message_hash;
        const calculatedHash = this.calculateMessageHash(message);
        
        return originalHash === calculatedHash;
    }

    /**
     * Submit Travel Rule message to beneficiary VASP
     * @param {string} messageId - Travel Rule message ID
     * @param {string} beneficiaryVASP - Beneficiary VASP endpoint
     * @returns {Object} Submission result
     */
    async submitTravelRuleMessage(messageId, beneficiaryVASP) {
        try {
            console.log(`📤 Submitting Travel Rule message ${messageId} to ${beneficiaryVASP}`);
            
            const message = this.travelRuleRecords.get(messageId);
            if (!message) {
                throw new Error(`Travel Rule message not found: ${messageId}`);
            }
            
            // In production, implement actual VASP-to-VASP communication
            // This could use protocols like OpenVASP, TRP, or direct API
            
            // For now, simulate successful submission
            const submissionResult = {
                messageId,
                beneficiaryVASP,
                status: 'submitted',
                timestamp: new Date().toISOString(),
                confirmation_id: `conf_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
                response: {
                    accepted: true,
                    message: 'Travel Rule message accepted by beneficiary VASP'
                }
            };
            
            // Update message with submission status
            message.submission = submissionResult;
            this.travelRuleRecords.set(messageId, message);
            
            console.log(`✅ Travel Rule message submitted successfully: ${submissionResult.confirmation_id}`);
            
            return submissionResult;
            
        } catch (error) {
            console.error('❌ Travel Rule submission failed:', error);
            return {
                messageId,
                status: 'failed',
                timestamp: new Date().toISOString(),
                error: error.message
            };
        }
    }

    /**
     * Get Travel Rule message by ID
     * @param {string} messageId - Message ID
     * @returns {Object} Travel Rule message
     */
    getTravelRuleMessage(messageId) {
        return this.travelRuleRecords.get(messageId);
    }

    /**
     * Get all Travel Rule messages for audit
     * @param {Object} filters - Optional filters
     * @returns {Array} Array of Travel Rule messages
     */
    getTravelRuleMessages(filters = {}) {
        let messages = Array.from(this.travelRuleRecords.values());
        
        // Apply filters
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            messages = messages.filter(msg => new Date(msg.timestamp) >= startDate);
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            messages = messages.filter(msg => new Date(msg.timestamp) <= endDate);
        }
        
        if (filters.country) {
            messages = messages.filter(msg => 
                msg.originator.address.country === filters.country ||
                msg.beneficiary.address.country === filters.country
            );
        }
        
        if (filters.minAmount) {
            messages = messages.filter(msg => msg.transaction.usdAmount >= filters.minAmount);
        }
        
        // Sort by timestamp (newest first)
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return messages;
    }

    /**
     * Get Travel Rule compliance statistics
     */
    getComplianceStats() {
        const messages = Array.from(this.travelRuleRecords.values());
        
        const stats = {
            total_messages: messages.length,
            by_status: {},
            by_country: {},
            by_risk_level: {},
            total_volume_usd: 0,
            average_amount_usd: 0,
            thresholds: this.thresholds,
            high_risk_jurisdictions: this.highRiskJurisdictions.length
        };
        
        for (const message of messages) {
            // Status stats
            const status = message.submission?.status || 'pending';
            stats.by_status[status] = (stats.by_status[status] || 0) + 1;
            
            // Country stats
            const originatorCountry = message.originator.address.country;
            const beneficiaryCountry = message.beneficiary.address.country;
            
            stats.by_country[originatorCountry] = (stats.by_country[originatorCountry] || 0) + 1;
            if (originatorCountry !== beneficiaryCountry) {
                stats.by_country[beneficiaryCountry] = (stats.by_country[beneficiaryCountry] || 0) + 1;
            }
            
            // Volume stats
            stats.total_volume_usd += message.transaction.usdAmount;
        }
        
        if (messages.length > 0) {
            stats.average_amount_usd = stats.total_volume_usd / messages.length;
        }
        
        return stats;
    }

    /**
     * Export Travel Rule data for regulatory reporting
     * @param {Object} options - Export options
     * @returns {Object} Export data
     */
    exportComplianceData(options = {}) {
        const messages = this.getTravelRuleMessages(options.filters || {});
        
        return {
            export_id: `export_${Date.now()}`,
            generated_at: new Date().toISOString(),
            period: {
                start: options.filters?.startDate || null,
                end: options.filters?.endDate || null
            },
            total_records: messages.length,
            format_version: 'FATF-TR-2025',
            messages: messages.map(msg => ({
                message_id: msg.messageId,
                transaction_id: msg.transaction.id,
                timestamp: msg.timestamp,
                amount_usd: msg.transaction.usdAmount,
                originator_country: msg.originator.address.country,
                beneficiary_country: msg.beneficiary.address.country,
                status: msg.submission?.status || 'pending',
                hash: msg.metadata.message_hash
            }))
        };
    }
}

module.exports = TravelRuleService;




