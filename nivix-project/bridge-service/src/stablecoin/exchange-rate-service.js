const axios = require('axios');

/**
 * Exchange Rate Service - Provides real-time exchange rates
 * Uses real-time APIs with fallback rates for reliability
 */
class ExchangeRateService {
    constructor() {
        // Cache for exchange rates (5 minutes)
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        
        // Free API endpoints for real-time rates
        this.apiEndpoints = [
            'https://api.exchangerate-api.com/v4/latest/USD',
            'https://api.fixer.io/latest?access_key=free&base=USD',
            'https://api.currencylayer.com/live?access_key=free&currencies=INR,EUR,GBP,JPY,CAD,AUD'
        ];
        // Comprehensive fallback rates for all major currency pairs
        this.fallbackRates = {
            // USD pairs (base currency)
            'USD_INR': 83.5,
            'USD_EUR': 0.91,
            'USD_GBP': 0.79,
            'USD_JPY': 150.0,
            'USD_CAD': 1.35,
            'USD_AUD': 1.52,
            'USD_CHF': 0.88,
            'USD_CNY': 7.25,
            'USD_SGD': 1.35,
            'USD_HKD': 7.82,
            'USD_NZD': 1.62,
            'USD_SEK': 10.85,
            'USD_NOK': 10.95,
            'USD_DKK': 6.95,
            'USD_PLN': 4.05,
            'USD_CZK': 23.5,
            'USD_HUF': 365.0,
            'USD_RON': 4.65,
            'USD_BGN': 1.82,
            'USD_HRK': 6.95,
            'USD_RSD': 108.5,
            'USD_MXN': 17.25,
            'USD_BRL': 5.15,
            'USD_ARS': 850.0,
            'USD_CLP': 920.0,
            'USD_COP': 4100.0,
            'USD_PEN': 3.75,
            'USD_UYU': 39.5,
            'USD_VES': 36.5,
            'USD_ZAR': 18.5,
            'USD_EGP': 30.95,
            'USD_NGN': 1600.0,
            'USD_KES': 160.0,
            'USD_GHS': 12.5,
            'USD_MAD': 10.05,
            'USD_TND': 3.15,
            'USD_DZD': 134.5,
            'USD_LYD': 4.85,
            'USD_ETB': 55.5,
            'USD_UGX': 3700.0,
            'USD_TZS': 2500.0,
            'USD_RWF': 1300.0,
            'USD_BWP': 13.5,
            'USD_NAD': 18.5,
            'USD_ZWL': 6000.0,
            'USD_AED': 3.67,
            'USD_SAR': 3.75,
            'USD_QAR': 3.64,
            'USD_KWD': 0.31,
            'USD_BHD': 0.38,
            'USD_OMR': 0.38,
            'USD_JOD': 0.71,
            'USD_LBP': 15000.0,
            'USD_ILS': 3.65,
            'USD_TRY': 30.5,
            'USD_RUB': 95.5,
            'USD_UAH': 36.5,
            'USD_BYN': 3.25,
            'USD_KZT': 450.0,
            'USD_UZS': 12000.0,
            'USD_KGS': 89.5,
            'USD_TJS': 10.95,
            'USD_TMT': 3.5,
            'USD_AZN': 1.7,
            'USD_GEL': 2.65,
            'USD_AMD': 405.0,
            'USD_AED': 3.67,
            'USD_AFN': 70.5,
            'USD_PKR': 280.0,
            'USD_LKR': 325.0,
            'USD_BDT': 110.0,
            'USD_NPR': 133.5,
            'USD_BTN': 83.5,
            'USD_MVR': 15.4,
            'USD_IDR': 15500.0,
            'USD_MYR': 4.65,
            'USD_THB': 35.5,
            'USD_VND': 24000.0,
            'USD_PHP': 56.5,
            'USD_MMK': 2100.0,
            'USD_LAK': 20000.0,
            'USD_KHR': 4100.0,
            'USD_BND': 1.35,
            'USD_FJD': 2.25,
            'USD_PGK': 3.75,
            'USD_SBD': 8.4,
            'USD_VUV': 120.0,
            'USD_WST': 2.7,
            'USD_TOP': 2.35,
            'USD_NZD': 1.62,
            'USD_AUD': 1.52,
            'USD_KRW': 1350.0,
            'USD_JPY': 150.0,
            'USD_TWD': 31.5,
            'USD_MOP': 8.05,
            'USD_HKD': 7.82,
            'USD_CNY': 7.25,
            'USD_MNT': 3400.0,
            'USD_KPW': 900.0,
            'USD_TWD': 31.5,
            
            // Reverse rates (calculated from USD base)
            'INR_USD': 0.012,
            'EUR_USD': 1.10,
            'GBP_USD': 1.27,
            'JPY_USD': 0.0067,
            'CAD_USD': 0.74,
            'AUD_USD': 0.66,
            'CHF_USD': 1.14,
            'CNY_USD': 0.138,
            'SGD_USD': 0.74,
            'HKD_USD': 0.128,
            'NZD_USD': 0.62,
            'SEK_USD': 0.092,
            'NOK_USD': 0.091,
            'DKK_USD': 0.144,
            'PLN_USD': 0.247,
            'CZK_USD': 0.043,
            'HUF_USD': 0.0027,
            'RON_USD': 0.215,
            'BGN_USD': 0.55,
            'HRK_USD': 0.144,
            'RSD_USD': 0.0092,
            'MXN_USD': 0.058,
            'BRL_USD': 0.194,
            'ARS_USD': 0.0012,
            'CLP_USD': 0.0011,
            'COP_USD': 0.00024,
            'PEN_USD': 0.267,
            'UYU_USD': 0.025,
            'VES_USD': 0.027,
            'ZAR_USD': 0.054,
            'EGP_USD': 0.032,
            'NGN_USD': 0.00063,
            'KES_USD': 0.0063,
            'GHS_USD': 0.08,
            'MAD_USD': 0.099,
            'TND_USD': 0.317,
            'DZD_USD': 0.0074,
            'LYD_USD': 0.206,
            'ETB_USD': 0.018,
            'UGX_USD': 0.00027,
            'TZS_USD': 0.0004,
            'RWF_USD': 0.00077,
            'BWP_USD': 0.074,
            'NAD_USD': 0.054,
            'ZWL_USD': 0.00017,
            'AED_USD': 0.272,
            'SAR_USD': 0.267,
            'QAR_USD': 0.275,
            'KWD_USD': 3.23,
            'BHD_USD': 2.63,
            'OMR_USD': 2.63,
            'JOD_USD': 1.41,
            'LBP_USD': 0.000067,
            'ILS_USD': 0.274,
            'TRY_USD': 0.033,
            'RUB_USD': 0.010,
            'UAH_USD': 0.027,
            'BYN_USD': 0.308,
            'KZT_USD': 0.0022,
            'UZS_USD': 0.000083,
            'KGS_USD': 0.011,
            'TJS_USD': 0.091,
            'TMT_USD': 0.286,
            'AZN_USD': 0.588,
            'GEL_USD': 0.377,
            'AMD_USD': 0.0025,
            'AFN_USD': 0.014,
            'PKR_USD': 0.0036,
            'LKR_USD': 0.0031,
            'BDT_USD': 0.0091,
            'NPR_USD': 0.0075,
            'BTN_USD': 0.012,
            'MVR_USD': 0.065,
            'IDR_USD': 0.000065,
            'MYR_USD': 0.215,
            'THB_USD': 0.028,
            'VND_USD': 0.000042,
            'PHP_USD': 0.018,
            'MMK_USD': 0.00048,
            'LAK_USD': 0.00005,
            'KHR_USD': 0.00024,
            'BND_USD': 0.74,
            'FJD_USD': 0.444,
            'PGK_USD': 0.267,
            'SBD_USD': 0.119,
            'VUV_USD': 0.0083,
            'WST_USD': 0.37,
            'TOP_USD': 0.426,
            'KRW_USD': 0.00074,
            'TWD_USD': 0.032,
            'MOP_USD': 0.124,
            'MNT_USD': 0.00029,
            'KPW_USD': 0.0011,
            
            // Same currency rates
            'USD_USD': 1.0,
            'INR_INR': 1.0,
            'EUR_EUR': 1.0,
            'GBP_GBP': 1.0,
            'JPY_JPY': 1.0,
            'CAD_CAD': 1.0,
            'AUD_AUD': 1.0,
            'CHF_CHF': 1.0,
            'CNY_CNY': 1.0,
            'SGD_SGD': 1.0,
            'HKD_HKD': 1.0,
            'NZD_NZD': 1.0,
            'SEK_SEK': 1.0,
            'NOK_NOK': 1.0,
            'DKK_DKK': 1.0,
            'PLN_PLN': 1.0,
            'CZK_CZK': 1.0,
            'HUF_HUF': 1.0,
            'RON_RON': 1.0,
            'BGN_BGN': 1.0,
            'HRK_HRK': 1.0,
            'RSD_RSD': 1.0,
            'MXN_MXN': 1.0,
            'BRL_BRL': 1.0,
            'ARS_ARS': 1.0,
            'CLP_CLP': 1.0,
            'COP_COP': 1.0,
            'PEN_PEN': 1.0,
            'UYU_UYU': 1.0,
            'VES_VES': 1.0,
            'ZAR_ZAR': 1.0,
            'EGP_EGP': 1.0,
            'NGN_NGN': 1.0,
            'KES_KES': 1.0,
            'GHS_GHS': 1.0,
            'MAD_MAD': 1.0,
            'TND_TND': 1.0,
            'DZD_DZD': 1.0,
            'LYD_LYD': 1.0,
            'ETB_ETB': 1.0,
            'UGX_UGX': 1.0,
            'TZS_TZS': 1.0,
            'RWF_RWF': 1.0,
            'BWP_BWP': 1.0,
            'NAD_NAD': 1.0,
            'ZWL_ZWL': 1.0,
            'AED_AED': 1.0,
            'SAR_SAR': 1.0,
            'QAR_QAR': 1.0,
            'KWD_KWD': 1.0,
            'BHD_BHD': 1.0,
            'OMR_OMR': 1.0,
            'JOD_JOD': 1.0,
            'LBP_LBP': 1.0,
            'ILS_ILS': 1.0,
            'TRY_TRY': 1.0,
            'RUB_RUB': 1.0,
            'UAH_UAH': 1.0,
            'BYN_BYN': 1.0,
            'KZT_KZT': 1.0,
            'UZS_UZS': 1.0,
            'KGS_KGS': 1.0,
            'TJS_TJS': 1.0,
            'TMT_TMT': 1.0,
            'AZN_AZN': 1.0,
            'GEL_GEL': 1.0,
            'AMD_AMD': 1.0,
            'AFN_AFN': 1.0,
            'PKR_PKR': 1.0,
            'LKR_LKR': 1.0,
            'BDT_BDT': 1.0,
            'NPR_NPR': 1.0,
            'BTN_BTN': 1.0,
            'MVR_MVR': 1.0,
            'IDR_IDR': 1.0,
            'MYR_MYR': 1.0,
            'THB_THB': 1.0,
            'VND_VND': 1.0,
            'PHP_PHP': 1.0,
            'MMK_MMK': 1.0,
            'LAK_LAK': 1.0,
            'KHR_KHR': 1.0,
            'BND_BND': 1.0,
            'FJD_FJD': 1.0,
            'PGK_PGK': 1.0,
            'SBD_SBD': 1.0,
            'VUV_VUV': 1.0,
            'WST_WST': 1.0,
            'TOP_TOP': 1.0,
            'KRW_KRW': 1.0,
            'TWD_TWD': 1.0,
            'MOP_MOP': 1.0,
            'MNT_MNT': 1.0,
            'KPW_KPW': 1.0
        };
    }

