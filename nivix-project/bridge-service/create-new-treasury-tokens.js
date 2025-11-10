const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { createMint, mintTo, getOrCreateAssociatedTokenAccount, getAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Load bridge wallet (will be mint authority)
const bridgeWalletPath = path.join(__dirname, 'wallet', 'bridge-wallet.json');
const bridgeWalletData = JSON.parse(fs.readFileSync(bridgeWalletPath, 'utf8'));
const bridgeWallet = Keypair.fromSecretKey(new Uint8Array(bridgeWalletData));

// Connection to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

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

// Currencies to create
const currencies = [
    'EUR', 'USD', 'INR', 'GBP', 'JPY', 'CAD', 'AUD'
];

async function createTreasuryTokenMints() {
    try {
        console.log('🏦 Creating new token mints for treasury with 100k tokens each...');
        console.log('Bridge Wallet (Mint Authority):', bridgeWallet.publicKey.toString());

        // Load treasury keypair
        const treasuryWallet = await loadTreasuryKeypair();
        console.log('Treasury Wallet:', treasuryWallet.publicKey.toString());
        console.log('');

        const tokenAmount = 100000 * Math.pow(10, 6); // 100k tokens with 6 decimals
        const results = {
            treasuryMints: {},
            treasuryAccounts: {}
        };

        for (const currency of currencies) {
            try {
                console.log(`🪙 Creating ${currency} treasury token mint...`);

                // Create new token mint with current bridge wallet as authority
                const mint = await createMint(
                    connection,
                    bridgeWallet, // payer
                    bridgeWallet.publicKey, // mint authority
                    bridgeWallet.publicKey, // freeze authority
                    6 // decimals
                );

                console.log(`✅ ${currency} mint created: ${mint.toString()}`);

                // Create treasury token account
                const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
                    connection,
                    bridgeWallet, // payer
                    mint,
                    treasuryWallet.publicKey // owner
                );

                console.log(`✅ ${currency} treasury account: ${treasuryTokenAccount.address.toString()}`);

                // Mint 100k tokens directly to treasury
                console.log(`💰 Minting 100,000 ${currency} tokens to treasury...`);
                const signature = await mintTo(
                    connection,
                    bridgeWallet, // payer
                    mint,
                    treasuryTokenAccount.address,
                    bridgeWallet, // mint authority
                    tokenAmount
                );

                console.log(`✅ Mint signature: ${signature}`);

                // Verify balance
                const balance = await getAccount(connection, treasuryTokenAccount.address);
                const balanceAmount = Number(balance.amount) / Math.pow(10, 6);
                console.log(`✅ ${currency} treasury balance: ${balanceAmount.toLocaleString()} tokens`);

                results.treasuryMints[currency] = {
                    mint: mint.toString(),
                    mintAuthority: bridgeWallet.publicKey.toString(),
                    decimals: 6,
                    initialSupply: 100000
                };

                results.treasuryAccounts[currency] = {
                    account: treasuryTokenAccount.address.toString(),
                    owner: treasuryWallet.publicKey.toString(),
                    balance: balanceAmount,
                    mint: mint.toString()
                };

                console.log('');

            } catch (error) {
                console.error(`❌ Error creating ${currency} treasury tokens:`, error.message);
                results.treasuryMints[currency] = { error: error.message };
                results.treasuryAccounts[currency] = { error: error.message };
                console.log('');
            }
        }

        // Save treasury token data
        const treasuryTokenDataPath = path.join(__dirname, '../data/treasury-token-mints.json');
        const treasuryTokenData = {
            treasuryWallet: treasuryWallet.publicKey.toString(),
            bridgeWallet: bridgeWallet.publicKey.toString(),
            ...results,
            created: new Date().toISOString(),
            totalSupplyPerCurrency: 100000,
            description: "Treasury token mints with 100k initial supply each"
        };

        const dataDir = path.dirname(treasuryTokenDataPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(treasuryTokenDataPath, JSON.stringify(treasuryTokenData, null, 2));

        console.log('🎉 Treasury token creation completed!');
        console.log('');
        console.log('📊 Summary:');

        let successCount = 0;
        let totalSupply = 0;

        for (const currency of currencies) {
            if (results.treasuryMints[currency] && !results.treasuryMints[currency].error) {
                successCount++;
                totalSupply += 100000;
                console.log(`✅ ${currency}: 100,000 tokens minted to treasury`);
            } else {
                console.log(`❌ ${currency}: Failed to create`);
            }
        }

        console.log('');
        console.log(`✅ Successfully created treasury tokens for ${successCount}/${currencies.length} currencies`);
        console.log(`💰 Total treasury supply: ${totalSupply.toLocaleString()} tokens`);
        console.log('✅ Treasury wallet:', treasuryWallet.publicKey.toString());
        console.log('✅ Data saved to:', treasuryTokenDataPath);
        console.log('');
        console.log('🔑 Important Notes:');
        console.log('- These are NEW token mints specifically for treasury use');
        console.log('- Current bridge wallet is the mint authority for all new mints');
        console.log('- Treasury now has 100,000 tokens of each currency');
        console.log('- Treasury balance is no longer zero!');

        return results;

    } catch (error) {
        console.error('❌ Error creating treasury tokens:', error);
        throw error;
    }
}

// Run the creation process
if (require.main === module) {
    createTreasuryTokenMints()
        .then(() => {
            console.log('✅ Treasury token creation process completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Treasury token creation process failed:', error);
            process.exit(1);
        });
}

module.exports = { createTreasuryTokenMints };