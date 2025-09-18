import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NivixProtocol } from "../target/types/nivix_protocol";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAssociatedTokenAddress } from "@solana/spl-token";
import { expect } from "chai";
import { BN } from "bn.js";

describe("nivix_protocol", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NivixProtocol as Program<NivixProtocol>;

  // Generate keypairs for testing
  const admin = Keypair.generate();
  const user1 = Keypair.generate();
  const user2 = Keypair.generate();
  
  // Token mint and accounts
  let mint: PublicKey;
  let user1TokenAccount: PublicKey;
  let user2TokenAccount: PublicKey;
  let poolSourceAccount: PublicKey;
  let poolDestAccount: PublicKey;
  
  // Platform and user accounts
  const platformKeypair = Keypair.generate();
  const user1AccountKeypair = Keypair.generate();
  const user2AccountKeypair = Keypair.generate();
  const wallet1Keypair = Keypair.generate();
  const wallet2Keypair = Keypair.generate();
  const transactionRecordKeypair = Keypair.generate();
  const offlineTxKeypair = Keypair.generate();
  const liquidityPoolKeypair = Keypair.generate();
  
  before(async () => {
    // Airdrop SOL to the admin and users
    await provider.connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    await provider.connection.requestAirdrop(user2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL);
    
    // Wait for airdrops to confirm
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user1.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(user2.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL),
      "confirmed"
    );
    
    // Create token mint
    mint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6 // 6 decimals
    );
    
    // Create associated token accounts for better ownership management
    user1TokenAccount = await getAssociatedTokenAddress(mint, user1.publicKey);
    user2TokenAccount = await getAssociatedTokenAddress(mint, user2.publicKey);
    poolSourceAccount = await getAssociatedTokenAddress(mint, admin.publicKey);
    poolDestAccount = await getAssociatedTokenAddress(mint, admin.publicKey);
    
    // Create the token accounts if they don't exist
    try {
      await createAccount(
        provider.connection,
        user1,
        mint,
        user1.publicKey
      );
    } catch (e) {
      // Account might already exist
    }
    
    try {
      await createAccount(
        provider.connection,
        user2,
        mint,
        user2.publicKey
      );
    } catch (e) {
      // Account might already exist
    }
    
    try {
      await createAccount(
        provider.connection,
        admin,
        mint,
        admin.publicKey
      );
    } catch (e) {
      // Account might already exist
    }
    
    // Mint tokens to users and pool for testing
    await mintTo(
      provider.connection,
      admin,
      mint,
      user1TokenAccount,
      admin,
      1000000000 // 1000 tokens with 6 decimals
    );
    
    await mintTo(
      provider.connection,
      admin,
      mint,
      poolSourceAccount,
      admin,
      1000000000 // 1000 tokens with 6 decimals
    );
  });

  it("Initializes the platform", async () => {
    await program.methods
      .initializePlatform("Nivix Protocol", admin.publicKey, new BN(50)) // 0.5% fee rate
      .accounts({
        platform: platformKeypair.publicKey,
        payer: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([platformKeypair, admin])
      .rpc();
    
    // Fetch the platform data and verify
    const platform = await program.account.platform.fetch(platformKeypair.publicKey);
    expect(platform.name).to.equal("Nivix Protocol");
    expect(platform.admin.toString()).to.equal(admin.publicKey.toString());
    expect(platform.feeRate.toNumber()).to.equal(50); // 0.5%
    expect(platform.isActive).to.be.true;
    expect(platform.totalTransactions.toNumber()).to.equal(0);
    expect(platform.totalFeesCollected.toNumber()).to.equal(0);
  });

  it("Registers a new user", async () => {
    await program.methods
      .registerUser("user1", true, "USD", 3, "US") // Low risk user
      .accounts({
        platform: platformKeypair.publicKey,
        user: user1AccountKeypair.publicKey,
        owner: user1.publicKey,
        payer: user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([user1AccountKeypair, user1])
      .rpc();
    
    // Verify user account
    const user = await program.account.user.fetch(user1AccountKeypair.publicKey);
    expect(user.username).to.equal("user1");
    expect(user.kycVerified).to.be.true;
    expect(user.homeCurrency).to.equal("USD");
    expect(user.riskScore).to.equal(3);
    expect(user.countryCode).to.equal("US");
    expect(user.owner.toString()).to.equal(user1.publicKey.toString());
  });

  it("Adds a currency to user wallet", async () => {
    await program.methods
      .addCurrency("USD")
      .accounts({
        user: user1AccountKeypair.publicKey,
        wallet: wallet1Keypair.publicKey,
        tokenMint: mint,
        tokenAccount: user1TokenAccount,
        owner: user1.publicKey,
        payer: user1.publicKey,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([wallet1Keypair, user1])
      .rpc();
    
    // Verify wallet account
    const wallet = await program.account.wallet.fetch(wallet1Keypair.publicKey);
    expect(wallet.currencyCode).to.equal("USD");
    expect(wallet.tokenMint.toString()).to.equal(mint.toString());
    expect(wallet.tokenAccount.toString()).to.equal(user1TokenAccount.toString());
    expect(wallet.owner.toString()).to.equal(user1AccountKeypair.publicKey.toString());
  });

  it("Creates a liquidity pool", async () => {
    await program.methods
      .createLiquidityPool(
        "USD-INR Pool", 
        "USD", 
        "INR", 
        new BN(832500), // 1 USD = 83.25 INR
        new BN(30)      // 0.3% pool fee rate
      )
      .accounts({
        platform: platformKeypair.publicKey,
        liquidityPool: liquidityPoolKeypair.publicKey,
        sourceMint: mint,
        destinationMint: mint, // Using same mint for testing
        admin: admin.publicKey,
        payer: admin.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([liquidityPoolKeypair, admin])
      .rpc();
    
    // Verify liquidity pool
    const pool = await program.account.liquidityPool.fetch(liquidityPoolKeypair.publicKey);
    expect(pool.name).to.equal("USD-INR Pool");
    expect(pool.sourceCurrency).to.equal("USD");
    expect(pool.destinationCurrency).to.equal("INR");
    expect(pool.exchangeRate.toNumber()).to.equal(832500);
    expect(pool.poolFeeRate.toNumber()).to.equal(30); // 0.3%
    expect(pool.admin.toString()).to.equal(admin.publicKey.toString());
    expect(pool.isActive).to.be.true;
    expect(pool.totalSwapped.toNumber()).to.equal(0);
    expect(pool.totalVolume.toNumber()).to.equal(0);
  });

  it("Records an offline transaction", async () => {
    const bluetoothTxId = "bt-tx-12345";
    const signature = new Uint8Array(64).fill(1); // Mock signature
    
    await program.methods
      .recordOfflineTransaction(
        new BN(500), // 500 (equivalent to $5-10)
        "USD",
        "INR",
        user2.publicKey,
        bluetoothTxId,
        signature,
        new BN(Math.floor(Date.now() / 1000)) // Current timestamp as BN
      )
      .accounts({
        user: user1AccountKeypair.publicKey,
        offlineRecord: offlineTxKeypair.publicKey,
        owner: user1.publicKey,
        payer: user1.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([offlineTxKeypair, user1])
      .rpc();
    
    // Verify offline transaction record
    const record = await program.account.offlineTransaction.fetch(offlineTxKeypair.publicKey);
    expect(record.amount.toNumber()).to.equal(500);
    expect(record.sourceCurrency).to.equal("USD");
    expect(record.destinationCurrency).to.equal("INR");
    expect(record.bluetoothTxId).to.equal(bluetoothTxId);
    expect(record.synced).to.be.false;
  });
});
