const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { createMint, createAccount, mintTo, getAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Load bridge wallet
const bridgeWalletPath = path.join(__dirname, 'wallet', 'bridge-wallet.json');
const bridgeWalletData = JSON.parse(fs.readFileSync(bridgeWalletPath, 'utf8'));
const bridgeWallet = Keypair.fromSecretKey(new Uint8Array(bridgeWalletData));

// Connection to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

async function createCurrencyToken(currency, symbol) {
  try {
    console.log(`🪙 Creating ${currency} Token Mint...`);
    console.log('Bridge Wallet:', bridgeWallet.publicKey.toString());

    // Create token mint
    const tokenMint = await createMint(
      connection,
      bridgeWallet,
      bridgeWallet.publicKey, // mint authority
      bridgeWallet.publicKey, // freeze authority
      6 // decimals
    );

    console.log(`✅ ${currency} Token Mint Created:`, tokenMint.toString());

    // Create token account for bridge wallet
    const tokenAccount = await createAccount(
      connection,
      bridgeWallet,
      tokenMint,
      bridgeWallet.publicKey
    );

    console.log(`✅ ${currency} Token Account Created:`, tokenAccount.toString());

    // Mint initial supply (1,000,000 tokens)
    const initialSupply = 1000000 * Math.pow(10, 6); // 1M tokens with 6 decimals
    await mintTo(
      connection,
      bridgeWallet,
      tokenMint,
      tokenAccount,
      bridgeWallet,
      initialSupply
    );

    console.log(`✅ Minted 1,000,000 ${currency} tokens`);

    // Verify token account
    const accountInfo = await getAccount(connection, tokenAccount);
    console.log(`✅ ${currency} Token Account Balance:`, accountInfo.amount.toString());

    return {
      mint: tokenMint.toString(),
      tokenAccount: tokenAccount.toString(),
      balance: accountInfo.amount.toString()
    };

  } catch (error) {
    console.error(`❌ Error creating ${currency} token:`, error);
    throw error;
  }
}

async function createAllCurrencyTokens() {
  try {
    console.log('🚀 Creating All Currency Tokens...\n');

    const currencies = [
      { name: 'GBP', symbol: 'GBP' },
      { name: 'JPY', symbol: 'JPY' },
      { name: 'CAD', symbol: 'CAD' },
      { name: 'AUD', symbol: 'AUD' }
    ];

    const tokenData = {};

    // Load existing mint data
    const mintDataPath = path.join(__dirname, 'data', 'mint-accounts.json');
    let mintData = {};
    
    if (fs.existsSync(mintDataPath)) {
      mintData = JSON.parse(fs.readFileSync(mintDataPath, 'utf8'));
    }

    // Create each currency token
    for (const currency of currencies) {
      const result = await createCurrencyToken(currency.name, currency.symbol);
      
      // Store in tokenData
      tokenData[`${currency.symbol.toLowerCase()}Mint`] = result.mint;
      tokenData[`${currency.symbol.toLowerCase()}TokenAccount`] = result.tokenAccount;
      
      console.log(`\n${currency.name} Token Details:`);
      console.log(`Mint: ${result.mint}`);
      console.log(`Account: ${result.tokenAccount}`);
      console.log(`Balance: ${result.balance}\n`);
    }

    // Update mint data with new tokens
    Object.assign(mintData, tokenData);
    mintData.lastUpdated = new Date().toISOString();

    // Save updated mint data
    fs.writeFileSync(mintDataPath, JSON.stringify(mintData, null, 2));

    console.log('✅ All currency tokens created and saved!');
    console.log('📄 Updated mint-accounts.json with new tokens');

    return tokenData;

  } catch (error) {
    console.error('❌ Error creating currency tokens:', error);
  }
}

createAllCurrencyTokens();
