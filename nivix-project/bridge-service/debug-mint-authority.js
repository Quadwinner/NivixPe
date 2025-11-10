const { Connection, PublicKey } = require('@solana/web3.js');
const { getMint } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Connection to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

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

async function checkMintAuthorities() {
    console.log('🔍 Checking mint authorities for all currencies...\n');

    for (const [currency, mintAddress] of Object.entries(currencyTokens)) {
        try {
            console.log(`🪙 ${currency} Token:`);
            console.log(`   Mint: ${mintAddress}`);

            const mint = new PublicKey(mintAddress);
            const mintInfo = await getMint(connection, mint);

            console.log(`   Mint Authority: ${mintInfo.mintAuthority?.toString() || 'None'}`);
            console.log(`   Freeze Authority: ${mintInfo.freezeAuthority?.toString() || 'None'}`);
            console.log(`   Supply: ${Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals)}`);
            console.log(`   Decimals: ${mintInfo.decimals}`);
            console.log('');

        } catch (error) {
            console.error(`❌ Error checking ${currency} mint:`, error.message);
            console.log('');
        }
    }
}

checkMintAuthorities();