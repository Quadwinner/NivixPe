require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { directInvokeChaincode } = require('./direct-invoke');
const { execPromise } = require('./exec-promise');
const { storeKYCDirectly, getKYCStatusDirectly } = require('./direct-kyc');
const { storeKYC, getKYC } = require('./file-storage');

// Resolve repo root (bridge-service/src -> repo root is ../..)
const PROJECT_ROOT = process.env.NIVIX_PROJECT_ROOT
  || process.env.FABRIC_PROJECT_ROOT
  || path.resolve(__dirname, '..', '..');

// Import the Solana client (working version)
const solanaClient = require('./solana/solana-client');

// Import the Anchor liquidity client
const anchorLiquidityClient = require('./solana/anchor-liquidity-client');

// Import off-ramp components
const OfframpEngine = require('./offramp/offramp-engine');
const USDCBridge = require('./stablecoin/usdc-bridge');

// Import on-ramp components
const OnrampEngine = require('./onramp/onramp-engine');

// Import compliance and admin components
const SanctionsScreeningService = require('./compliance/sanctions-screening');
const TravelRuleService = require('./compliance/travel-rule');
const OperationsDashboard = require('./admin/operations-dashboard');

// Import cross-border payment service

// Global variables for off-ramp services
let offrampEngine = null;
let usdcBridge = null;

// Global variables for on-ramp services
let onrampEngine = null;

// Global variables for compliance and admin services
let sanctionsScreening = null;
let travelRuleService = null;
let operationsDashboard = null;

const app = express();
const PORT = process.env.PORT || 3002;   

// Middleware
app.use(cors());
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Request received`);
  if (req.method === 'POST') {
    console.log('Request body:', JSON.stringify(req.body));
  } else if (req.method === 'GET' && req.params) {
    console.log('Request params:', JSON.stringify(req.params));
  }
  
  // Capture the original send function
  const originalSend = res.send;
  
  // Override the send function to log responses
  res.send = function(body) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - Response sent (${res.statusCode}) - Duration: ${duration}ms`);
    
    // Call the original send function
    return originalSend.call(this, body);
  };
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'nivix-bridge-service',
    mode: 'hyperledger',
    version: '2.0.0',
    features: {
      kyc: true,
      solana: solanaClient.initialized,
      hyperledger: true,
      liquidityPools: true,
      offramp: offrampEngine !== null,
      onramp: onrampEngine !== null,
      usdcBridge: usdcBridge !== null,
      treasury: offrampEngine !== null
    }
  });
});

// Storage for temporary KYC data if Hyperledger connection fails
const tempKYCData = new Map();

// Connect to Hyperledger Fabric
async function connectToFabric() {
  try {
    console.log('Attempting to connect to Hyperledger Fabric...');
    
    // First check if the network is running using docker
    try {
      const { stdout } = await execPromise('docker ps | grep "hyperledger/fabric-peer" | wc -l');
      const runningContainers = parseInt(stdout.trim());
      if (runningContainers === 0) {
        console.log('No Hyperledger Fabric containers are running. Please start the network first.');
        return null;
      }
      console.log(`Found ${runningContainers} running Hyperledger containers`);
    } catch (error) {
      console.error('Error checking Docker containers:', error);
    }
    
    // Check if the fabric-invoke.sh script can be executed
    const helperScriptPath = '/tmp/fabric-invoke.sh';
    if (!fs.existsSync(helperScriptPath)) {
      console.error(`Fabric invoke script not found at: ${helperScriptPath}`);
      return null;
    }
    
    // Test chaincode connectivity with a query for a known Solana address
    console.log('Testing chaincode connectivity with GetKYCStatus query...');
    try {
      const args = ['user123_solana_address'];
      const argsJson = JSON.stringify(args);
      const command = `NIVIX_PROJECT_ROOT="${PROJECT_ROOT}" ${helperScriptPath} "GetKYCStatus" '${argsJson}' "query"`;
      
      const { stdout, stderr } = await execPromise(command);
      
      if (stderr && stderr.includes('Error') && !stderr.includes('no KYC record found')) {
        console.error('Chaincode connection test error:', stderr);
        throw new Error(stderr);
      }
      
      console.log('Successfully connected to Hyperledger Fabric chaincode');
      return true;
    } catch (error) {
      console.error('Failed to connect to chaincode', error);
      return null;
    }
  } catch (error) {
    console.error('Error connecting to Hyperledger Fabric:', error);
    return null;
  }
}

