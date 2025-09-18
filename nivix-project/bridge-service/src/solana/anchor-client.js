/**
 * Anchor Client Module
 * Handles interaction with Solana smart contracts using Anchor framework
 */

const anchor = require('@project-serum/anchor');
const { Program, AnchorProvider, web3, BN } = anchor;
const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const { TOKEN_PROGRAM_ID } = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');
const solanaClient = require('./solana-client');

// Helper function to convert to BN (Big Number) with proper decimal handling
const convertToBN = (amount, decimals = 9) => {
  return new BN(amount * Math.pow(10, decimals));
};

class AnchorClient {
  constructor() {
    this.connection = solanaClient.connection;
    this.provider = null;
    this.program = null;
    this.initialized = false;
    this.programId = new PublicKey('FavSaLCcw6qgpLob47uGPoNhJRsGjBMB1tSb7CZTavbw');
  }

  /**
   * Initialize the Anchor client with bridge wallet
   */
  async initialize() {
    try {
      // Wait for solanaClient to be initialized if it's not already
      if (!solanaClient.initialized) {
        await solanaClient.initialize();
      }

      // Use the bridge wallet from solanaClient
      this.wallet = {
        publicKey: solanaClient.bridgeWallet.publicKey,
        signTransaction: async (tx) => {
          tx.partialSign(solanaClient.bridgeWallet);
          return tx;
        },
        signAllTransactions: async (txs) => {
          return txs.map((tx) => {
            tx.partialSign(solanaClient.bridgeWallet);
            return tx;
          });
        },
      };

      // Create an Anchor provider
      this.provider = new AnchorProvider(
        this.connection,
        this.wallet,
        { commitment: 'confirmed' }
      );
      // Set provider globally for Anchor
      anchor.setProvider(this.provider);

      // Load the IDL (Interface Description Language) for the program
      const idlPath = path.join(__dirname, '../../config/nivix_protocol.json');
      let idl;

      if (fs.existsSync(idlPath)) {
        idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
        console.log('Loaded Nivix Protocol IDL from file');
      } else {
        // If we don't have the IDL file, try to fetch it from the chain
        try {
          idl = await Program.fetchIdl(this.programId, this.provider);
          
          if (idl) {
            // Ensure the directory exists
            const configDir = path.join(__dirname, '../../config');
            if (!fs.existsSync(configDir)) {
              fs.mkdirSync(configDir, { recursive: true });
            }
            
            // Save the IDL for future use
            fs.writeFileSync(idlPath, JSON.stringify(idl, null, 2));
            console.log('Fetched and saved Nivix Protocol IDL');
          } else {
            throw new Error('Failed to fetch IDL from chain');
          }
        } catch (error) {
          console.error('Error fetching IDL:', error);
          throw new Error('Cannot load or fetch IDL. Make sure the program is deployed on this network.');
        }
      }

      // Create the program interface
      this.program = new Program(idl, this.programId, this.provider);
      this.initialized = true;
      console.log('Anchor client initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Anchor client:', error);
      return false;
    }
  }

