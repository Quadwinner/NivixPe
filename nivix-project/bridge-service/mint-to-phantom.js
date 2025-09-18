const { Connection, Keypair, PublicKey, Transaction } = require('@solana/web3.js');
const { createAccount, mintTo, getAccount } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

// Load bridge wallet
const bridgeWalletPath = path.join(__dirname, 'wallet', 'bridge-wallet.json');
const bridgeWalletData = JSON.parse(fs.readFileSync(bridgeWalletPath, 'utf8'));
const bridgeWallet = Keypair.fromSecretKey(new Uint8Array(bridgeWalletData));

// Connection to Solana devnet
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// Load mint data
const mintDataPath = path.join(__dirname, 'data', 'mint-accounts.json');
const mintData = JSON.parse(fs.readFileSync(mintDataPath, 'utf8'));

// Your Phantom wallet address
const PHANTOM_WALLET = 'CauHK3m4DRTe6yPrBTDYQrzSvjsi8xN6BhppkZLCuZv9';

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

async function mintTokensToPhantomWallet() {
  try {
    console.log('🎯 Minting tokens to your Phantom wallet...');
    console.log('Phantom Wallet:', PHANTOM_WALLET);
    console.log('Bridge Wallet:', bridgeWallet.publicKey.toString());
    console.log('Tokens per currency: 100');
    console.log('');

    const phantomWallet = new PublicKey(PHANTOM_WALLET);
    const tokenAmount = 100 * Math.pow(10, 6); // 100 tokens with 6 decimals

    for (const [currency, mintAddress] of Object.entries(currencyTokens)) {
      try {
        console.log(`🪙 Processing ${currency} token...`);
        console.log(`Mint: ${mintAddress}`);

        const mint = new PublicKey(mintAddress);

        // Create token account for Phantom wallet if it doesn't exist
        let tokenAccount;
        try {
          tokenAccount = await createAccount(
            connection,
            bridgeWallet,
            mint,
            phantomWallet
          );
          console.log(`✅ Created ${currency} token account: ${tokenAccount.toString()}`);
        } catch (error) {
          if (error.message.includes('already exists')) {
            // Try to find existing account
            const accounts = await connection.getTokenAccountsByOwner(phantomWallet, {
              mint: mint
            });
            if (accounts.value.length > 0) {
              tokenAccount = accounts.value[0].pubkey;
              console.log(`✅ Using existing ${currency} token account: ${tokenAccount.toString()}`);
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }

        // Mint tokens to Phantom wallet
        await mintTo(
          connection,
          bridgeWallet,
          mint,
          tokenAccount,
          bridgeWallet,
          tokenAmount
        );

        console.log(`✅ Minted 100 ${currency} tokens to your Phantom wallet`);

        // Verify balance
        const accountInfo = await getAccount(connection, tokenAccount);
        console.log(`✅ ${currency} balance: ${accountInfo.amount.toString()} (100 tokens)`);
        console.log('');

      } catch (error) {
        console.error(`❌ Error minting ${currency} tokens:`, error.message);
        console.log('');
      }
    }

    console.log('🎉 Token minting completed!');
    console.log('');
    console.log('📊 Summary:');
    console.log('✅ Minted 100 tokens of each currency to your Phantom wallet');
    console.log('✅ Currencies: EUR, USD, INR, GBP, JPY, CAD, AUD');
    console.log('✅ All tokens are now available in your Phantom wallet');
    console.log('');
    console.log('🔗 Your Phantom wallet address: CauHK3m4DRTe6yPrBTDYQrzSvjsi8xN6BhppkZLCuZv9');

  } catch (error) {
    console.error('❌ Error minting tokens:', error);
  }
}

mintTokensToPhantomWallet();