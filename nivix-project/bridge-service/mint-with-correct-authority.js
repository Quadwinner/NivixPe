const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { createAccount, mintTo, getAccount, getAssociatedTokenAddress, createAssociatedTokenAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Connection to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// The correct mint authority from our debug
const MINT_AUTHORITY_ADDRESS = '9EGgMSNmvGaCmTcpMBayyNSCC7dGWMEVE6aGiAvei2em';

// Load mint data
const mintDataPath = path.join(__dirname, 'data', 'mint-accounts.json');
const mintData = JSON.parse(fs.readFileSync(mintDataPath, 'utf8'));

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

async function findMintAuthorityKeypair() {
    console.log('🔍 Searching for mint authority keypair...');
    console.log('Required address:', MINT_AUTHORITY_ADDRESS);
    console.log('');

    // Check if it's the bridgeWallet address stored in mint-accounts.json
    if (mintData.bridgeWallet && mintData.bridgeWallet === MINT_AUTHORITY_ADDRESS) {
        console.log('✅ Found mint authority address in mint-accounts.json as bridgeWallet');

        // Try to find the keypair file for this address
        const possiblePaths = [
            path.join(__dirname, 'wallet', 'bridge-wallet.json'),
            path.join(__dirname, 'wallet', `${MINT_AUTHORITY_ADDRESS}.json`),
            path.join(__dirname, '../data', `${MINT_AUTHORITY_ADDRESS}.json`),
            path.join(__dirname, '../data', 'bridge-wallet.json'),
        ];

        for (const keyPath of possiblePaths) {
            try {
                if (fs.existsSync(keyPath)) {
                    const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
                    const keypair = Keypair.fromSecretKey(new Uint8Array(keyData));

                    if (keypair.publicKey.toString() === MINT_AUTHORITY_ADDRESS) {
                        console.log(`✅ Found correct mint authority keypair at: ${keyPath}`);
                        return keypair;
                    } else {
                        console.log(`❌ Keypair at ${keyPath} has address ${keypair.publicKey.toString()}, not ${MINT_AUTHORITY_ADDRESS}`);
                    }
                }
            } catch (error) {
                console.log(`❌ Error reading ${keyPath}:`, error.message);
            }
        }
    }

    // If we can't find the keypair, we need to transfer mint authority or recreate tokens
    console.log('❌ Could not find the mint authority keypair');
    console.log('');
    console.log('💡 Solutions:');
    console.log('1. Find the original keypair for address:', MINT_AUTHORITY_ADDRESS);
    console.log('2. Transfer mint authority to current bridge wallet');
    console.log('3. Create new token mints with current bridge wallet as authority');

    return null;
}

async function transferMintAuthority() {
    console.log('🔄 Attempting to transfer mint authority to current bridge wallet...');

    // This would require the current mint authority keypair
    // For now, let's just report what would need to be done

    console.log('❌ Cannot transfer mint authority without the current mint authority keypair');
    console.log('');
    console.log('The transfer would require:');
    console.log('1. Current mint authority keypair for:', MINT_AUTHORITY_ADDRESS);
    console.log('2. New mint authority address (current bridge wallet)');
    console.log('3. setAuthority instruction for each token mint');

    return false;
}

async function suggestSolution() {
    console.log('💡 Recommended Solution:');
    console.log('');
    console.log('Since we cannot access the original mint authority keypair,');
    console.log('the best approach is to mint tokens directly to the treasury accounts');
    console.log('from the existing token accounts that have sufficient balance.');
    console.log('');
    console.log('Current token supplies:');

    for (const [currency, mintAddress] of Object.entries(currencyTokens)) {
        try {
            const mint = new PublicKey(mintAddress);
            const mintInfo = await connection.getTokenAccountBalance(new PublicKey(mintData[`${currency.toLowerCase()}TokenAccount`]));
            const balance = parseFloat(mintInfo.value.amount) / Math.pow(10, mintInfo.value.decimals);
            console.log(`${currency}: ${balance.toLocaleString()} tokens available`);
        } catch (error) {
            console.log(`${currency}: Error getting balance`);
        }
    }

    console.log('');
    console.log('✅ We can transfer tokens from these accounts to treasury accounts');
    console.log('   using the bridge wallet as the authority for the source accounts');
}

async function main() {
    try {
        const mintAuthorityKeypair = await findMintAuthorityKeypair();

        if (!mintAuthorityKeypair) {
            const transferred = await transferMintAuthority();

            if (!transferred) {
                await suggestSolution();
            }
        } else {
            console.log('✅ Found mint authority keypair! You can now mint tokens.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

main();