    /**
     * Get exchange rate between two currencies
     * @param {string} fromCurrency - Source currency (e.g., 'INR')
     * @param {string} toCurrency - Target currency (e.g., 'USD')
     * @returns {Promise<number>} Exchange rate
     */
    /**
     * Get real-time exchange rate from API
     */
    async getRealTimeRate(fromCurrency, toCurrency) {
        try {
            // Try multiple free APIs
            for (const endpoint of this.apiEndpoints) {
                try {
                    console.log(`🌐 Fetching real-time rate from: ${endpoint}`);
                    const response = await axios.get(endpoint, { timeout: 5000 });
                    
                    if (response.data && response.data.rates) {
                        const rates = response.data.rates;
                        
                        // Check if we have both currencies
                        if (rates[fromCurrency] && rates[toCurrency]) {
                            const rate = rates[toCurrency] / rates[fromCurrency];
                            console.log(`✅ Real-time rate: ${fromCurrency}/${toCurrency} = ${rate}`);
                            return rate;
                        }
                    }
                } catch (error) {
                    console.warn(`⚠️ API failed: ${endpoint}`, error.message);
                    continue;
                }
            }
            
            return null;
        } catch (error) {
            console.error('❌ All real-time APIs failed:', error);
            return null;
        }
    }

    getFallbackRate(normalizedFrom, normalizedTo) {
        const key = `${normalizedFrom}_${normalizedTo}`;
        if (this.fallbackRates[key]) {
            return this.fallbackRates[key];
        }
        const reverseKey = `${normalizedTo}_${normalizedFrom}`;
        if (this.fallbackRates[reverseKey]) {
            return 1 / this.fallbackRates[reverseKey];
        }
        const fromToUsd = this.fallbackRates[`${normalizedFrom}_USD`];
        const usdToTo = this.fallbackRates[`USD_${normalizedTo}`];
        if (fromToUsd && usdToTo) {
            return fromToUsd * usdToTo;
        }
        const usdToFrom = this.fallbackRates[`USD_${normalizedFrom}`];
        const toToUsd = this.fallbackRates[`${normalizedTo}_USD`];
        if (usdToFrom && toToUsd) {
            return (1 / usdToFrom) * (1 / toToUsd);
        }
        if (fromToUsd && toToUsd) {
            return fromToUsd / toToUsd;
        }
        if (usdToFrom && usdToTo) {
            return usdToTo / usdToFrom;
        }
        console.warn(`⚠️ No rate found for ${normalizedFrom}/${normalizedTo}, using 1.0`);
        return 1.0;
    }

