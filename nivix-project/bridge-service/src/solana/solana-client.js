/**
 * Solana Client Module
 * Handles connection to Solana blockchain and provides methods for interacting with Solana
 */

const { Connection, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const splToken = require('@solana/spl-token');
const TOKEN_PROGRAM_ID = splToken.TOKEN_PROGRAM_ID;
const ASSOCIATED_TOKEN_PROGRAM_ID = splToken.ASSOCIATED_TOKEN_PROGRAM_ID;
const fs = require('fs');
const path = require('path');
const os = require('os');

class SolanaClient {
  constructor(networkUrl = (process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com')) {
    this.connection = new Connection(networkUrl, 'confirmed');
    this.programId = new PublicKey('6WapLzABgaKEBBos6NTTyNJajhe2uFZ27MUpYAwWcBzM'); // Nivix program ID
    this.initialized = false;
    this.bridgeWallet = null;
  }

  /**
   * Initialize the Solana client with bridge wallet
   */
  async initialize() {
    try {
      // Load or create bridge wallet
      const walletPath = path.join(__dirname, '../../wallet/bridge-wallet.json');
      
      if (fs.existsSync(walletPath)) {
        const walletData = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
        this.bridgeWallet = Keypair.fromSecretKey(new Uint8Array(walletData));
        console.log('Loaded existing bridge wallet from', walletPath);
      } else {
        // Create a new wallet for the bridge
        this.bridgeWallet = Keypair.generate();
        
        // Ensure directory exists
        if (!fs.existsSync(path.join(__dirname, '../../wallet'))) {
          fs.mkdirSync(path.join(__dirname, '../../wallet'), { recursive: true });
        }
        
        // Save wallet
        fs.writeFileSync(
          walletPath,
          JSON.stringify(Array.from(this.bridgeWallet.secretKey)),
          'utf-8'
        );
        console.log('Created new bridge wallet at', walletPath);
        
        // Request airdrop for new wallet (for devnet)
        const airdropSignature = await this.connection.requestAirdrop(
          this.bridgeWallet.publicKey,
          1000000000 // 1 SOL
        );
        
        await this.connection.confirmTransaction(airdropSignature);
        console.log('Airdropped 1 SOL to bridge wallet');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing Solana client:', error);
      return false;
    }
  }

  /**
   * Get the balance of a Solana wallet
   * @param {string} walletAddress - The Solana wallet address
   * @returns {Promise<number>} - The balance in SOL
   */
  async getWalletBalance(walletAddress) {
    try {
      const publicKey = new PublicKey(walletAddress);
      const balance = await this.connection.getBalance(publicKey);
      return balance / 1000000000; // Convert lamports to SOL
    } catch (error) {
      console.error('Error getting wallet balance:', error);
      throw error;
    }
  }

  /**
   * Get the token balance for a specific SPL token
   * @param {string} walletAddress - The Solana wallet address
   * @param {string} tokenMintAddress - The token mint address
   * @returns {Promise<number>} - The token balance
   */
  async getTokenBalance(walletAddress, tokenMintAddress) {
    try {
      const walletPublicKey = new PublicKey(walletAddress);
      const tokenMintPublicKey = new PublicKey(tokenMintAddress);
      
      // Find the associated token account
      const associatedTokenAddress = await splToken.getAssociatedTokenAddress(
        tokenMintPublicKey,
        walletPublicKey,
        false,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      
      // Get token account info
      const tokenAccountInfo = await this.connection.getAccountInfo(associatedTokenAddress);
      
      if (!tokenAccountInfo) {
        return 0; // Account doesn't exist, so balance is 0
      }
      
      // Parse the token account data
      const tokenAccount = await this.connection.getTokenAccountBalance(associatedTokenAddress);
      return parseFloat(tokenAccount.value.uiAmount);
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  /**
   * Transfer SOL between wallets
   * @param {string} fromSecretKey - The sender's secret key (as Uint8Array or base58 string)
   * @param {string} toAddress - The recipient's wallet address
   * @param {number} amount - Amount to send in SOL
   * @returns {Promise<string>} - Transaction signature
   */
  async transferSol(fromSecretKey, toAddress, amount) {
    try {
      // Convert the amount to lamports
      const lamports = amount * 1000000000;
      
      // Create sender keypair from secret key
      let fromKeypair;
      if (typeof fromSecretKey === 'string') {
        // Assuming base58 encoded string
        fromKeypair = Keypair.fromSecretKey(Buffer.from(fromSecretKey, 'base58'));
      } else {
        // Assuming Uint8Array
        fromKeypair = Keypair.fromSecretKey(fromSecretKey);
      }
      
      const toPublicKey = new PublicKey(toAddress);
      
      // Create a transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromKeypair.publicKey,
          toPubkey: toPublicKey,
          lamports: lamports
        })
      );
      
      // Send the transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair]
      );
      
      return signature;
    } catch (error) {
      console.error('Error transferring SOL:', error);
      throw error;
    }
  }

  /**
   * Get a Solana account from the blockchain
   * @param {string} accountAddress - The account address to fetch
   * @returns {Promise<Object>} - The account info
   */
  async getAccountInfo(accountAddress) {
    try {
      const publicKey = new PublicKey(accountAddress);
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      return accountInfo;
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }

  /**
   * Send a raw, signed transaction provided as base64
   * @param {string} signedTxBase64 - The signed transaction in base64 encoding
   * @returns {Promise<string>} - Transaction signature
   */
  async sendSignedTransactionBase64(signedTxBase64) {
    try {
      const raw = Buffer.from(signedTxBase64, 'base64');
      const sig = await this.connection.sendRawTransaction(raw, {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });
      await this.connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (error) {
      console.error('Error sending signed transaction:', error);
      throw error;
    }
  }

  /**
   * Request airdrop of SOL (devnet)
   */
  async requestAirdrop(toAddress, solAmount = 1) {
    try {
      const pubkey = new PublicKey(toAddress);
      const sig = await this.connection.requestAirdrop(pubkey, Math.floor(solAmount * 1_000_000_000));
      await this.connection.confirmTransaction(sig, 'confirmed');
      return sig;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw error;
    }
  }

  /**
   * Create an SPL token mint with the bridge wallet as mint authority
   */
  async createMint(decimals = 9) {
    try {
      if (!this.initialized) await this.initialize();
      const mintPubkey = await splToken.createMint(
        this.connection,
        this.bridgeWallet,
        this.bridgeWallet.publicKey,
        this.bridgeWallet.publicKey,
        decimals,
        undefined,
        undefined,
        TOKEN_PROGRAM_ID
      );
      return mintPubkey.toBase58();
    } catch (error) {
      console.error('Error creating mint:', error);
      throw error;
    }
  }

  /**
   * Get or create associated token account for owner for a given mint
   */
  async getOrCreateAta(ownerAddress, mintAddress) {
    try {
      const owner = new PublicKey(ownerAddress);
      const mintPk = new PublicKey(mintAddress);
      const ata = await splToken.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.bridgeWallet,
        mintPk,
        owner,
        false,
        'confirmed',
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      return ata.address.toBase58();
    } catch (error) {
      console.error('Error getting/creating ATA:', error);
      throw error;
    }
  }

  /**
   * Mint tokens to owner's ATA
   */
  async mintTo(mintAddress, ownerAddress, amount, decimals = 9) {
    try {
      const mintPk = new PublicKey(mintAddress);
      const owner = new PublicKey(ownerAddress);
      const rawAmount = Math.floor(amount * Math.pow(10, decimals));
      const ata = await splToken.getOrCreateAssociatedTokenAccount(
        this.connection,
        this.bridgeWallet,
        mintPk,
        owner,
        false,
        'confirmed',
        undefined,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      );
      await splToken.mintTo(
        this.connection,
        this.bridgeWallet,
        mintPk,
        ata.address,
        this.bridgeWallet.publicKey,
        rawAmount,
        [],
        undefined,
        TOKEN_PROGRAM_ID
      );
      return { ata: ata.address.toBase58() };
    } catch (error) {
      console.error('Error minting to:', error);
      throw error;
    }
  }
}

module.exports = new SolanaClient(); 