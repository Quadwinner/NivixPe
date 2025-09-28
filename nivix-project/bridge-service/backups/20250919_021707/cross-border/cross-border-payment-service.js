const { Connection, PublicKey, Transaction, Keypair } = require('@solana/web3.js');
const { 
    createTransferInstruction, 
    getAssociatedTokenAddress,
    createMintToInstruction,
    createBurnInstruction
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

class CrossBorderPaymentService {
    constructor() {
        this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        this.treasuryKeypair = null;
        this.mintAccounts = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Load treasury wallet
            const walletPath = path.join(__dirname, '../../wallet/bridge-wallet.json');
            const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf8'));
            this.treasuryKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));

            // Load mint accounts
            const mintAccountsPath = path.join(__dirname, '../../data/mint-accounts.json');
            this.mintAccounts = JSON.parse(fs.readFileSync(mintAccountsPath, 'utf8'));

            this.initialized = true;
            console.log('🌍 Cross-border payment service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize cross-border service:', error);
            throw error;
        }
    }

    /**
     * Process cross-border payment: User A → Pool → User B
     */
    async processCrossBorderPayment(senderAddress, recipientAddress, fromCurrency, toCurrency, amount) {
        try {
            if (!this.initialized) {
                await this.initialize();
            }

            console.log(`🌍 Processing cross-border payment:`);
            console.log(`   From: ${senderAddress} (${amount} ${fromCurrency})`);
            console.log(`   To: ${recipientAddress} (${toCurrency})`);

            // Step 1: Get exchange rate
            const exchangeRate = this.getExchangeRate(fromCurrency, toCurrency);
            const toAmount = amount * exchangeRate;

            console.log(`📊 Exchange rate: 1 ${fromCurrency} = ${exchangeRate} ${toCurrency}`);
            console.log(`💰 Amount out: ${toAmount} ${toCurrency}`);

            // Step 2: Create swap transaction
            const swapResult = await this.executePoolSwap(
                senderAddress,
                recipientAddress,
                fromCurrency,
                toCurrency,
                amount,
                toAmount
            );

            if (swapResult.success) {
                console.log('✅ Cross-border payment completed successfully');
                return {
                    success: true,
                    transactionHash: swapResult.transactionHash,
                    senderAddress,
                    recipientAddress,
                    fromAmount: amount,
                    toAmount: toAmount,
                    fromCurrency,
                    toCurrency,
                    exchangeRate
                };
            } else {
                throw new Error(swapResult.error);
            }

        } catch (error) {
            console.error('❌ Cross-border payment failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Execute pool swap: Transfer from sender to treasury, mint to recipient
     */
    async executePoolSwap(senderAddress, recipientAddress, fromCurrency, toCurrency, fromAmount, toAmount) {
        try {
            console.log(`🔄 Executing pool swap: ${fromAmount} ${fromCurrency} → ${toAmount} ${toCurrency}`);

            const senderPubkey = new PublicKey(senderAddress);
            const recipientPubkey = new PublicKey(recipientAddress);

            // Get mint addresses
            const fromMint = this.getMintAddress(fromCurrency);
            const toMint = this.getMintAddress(toCurrency);

            if (!fromMint || !toMint) {
                throw new Error(`Invalid currency pair: ${fromCurrency} → ${toCurrency}`);
            }

            // Get token accounts
            const senderFromAccount = await getAssociatedTokenAddress(fromMint, senderPubkey);
            const recipientToAccount = await getAssociatedTokenAddress(toMint, recipientPubkey);
            const treasuryFromAccount = await this.getTreasuryTokenAccount(fromCurrency);
            const treasuryToAccount = await this.getTreasuryTokenAccount(toCurrency);

            // Convert amounts to token units
            const fromAmountUnits = Math.floor(fromAmount * Math.pow(10, 6));
            const toAmountUnits = Math.floor(toAmount * Math.pow(10, 6));

            console.log(`💰 Swap amounts:`);
            console.log(`   From: ${fromAmountUnits} units (${fromAmount} ${fromCurrency})`);
            console.log(`   To: ${toAmountUnits} units (${toAmount} ${toCurrency})`);

            // Create transaction
            const transaction = new Transaction();

            // Step 1: Transfer from sender to treasury (sender pays)
            transaction.add(
                createTransferInstruction(
                    senderFromAccount,      // source
                    treasuryFromAccount,    // destination
                    senderPubkey,          // owner (sender)
                    fromAmountUnits        // amount
                )
            );

            // Step 2: Mint tokens to recipient (treasury mints)
            transaction.add(
                createMintToInstruction(
                    toMint,                // mint
                    recipientToAccount,    // destination
                    this.treasuryKeypair.publicKey, // mint authority
                    toAmountUnits          // amount
                )
            );

            // Get recent blockhash
            const { blockhash } = await this.connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.treasuryKeypair.publicKey;

            // Sign and send transaction
            const signature = await this.connection.sendTransaction(transaction, [this.treasuryKeypair], {
                skipPreflight: false,
                preflightCommitment: 'confirmed'
            });

            // Confirm transaction
            await this.connection.confirmTransaction(signature, 'confirmed');

            console.log(`✅ Pool swap completed: ${signature}`);

            return {
                success: true,
                transactionHash: signature,
                fromAmount: fromAmount,
                toAmount: toAmount
            };

        } catch (error) {
            console.error('❌ Pool swap failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get exchange rate between currencies
     */
    getExchangeRate(fromCurrency, toCurrency) {
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

    /**
     * Get mint address for currency
     */
    getMintAddress(currency) {
        const mintKey = `${currency.toLowerCase()}Mint`;
        return this.mintAccounts[mintKey] ? new PublicKey(this.mintAccounts[mintKey]) : null;
    }

    /**
     * Get treasury token account for currency
     */
    async getTreasuryTokenAccount(currency) {
        const tokenAccountKey = `${currency.toLowerCase()}TokenAccount`;
        const tokenAccountAddress = this.mintAccounts[tokenAccountKey];
        
        if (!tokenAccountAddress) {
            throw new Error(`No treasury token account found for ${currency}`);
        }

        return new PublicKey(tokenAccountAddress);
    }

    /**
     * Get cross-border payment history
     */
    async getPaymentHistory(userAddress) {
        // This would query the blockchain for payment transactions
        // For now, return mock data
        return {
            success: true,
            payments: [
                {
                    id: 'payment_001',
                    sender: userAddress,
                    recipient: 'recipient_address',
                    fromCurrency: 'USD',
                    toCurrency: 'INR',
                    fromAmount: 100,
                    toAmount: 8350,
                    exchangeRate: 83.5,
                    timestamp: new Date().toISOString(),
                    status: 'completed'
                }
            ]
        };
    }
}

module.exports = new CrossBorderPaymentService();