    /**
     * Get exchange rate with real-time data and fallback
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            console.log(`📊 Getting exchange rate: ${fromCurrency} → ${toCurrency}`);

            // Normalize currency codes (USDC = USD)
            const normalizedFrom = fromCurrency === 'USDC' ? 'USD' : fromCurrency;
            const normalizedTo = toCurrency === 'USDC' ? 'USD' : toCurrency;

            // Same currency
            if (normalizedFrom === normalizedTo) {
                return 1.0;
            }

            // Check cache first
            const cacheKey = `${normalizedFrom}_${normalizedTo}`;
            const cached = this.cache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`📊 Using cached rate: ${fromCurrency}/${toCurrency} = ${cached.rate}`);
                return cached.rate;
            }

            // Try to get real-time rate
            let rate = await this.getRealTimeRate(normalizedFrom, normalizedTo);
            
            if (!rate) {
                console.log(`⚠️ Real-time API failed, using fallback rates`);
                rate = this.getFallbackRate(normalizedFrom, normalizedTo);
            }

            // Cache the rate
            this.cache.set(cacheKey, {
                rate: rate,
                timestamp: Date.now()
            });

            console.log(`✅ Final rate: ${fromCurrency}/${toCurrency} = ${rate}`);
            return rate;

        } catch (error) {
            console.error(`❌ Exchange rate error for ${fromCurrency}/${toCurrency}:`, error);
            throw new Error(`Failed to get exchange rate for ${fromCurrency}/${toCurrency}`);
        }
    }

    /**
     * Get multiple exchange rates at once
     * @param {Array} pairs - Array of {from, to} currency pairs
     * @returns {Promise<Object>} Object with rates
     */
    async getMultipleRates(pairs) {
        try {
            const rates = {};
            
            for (const pair of pairs) {
                const key = `${pair.from}_${pair.to}`;
                rates[key] = await this.getExchangeRate(pair.from, pair.to);
            }

            return rates;
        } catch (error) {
            console.error('❌ Failed to get multiple rates:', error);
            throw error;
        }
    }

    /**
     * Check if a currency pair is supported
     * @param {string} fromCurrency 
     * @param {string} toCurrency 
     * @returns {boolean}
     */
    isSupported(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) return true;
        
        const key = `${fromCurrency}_${toCurrency}`;
        const reverseKey = `${toCurrency}_${fromCurrency}`;
        
        return !!(this.fallbackRates[key] || this.fallbackRates[reverseKey]);
    }

    /**
     * Get list of supported currencies
     * @returns {Array<string>}
     */
    getSupportedCurrencies() {
        const currencies = new Set();
        
        Object.keys(this.fallbackRates).forEach(key => {
            const [from, to] = key.split('_');
            currencies.add(from);
            currencies.add(to);
        });

        return Array.from(currencies);
    }
}

module.exports = ExchangeRateService;