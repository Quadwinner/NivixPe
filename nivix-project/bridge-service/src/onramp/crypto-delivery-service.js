const { Connection, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const { Token, TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } = require('@solana/spl-token');
const fs = require('fs');

/**
 * Crypto Delivery Service for On-ramp
 * Handles minting/transferring crypto to users after successful fiat payment
 */
class CryptoDeliveryService {
    constructor() {
        this.connection = null;
        this.treasuryKeypair = null;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Initialize Solana connection
            const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
            this.connection = new Connection(rpcUrl, 'confirmed');
            console.log('🔗 Connected to Solana:', rpcUrl);

            // Load treasury keypair
            await this.loadTreasuryKeypair();
            
            this.initialized = true;
            console.log('🚀 Crypto Delivery Service initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Crypto Delivery Service:', error.message);
            throw error;
        }
    }

    /**
     * Deliver crypto to user after successful payment by MINTING new tokens
     */
    async deliverCrypto(deliveryData) {
        try {
            if (!this.initialized) {
                throw new Error('Crypto Delivery Service not initialized');
            }

            const {
                userAddress,     // Recipient Solana address
                tokenMint,       // Token mint address
                amount,          // Amount to mint (in token units)
                orderId          // Order ID for tracking
            } = deliveryData;

            console.log('🪙 Minting crypto tokens to user:', {
                userAddress,
                tokenMint,
                amount,
                orderId
            });

            // Convert addresses to PublicKey objects
            const recipientPubkey = new PublicKey(userAddress);
            const mintPubkey = new PublicKey(tokenMint);

            // Get or create associated token account for recipient
            const recipientTokenAccount = await getAssociatedTokenAddress(
                mintPubkey,
                recipientPubkey
            );

            // Check if recipient token account exists
            const recipientAccountInfo = await this.connection.getAccountInfo(recipientTokenAccount);
            
            // Create transaction
            const transaction = new Transaction();

            // Add create account instruction if needed
            if (!recipientAccountInfo) {
                console.log('📝 Creating associated token account for recipient');
                const createAccountInstruction = createAssociatedTokenAccountInstruction(
                    this.treasuryKeypair.publicKey, // payer (treasury pays for account creation)
                    recipientTokenAccount,           // associated token account
                    recipientPubkey,                // owner
                    mintPubkey                      // mint
                );
                transaction.add(createAccountInstruction);
            }

            // Add mint instruction (MINT NEW TOKENS - not transfer from treasury)
            const mintAmount = Math.floor(parseFloat(amount) * Math.pow(10, 6)); // Assuming 6 decimals
            console.log('🪙 Minting amount (with decimals):', mintAmount);

            const mintInstruction = createMintToInstruction(
                mintPubkey,                      // mint
                recipientTokenAccount,           // destination (recipient's token account)
                this.treasuryKeypair.publicKey, // mint authority (treasury is mint authority)
                mintAmount                      // amount
            );
            transaction.add(mintInstruction);

            // Send transaction
            console.log('📡 Sending mint transaction...');
            const signature = await sendAndConfirmTransaction(
                this.connection,
                transaction,
                [this.treasuryKeypair],
                { commitment: 'confirmed' }
            );

            console.log('✅ Crypto tokens minted successfully!');
            console.log('📝 Transaction signature:', signature);

            return {
                success: true,
                transactionSignature: signature,
                recipientTokenAccount: recipientTokenAccount.toString(),
                amount: mintAmount,
                orderId: orderId,
                operation: 'mint' // Indicates this was a minting operation
            };

        } catch (error) {
            console.error('❌ Failed to mint crypto tokens:', error.message);
            return {
                success: false,
                error: error.message,
                orderId: deliveryData.orderId
            };
        }
    }

    /**
     * Check if minting is feasible (mint authority check)
     */
    async checkDeliveryFeasibility(tokenMint, amount) {
        try {
            console.log('🔍 DEBUG: Checking mint feasibility for token:', tokenMint);
            const mintPubkey = new PublicKey(tokenMint);
            const requestedAmount = Math.floor(parseFloat(amount) * Math.pow(10, 6));

            // Check if the bridge wallet has mint authority
            const mintInfo = await this.connection.getParsedAccountInfo(mintPubkey);
            if (!mintInfo.value) {
                return {
                    success: false,
                    sufficient: false,
                    error: 'Token mint does not exist'
                };
            }

            const mintData = mintInfo.value.data.parsed.info;
            const mintAuthority = mintData.mintAuthority;

            console.log('🪙 Mint authority check:', {
                tokenMint: tokenMint,
                mintAuthority: mintAuthority,
                bridgeWallet: this.treasuryKeypair.publicKey.toString(),
                hasMintAuthority: mintAuthority === this.treasuryKeypair.publicKey.toString()
            });

            const hasMintAuthority = mintAuthority === this.treasuryKeypair.publicKey.toString();

            if (!hasMintAuthority) {
                return {
                    success: false,
                    sufficient: false,
                    error: `Bridge wallet does not have mint authority for token ${tokenMint}`
                };
            }

            // For minting, we don't need existing balance - we create new tokens
            return {
                success: true,
                sufficient: true, // We can mint as much as needed
                canMint: true, // Bridge wallet can mint new tokens
                requestedAmount: requestedAmount,
                balance: 'unlimited' // Minting doesn't depend on existing balance
            };

        } catch (error) {
            console.error('❌ Failed to check mint feasibility:', error.message);
            return {
                success: false,
                sufficient: false,
                error: error.message,
                requestedAmount: Math.floor(parseFloat(amount) * Math.pow(10, 6)),
                balance: 0
            };
        }
    }

    /**
     * Deliver tokens by minting to user's wallet
     */
    async deliverTokens(userAddress, tokenMint, amount, orderId) {
        try {
            console.log(`🪙 Starting real token minting for order: ${orderId}`);
            console.log(`📤 Minting ${amount} tokens of ${tokenMint} to ${userAddress}`);
            
            const userPubkey = new PublicKey(userAddress);
            const mintPubkey = new PublicKey(tokenMint);
            
            // Get or create associated token account for user
            const userTokenAccount = await getAssociatedTokenAddress(
                mintPubkey,
                userPubkey
            );

            console.log(`📍 User token account: ${userTokenAccount.toString()}`);

            // Check if token account exists
            const accountInfo = await this.connection.getAccountInfo(userTokenAccount);
            let instructions = [];

            if (!accountInfo) {
                console.log('🔧 Creating associated token account for user');
                instructions.push(
                    createAssociatedTokenAccountInstruction(
                        this.treasuryKeypair.publicKey, // payer
                        userTokenAccount, // associated token account
                        userPubkey, // owner
                        mintPubkey // mint
                    )
                );
            }

            // Convert amount to token units (6 decimals)
            const tokenAmount = Math.floor(parseFloat(amount) * Math.pow(10, 6));
            console.log(`💰 Minting ${tokenAmount} token units (${amount} tokens)`);

            // Add mint instruction
            instructions.push(
                createMintToInstruction(
                    mintPubkey, // mint
                    userTokenAccount, // destination
                    this.treasuryKeypair.publicKey, // mint authority
                    tokenAmount // amount
                )
            );

            // Create and send transaction
            const transaction = new Transaction().add(...instructions);
            
            // Get latest blockhash with lastValidBlockHeight for robust confirmation
            const { blockhash, lastValidBlockHeight } = await this.connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = this.treasuryKeypair.publicKey;
            
            // Sign transaction
            transaction.sign(this.treasuryKeypair);
            
            // Send transaction
            console.log('📡 Sending token mint transaction...');
            const signature = await this.connection.sendRawTransaction(transaction.serialize(), {
                skipPreflight: false,
                maxRetries: 5
            });
            
            // Robust confirmation with context and retry loop (up to ~60s)
            console.log(`⏳ Confirming transaction: ${signature}`);
            const start = Date.now();
            const timeoutMs = 60_000;
            let confirmed = false;
            while (Date.now() - start < timeoutMs) {
                try {
                    const status = await this.connection.confirmTransaction(
                        { signature, blockhash, lastValidBlockHeight },
                        'confirmed'
                    );
                    if (status && status.value && (status.value.err === null)) {
                        confirmed = true;
                        break;
                    }
                } catch (_) {}
                await new Promise(r => setTimeout(r, 2000));
            }
            
            if (!confirmed) {
                throw new Error(`Transaction was not confirmed in ${(timeoutMs/1000).toFixed(0)} seconds. Check signature ${signature} on Solana Explorer.`);
            }

            console.log(`✅ Token minting successful! Transaction: ${signature}`);

            return {
                success: true,
                transactionHash: signature,
                transactionSignature: signature, // Add this for consistency with onramp engine
                amount: amount,
                recipient: userAddress,
                userAddress: userAddress, // Add this for consistency
                cryptoAmount: amount, // Add this for consistency
                cryptoCurrency: 'USD', // Assume USD for now
                tokenMint: tokenMint,
                tokenAccount: userTokenAccount.toString()
            };
            
        } catch (error) {
            console.error('❌ Token minting failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get token balance for an address
     */
    async getTokenBalance(userAddress, tokenMint) {
        try {
            const userPubkey = new PublicKey(userAddress);
            const mintPubkey = new PublicKey(tokenMint);
            
            const tokenAccount = await getAssociatedTokenAddress(
                mintPubkey,
                userPubkey
            );

            const balance = await this.connection.getTokenAccountBalance(tokenAccount);
            
            return {
                success: true,
                balance: balance.value.uiAmount,
                tokenAccount: tokenAccount.toString()
            };

        } catch (error) {
            // Account might not exist yet
            return {
                success: true,
                balance: 0,
                tokenAccount: null
            };
        }
    }

    /**
     * Estimate transaction fee
     */
    async estimateTransactionFee() {
        try {
            const recentBlockhash = await this.connection.getLatestBlockhash();
            
            // Create a dummy transaction to estimate fee
            const dummyTransaction = new Transaction();
            dummyTransaction.recentBlockhash = recentBlockhash.blockhash;
            dummyTransaction.feePayer = this.treasuryKeypair.publicKey;

            const fee = await this.connection.getFeeForMessage(
                dummyTransaction.compileMessage(),
                'confirmed'
            );

            return {
                success: true,
                fee: fee.value || 5000 // Default to 5000 lamports if estimation fails
            };

        } catch (error) {
            console.error('⚠️ Fee estimation failed, using default:', error.message);
            return {
                success: true,
                fee: 5000 // Default fee
            };
        }
    }

    /**
     * Load treasury keypair from file
     */
    async loadTreasuryKeypair() {
        try {
            // Load bridge wallet from WALLETS_REGISTRY.json (has mint authority)
            const fallbackRegistry = '/media/OS/for linux work/blockchain solana/nivix-project/WALLETS_REGISTRY.json';
            const envRegistry = process.env.WALLETS_REGISTRY_PATH;
            const registryPath = (envRegistry && fs.existsSync(envRegistry))
                ? envRegistry
                : (fs.existsSync(fallbackRegistry) ? fallbackRegistry : envRegistry || fallbackRegistry);
            
            if (fs.existsSync(registryPath)) {
                const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
                const bridgeWallet = registry.coreWallets?.bridgeWallet;
                
                if (bridgeWallet && bridgeWallet.privateKey) {
                    // Convert private key array to Uint8Array
                    const secretKey = new Uint8Array(bridgeWallet.privateKey);
                    
                    const { Keypair } = require('@solana/web3.js');
                    this.treasuryKeypair = Keypair.fromSecretKey(secretKey);
                    
                    console.log('🔑 Bridge wallet keypair loaded (mint authority):', this.treasuryKeypair.publicKey.toString());
                    return;
                }
            }

            throw new Error('Bridge wallet keypair not found in WALLETS_REGISTRY.json');

        } catch (error) {
            console.error('❌ Failed to load bridge wallet keypair:', error.message);
            throw error;
        }
    }

    /**
     * Get service status
     */
    getStatus() {
        return {
            initialized: this.initialized,
            treasuryAddress: this.treasuryKeypair ? this.treasuryKeypair.publicKey.toString() : null,
            rpcEndpoint: this.connection ? this.connection.rpcEndpoint : null
        };
    }
}

module.exports = CryptoDeliveryService;
