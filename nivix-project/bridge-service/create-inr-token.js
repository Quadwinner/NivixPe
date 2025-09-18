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

async function createINRToken() {
  try {
    console.log('🪙 Creating INR Token Mint...');
    console.log('Bridge Wallet:', bridgeWallet.publicKey.toString());

    // Create INR token mint
    const inrMint = await createMint(
      connection,
      bridgeWallet,
      bridgeWallet.publicKey, // mint authority
      bridgeWallet.publicKey, // freeze authority
      6 // decimals
    );

    console.log('✅ INR Token Mint Created:', inrMint.toString());

    // Create token account for bridge wallet
    const inrTokenAccount = await createAccount(
      connection,
      bridgeWallet,
      inrMint,
      bridgeWallet.publicKey
    );

    console.log('✅ INR Token Account Created:', inrTokenAccount.toString());

    // Mint initial supply of INR tokens (1,000,000 INR)
    const initialSupply = 1000000 * Math.pow(10, 6); // 1M INR with 6 decimals
    await mintTo(
      connection,
      bridgeWallet,
      inrMint,
      inrTokenAccount,
      bridgeWallet,
      initialSupply
    );

    console.log('✅ Minted 1,000,000 INR tokens');

    // Load existing mint data
    const mintDataPath = path.join(__dirname, 'data', 'mint-accounts.json');
    let mintData = {};
    
    if (fs.existsSync(mintDataPath)) {
      mintData = JSON.parse(fs.readFileSync(mintDataPath, 'utf8'));
    }

    // Add INR token data
    mintData.inrMint = inrMint.toString();
    mintData.inrTokenAccount = inrTokenAccount.toString();
    mintData.lastUpdated = new Date().toISOString();

    // Save updated mint data
    fs.writeFileSync(mintDataPath, JSON.stringify(mintData, null, 2));

    console.log('✅ INR Token data saved to mint-accounts.json');

    // Verify token account
    const accountInfo = await getAccount(connection, inrTokenAccount);
    console.log('✅ INR Token Account Balance:', accountInfo.amount.toString());

    console.log('\n🎉 INR Token Creation Complete!');
    console.log('INR Mint Address:', inrMint.toString());
    console.log('INR Token Account:', inrTokenAccount.toString());
    console.log('Initial Supply: 1,000,000 INR');

  } catch (error) {
    console.error('❌ Error creating INR token:', error);
  }
}

createINRToken();
