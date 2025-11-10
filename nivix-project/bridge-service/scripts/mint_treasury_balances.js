/*
  Mint 100,000 tokens (6 decimals) for each configured currency to the treasury wallet.
  Uses bridge-service dependencies and registry keys (devnet only).
*/
const fs = require('fs');
const path = require('path');
const { Connection, PublicKey, Keypair, sendAndConfirmTransaction, Transaction } = require('@solana/web3.js');
const { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createMintToInstruction } = require('@solana/spl-token');

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
  if (!bridgeWallet?.privateKey || !treasuryWallet?.publicKey) {
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

  const bridgeKeypair = Keypair.fromSecretKey(new Uint8Array(bridgeWallet.privateKey));
  const treasuryPubkey = new PublicKey(treasuryWallet.publicKey);

  const amountTokens = 100000; // 100k
  const decimals = 6;
  const amount = Math.floor(amountTokens * Math.pow(10, decimals));

  const results = {};

  for (const [currency, mintStr] of Object.entries(currencyToMint)) {
    if (!mintStr) continue;
    const mint = new PublicKey(mintStr);
    try {
      const ata = await getAssociatedTokenAddress(mint, treasuryPubkey);
      const accountInfo = await connection.getAccountInfo(ata);
      const tx = new Transaction();
      if (!accountInfo) {
        tx.add(createAssociatedTokenAccountInstruction(
          bridgeKeypair.publicKey,
          ata,
          treasuryPubkey,
          mint
        ));
      }
      tx.add(createMintToInstruction(
        mint,
        ata,
        bridgeKeypair.publicKey,
        amount
      ));
      tx.feePayer = bridgeKeypair.publicKey;
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.sign(bridgeKeypair);
      const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: true, maxRetries: 5 });
      await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed');
      results[currency] = { success: true, signature: sig, ata: ata.toBase58() };
      console.log(`✅ Minted ${amountTokens} ${currency} to ${ata.toBase58()} | ${sig}`);
    } catch (e) {
      results[currency] = { success: false, error: e.message };
      console.error(`❌ Failed mint for ${currency}:`, e.message);
    }
  }

  console.log(JSON.stringify({ success: true, results }, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});