  /**
   * Ensure platform account exists; initialize if missing
   */
  async ensurePlatformInitialized(platformName = 'Nivix', feeRateBps = 50) {
    if (!this.initialized) await this.initialize();
    const [platformPda] = await PublicKey.findProgramAddress(
      [Buffer.from('platform')],
      this.programId
    );
    this.platformPda = platformPda;
    try {
      const existing = await this.program.account.platform.fetch(platformPda);
      if (existing) return platformPda;
    } catch (_) {}
    const tx = await this.program.rpc.initializePlatform(
      platformName,
      this.wallet.publicKey,
      new BN(feeRateBps),
      {
        accounts: {
          platform: platformPda,
          payer: this.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [solanaClient.bridgeWallet],
      }
    );
    return platformPda;
  }

  /**
   * Register a currency in the protocol
   */
  async registerCurrency(code, mintAddress, decimals) {
    if (!this.initialized) await this.initialize();
    const [platformPda] = await PublicKey.findProgramAddress(
      [Buffer.from('platform')],
      this.programId
    );
    // Ensure platform exists
    await this.ensurePlatformInitialized();
    const mint = new PublicKey(mintAddress);
    const [currencyPda] = await PublicKey.findProgramAddress(
      [Buffer.from('currency'), mint.toBuffer()],
      this.programId
    );
    const tx = await this.program.rpc.registerCurrency(
      code,
      decimals,
      {
        accounts: {
          platform: platformPda,
          currency: currencyPda,
          mint,
          admin: this.wallet.publicKey,
          payer: this.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [solanaClient.bridgeWallet],
      }
    );
    return { success: true, transaction: tx, currency: currencyPda.toBase58() };
  }

  /**
   * List all registered currencies
   */
  async listCurrencies() {
    if (!this.initialized) await this.initialize();
    const all = await this.program.account.currency.all();
    return all.map((a) => ({
      pubkey: a.publicKey.toBase58(),
      code: a.account.code,
      mint: a.account.mint.toBase58(),
      decimals: a.account.decimals,
      is_active: a.account.isActive,
      created_at: a.account.createdAt,
    }));
  }

  /**
   * Create a liquidity pool for currency exchange
   */
  async createLiquidityPool(poolName, sourceCurrency, destinationCurrency, sourceMint, destinationMint, initialExchangeRate, poolFeeRate) {
    try {
      if (!this.initialized) {
        throw new Error('Anchor client not initialized');
      }

      console.log(`Creating liquidity pool: ${poolName}`);
      console.log(`Source: ${sourceCurrency} (${sourceMint})`);
      console.log(`Destination: ${destinationCurrency} (${destinationMint})`);
      console.log(`Exchange Rate: ${initialExchangeRate}`);
      console.log(`Fee Rate: ${poolFeeRate} bps`);

      // Ensure platform exists
      await this.ensurePlatformInitialized();

      // Create the liquidity pool account
      const liquidityPool = web3.Keypair.generate();

      const tx = await this.program.methods
        .createLiquidityPool(
          poolName,
          sourceCurrency,
          destinationCurrency,
          new BN(initialExchangeRate),
          new BN(poolFeeRate)
        )
        .accounts({
          platform: this.platformPda,
          liquidityPool: liquidityPool.publicKey,
          sourceMint: new PublicKey(sourceMint),
          destinationMint: new PublicKey(destinationMint),
          admin: this.wallet.publicKey,
          payer: this.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .signers([liquidityPool])
        .rpc();

      console.log(`Liquidity pool created successfully: ${liquidityPool.publicKey.toString()}`);
      console.log(`Transaction: ${tx}`);

      return {
        success: true,
        poolAddress: liquidityPool.publicKey.toString(),
        transaction: tx,
        pool: {
          name: poolName,
          sourceCurrency,
          destinationCurrency,
          sourceMint,
          destinationMint,
          exchangeRate: initialExchangeRate,
          feeRate: poolFeeRate,
          address: liquidityPool.publicKey.toString()
        }
      };
    } catch (error) {
      console.error('Error creating liquidity pool:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update liquidity pool exchange rate
   */
  async updatePoolRate(poolAddress, newExchangeRate) {
    try {
      if (!this.initialized) {
        throw new Error('Anchor client not initialized');
      }

      console.log(`Updating pool rate for ${poolAddress} to ${newExchangeRate}`);

      const tx = await this.program.methods
        .updatePoolRate(new BN(newExchangeRate))
        .accounts({
          liquidityPool: new PublicKey(poolAddress),
          admin: this.wallet.publicKey,
        })
        .rpc();

      console.log(`Pool rate updated successfully: ${tx}`);

      return {
        success: true,
        transaction: tx,
        newRate: newExchangeRate
      };
    } catch (error) {
      console.error('Error updating pool rate:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(poolAddress, sourceAmount, destinationAmount, userSourceAccount, userDestinationAccount, poolSourceAccount, poolDestinationAccount, liquidityMint, userLiquidityAccount) {
    try {
      if (!this.initialized) {
        throw new Error('Anchor client not initialized');
      }

      console.log(`Adding liquidity to pool ${poolAddress}`);
      console.log(`Source amount: ${sourceAmount}`);
      console.log(`Destination amount: ${destinationAmount}`);

      const tx = await this.program.methods
        .addLiquidity(
          new BN(sourceAmount),
          new BN(destinationAmount)
        )
        .accounts({
          liquidityPool: new PublicKey(poolAddress),
          user: this.wallet.publicKey, // This should be the user's account PDA
          userSourceAccount: new PublicKey(userSourceAccount),
          userDestinationAccount: new PublicKey(userDestinationAccount),
          poolSourceAccount: new PublicKey(poolSourceAccount),
          poolDestinationAccount: new PublicKey(poolDestinationAccount),
          liquidityMint: new PublicKey(liquidityMint),
          userLiquidityAccount: new PublicKey(userLiquidityAccount),
          poolAuthority: this.wallet.publicKey,
          owner: this.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log(`Liquidity added successfully: ${tx}`);

      return {
        success: true,
        transaction: tx,
        sourceAmount,
        destinationAmount
      };
    } catch (error) {
      console.error('Error adding liquidity:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Swap currencies using a liquidity pool
   */
  async swapCurrencies(poolAddress, amountIn, minimumAmountOut, userSourceAccount, userDestinationAccount, poolSourceAccount, poolDestinationAccount) {
    try {
      if (!this.initialized) {
        throw new Error('Anchor client not initialized');
      }

      console.log(`Swapping currencies in pool ${poolAddress}`);
      console.log(`Amount in: ${amountIn}`);
      console.log(`Minimum amount out: ${minimumAmountOut}`);

      // Create swap record account
      const swapRecord = web3.Keypair.generate();

      const tx = await this.program.methods
        .swapCurrencies(
          new BN(amountIn),
          new BN(minimumAmountOut)
        )
        .accounts({
          liquidityPool: new PublicKey(poolAddress),
          user: this.wallet.publicKey, // This should be the user's account PDA
          userSourceAccount: new PublicKey(userSourceAccount),
          userDestinationAccount: new PublicKey(userDestinationAccount),
          swapRecord: swapRecord.publicKey,
          poolSourceAccount: new PublicKey(poolSourceAccount),
          poolDestinationAccount: new PublicKey(poolDestinationAccount),
          poolAuthority: this.wallet.publicKey,
          owner: this.wallet.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([swapRecord])
        .rpc();

      console.log(`Swap completed successfully: ${tx}`);

      return {
        success: true,
        transaction: tx,
        swapRecord: swapRecord.publicKey.toString(),
        amountIn,
        minimumAmountOut
      };
    } catch (error) {
      console.error('Error swapping currencies:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get pool information
   */
  async getPoolInfo(poolAddress) {
    try {
      if (!this.initialized) {
        throw new Error('Anchor client not initialized');
      }

      console.log(`Getting pool info for ${poolAddress}`);

      const poolAccount = await this.program.account.liquidityPool.fetch(new PublicKey(poolAddress));

      return {
        success: true,
        pool: {
          name: poolAccount.name,
          admin: poolAccount.admin.toString(),
          sourceCurrency: poolAccount.sourceCurrency,
          destinationCurrency: poolAccount.destinationCurrency,
          sourceMint: poolAccount.sourceMint.toString(),
          destinationMint: poolAccount.destinationMint.toString(),
          exchangeRate: poolAccount.exchangeRate.toString(),
          poolFeeRate: poolAccount.poolFeeRate.toString(),
          totalSwapped: poolAccount.totalSwapped.toString(),
          totalVolume: poolAccount.totalVolume.toString(),
          lastUpdated: poolAccount.lastUpdated.toString(),
          isActive: poolAccount.isActive,
          createdAt: poolAccount.createdAt.toString()
        }
      };
    } catch (error) {
      console.error('Error getting pool info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * List all liquidity pools
   */
  async listLiquidityPools() {
    try {
      if (!this.initialized) {
        throw new Error('Anchor client not initialized');
      }

      console.log('Fetching all liquidity pools...');

      const pools = await this.program.account.liquidityPool.all();

      return {
        success: true,
        pools: pools.map(pool => ({
          address: pool.publicKey.toString(),
          name: pool.account.name,
          admin: pool.account.admin.toString(),
          sourceCurrency: pool.account.sourceCurrency,
          destinationCurrency: pool.account.destinationCurrency,
          sourceMint: pool.account.sourceMint.toString(),
          destinationMint: pool.account.destinationMint.toString(),
          exchangeRate: pool.account.exchangeRate.toString(),
          poolFeeRate: pool.account.poolFeeRate.toString(),
          totalSwapped: pool.account.totalSwapped.toString(),
          totalVolume: pool.account.totalVolume.toString(),
          lastUpdated: pool.account.lastUpdated.toString(),
          isActive: pool.account.isActive,
          createdAt: pool.account.createdAt.toString()
        }))
      };
    } catch (error) {
      console.error('Error listing liquidity pools:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new AnchorClient(); 