// Function to store KYC data in Hyperledger or persistently
async function storeKYCData(kycData) {
  try {
    console.log('Attempting to store KYC data in Hyperledger Fabric');
    
    // Retry counter
    let retries = 0;
    const maxRetries = 3;
    
    // First, try to store using the direct method with retries
    while (retries < maxRetries) {
      try {
        const result = await storeKYCDirectly(kycData);
        console.log('KYC data submitted to Hyperledger Fabric successfully via direct method');
        
        // Also store in our persistent file storage as backup
        storeKYC(kycData.solanaAddress, kycData);
        
        // Log the submission in the KYC log file
        try {
          const logEntry = `${new Date().toISOString()} - KYC submission for ${kycData.solanaAddress} (${kycData.fullName})\n`;
          fs.appendFileSync(path.join(process.cwd(), 'kyc-submissions.log'), logEntry);
        } catch (logError) {
          console.error('Error logging KYC submission:', logError);
        }
        
        return result;
      } catch (directError) {
        console.error(`Error submitting KYC data to Hyperledger via direct method (attempt ${retries + 1}/${maxRetries}):`, directError);
        retries++;
        
        if (retries < maxRetries) {
          console.log(`Retrying KYC submission (attempt ${retries + 1}/${maxRetries})...`);
          // Wait briefly before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // If we've exhausted all retries, fall back to local storage
    console.error(`Failed to submit KYC data to Hyperledger after ${maxRetries} attempts. Falling back to temporary and persistent storage`);
    
    // Store in memory
    tempKYCData.set(kycData.solanaAddress, {
      ...kycData,
      kycVerified: false,
      verificationDate: kycData.verificationDate
    });
    
    // Store in persistent file storage
    storeKYC(kycData.solanaAddress, {
      ...kycData,
      kycVerified: false,
      verificationDate: kycData.verificationDate
    });
    
    // Log the submission in the KYC log file
    try {
      const logEntry = `${new Date().toISOString()} - KYC submission for ${kycData.solanaAddress} (${kycData.fullName})\n`;
      fs.appendFileSync(path.join(process.cwd(), 'kyc-submissions.log'), logEntry);
    } catch (logError) {
      console.error('Error logging KYC submission:', logError);
    }
    
    // Schedule a background retry task to eventually persist to blockchain
    setTimeout(async () => {
      try {
        console.log(`Attempting delayed blockchain submission for ${kycData.solanaAddress}...`);
        await storeKYCDirectly(kycData);
        console.log(`Delayed blockchain submission successful for ${kycData.solanaAddress}`);
      } catch (delayedError) {
        console.error(`Delayed blockchain submission failed for ${kycData.solanaAddress}:`, delayedError);
      }
    }, 5000); // Try again after 5 seconds
    
    return {
      success: true,
      verification_id: `kyc_${kycData.userId}`,
      status: 'pending',
      message: 'KYC data stored persistently due to Hyperledger error. Will retry submission.'
    };
  } catch (error) {
    console.error('Unhandled error in storeKYCData:', error);
    throw error;
  }
}

// KYC submission endpoint
app.post('/api/kyc/submit', async (req, res) => {
  try {
    // Format the KYC data
    const { 
      userId, 
      solanaAddress,
      fullName,
      countryCode,
      idDocuments
    } = req.body;
    
    // Generate verification date (current time)
    const verificationDate = new Date().toISOString();
    
    // Initial risk score (could be calculated based on various factors)
    const riskScore = 50;
    
    const kycData = {
      userId,
      solanaAddress,
      fullName,
      countryCode,
      idDocuments,
      verificationDate,
      riskScore
    };
    
    // Store KYC data in Hyperledger Fabric or temporarily in memory
    const result = await storeKYCData(kycData);
    
    // Return response
    res.status(200).json(result);
    
  } catch (error) {
    console.error('Error processing KYC submission:', error);
    res.status(500).json({
      success: false,
      message: `Failed to submit KYC data: ${error.message}`
    });
  }
});

// Function to get KYC status from Hyperledger or storage
async function getKYCStatus(solanaAddress) {
  try {
    console.log(`Attempting to get KYC status for ${solanaAddress} from Hyperledger`);
    
    // First, try to get status using the direct method
    try {
      const result = await getKYCStatusDirectly(solanaAddress);
      if (result) {
        console.log('KYC status retrieved successfully from Hyperledger');
        return result;
      }
    } catch (directError) {
      console.error('Error querying KYC status from Hyperledger via direct method:', directError);
    }
    
    // Try to get from temporary memory storage
    console.log(`Looking up KYC status for ${solanaAddress} in temporary storage`);
    const kycData = tempKYCData.get(solanaAddress);
    
    if (kycData) {
      console.log('Found KYC data in temporary storage');
      return {
        verified: kycData.kycVerified,
        userId: kycData.userId,
        status: kycData.kycVerified ? 'verified' : 'pending',
        countryCode: kycData.countryCode
      };
    }
    
    // If not found in memory, try persistent storage
    console.log(`Looking up KYC status for ${solanaAddress} in persistent storage`);
    const persistentData = getKYC(solanaAddress);
    
    if (persistentData) {
      console.log('Found KYC data in persistent storage');
      
      // Also update in-memory cache
      tempKYCData.set(solanaAddress, persistentData);
      
      return {
        verified: persistentData.kycVerified,
        userId: persistentData.userId,
        status: persistentData.kycVerified ? 'verified' : 'pending',
        countryCode: persistentData.countryCode
      };
    }
    
    console.log('No KYC data found in any storage');
    return null;
  } catch (error) {
    console.error('Unhandled error in getKYCStatus:', error);
    throw error;
  }
}

// KYC status check endpoint
app.get('/api/kyc/status/:solanaAddress', async (req, res) => {
  try {
    const { solanaAddress } = req.params;
    
    const kycStatus = await getKYCStatus(solanaAddress);
    
    if (!kycStatus) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: `No KYC record found for address ${solanaAddress}`
      });
    }
    
    res.status(200).json(kycStatus);
    
  } catch (error) {
    console.error('Error checking KYC status:', error);
    res.status(500).json({
      success: false,
      verified: false,
      message: `Failed to check KYC status: ${error.message}`
    });
  }
});

// Initialize the Solana client and transaction bridge
(async () => {
  try {
    await solanaClient.initialize();
    console.log('Solana client initialized');
    
    // Initialize Direct Liquidity Pool Client
    const liquidityInitialized = await anchorLiquidityClient.initialize();
    if (liquidityInitialized) {
      console.log('Direct Liquidity Pool Client initialized successfully');
    } else {
      console.log('Direct Liquidity Pool Client initialization failed');
    }
    
    // The transaction bridge initialization is removed as per the new_code.
    // The liquidity pools are now managed directly in memory.
  } catch (error) {
    console.error('Error initializing Solana/Bridge components:', error);
  }
})();

// New bridge service endpoints

