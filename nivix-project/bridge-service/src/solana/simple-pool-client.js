const { Connection, PublicKey, Transaction, TransactionInstruction } = require('@solana/web3.js');
const { 
    createTransferInstruction, 
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
} = require('@solana/spl-token');
const fs = require('fs').promises;
const path = require('path');

class SimplePoolClient {
    constructor() {
        this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        this.treasuryKeypair = null;
        this.mintAccounts = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing Simple Pool Client...');
            
            // Load treasury keypair
            const keypairPath = path.join(__dirname, '../../wallet/bridge-wallet.json');
            const keypairData = await fs.readFile(keypairPath, 'utf8');
            this.treasuryKeypair = JSON.parse(keypairData);
            this.treasuryKeypair.publicKey = new PublicKey(this.treasuryKeypair.publicKey);
            
            // Load mint accounts
            const mintAccountsPath = path.join(__dirname, '../../data/mint-accounts.json');
            const mintData = await fs.readFile(mintAccountsPath, 'utf8');
            this.mintAccounts = JSON.parse(mintData);
            
            this.initialized = true;
            console.log('✅ Simple Pool Client initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Simple Pool Client:', error);
            throw error;
        }
    }

    /**
     * Get mint address for currency
     */
    getMintAddress(currency) {
        const mintMap = {
            'USD': this.mintAccounts.usdMint,
            'EUR': this.mintAccounts.eurMint,
            'INR': this.mintAccounts.inrMint,
            'GBP': this.mintAccounts.gbpMint,
            'JPY': this.mintAccounts.jpyMint,
            'CAD': this.mintAccounts.cadMint,
            'AUD': this.mintAccounts.audMint
        };
        
        return mintMap[currency.toUpperCase()];
    }

    /**
     * Get treasury token account for currency
     */
    async getTreasuryTokenAccount(currency) {
        const mintAddress = this.getMintAddress(currency);
        if (!mintAddress) {
            throw new Error(`No mint address found for currency: ${currency}`);
        }
        
        const mintPubkey = new PublicKey(mintAddress);
        return await getAssociatedTokenAddress(mintPubkey, this.treasuryKeypair.publicKey);
    }

    /**
     * Get user token account for currency
     */
    async getUserTokenAccount(userAddress, currency) {
        const mintAddress = this.getMintAddress(currency);
        if (!mintAddress) {
            throw new Error(`No mint address found for currency: ${currency}`);
        }
        
        const mintPubkey = new PublicKey(mintAddress);
        const userPubkey = new PublicKey(userAddress);
        return await getAssociatedTokenAddress(mintPubkey, userPubkey);
    }

    /**
     * Perform a simple token swap using standard SPL Token instructions
     */
    async performSwap(userAddress, fromCurrency, toCurrency, amount, exchangeRate = 1.0, feeRate = 0.003) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log(`🔄 Performing simple swap: ${amount} ${fromCurrency} → ${toCurrency}`);
            console.log(`📊 Exchange rate: ${exchangeRate}, Fee rate: ${feeRate}`);

            const userPubkey = new PublicKey(userAddress);
            
            // Get mint addresses
            const fromMint = this.getMintAddress(fromCurrency);
            const toMint = this.getMintAddress(toCurrency);
            
            if (!fromMint || !toMint) {
                throw new Error(`Invalid currency pair: ${fromCurrency} → ${toCurrency}`);
            }

            // Get token accounts
            const userFromAccount = await this.getUserTokenAccount(userAddress, fromCurrency);
            const userToAccount = await this.getUserTokenAccount(userAddress, toCurrency);
            const treasuryFromAccount = await this.getTreasuryTokenAccount(fromCurrency);
            const treasuryToAccount = await this.getTreasuryTokenAccount(toCurrency);

            // Calculate amounts
            const fromAmount = Math.floor(parseFloat(amount) * Math.pow(10, 6)); // 6 decimals
            const feeAmount = Math.floor(fromAmount * feeRate);
            const netFromAmount = fromAmount - feeAmount;
            const toAmount = Math.floor(netFromAmount * exchangeRate);

            console.log(`💰 Swap details:`);
            console.log(`   From: ${fromAmount} units (${amount} ${fromCurrency})`);
            console.log(`   Fee: ${feeAmount} units`);
            console.log(`   Net: ${netFromAmount} units`);
            console.log(`   To: ${toAmount} units (${toAmount / Math.pow(10, 6)} ${toCurrency})`);

            // Create transaction
            const transaction = new Transaction();

            // Step 1: Transfer tokens from user to treasury (user pays)
            transaction.add(
                createTransferInstruction(
                    userFromAccount, // source
                    treasuryFromAccount, // destination
                    userPubkey, // owner
                    fromAmount // amount
                )
            );

            // Step 2: Transfer tokens from treasury to user (user receives)
            transaction.add(
                createTransferInstruction(
                    treasuryToAccount, // source
                    userToAccount, // destination
                    this.treasuryKeypair.publicKey, // owner (treasury)
                    toAmount // amount
                )
            );

            // Get recent blockhash
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.treasuryKeypair.publicKey;

            // Sign and send transaction
            transaction.sign(this.treasuryKeypair);
            const signature = await this.connection.sendTransaction(transaction, [this.treasuryKeypair]);

            console.log(`✅ Simple swap completed: ${signature}`);

            return {
                success: true,
                signature: signature,
                fromAmount: fromAmount,
                toAmount: toAmount,
                feeAmount: feeAmount,
                exchangeRate: exchangeRate,
                fromCurrency: fromCurrency,
                toCurrency: toCurrency
            };

        } catch (error) {
            console.error('❌ Simple swap failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get pool balance for a currency
     */
    async getPoolBalance(currency) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            const treasuryAccount = await this.getTreasuryTokenAccount(currency);
            const accountInfo = await this.connection.getTokenAccountBalance(treasuryAccount);
            
            return {
                currency: currency,
                balance: accountInfo.value.uiAmount || 0,
                rawBalance: accountInfo.value.amount,
                decimals: accountInfo.value.decimals
            };

        } catch (error) {
            console.error(`❌ Failed to get pool balance for ${currency}:`, error);
            return {
                currency: currency,
                balance: 0,
                rawBalance: '0',
                decimals: 6,
                error: error.message
            };
        }
    }

    /**
     * Get all pool balances
     */
    async getAllPoolBalances() {
        const currencies = ['USD', 'EUR', 'INR', 'GBP', 'JPY', 'CAD', 'AUD'];
        const balances = {};

        for (const currency of currencies) {
            balances[currency] = await this.getPoolBalance(currency);
        }

        return balances;
    }

    /**
     * Get exchange rate between two currencies
     */
    getExchangeRate(fromCurrency, toCurrency) {
        // Simple exchange rates (in production, this would come from an oracle)
        const rates = {
            'USD': { 'EUR': 0.91, 'INR': 83.5, 'GBP': 0.79, 'JPY': 150, 'CAD': 1.35, 'AUD': 1.52 },
            'EUR': { 'USD': 1.10, 'INR': 91.8, 'GBP': 0.87, 'JPY': 165, 'CAD': 1.48, 'AUD': 1.67 },
            'INR': { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0095, 'JPY': 1.8, 'CAD': 0.016, 'AUD': 0.018 },
            'GBP': { 'USD': 1.27, 'EUR': 1.15, 'INR': 105.4, 'JPY': 190, 'CAD': 1.71, 'AUD': 1.92 },
            'JPY': { 'USD': 0.0067, 'EUR': 0.0061, 'INR': 0.56, 'GBP': 0.0053, 'CAD': 0.009, 'AUD': 0.010 },
            'CAD': { 'USD': 0.74, 'EUR': 0.68, 'INR': 61.8, 'GBP': 0.58, 'JPY': 111, 'AUD': 1.13 },
            'AUD': { 'USD': 0.66, 'EUR': 0.60, 'INR': 55.3, 'GBP': 0.52, 'JPY': 99, 'CAD': 0.89 }
        };

        return rates[fromCurrency]?.[toCurrency] || 1.0;
    }
}

module.exports = new SimplePoolClient();
