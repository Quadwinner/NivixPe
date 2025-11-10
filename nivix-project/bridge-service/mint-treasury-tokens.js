const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { createAccount, mintTo, getAccount, getAssociatedTokenAddress, createAssociatedTokenAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Load bridge wallet (mint authority)
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

// Currency tokens mapping
const currencyTokens = {
    'EUR': mintData.eurMint,
    'USD': mintData.usdMint,
    'INR': mintData.inrMint,
    'GBP': mintData.gbpMint,
    'JPY': mintData.jpyMint,
    'CAD': mintData.cadMint,
    'AUD': mintData.audMint
};

async function mintTreasuryTokens() {
    try {
        console.log('🏦 Minting 100,000 tokens of each currency to treasury...');
        console.log('Bridge Wallet (Mint Authority):', bridgeWallet.publicKey.toString());

        // Load treasury keypair
        const treasuryWallet = await loadTreasuryKeypair();
        console.log('Treasury Wallet:', treasuryWallet.publicKey.toString());
        console.log('');

        const tokenAmount = 100000 * Math.pow(10, 6); // 100k tokens with 6 decimals
        const results = {};

        for (const [currency, mintAddress] of Object.entries(currencyTokens)) {
            try {
                console.log(`🪙 Processing ${currency} token...`);
                console.log(`Mint: ${mintAddress}`);

                const mint = new PublicKey(mintAddress);

                // Get associated token account address for treasury
                const treasuryTokenAccount = await getAssociatedTokenAddress(
                    mint,
                    treasuryWallet.publicKey
                );

                console.log(`Treasury ${currency} token account: ${treasuryTokenAccount.toString()}`);

                // Check if token account exists, create if it doesn't
                try {
                    await getAccount(connection, treasuryTokenAccount);
                    console.log(`✅ Treasury ${currency} token account already exists`);
                } catch (error) {
                    if (error.message.includes('could not find account')) {
                        // Create associated token account
                        console.log(`📝 Creating treasury ${currency} token account...`);
                        await createAssociatedTokenAccount(
                            connection,
                            bridgeWallet, // payer
                            mint,
                            treasuryWallet.publicKey // owner
                        );
                        console.log(`✅ Created treasury ${currency} token account`);
                    } else {
                        throw error;
                    }
                }

                // Mint tokens to treasury account
                console.log(`💰 Minting 100,000 ${currency} tokens to treasury...`);
                await mintTo(
                    connection,
                    bridgeWallet, // payer
                    mint,
                    treasuryTokenAccount,
                    bridgeWallet, // mint authority
                    tokenAmount
                );

                console.log(`✅ Minted 100,000 ${currency} tokens to treasury`);

                // Verify balance
                const accountInfo = await getAccount(connection, treasuryTokenAccount);
                const balance = Number(accountInfo.amount) / Math.pow(10, 6);
                console.log(`✅ ${currency} treasury balance: ${balance.toLocaleString()} tokens`);

                results[currency] = {
                    mint: mintAddress,
                    treasuryAccount: treasuryTokenAccount.toString(),
                    balance: balance,
                    mintedAmount: 100000
                };

                console.log('');

            } catch (error) {
                console.error(`❌ Error minting ${currency} tokens:`, error.message);
                results[currency] = {
                    error: error.message
                };
                console.log('');
            }
        }

        // Save treasury account information
        const treasuryDataPath = path.join(__dirname, '../data/treasury-accounts.json');
        const treasuryData = {
            treasuryWallet: treasuryWallet.publicKey.toString(),
            accounts: results,
            lastMinted: new Date().toISOString(),
            totalMinted: 100000
        };

        const dataDir = path.dirname(treasuryDataPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(treasuryDataPath, JSON.stringify(treasuryData, null, 2));

        console.log('🎉 Treasury token minting completed!');
        console.log('');
        console.log('📊 Summary:');
        console.log('✅ Minted 100,000 tokens of each currency to treasury');
        console.log('✅ Currencies:', Object.keys(currencyTokens).join(', '));
        console.log('✅ Treasury wallet:', treasuryWallet.publicKey.toString());
        console.log('✅ Treasury accounts saved to:', treasuryDataPath);
        console.log('');

        // Calculate total value minted
        const totalCurrencies = Object.keys(currencyTokens).length;
        const totalTokens = totalCurrencies * 100000;
        console.log(`💰 Total tokens minted: ${totalTokens.toLocaleString()}`);
        console.log(`💰 Treasury is now funded with 100k tokens per currency`);

        return results;

    } catch (error) {
        console.error('❌ Error minting treasury tokens:', error);
        throw error;
    }
}

// Run the minting process
if (require.main === module) {
    mintTreasuryTokens()
        .then(() => {
            console.log('✅ Treasury minting process completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Treasury minting process failed:', error);
            process.exit(1);
        });
}

module.exports = { mintTreasuryTokens };