// Get Solana wallet balance
app.get('/api/solana/balance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!solanaClient.initialized) {
      return res.status(503).json({
        success: false,
        message: 'Solana client not initialized'
      });
    }
    
    const balance = await solanaClient.getWalletBalance(address);
    
    res.json({
      success: true,
      address,
      balance,
      currency: 'SOL'
    });
  } catch (error) {
    console.error('Error getting wallet balance:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Devnet: airdrop SOL
app.post('/api/solana/airdrop', async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    if (!toAddress) return res.status(400).json({ success: false, message: 'toAddress required' });
    const sig = await solanaClient.requestAirdrop(toAddress, amount || 1);
    res.json({ success: true, signature: sig });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create an SPL token mint (dev use)
app.post('/api/solana/create-mint', async (req, res) => {
  try {
    const { decimals } = req.body || {};
    const mint = await solanaClient.createMint(decimals || 9);
    res.json({ success: true, mint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mint tokens to owner address
app.post('/api/solana/mint-to', async (req, res) => {
  try {
    const { mint, owner, amount, decimals } = req.body;
    if (!mint || !owner || !amount) return res.status(400).json({ success: false, message: 'mint, owner, amount required' });
    const result = await solanaClient.mintTo(mint, owner, Number(amount), decimals || 9);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get or create ATA
app.post('/api/solana/get-or-create-ata', async (req, res) => {
  try {
    const { mint, owner } = req.body;
    if (!mint || !owner) return res.status(400).json({ success: false, message: 'mint, owner required' });
    const ata = await solanaClient.getOrCreateAta(owner, mint);
    res.json({ success: true, ata });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Bridge wallet public key (mint authority)
app.get('/api/solana/bridge-wallet', async (req, res) => {
  try {
    if (!solanaClient.initialized) await solanaClient.initialize();
    res.json({ success: true, publicKey: solanaClient.bridgeWallet.publicKey.toBase58() });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Initiate a transaction
app.post('/api/bridge/initiate-transfer', async (req, res) => {
  try {
    const { 
      fromAddress, 
      toAddress, 
      amount,
      sourceCurrency,
      destinationCurrency,
      memo
    } = req.body;
    
    // The transaction bridge initialization is removed as per the new_code.
    // This endpoint is now a placeholder for future direct Solana transactions.
    
    if (!fromAddress || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: fromAddress, toAddress, amount'
      });
    }
    
    // Simulate a successful transaction for now
    console.log(`Simulating Solana transfer: ${amount} ${sourceCurrency} from ${fromAddress} to ${toAddress}`);
    
    res.json({
      success: true,
      transaction_id: `solana_transfer_${Date.now()}`,
      status: 'pending',
      message: 'Transaction initiated successfully (simulated)'
    });
  } catch (error) {
    console.error('Error initiating transfer:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction status
app.get('/api/bridge/transaction-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // The transaction bridge initialization is removed as per the new_code.
    // This endpoint is now a placeholder for future direct Solana transactions.
    
    res.json({
      success: true,
      transaction_id: id,
      status: 'completed', // Simulate completed status
      message: 'Transaction status retrieved (simulated)'
    });
  } catch (error) {
    console.error('Error getting transaction status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Build unsigned transfer explicitly
app.post('/api/solana/build-transfer', async (req, res) => {
  try {
    const { fromAddress, toAddress, amount, sourceCurrency, destinationCurrency, memo } = req.body;
    if (!fromAddress || !toAddress || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required parameters' });
    }
    // The transaction bridge initialization is removed as per the new_code.
    // This endpoint is now a placeholder for future direct Solana transactions.
    
    res.json({
      success: true,
      transaction_id: `solana_transfer_${Date.now()}`,
      status: 'pending',
      message: 'Unsigned transaction built (simulated)'
    });
  } catch (error) {
    console.error('Error building unsigned transfer:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit signed transaction
app.post('/api/solana/submit-signed', async (req, res) => {
  try {
    const { transaction_id: transactionId, signedTxBase64 } = req.body;
    if (!signedTxBase64) return res.status(400).json({ success: false, message: 'signedTxBase64 required' });
    // The transaction bridge initialization is removed as per the new_code.
    // This endpoint is now a placeholder for future direct Solana transactions.
    
    res.json({
      success: true,
      transaction_id: transactionId,
      status: 'completed', // Simulate completed status
      message: 'Signed transaction submitted (simulated)'
    });
  } catch (error) {
    console.error('Error submitting signed transaction:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get wallet transaction history
app.get('/api/bridge/wallet-transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // The transaction bridge initialization is removed as per the new_code.
    // This endpoint is now a placeholder for future direct Solana transactions.
    
    res.json({
      success: true,
      address,
      transactions: [] // No transactions simulated yet
    });
  } catch (error) {
    console.error('Error getting wallet transactions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Sync offline transaction
app.post('/api/bridge/sync-offline-transaction', async (req, res) => {
  try {
    const { 
      offlineTransactionId, 
      fromAddress, 
      toAddress, 
      amount,
      sourceCurrency,
      destinationCurrency,
      bluetoothTxId,
      signature,
      timestamp
    } = req.body;
    
    // The transaction bridge initialization is removed as per the new_code.
    // This endpoint is now a placeholder for future direct Solana transactions.
    
    if (!offlineTransactionId || !fromAddress || !toAddress || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    // TODO: Implement offline transaction syncing
    // This would involve:
    // 1. Verifying the transaction signature
    // 2. Recording the transaction in Hyperledger
    // 3. Executing the transaction on Solana
    
    res.json({
      success: true,
      message: 'Offline transaction sync not fully implemented yet',
      status: 'PENDING',
      transaction_id: offlineTransactionId
    });
  } catch (error) {
    console.error('Error syncing offline transaction:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Add these new API endpoints after the existing endpoints

// New API endpoint for direct Fabric queries
app.post('/api/fabric/query', async (req, res) => {
  try {
    const { fcn, args } = req.body;
    
    if (!fcn || !args) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: fcn and args' 
      });
    }
    
    console.log(`Executing Fabric query: ${fcn} with args:`, args);
    
    // Helper to normalize "not found" into a non-500 response (frontend expects this case)
    const isNotFoundKyc = (msg) => {
      const m = (msg || '').toLowerCase();
      return m.includes('no kyc record found');
    };

    // First try to execute via direct invocation
    try {
      const result = await directInvokeChaincode(fcn, args, true); // true = query mode
      return res.json({ 
        success: true, 
        data: result 
      });
    } catch (directError) {
      if (isNotFoundKyc(directError?.message)) {
        return res.status(200).json({
          success: false,
          notFound: true,
          data: null,
          error: directError.message
        });
      }
      console.error('Direct query failed, trying helper script:', directError);
      
      // Fall back to helper script if direct invocation fails
      const helperScriptPath = '/tmp/fabric-invoke.sh';
      if (fs.existsSync(helperScriptPath)) {
        try {
          const argsJson = JSON.stringify(args);
          const command = `NIVIX_PROJECT_ROOT="${PROJECT_ROOT}" ${helperScriptPath} "${fcn}" '${argsJson}' "query"`;
          
          const { stdout, stderr } = await execPromise(command);
          
          if (stderr && isNotFoundKyc(stderr)) {
            return res.status(200).json({
              success: false,
              notFound: true,
              data: null,
              error: stderr.trim()
            });
          }

          if (stderr && stderr.includes('Error')) {
            throw new Error(stderr);
          }
          
          // Always return a consistent shape for frontend parsing
          return res.json({
            success: true,
            data: (stdout || '').trim()
          });
        } catch (scriptError) {
          const scriptMsg = `${scriptError?.message || ''}\n${scriptError?.stderr || ''}`;
          if (isNotFoundKyc(scriptMsg)) {
            return res.status(200).json({
              success: false,
              notFound: true,
              data: null,
              error: (scriptError?.stderr || scriptError?.message || '').trim()
            });
          }
          console.error('Helper script query failed:', scriptError);
          throw scriptError;
        }
      } else {
        throw new Error('Helper script not found');
      }
    }
  } catch (error) {
    console.error('Error executing Fabric query:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error during Fabric query'
    });
  }
});

// New API endpoint for direct Fabric invocations
app.post('/api/fabric/invoke', async (req, res) => {
  try {
    const { fcn, args } = req.body;
    
    if (!fcn || !args) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: fcn and args' 
      });
    }
    
    console.log(`Executing Fabric invoke: ${fcn} with args:`, args);
    
    // First try to execute via direct invocation
    try {
      const result = await directInvokeChaincode(fcn, args, false); // false = invoke mode
      return res.json({ 
        success: true, 
        txId: 'direct_invoke_success', 
        result 
      });
    } catch (directError) {
      console.error('Direct invoke failed, trying helper script:', directError);
      
      // Fall back to helper script if direct invocation fails
      const helperScriptPath = '/tmp/fabric-invoke.sh';
      if (fs.existsSync(helperScriptPath)) {
        try {
          const argsJson = JSON.stringify(args);
          const command = `${helperScriptPath} "${fcn}" '${argsJson}' "invoke"`;
          
          const { stdout, stderr } = await execPromise(command);
          
          if (stderr && stderr.includes('Error')) {
            throw new Error(stderr);
          }
          
          // Always return a consistent shape for frontend parsing
          return res.json({
            success: true,
            data: (stdout || '').trim()
          });
        } catch (scriptError) {
          console.error('Helper script invoke failed:', scriptError);
          throw scriptError;
        }
      } else {
        throw new Error('Helper script not found');
      }
    }
  } catch (error) {
    console.error('Error executing Fabric invoke:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Unknown error during Fabric invoke'
    });
  }
});

// KYC status update endpoint for admin dashboard
app.post('/api/kyc/update-status', async (req, res) => {
  try {
    const { userId, solanaAddress, kycVerified, reason } = req.body;
    
    if (!userId || !solanaAddress || typeof kycVerified !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userId, solanaAddress, kycVerified'
      });
    }
    
    console.log(`Updating KYC status for user ${userId}, address ${solanaAddress}, verified: ${kycVerified}`);
    
    // Call the UpdateKYCStatus chaincode function
    const args = [userId, solanaAddress, kycVerified.toString(), reason || 'Status updated via admin dashboard'];
    
    try {
      const result = await directInvokeChaincode('UpdateKYCStatus', args, false); // false = invoke mode
      
      console.log('KYC status updated successfully via direct invoke');
      
      return res.json({
        success: true,
        message: 'KYC status updated successfully',
        result
      });
    } catch (directError) {
      console.error('Direct invoke failed, trying helper script:', directError);
      
      // Fall back to helper script
      const helperScriptPath = path.join(__dirname, '../../scripts/fabric-invoke.sh');
      if (fs.existsSync(helperScriptPath)) {
        try {
          const argsJson = JSON.stringify(args);
          const command = `${helperScriptPath} "UpdateKYCStatus" '${argsJson}' "invoke"`;
          
          const { stdout, stderr } = await execPromise(command);
          
          if (stderr && stderr.includes('Error')) {
            throw new Error(stderr);
          }
          
          console.log('KYC status updated successfully via helper script');
          
          return res.json({
            success: true,
            message: 'KYC status updated successfully',
            result: stdout
          });
        } catch (scriptError) {
          console.error('Helper script invoke failed:', scriptError);
          throw scriptError;
        }
      } else {
        throw new Error('Helper script not found');
      }
    }
  } catch (error) {
    console.error('Error updating KYC status:', error);
    return res.status(500).json({
      success: false,
      message: `Failed to update KYC status: ${error.message}`
    });
  }
});

// Platform Management Endpoints

// Initialize platform account
app.post('/api/platform/initialize', async (req, res) => {
  try {
    const { platformName = "Nivix Protocol", feeRate = 50 } = req.body;
    
    console.log('Initializing platform:', { platformName, feeRate });
    
    const result = await anchorLiquidityClient.initializePlatform(platformName, feeRate);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Platform initialized successfully',
        platformAccount: result.platformAccount,
        transaction: result.transaction
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to initialize platform',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error initializing platform:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// User Management Endpoints

// Register user with KYC
app.post('/api/users/register', async (req, res) => {
  try {
    const { 
      username, 
      kycStatus = true, 
      homeCurrency = "USD", 
      riskScore = 3, 
      countryCode = "US" 
    } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required'
      });
    }
    
    console.log('Registering user:', { username, kycStatus, homeCurrency, riskScore, countryCode });
    
    const result = await anchorLiquidityClient.registerUser(username, kycStatus, homeCurrency, riskScore, countryCode);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'User registered successfully',
        userAccount: result.userAccount,
        transaction: result.transaction
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to register user',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Token Account Management Endpoints

// Create token account
app.post('/api/tokens/create-account', async (req, res) => {
  try {
    const { mint, owner } = req.body;
    
    if (!mint || !owner) {
      return res.status(400).json({
        success: false,
        message: 'Mint and owner are required'
      });
    }
    
    console.log('Creating token account:', { mint, owner });
    
    const result = await anchorLiquidityClient.createTokenAccount(mint, owner);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Token account created successfully',
        tokenAccount: result.tokenAccount,
        transaction: result.transaction
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create token account',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating token account:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Liquidity Pool Endpoints

// Create a new liquidity pool
app.post('/api/pools/create', async (req, res) => {
  try {
    const { poolName, sourceCurrency, destinationCurrency, sourceMint, destinationMint, initialExchangeRate, poolFeeRate } = req.body;
    
    if (!poolName || !sourceCurrency || !destinationCurrency || !sourceMint || !destinationMint || !initialExchangeRate || !poolFeeRate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: poolName, sourceCurrency, destinationCurrency, sourceMint, destinationMint, initialExchangeRate, poolFeeRate'
      });
    }

    console.log('Creating liquidity pool:', { poolName, sourceCurrency, destinationCurrency, sourceMint, destinationMint, initialExchangeRate, poolFeeRate });

    const result = await anchorLiquidityClient.createLiquidityPool(
      poolName,
      sourceCurrency,
      destinationCurrency,
      sourceMint,
      destinationMint,
      initialExchangeRate,
      poolFeeRate
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Liquidity pool created successfully',
        pool: result.pool,
        transaction: result.transaction
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to create liquidity pool',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error creating liquidity pool:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Update pool exchange rate
app.post('/api/pools/update-rate', async (req, res) => {
  try {
    const { poolAddress, newExchangeRate } = req.body;
    
    if (!poolAddress || !newExchangeRate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: poolAddress, newExchangeRate'
      });
    }

    console.log('Updating pool rate:', { poolAddress, newExchangeRate });

    const result = await anchorLiquidityClient.updatePoolRate(poolAddress, newExchangeRate);

    if (result.success) {
      res.json({
        success: true,
        message: 'Pool rate updated successfully',
        newRate: result.newRate,
        transaction: result.transaction
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to update pool rate',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error updating pool rate:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add liquidity to a pool
app.post('/api/pools/add-liquidity', async (req, res) => {
  try {
    const { 
      poolAddress, 
      sourceAmount, 
      destinationAmount, 
      userSourceAccount, 
      userDestinationAccount, 
      poolSourceAccount, 
      poolDestinationAccount, 
      liquidityMint, 
      userLiquidityAccount 
    } = req.body;
    
    if (!poolAddress || !sourceAmount || !destinationAmount || !userSourceAccount || !userDestinationAccount || !poolSourceAccount || !poolDestinationAccount || !liquidityMint || !userLiquidityAccount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for adding liquidity'
      });
    }

    console.log('Adding liquidity to pool:', { poolAddress, sourceAmount, destinationAmount });

    const result = await anchorLiquidityClient.addLiquidity(
      poolAddress,
      sourceAmount,
      destinationAmount,
      userSourceAccount,
      userDestinationAccount,
      poolSourceAccount,
      poolDestinationAccount,
      liquidityMint,
      userLiquidityAccount
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Liquidity added successfully',
        sourceAmount: result.sourceAmount,
        destinationAmount: result.destinationAmount,
        transaction: result.transaction
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to add liquidity',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error adding liquidity:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Swap currencies using a pool
app.post('/api/pools/swap', async (req, res) => {
  try {
    const { 
      poolAddress, 
      amountIn, 
      minimumAmountOut, 
      userSourceAccount, 
      userDestinationAccount, 
      poolSourceAccount, 
      poolDestinationAccount 
    } = req.body;
    
    if (!poolAddress || !amountIn || !minimumAmountOut || !userSourceAccount || !userDestinationAccount || !poolSourceAccount || !poolDestinationAccount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields for swap'
      });
    }

    console.log('Swapping currencies:', { poolAddress, amountIn, minimumAmountOut });

    const result = await anchorLiquidityClient.swapCurrencies(
      poolAddress,
      amountIn,
      minimumAmountOut,
      userSourceAccount,
      userDestinationAccount,
      poolSourceAccount,
      poolDestinationAccount
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Swap completed successfully',
        swapRecord: result.swapRecord,
        amountIn: result.amountIn,
        minimumAmountOut: result.minimumAmountOut,
        amountOut: result.amountOut,
        poolFee: result.poolFee,
        transaction: result.transaction
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to complete swap',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error swapping currencies:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get pool information
app.get('/api/pools/:poolAddress', async (req, res) => {
  try {
    const { poolAddress } = req.params;
    
    if (!poolAddress) {
      return res.status(400).json({
        success: false,
        message: 'Pool address is required'
      });
    }

    console.log('Getting pool info for:', poolAddress);

    const result = await anchorLiquidityClient.getPoolInfo(poolAddress);

    if (result.success) {
      res.json({
        success: true,
        pool: result.pool
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Pool not found',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error getting pool info:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// List all liquidity pools
app.get('/api/pools', async (req, res) => {
  try {
    console.log('Listing all liquidity pools');

    const result = await anchorLiquidityClient.listLiquidityPools();

    if (result.success) {
      res.json({
        success: true,
        pools: result.pools
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to list pools',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error listing pools:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Simple Pool API endpoints (working version using standard SPL Token instructions)

// Test endpoint
app.get('/api/simple-pool/test', (req, res) => {
  res.json({ success: true, message: 'Simple pool test endpoint working' });
});

// Create unsigned swap transaction for frontend signing
app.post('/api/simple-pool/create-swap-transaction', async (req, res) => {
  try {
    const { userAddress, fromCurrency, toCurrency, amount } = req.body;
    
    if (!userAddress || !fromCurrency || !toCurrency || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters: userAddress, fromCurrency, toCurrency, amount' 
      });
    }

    console.log('🔄 Creating unsigned swap transaction:', { userAddress, fromCurrency, toCurrency, amount });

    // Get exchange rate
    const exchangeRate = simplePoolClient.getExchangeRate(fromCurrency, toCurrency);
    console.log(`📊 Backend exchange rate calculation: ${fromCurrency} → ${toCurrency} = ${exchangeRate}`);

    const result = await simplePoolClient.createUnsignedSwapTransaction(
      userAddress, 
      fromCurrency, 
      toCurrency, 
      amount,
      exchangeRate
    );

    if (result.success) {
      res.json({
        success: true,
        transaction: result.transaction,
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        feeAmount: result.feeAmount,
        exchangeRate: result.exchangeRate,
        fromCurrency: result.fromCurrency,
        toCurrency: result.toCurrency,
        userFromAccount: result.userFromAccount,
        userToAccount: result.userToAccount,
        treasuryFromAccount: result.treasuryFromAccount,
        treasuryToAccount: result.treasuryToAccount
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error creating swap transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Submit signed swap transaction
app.post('/api/simple-pool/submit-swap-transaction', async (req, res) => {
  try {
    const { signedTransaction } = req.body;
    
    if (!signedTransaction) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameter: signedTransaction' 
      });
    }

    console.log('🔄 Submitting signed swap transaction...');

    const result = await simplePoolClient.submitSignedSwapTransaction(signedTransaction);

    if (result.success) {
      res.json({
        success: true,
        signature: result.signature,
        message: 'Swap transaction submitted successfully'
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('❌ Error submitting swap transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Perform a simple token swap
app.post('/api/simple-pool/swap', async (req, res) => {
  try {
    const { userAddress, fromCurrency, toCurrency, amount } = req.body;
    
    if (!userAddress || !fromCurrency || !toCurrency || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userAddress, fromCurrency, toCurrency, amount'
      });
    }

    console.log(`🔄 Simple pool swap request: ${amount} ${fromCurrency} → ${toCurrency} for ${userAddress}`);

    // Get exchange rate
    const exchangeRate = simplePoolClient.getExchangeRate(fromCurrency, toCurrency);
    
    const result = await simplePoolClient.performSwap(
      userAddress,
      fromCurrency,
      toCurrency,
      amount,
      exchangeRate,
      0.003 // 0.3% fee
    );

    if (result.success) {
      res.json({
        success: true,
        message: 'Swap completed successfully',
        signature: result.signature,
        fromAmount: result.fromAmount,
        toAmount: result.toAmount,
        feeAmount: result.feeAmount,
        exchangeRate: result.exchangeRate,
        fromCurrency: result.fromCurrency,
        toCurrency: result.toCurrency
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Swap failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error('❌ Simple pool swap error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get pool balance for a specific currency
app.get('/api/simple-pool/balance/:currency', async (req, res) => {
  try {
    const { currency } = req.params;
    
    const balance = await simplePoolClient.getPoolBalance(currency.toUpperCase());
    
    res.json({
      success: true,
      balance: balance
    });
  } catch (error) {
    console.error('❌ Get pool balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get all pool balances
app.get('/api/simple-pool/balances', async (req, res) => {
  try {
    const balances = await simplePoolClient.getAllPoolBalances();
    
    res.json({
      success: true,
      balances: balances
    });
  } catch (error) {
    console.error('❌ Get all pool balances error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get exchange rate between currencies
app.get('/api/simple-pool/rate/:fromCurrency/:toCurrency', async (req, res) => {
  try {
    const { fromCurrency, toCurrency } = req.params;
    
    const rate = simplePoolClient.getExchangeRate(fromCurrency.toUpperCase(), toCurrency.toUpperCase());
    
    res.json({
      success: true,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      rate: rate
    });
  } catch (error) {
    console.error('❌ Get exchange rate error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Add pool to cache (for testing)
app.post('/api/pools/add-to-cache', async (req, res) => {
  try {
    const { poolAddress, poolData } = req.body;
    
    if (!poolAddress || !poolData) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: poolAddress, poolData'
      });
    }

    console.log('Adding pool to cache:', poolAddress);
    
    anchorLiquidityClient.addPoolToCache(poolAddress, poolData);

    res.json({
      success: true,
      message: 'Pool added to cache successfully',
      poolAddress
    });
  } catch (error) {
    console.error('Error adding pool to cache:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// ==================== OFF-RAMP API ENDPOINTS ====================

// Initialize off-ramp services
async function initializeOfframpServices() {
  try {
    console.log('🚀 Initializing off-ramp services...');
    
    // Initialize Off-ramp Engine
    offrampEngine = new OfframpEngine();
    await offrampEngine.initialize();
    
    // Initialize USDC Bridge
    usdcBridge = new USDCBridge();
    await usdcBridge.initialize();
    
    console.log('✅ Off-ramp services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ Off-ramp services initialization failed:', error);
    return false;
  }
}

// Get withdrawal quote
app.post('/api/offramp/quote', async (req, res) => {
  try {
    const { fromCurrency, toCurrency, amount, corridor, paymentMethod } = req.body;
    
    if (!offrampEngine) {
      return res.status(503).json({
        success: false,
        message: 'Off-ramp service not initialized'
      });
    }

    const quote = await offrampEngine.getWithdrawalQuote({
      fromCurrency,
      toCurrency,
      amount,
      corridor,
      paymentMethod
    });

    res.json({
      success: true,
      quote
    });
  } catch (error) {
    console.error('❌ Quote generation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Initiate withdrawal
app.post('/api/offramp/initiate', async (req, res) => {
  try {
    const { quoteId, userAddress, beneficiaryDetails, burnTransactionHash, kycVerified } = req.body;

    // Normalize beneficiary details to expected structure
    const bank = beneficiaryDetails?.bank_account || {};
    const normalizedBeneficiary = {
      name: beneficiaryDetails?.name || beneficiaryDetails?.accountName || bank?.account_holder_name,
      email: beneficiaryDetails?.email,
      phone: beneficiaryDetails?.phone,
      accountNumber: beneficiaryDetails?.accountNumber || bank?.account_number,
      ifscCode: beneficiaryDetails?.ifscCode || beneficiaryDetails?.ifsc || bank?.ifsc_code,
      bank_account: {
        account_number: bank?.account_number || beneficiaryDetails?.accountNumber,
        ifsc_code: bank?.ifsc_code || beneficiaryDetails?.ifscCode || beneficiaryDetails?.ifsc,
        account_holder_name: bank?.account_holder_name || beneficiaryDetails?.name || beneficiaryDetails?.accountName
      },
      address: beneficiaryDetails?.address,
      accountType: beneficiaryDetails?.accountType || 'bank_transfer'
    };
    
    if (!offrampEngine) {
      return res.status(503).json({
        success: false,
        message: 'Off-ramp service not initialized'
      });
    }

    const result = await offrampEngine.initiateWithdrawal({
      quoteId,
      userAddress,
      beneficiaryDetails: normalizedBeneficiary,
      burnTransactionHash,
      kycVerified
    });

    // Include commonly-used summary fields at the top level for UI convenience
    res.json({
      success: true,
      // Top-level hints for frontend rendering
      routeUsed: result.routeUsed || result.method || result.provider || 'cashfree_direct',
      provider: result.provider || result.method || 'cashfree',
      status: result.status || 'PROCESSING',
      payoutReference: result.payoutReference,
      burnTransactionHash: result.burnTransactionHash,
      // Full object preserved
      transaction: result
    });
  } catch (error) {
    console.error('❌ Withdrawal initiation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get transaction status
app.get('/api/offramp/status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!offrampEngine) {
      return res.status(503).json({
        success: false,
        message: 'Off-ramp service not initialized'
      });
    }

    const status = await offrampEngine.getTransactionStatus(transactionId);

    res.json({
      success: true,
      transaction: status
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
});

// Cancel withdrawal
app.post('/api/offramp/cancel/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;
    
    if (!offrampEngine) {
      return res.status(503).json({
        success: false,
        message: 'Off-ramp service not initialized'
      });
    }

    const result = await offrampEngine.cancelWithdrawal(transactionId, reason);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('❌ Withdrawal cancellation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user transactions
app.get('/api/offramp/transactions/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!offrampEngine) {
      return res.status(503).json({
        success: false,
        message: 'Off-ramp service not initialized'
      });
    }

    const transactions = await offrampEngine.getUserTransactions(userAddress);

    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('❌ Transaction history error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Razorpay webhook endpoint
app.post('/api/razorpay/webhook', async (req, res) => {
  try {
    const webhookData = req.body;
    const signature = req.headers['x-razorpay-signature'];
    const eventId = req.headers['x-razorpay-event-id'];
    
    console.log('🔔 Received Razorpay webhook:', {
      event: webhookData.event,
      eventId: eventId,
      hasSignature: !!signature
    });

    // Verify webhook signature (in production, you should verify this)
    if (!signature) {
      console.warn('⚠️ Webhook received without signature');
    }

    // Handle different webhook events
    switch (webhookData.event) {
      case 'payout.processed':
        console.log('✅ Payout processed:', webhookData.payload.payout.entity.id);
        // Update transaction status in your system
        break;
      
      case 'payout.failed':
        console.log('❌ Payout failed:', webhookData.payload.payout.entity.id);
        // Handle failed payout
        break;
      
      case 'payout.reversed':
        console.log('🔄 Payout reversed:', webhookData.payload.payout.entity.id);
        // Handle reversed payout
        break;
      
      default:
        console.log('📝 Unhandled webhook event:', webhookData.event);
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully',
      eventId: eventId
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
});

// Get treasury status (admin endpoint)
app.get('/api/treasury/status', async (req, res) => {
  try {
    if (!offrampEngine) {
      return res.status(503).json({
        success: false,
        message: 'Off-ramp service not initialized'
      });
    }

    const status = await offrampEngine.getSystemStatus();

    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('❌ Treasury status error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// USDC conversion endpoints
app.post('/api/usdc/convert-to', async (req, res) => {
  try {
    const { fromCurrency, amount, userWallet } = req.body;
    
    if (!usdcBridge) {
      return res.status(503).json({
        success: false,
        message: 'USDC bridge not initialized'
      });
    }

    const result = await usdcBridge.convertToUSDC(fromCurrency, amount, userWallet);

    res.json({
      success: true,
      conversion: result
    });
  } catch (error) {
    console.error('❌ USDC conversion error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

app.post('/api/usdc/convert-from', async (req, res) => {
  try {
    const { toCurrency, usdcAmount, userWallet } = req.body;
    
    if (!usdcBridge) {
      return res.status(503).json({
        success: false,
        message: 'USDC bridge not initialized'
      });
    }

    const result = await usdcBridge.convertFromUSDC(toCurrency, usdcAmount, userWallet);

    res.json({
      success: true,
      conversion: result
    });
  } catch (error) {
    console.error('❌ USDC conversion error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get USDC balance
app.get('/api/usdc/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    
    if (!usdcBridge) {
      return res.status(503).json({
        success: false,
        message: 'USDC bridge not initialized'
      });
    }

    const balance = await usdcBridge.getUSDCBalance(walletAddress);

    res.json({
      success: true,
      balance,
      currency: 'USDC'
    });
  } catch (error) {
    console.error('❌ USDC balance error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Exchange rate endpoint
app.get('/api/rates/:fromCurrency/:toCurrency', async (req, res) => {
  try {
    const { fromCurrency, toCurrency } = req.params;
    
    if (!usdcBridge) {
      return res.status(503).json({
        success: false,
        message: 'USDC bridge not initialized'
      });
    }

    const rate = await usdcBridge.getExchangeRate(fromCurrency, toCurrency);

    res.json({
      success: true,
      fromCurrency,
      toCurrency,
      rate,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ Exchange rate error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// ==================== END OFF-RAMP ENDPOINTS ====================

// ==================== ON-RAMP API ENDPOINTS ====================

// Initialize on-ramp services
async function initializeOnrampServices() {
  try {
    console.log('🚀 Initializing on-ramp services...');
    
    // Initialize On-ramp Engine
    onrampEngine = new OnrampEngine();
    await onrampEngine.initialize();
    
    console.log('✅ On-ramp services initialized successfully');
    return true;
  } catch (error) {
    console.error('❌ On-ramp services initialization failed:', error);
    return false;
  }
}

// Create on-ramp order (Step 1: User wants to buy crypto)
app.post('/api/onramp/create-order', async (req, res) => {
  try {
    const { userAddress, cryptoAmount, fiatAmount, cryptoCurrency, fiatCurrency, userEmail, userPhone, automatedTransfer, recipientDetails, transferType } = req.body;
    
    if (!onrampEngine) {
      return res.status(503).json({ 
        success: false, 
        error: 'On-ramp service not initialized' 
      });
    }

    console.log('🔥 DEBUG: API endpoint hit - Creating on-ramp order:', { userAddress, cryptoAmount, fiatAmount, cryptoCurrency, fiatCurrency, automatedTransfer, transferType });

    const result = await onrampEngine.createOrder({
      userAddress,
      cryptoAmount,
      fiatAmount,
      cryptoCurrency,
      fiatCurrency,
      userEmail,
      userPhone,
      ipAddress: req.ip,
      // Pass automated transfer info to onramp engine
      automatedTransfer,
      recipientDetails,
      transferType
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Create on-ramp order error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create payment for order (Step 2: Generate Razorpay payment)
app.post('/api/onramp/create-payment', async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!onrampEngine) {
      return res.status(503).json({ 
        success: false, 
        error: 'On-ramp service not initialized' 
      });
    }

    console.log('💳 Creating payment for order:', orderId);

    const result = await onrampEngine.createPayment(orderId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Create payment error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Razorpay webhook for on-ramp (Step 3: Handle payment completion)
app.post('/api/onramp/razorpay-webhook', async (req, res) => {
  try {
    console.log('🔔 On-ramp Razorpay webhook received:', req.body);
    
    if (!onrampEngine) {
      return res.status(503).json({ 
        success: false, 
        error: 'On-ramp service not initialized' 
      });
    }

    const webhookData = {
      event: req.body.event,
      payload: req.body.payload
    };

    const result = await onrampEngine.processPaymentWebhook(webhookData);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ On-ramp webhook error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Verify Razorpay payment (called from frontend after payment success)
app.post('/api/onramp/verify-payment', async (req, res) => {
  try {
    console.log('✅ Verifying Razorpay payment:', req.body);
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required payment verification parameters' 
      });
    }

    if (!onrampEngine) {
      return res.status(503).json({ 
        success: false, 
        error: 'On-ramp service not initialized' 
      });
    }

    const verificationResult = await onrampEngine.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId
    });

    if (verificationResult.success) {
      res.status(200).json(verificationResult);
    } else {
      res.status(400).json(verificationResult);
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get on-ramp order status
app.get('/api/onramp/order-status/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!onrampEngine) {
      return res.status(503).json({ 
        success: false, 
        error: 'On-ramp service not initialized' 
      });
    }

    console.log('📊 Getting on-ramp order status:', orderId);

    const result = await onrampEngine.getOrderStatus(orderId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error) {
    console.error('❌ Get order status error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Search onramp orders by offramp order ID for automated transfers
app.get('/api/onramp/search-by-offramp/:offrampOrderId', async (req, res) => {
  try {
    const { offrampOrderId } = req.params;

    if (!onrampEngine) {
      return res.status(503).json({
        success: false,
        error: 'On-ramp service not initialized'
      });
    }

    console.log('🔍 Searching for onramp order with offrampOrderId:', offrampOrderId);

    // Search through all orders to find one with matching offrampOrderId
    const result = await onrampEngine.getAllOrders();
    if (result.success) {
      const matchingOrder = result.orders.find(order =>
        order.offrampOrderId === offrampOrderId
      );

      if (matchingOrder) {
        console.log('✅ Found matching onramp order:', matchingOrder.id);
        res.status(200).json({
          success: true,
          order: matchingOrder
        });
      } else {
        console.log('❌ No onramp order found with offrampOrderId:', offrampOrderId);
        res.status(404).json({
          success: false,
          error: 'No onramp order found with the specified offramp order ID'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to search orders'
      });
    }
  } catch (error) {
    console.error('❌ Search by offramp order ID error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Complete burn and trigger payout for automated transfers
app.post('/api/offramp/complete-burn', async (req, res) => {
  try {
    const { offrampOrderId, burnTransactionHash, userAddress } = req.body;

    console.log('🔥 Completing burn for automated transfer:', { offrampOrderId, burnTransactionHash, userAddress });

    if (!offrampEngine) {
      return res.status(503).json({
        success: false,
        error: 'Off-ramp service not initialized'
      });
    }

    const result = await offrampEngine.completeBurnAndPayout({
      offrampOrderId,
      burnTransactionHash,
      userAddress
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Complete burn error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get user's on-ramp orders
app.get('/api/onramp/user-orders/:userAddress', async (req, res) => {
  try {
    const { userAddress } = req.params;
    
    if (!onrampEngine) {
      return res.status(503).json({ 
        success: false, 
        error: 'On-ramp service not initialized' 
      });
    }

    console.log('📋 Getting user on-ramp orders:', userAddress);

    const result = await onrampEngine.getUserOrders(userAddress);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Get user orders error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get on-ramp system statistics (admin endpoint)
app.get('/api/onramp/stats', async (req, res) => {
  try {
    if (!onrampEngine) {
      return res.status(503).json({ 
        success: false, 
        error: 'On-ramp service not initialized' 
      });
    }

    console.log('📊 Getting on-ramp system stats');

    const result = await onrampEngine.getSystemStats();

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('❌ Get system stats error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Debug endpoint for testing exchange rates
app.get('/api/debug/exchange-rate/:from/:to', async (req, res) => {
  try {
    const { from, to } = req.params;
    
    if (!onrampEngine) {
      return res.status(503).json({ 
        success: false, 
        error: 'On-ramp service not initialized' 
      });
    }

    const exchangeRateService = onrampEngine.exchangeRateService;
    if (!exchangeRateService) {
      return res.status(500).json({ 
        success: false, 
        error: 'Exchange rate service not available' 
      });
    }

    console.log(`🔍 Debug: Getting exchange rate ${from} -> ${to}`);
    const rate = await exchangeRateService.getExchangeRate(from, to);
    console.log(`📊 Debug: Exchange rate result:`, rate);

    res.json({
      success: true,
      from,
      to,
      rate,
      type: typeof rate
    });

  } catch (error) {
    console.error('❌ Debug exchange rate error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==================== END ON-RAMP ENDPOINTS ====================

// Initialize compliance services
async function initializeComplianceServices() {
  try {
    console.log('🛡️ Initializing compliance services...');
    
    // Initialize sanctions screening
    sanctionsScreening = new SanctionsScreeningService();
    
    // Initialize travel rule service
    travelRuleService = new TravelRuleService();
    
    console.log('✅ Compliance services initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize compliance services:', error);
    return false;
  }
}

// Initialize admin services
async function initializeAdminServices() {
  try {
    console.log('📊 Initializing admin services...');
    
    // Initialize operations dashboard
    operationsDashboard = new OperationsDashboard();
    
    console.log('✅ Admin services initialized successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize admin services:', error);
    return false;
  }
}

// === COMPLIANCE ENDPOINTS ===

// Sanctions screening endpoint
app.post('/api/compliance/sanctions-screen', async (req, res) => {
  try {
    if (!sanctionsScreening) {
      return res.status(503).json({
        success: false,
        error: 'Sanctions screening service not available'
      });
    }
    
    const { user } = req.body;
    
    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'User data is required'
      });
    }
    
    const screeningResult = await sanctionsScreening.screenUser(user);
    
    res.json({
      success: true,
      screening: screeningResult
    });
    
  } catch (error) {
    console.error('❌ Sanctions screening failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Travel rule check endpoint
app.post('/api/compliance/travel-rule-check', async (req, res) => {
  try {
    if (!travelRuleService) {
      return res.status(503).json({
        success: false,
        error: 'Travel rule service not available'
      });
    }
    
    const { transaction } = req.body;
    
    if (!transaction) {
      return res.status(400).json({
        success: false,
        error: 'Transaction data is required'
      });
    }
    
    const requirement = travelRuleService.checkTravelRuleRequirement(transaction);
    
    res.json({
      success: true,
      requirement
    });
    
  } catch (error) {
    console.error('❌ Travel rule check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get compliance statistics
app.get('/api/compliance/stats', async (req, res) => {
  try {
    const stats = {
      sanctions: sanctionsScreening ? sanctionsScreening.getScreeningStats() : null,
      travel_rule: travelRuleService ? travelRuleService.getComplianceStats() : null,
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('❌ Failed to get compliance stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// === ADMIN ENDPOINTS ===

// System overview dashboard
app.get('/api/admin/dashboard', async (req, res) => {
  try {
    if (!operationsDashboard) {
      return res.status(503).json({
        success: false,
        error: 'Operations dashboard not available'
      });
    }
    
    const overview = await operationsDashboard.getSystemOverview();
    
    res.json({
      success: true,
      dashboard: overview
    });
    
  } catch (error) {
    console.error('❌ Dashboard request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// System health endpoint
app.get('/api/admin/health', async (req, res) => {
  try {
    if (!operationsDashboard) {
      return res.status(503).json({
        success: false,
        error: 'Operations dashboard not available'
      });
    }
    
    const health = await operationsDashboard.getSystemHealth();
    
    res.json({
      success: true,
      health
    });
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Transaction metrics endpoint
app.get('/api/admin/metrics/transactions', async (req, res) => {
  try {
    if (!operationsDashboard) {
      return res.status(503).json({
        success: false,
        error: 'Operations dashboard not available'
      });
    }
    
    const metrics = await operationsDashboard.getTransactionMetrics();
    
    res.json({
      success: true,
      metrics
    });
    
  } catch (error) {
    console.error('❌ Transaction metrics request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Treasury status endpoint
app.get('/api/admin/treasury', async (req, res) => { 
  try {
    if (!operationsDashboard) {
      return res.status(503).json({
        success: false,
        error: 'Operations dashboard not available'
      });
    }
    
    const treasury = await operationsDashboard.getTreasuryStatus();
    
    res.json({
      success: true,
      treasury
    });
    
  } catch (error) {
    console.error('❌ Treasury status request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Alerts endpoint
app.get('/api/admin/alerts', async (req, res) => {
  try {
    if (!operationsDashboard) {
      return res.status(503).json({
        success: false,
        error: 'Operations dashboard not available'
      });
    }
    
    const alerts = operationsDashboard.getActiveAlerts();
    
    res.json({
      success: true,
      alerts
    });
    
  } catch (error) {
    console.error('❌ Alerts request failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Nivix Bridge Service',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    cashfree: {
      client_id: process.env.CASHFREE_CLIENT_ID ? 'configured' : 'missing',
      client_secret: process.env.CASHFREE_CLIENT_SECRET ? 'configured' : 'missing',
      testing_mode: process.env.TESTING_MODE || 'false',
      force_real_cashfree: process.env.FORCE_REAL_CASHFREE || 'false'
    }
  });
});

// Cashfree Testing Endpoints
app.post('/api/test/cashfree-auth', async (req, res) => {
  try {
    console.log('🧪 Testing Cashfree token-based authentication...');
    
    if (!offrampEngine || !offrampEngine.fiatPayoutService) {
      return res.status(503).json({
        success: false,
        error: 'Fiat payout service not available'
      });
    }
    
    const token = await offrampEngine.fiatPayoutService.getCashfreeAuthToken();
    
    res.json({
      success: true,
      token: token.substring(0, 30) + '...', // Show partial token for security
      message: 'Cashfree bearer token obtained successfully',
      clientId: process.env.CASHFREE_CLIENT_ID ? process.env.CASHFREE_CLIENT_ID.substring(0, 10) + '...' : 'Not set',
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
      tokenLength: token.length,
      validFor: '600 seconds (10 minutes)'
    });
    
  } catch (error) {
    console.error('❌ Cashfree token test failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/test/cashfree-payout', async (req, res) => {
  try {
    console.log('🧪 Testing Cashfree payout...');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    
    if (!offrampEngine || !offrampEngine.fiatPayoutService) {
      return res.status(503).json({
        success: false,
        error: 'Fiat payout service not available'
      });
    }
    
    const result = await offrampEngine.fiatPayoutService.processPayoutToRecipient(req.body);
    
    res.json(result);
    
  } catch (error) {
    console.error('❌ Cashfree payout test failed:', error.message);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Nivix Bridge Service running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  
  console.log('Attempting to connect to Hyperledger Fabric...');
  connectToFabric().then(connection => {
    if (connection) {
      console.log('Successfully connected to Hyperledger Fabric');
    } else {
      console.log('Failed to connect to Hyperledger Fabric - temporarily storing KYC data in memory');
      console.log('Will try to reconnect to Hyperledger Fabric on each request');
    }
  });
  
  // Initialize compliance and admin services first (independent of other services)
  console.log('Initializing compliance and admin services...');
  initializeComplianceServices().then(async () => {
    await initializeAdminServices();
    console.log('✅ Compliance and admin services ready');
  }).catch(error => {
    console.error('❌ Failed to initialize compliance/admin services:', error);
  });
  
  // Initialize off-ramp services
  console.log('Initializing off-ramp services...');
  initializeOfframpServices().then(async (success) => {
    if (success) {
      console.log('✅ Off-ramp services ready');
    } else {
      console.log('⚠️ Off-ramp services failed to initialize - some endpoints may not work');
    }
  });
  
  // Initialize on-ramp services
  console.log('Initializing on-ramp services...');
  initializeOnrampServices().then(success => {
    if (success) {
      console.log('✅ On-ramp services ready');
    } else {
      console.log('⚠️ On-ramp services failed to initialize - some endpoints may not work');
    }
  });
});