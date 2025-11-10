const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { transfer, getAccount, getAssociatedTokenAddress, createAssociatedTokenAccount, getOrCreateAssociatedTokenAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Load bridge wallet (has authority over source token accounts)
const bridgeWalletPath = path.join(__dirname, 'wallet', 'bridge-wallet.json');
const bridgeWalletData = JSON.parse(fs.readFileSync(bridgeWalletPath, 'utf8'));
const bridgeWallet = Keypair.fromSecretKey(new Uint8Array(bridgeWalletData));

// Connection to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Load mint data
const mintDataPath = path.join(__dirname, 'data', 'mint-accounts.json');
const mintData = JSON.parse(fs.readFileSync(mintDataPath, 'utf8'));

// Load or create treasury keypair
async function loadTreasuryKeypair() {
    const treasuryKeyPath = path.join(__dirname, '../data/treasury-keypair.json');

    try {
        if (fs.existsSync(treasuryKeyPath)) {
            const keyData = JSON.parse(fs.readFileSync(treasuryKeyPath, 'utf8'));
            const keypair = Keypair.fromSecretKey(new Uint8Array(keyData));
            console.log('📂 Loaded existing treasury keypair');
            return keypair;
        } else {
            // Create new treasury keypair
            const keypair = Keypair.generate();

            // Save keypair securely
            const dataDir = path.dirname(treasuryKeyPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            fs.writeFileSync(
                treasuryKeyPath,
                JSON.stringify(Array.from(keypair.secretKey)),
                { mode: 0o600 }
            );

            console.log('🔐 Created new treasury keypair');
            console.log('⚠️  IMPORTANT: Backup treasury-keypair.json securely!');
            return keypair;
        }
    } catch (error) {
        console.error('❌ Treasury keypair error:', error);
        throw error;
    }
}

// Currency token mapping
const currencyTokens = {
    'EUR': {
        mint: mintData.eurMint,
        sourceAccount: mintData.eurTokenAccount
    },
    'USD': {
        mint: mintData.usdMint,
        sourceAccount: mintData.usdTokenAccount
    },
    'INR': {
        mint: mintData.inrMint,
        sourceAccount: mintData.inrTokenAccount
    },
    'GBP': {
        mint: mintData.gbpMint,
        sourceAccount: mintData.gbpTokenAccount
    },
    'JPY': {
        mint: mintData.jpyMint,
        sourceAccount: mintData.jpyTokenAccount
    },
    'CAD': {
        mint: mintData.cadMint,
        sourceAccount: mintData.cadTokenAccount
    },
    'AUD': {
        mint: mintData.audMint,
        sourceAccount: mintData.audTokenAccount
    }
};

async function transferTokensToTreasury() {
    try {
        console.log('🏦 Transferring 100,000 tokens of each currency to treasury...');
        console.log('Bridge Wallet (Source Authority):', bridgeWallet.publicKey.toString());

        // Load treasury keypair
        const treasuryWallet = await loadTreasuryKeypair();
        console.log('Treasury Wallet:', treasuryWallet.publicKey.toString());
        console.log('');

        const transferAmount = 100000 * Math.pow(10, 6); // 100k tokens with 6 decimals
        const results = {};

        for (const [currency, tokenInfo] of Object.entries(currencyTokens)) {
            try {
                console.log(`🪙 Processing ${currency} token transfer...`);
                console.log(`Source account: ${tokenInfo.sourceAccount}`);

                const mint = new PublicKey(tokenInfo.mint);
                const sourceAccount = new PublicKey(tokenInfo.sourceAccount);

                // Check source account balance
                try {
                    const sourceBalance = await getAccount(connection, sourceAccount);
                    const availableBalance = Number(sourceBalance.amount) / Math.pow(10, 6);
                    console.log(`Available ${currency} balance: ${availableBalance.toLocaleString()}`);

                    if (Number(sourceBalance.amount) < transferAmount) {
                        console.log(`⚠️ Insufficient ${currency} balance. Available: ${availableBalance}, Required: 100,000`);
                        results[currency] = {
                            error: 'Insufficient balance',
                            available: availableBalance,
                            required: 100000
                        };
                        continue;
                    }
                } catch (error) {
                    console.error(`❌ Error checking ${currency} source balance:`, error.message);
                    results[currency] = { error: `Cannot check source balance: ${error.message}` };
                    continue;
                }

                // Get or create treasury token account
                const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
                    connection,
                    bridgeWallet, // payer
                    mint,
                    treasuryWallet.publicKey // owner
                );

                console.log(`Treasury ${currency} account: ${treasuryTokenAccount.address.toString()}`);

                // Transfer tokens from source to treasury
                console.log(`💸 Transferring 100,000 ${currency} tokens...`);
                const signature = await transfer(
                    connection,
                    bridgeWallet, // payer
                    sourceAccount, // source
                    treasuryTokenAccount.address, // destination
                    bridgeWallet, // owner of source account
                    transferAmount // amount
                );

                console.log(`✅ Transfer signature: ${signature}`);

                // Verify transfer
                const newBalance = await getAccount(connection, treasuryTokenAccount.address);
                const balance = Number(newBalance.amount) / Math.pow(10, 6);
                console.log(`✅ ${currency} treasury balance: ${balance.toLocaleString()} tokens`);

                results[currency] = {
                    mint: tokenInfo.mint,
                    sourceAccount: tokenInfo.sourceAccount,
                    treasuryAccount: treasuryTokenAccount.address.toString(),
                    transferAmount: 100000,
                    newBalance: balance,
                    signature: signature,
                    success: true
                };

                console.log('');

            } catch (error) {
                console.error(`❌ Error transferring ${currency} tokens:`, error.message);
                results[currency] = {
                    error: error.message,
                    success: false
                };
                console.log('');
            }
        }

        // Save results
        const resultsPath = path.join(__dirname, '../data/treasury-funding-results.json');
        const resultsData = {
            treasuryWallet: treasuryWallet.publicKey.toString(),
            bridgeWallet: bridgeWallet.publicKey.toString(),
            transfers: results,
            timestamp: new Date().toISOString(),
            totalAmountPerCurrency: 100000
        };

        const dataDir = path.dirname(resultsPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(resultsPath, JSON.stringify(resultsData, null, 2));

        console.log('🎉 Treasury funding completed!');
        console.log('');
        console.log('📊 Summary:');

        let successCount = 0;
        let totalTransferred = 0;

        for (const [currency, result] of Object.entries(results)) {
            if (result.success) {
                successCount++;
                totalTransferred += result.transferAmount || 0;
                console.log(`✅ ${currency}: ${result.transferAmount?.toLocaleString() || 'N/A'} tokens transferred`);
            } else {
                console.log(`❌ ${currency}: ${result.error}`);
            }
        }

        console.log('');
        console.log(`✅ Successfully transferred tokens for ${successCount}/${Object.keys(currencyTokens).length} currencies`);
        console.log(`💰 Total tokens transferred: ${totalTransferred.toLocaleString()}`);
        console.log('✅ Treasury wallet:', treasuryWallet.publicKey.toString());
        console.log('✅ Results saved to:', resultsPath);

        return results;

    } catch (error) {
        console.error('❌ Error during treasury funding:', error);
        throw error;
    }
}

// Run the transfer process
if (require.main === module) {
    transferTokensToTreasury()
        .then(() => {
            console.log('✅ Treasury funding process completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Treasury funding process failed:', error);
            process.exit(1);
        });
}

module.exports = { transferTokensToTreasury };