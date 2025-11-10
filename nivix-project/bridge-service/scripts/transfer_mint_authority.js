/*
  Transfer mint authority from current authority to bridge wallet for all tokens.
  Uses bridge-service dependencies and registry keys (devnet only).
*/
const fs = require('fs');
const path = require('path');
const { Connection, PublicKey, Keypair, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { setAuthority, AuthorityType } = require('@solana/spl-token');

async function main() {
  const registryPath = path.resolve('/media/OS/for linux work/blockchain solana/nivix-project/WALLETS_REGISTRY.json');
  const mintAccountsPath = path.resolve(path.join(__dirname, '../data/mint-accounts.json'));
  
  if (!fs.existsSync(registryPath)) {
    throw new Error(`Registry not found at ${registryPath}`);
  }
  if (!fs.existsSync(mintAccountsPath)) {
    throw new Error(`mint-accounts.json not found at ${mintAccountsPath}`);
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const bridgeWallet = registry.coreWallets?.bridgeWallet;
  const treasuryWallet = registry.coreWallets?.treasuryWallet;
  
  if (!bridgeWallet?.privateKey || !treasuryWallet?.privateKey) {
    throw new Error('Missing bridge or treasury wallet in registry');
  }

  const mintData = JSON.parse(fs.readFileSync(mintAccountsPath, 'utf8'));
  const currencyToMint = {
    USD: mintData.usdMint,
    EUR: mintData.eurMint,
    INR: mintData.inrMint,
    GBP: mintData.gbpMint,
    JPY: mintData.jpyMint,
    CAD: mintData.cadMint,
    AUD: mintData.audMint,
  };

  const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const connection = new Connection(rpcUrl, 'confirmed');

  // Treasury is the current mint authority (from setup scripts)
  const treasuryKeypair = Keypair.fromSecretKey(new Uint8Array(treasuryWallet.privateKey));
  const bridgePubkey = new PublicKey(bridgeWallet.publicKey);

  const results = {};

  for (const [currency, mintStr] of Object.entries(currencyToMint)) {
    if (!mintStr) continue;
    const mintPubkey = new PublicKey(mintStr);
    try {
      // Check current mint authority
      const mintInfo = await connection.getParsedAccountInfo(mintPubkey);
      if (!mintInfo.value) {
        results[currency] = { success: false, error: 'Mint account not found' };
        console.error(`❌ ${currency} mint not found: ${mintStr}`);
        continue;
      }
      const currentAuthority = mintInfo.value.data.parsed.info.mintAuthority;
      console.log(`🔍 ${currency} current mint authority: ${currentAuthority}`);

      if (currentAuthority === bridgePubkey.toString()) {
        results[currency] = { success: true, message: 'Already bridge authority', signature: null };
        console.log(`✅ ${currency} already has bridge as mint authority`);
        continue;
      }

      // Transfer mint authority to bridge wallet
      const sig = await setAuthority(
        connection,
        treasuryKeypair, // payer and current authority
        mintPubkey,
        treasuryKeypair.publicKey, // current authority
        AuthorityType.MintTokens,
        bridgePubkey, // new authority
        [],
        { commitment: 'confirmed' }
      );

      results[currency] = { success: true, signature: sig, newAuthority: bridgePubkey.toString() };
      console.log(`✅ Transferred ${currency} mint authority to bridge | ${sig}`);
    } catch (e) {
      results[currency] = { success: false, error: e.message };
      console.error(`❌ Failed to transfer ${currency} mint authority:`, e.message);
    }
  }

  console.log(JSON.stringify({ success: true, results }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});



