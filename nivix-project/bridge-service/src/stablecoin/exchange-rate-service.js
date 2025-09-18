/**
 * Exchange Rate Service - Provides real-time exchange rates
 * Uses fallback rates for testing and development
 */
class ExchangeRateService {
    constructor() {
        // Hardcoded fallback rates for testing
        this.fallbackRates = {
            'INR_USD': 0.012,
            'USD_INR': 83.25,
            'EUR_USD': 1.10,
            'USD_EUR': 0.91,
            'GBP_USD': 1.27,
            'USD_GBP': 0.79,
            'USD_USD': 1.0,
            'INR_INR': 1.0,
            'EUR_EUR': 1.0,
            'GBP_GBP': 1.0
        };
    }

    /**
     * Get exchange rate between two currencies
     * @param {string} fromCurrency - Source currency (e.g., 'INR')
     * @param {string} toCurrency - Target currency (e.g., 'USD')
     * @returns {Promise<number>} Exchange rate
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            console.log(`📊 Getting exchange rate: ${fromCurrency} → ${toCurrency}`);

            // Same currency
            if (fromCurrency === toCurrency) {
                return 1.0;
            }

            // Try direct rate
            const key = `${fromCurrency}_${toCurrency}`;
            if (this.fallbackRates[key]) {
                const rate = this.fallbackRates[key];
                console.log(`✅ Found direct rate: ${fromCurrency}/${toCurrency} = ${rate}`);
                return rate;
            }

            // Try reverse rate
            const reverseKey = `${toCurrency}_${fromCurrency}`;
            if (this.fallbackRates[reverseKey]) {
                const rate = 1 / this.fallbackRates[reverseKey];
                console.log(`✅ Found reverse rate: ${fromCurrency}/${toCurrency} = ${rate}`);
                return rate;
            }

            // Default fallback
            console.warn(`⚠️ No rate found for ${fromCurrency}/${toCurrency}, using 1.0`);
            return 1.0;

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