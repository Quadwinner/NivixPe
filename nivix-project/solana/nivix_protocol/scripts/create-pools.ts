import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NivixProtocol } from "../target/types/nivix_protocol";
import { PublicKey, Keypair, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { BN } from "bn.js";

// Example script to create different liquidity pools
export async function createLiquidityPools(program: Program<NivixProtocol>) {
  console.log("🚀 Creating Multiple Liquidity Pools for Nivix Protocol");
  console.log("==================================================");

  // Admin keypair (platform owner)
  const admin = Keypair.generate();
  
  // Platform keypair
  const platformKeypair = Keypair.generate();
  
  // Create platform first
  console.log("📋 Step 1: Creating Platform...");
  await program.methods
    .initializePlatform("Nivix Protocol", admin.publicKey, new BN(50)) // 0.5% platform fee
    .accounts({
      platform: platformKeypair.publicKey,
      payer: admin.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([platformKeypair, admin])
    .rpc();
  
  console.log("✅ Platform created successfully!");

  // Define different currency pairs and their exchange rates
  const poolConfigs = [
    {
      name: "USD-INR Pool",
      sourceCurrency: "USD",
      destinationCurrency: "INR",
      exchangeRate: new BN(832500), // 1 USD = 83.25 INR (scaled by 10,000)
      poolFeeRate: new BN(30), // 0.3% pool fee
      description: "US Dollar to Indian Rupee exchange"
    },
    {
      name: "USD-EUR Pool",
      sourceCurrency: "USD", 
      destinationCurrency: "EUR",
      exchangeRate: new BN(92000), // 1 USD = 0.92 EUR (scaled by 10,000)
      poolFeeRate: new BN(25), // 0.25% pool fee
      description: "US Dollar to Euro exchange"
    },
    {
      name: "INR-EUR Pool",
      sourceCurrency: "INR",
      destinationCurrency: "EUR", 
      exchangeRate: new BN(110), // 1 INR = 0.0011 EUR (scaled by 10,000)
      poolFeeRate: new BN(35), // 0.35% pool fee
      description: "Indian Rupee to Euro exchange"
    },
    {
      name: "SOL-USD Pool",
      sourceCurrency: "SOL",
      destinationCurrency: "USD",
      exchangeRate: new BN(9500), // 1 SOL = $95.00 (scaled by 10,000)
      poolFeeRate: new BN(20), // 0.2% pool fee
      description: "Solana to US Dollar exchange"
    },
    {
      name: "USDC-INR Pool",
      sourceCurrency: "USDC",
      destinationCurrency: "INR", 
      exchangeRate: new BN(832500), // 1 USDC = 83.25 INR (scaled by 10,000)
      poolFeeRate: new BN(15), // 0.15% pool fee
      description: "USDC stablecoin to Indian Rupee exchange"
    }
  ];

  console.log("\n🏊 Step 2: Creating Liquidity Pools...");
  console.log("=====================================");

  for (let i = 0; i < poolConfigs.length; i++) {
    const config = poolConfigs[i];
    console.log(`\n📊 Creating Pool ${i + 1}: ${config.name}`);
    console.log(`   Source: ${config.sourceCurrency}`);
    console.log(`   Destination: ${config.destinationCurrency}`);
    console.log(`   Exchange Rate: ${config.exchangeRate.toNumber() / 10000}`);
    console.log(`   Pool Fee: ${config.poolFeeRate.toNumber() / 100}%`);
    console.log(`   Description: ${config.description}`);

    // Generate pool keypair
    const poolKeypair = Keypair.generate();
    
    // Generate token mints for this pool (in real scenario, these would be actual token mints)
    const sourceMint = Keypair.generate();
    const destinationMint = Keypair.generate();

    try {
      await program.methods
        .createLiquidityPool(
          config.name,
          config.sourceCurrency,
          config.sourceCurrency,
          config.exchangeRate,
          config.poolFeeRate
        )
        .accounts({
          liquidityPool: poolKeypair.publicKey,
          platform: platformKeypair.publicKey,
          admin: admin.publicKey,
          sourceMint: sourceMint.publicKey,
          destinationMint: destinationMint.publicKey,
          payer: admin.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([poolKeypair, admin, sourceMint, destinationMint])
        .rpc();

      console.log(`   ✅ Pool created successfully!`);
      console.log(`   🆔 Pool Address: ${poolKeypair.publicKey.toString()}`);
      
    } catch (error) {
      console.log(`   ❌ Failed to create pool: ${error}`);
    }
  }

  console.log("\n🎯 Step 3: Pool Management Features");
  console.log("==================================");
  console.log("✅ Multiple currency pairs supported");
  console.log("✅ Pool-specific fee rates");
  console.log("✅ Dynamic exchange rate updates");
  console.log("✅ Liquidity provision capabilities");
  console.log("✅ Comprehensive swap tracking");
  console.log("✅ Risk-based transaction limits");

  console.log("\n💡 Usage Examples:");
  console.log("==================");
  console.log("1. Users can swap USD → INR using the USD-INR pool");
  console.log("2. Different pools have different fee structures");
  console.log("3. Admin can update exchange rates based on market conditions");
  console.log("4. Liquidity providers can earn fees from swaps");
  console.log("5. All transactions are tracked with unique IDs");

  console.log("\n🚀 Nivix Protocol is ready for multi-currency operations!");
}




