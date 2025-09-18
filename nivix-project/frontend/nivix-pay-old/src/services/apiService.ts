// Bridge base URL
const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');

// No mock balances; real data fetched from bridge

// No mock transactions; real data fetched from bridge

// Exchange rates service not yet wired; disable conversion UI for now

/**
 * Fetch wallet data for a user
 * @param walletAddress The Solana wallet address
 * @returns Promise with wallet data
 */
export const fetchWalletData = async (walletAddress?: string): Promise<Array<{ id: string; currency: string; balance: number; value_usd: number; icon: string }>> => {
  if (!walletAddress) return [];
  const res = await fetch(`${BRIDGE_URL}/api/solana/balance/${walletAddress}`);
  if (!res.ok) throw new Error('Failed to fetch wallet balance');
  const data = await res.json();
  const balance = typeof data.balance === 'number' ? data.balance : 0;
  return [
    { id: 'SOL', currency: 'SOL', balance, value_usd: 0, icon: '♦️' }
  ];
};

/**
 * Fetch transaction history for a user
 * @param walletAddress The Solana wallet address
 * @returns Promise with transaction history
 */
export const fetchTransactionHistory = async (walletAddress?: string): Promise<Array<{ id: string; type: string; amount: number; currency: string; from: string; to: string; date: string; status: string }>> => {
  if (!walletAddress) return [];
  const res = await fetch(`${BRIDGE_URL}/api/bridge/wallet-transactions/${walletAddress}`);
  if (!res.ok) throw new Error('Failed to fetch wallet transactions');
  const payload = await res.json();
  const txs = Array.isArray(payload.transactions) ? payload.transactions : [];
  return txs.map((tx: any) => {
    const isSender = tx.fromAddress === walletAddress;
    return {
      id: tx.id,
      type: isSender ? 'sent' : 'received',
      amount: Number(tx.amount) || 0,
      currency: tx.destinationCurrency || tx.sourceCurrency || 'SOL',
      from: tx.fromAddress,
      to: tx.toAddress,
      date: tx.created || new Date().toISOString(),
      status: tx.status || 'COMPLETED'
    };
  });
};

/**
 * Check KYC status for a user
 * @param walletAddress The Solana wallet address
 * @returns Promise with KYC status
 */
export const checkKYCStatus = async (walletAddress?: string): Promise<{ verified: boolean }> => {
  try {
    if (!walletAddress) {
      return { verified: false };
    }
    
    // Call the actual API endpoint
    const response = await fetch(`${BRIDGE_URL}/api/kyc/status/${walletAddress}`);
    
    if (response.status === 404) {
      return { verified: false };
    }
    
    if (!response.ok) {
      throw new Error('Failed to check KYC status');
    }
    
    const result = await response.json();
    return { verified: result?.status === 'approved' || result?.kycVerified === true };
  } catch (error) {
    console.error('Error checking KYC status:', error);
    return { verified: false };
  }
};

/**
 * Send a payment transaction
 * @param data Transaction data
 * @returns Promise with transaction result
 */
export const sendPayment = async (data: {
  from: string;
  to: string;
  amount: number;
  currency: string;
  memo?: string;
}) => {
  const res = await fetch(`${BRIDGE_URL}/api/bridge/initiate-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromAddress: data.from,
      toAddress: data.to,
      amount: data.amount,
      sourceCurrency: data.currency,
      destinationCurrency: data.currency,
      memo: data.memo || ''
    })
  });
  if (!res.ok) throw new Error('Failed to initiate transfer');
  return await res.json();
};

// Build unsigned transfer (user-signed flow)
export const buildUnsignedTransfer = async (data: {
  from: string;
  to: string;
  amount: number;
  sourceCurrency: string;
  destinationCurrency: string;
  memo?: string;
}) => {
  const res = await fetch(`${BRIDGE_URL}/api/solana/build-transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromAddress: data.from,
      toAddress: data.to,
      amount: data.amount,
      sourceCurrency: data.sourceCurrency,
      destinationCurrency: data.destinationCurrency,
      memo: data.memo || ''
    })
  });
  if (!res.ok) throw new Error('Failed to build unsigned transfer');
  return await res.json();
};

// Submit signed transaction
export const submitSignedTransaction = async (params: { transaction_id?: string; signedTxBase64: string; }) => {
  const res = await fetch(`${BRIDGE_URL}/api/solana/submit-signed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Failed to submit signed transaction');
  return await res.json();
};

/**
 * Submit KYC data to Hyperledger Fabric
 * @param data KYC data
 * @returns Promise with KYC submission result
 */
export const submitKYC = async (data: any) => {
  try {
    // Call the bridge service API
    const response = await fetch(`${BRIDGE_URL}/api/kyc/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit KYC data');
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error submitting KYC data to Hyperledger:', error);
    throw error;
  }
};

/**
 * Liquidity Pool API Functions
 */

/**
 * Fetch all liquidity pools
 * @returns Promise with pools data
 */
export const fetchLiquidityPools = async () => {
  const response = await fetch(`${BRIDGE_URL}/api/pools`);
  if (!response.ok) throw new Error('Failed to fetch liquidity pools');
  return await response.json();
};

/**
 * Fetch specific pool by address
 * @param poolAddress Pool address
 * @returns Promise with pool data
 */
export const fetchPool = async (poolAddress: string) => {
  const response = await fetch(`${BRIDGE_URL}/api/pools/${poolAddress}`);
  if (!response.ok) throw new Error('Failed to fetch pool');
  return await response.json();
};

/**
 * Create a new liquidity pool
 * @param data Pool creation data
 * @returns Promise with creation result
 */
export const createLiquidityPool = async (data: {
  name: string;
  sourceCurrency: string;
  destinationCurrency: string;
  exchangeRate: number;
  poolFeeRate: number;
}) => {
  // Map currencies to their mint addresses (loaded from mint-accounts.json)
  const currencyMints: { [key: string]: string } = {
    'EUR': '5PSU5Z4NNvHCP9qSRBmrp4oEt6NYGXxatLW2LY7sBFLE',
    'USD': '7bBhRdeA8onCTZa3kBwWpQVhuQdVzhMgLEvDTrjwWX5T',
    'INR': '4PmMiF3Lxv6dRGfB92xw7dv5SYWWPBCE6Y78Tdqb7mGg',
    'GBP': '5gBytEK8J6p8ffqqB5jh82hme5udwvjd4gr4bFwwTgCJ',
    'JPY': '8VAakzh8wMEiyMp75coMorNDjUEMqwgHwvJjv7pUdVQh',
    'CAD': '5eiCbZorrM9BRxyr4iuDvuTmf3LeGjhBBmP8NuXaZz5Q',
    'AUD': 'B9ASRwRngPPv6BpvVxXHawX4XEXfYHS1a4xJ5rEqHNjx'
  };

  const sourceMint = currencyMints[data.sourceCurrency] || currencyMints['EUR'];
  const destinationMint = currencyMints[data.destinationCurrency] || currencyMints['USD'];

  const response = await fetch(`${BRIDGE_URL}/api/pools/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      poolName: data.name,
      sourceCurrency: data.sourceCurrency,
      destinationCurrency: data.destinationCurrency,
      sourceMint: sourceMint,
      destinationMint: destinationMint,
      initialExchangeRate: data.exchangeRate,
      poolFeeRate: data.poolFeeRate
    })
  });
  if (!response.ok) throw new Error('Failed to create liquidity pool');
  return await response.json();
};

/**
 * Update pool exchange rate
 * @param data Rate update data
 * @returns Promise with update result
 */
export const updatePoolRate = async (data: {
  poolAddress: string;
  newExchangeRate: number;
}): Promise<{
  success: boolean;
  message?: string;
  newRate?: number;
  transaction?: string;
  error?: string;
}> => {
  const response = await fetch(`${BRIDGE_URL}/api/pools/update-rate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to update pool rate');
  return await response.json();
};

/**
 * Perform a currency swap
 * @param data Swap data
 * @returns Promise with swap result
 */
export const performSwap = async (data: {
  poolAddress: string;
  amountIn: number;
  minimumAmountOut: number;
  userSourceAccount: string;
  userDestinationAccount: string;
  poolSourceAccount: string;
  poolDestinationAccount: string;
}): Promise<{
  success: boolean;
  message?: string;
  swapRecord?: string;
  amountIn?: number;
  minimumAmountOut?: number;
  amountOut?: number;
  poolFee?: number;
  transaction?: string;
  error?: string;
}> => {
  const response = await fetch(`${BRIDGE_URL}/api/pools/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to perform swap');
  return await response.json();
};

/**
 * Add liquidity to a pool
 * @param data Liquidity data
 * @returns Promise with add liquidity result
 */
export const addLiquidity = async (data: {
  poolAddress: string;
  sourceAmount: number;
  destinationAmount: number;
  userSourceAccount: string;
  userDestinationAccount: string;
}): Promise<{
  success: boolean;
  message?: string;
  sourceAmount?: number;
  destinationAmount?: number;
  transaction?: string;
  error?: string;
}> => {
  const response = await fetch(`${BRIDGE_URL}/api/pools/add-liquidity`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to add liquidity');
  return await response.json();
};

// Off-ramp API functions
export const getOfframpQuote = async (data: {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  corridor: string;
  userAddress: string;
}) => {
  const response = await fetch(`${BRIDGE_URL}/api/offramp/quote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to get off-ramp quote');
  return await response.json();
};

export const initiateOfframpTransaction = async (data: {
  quoteId: string;
  userAddress: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    accountName: string;
    accountType: string;
  };
}) => {
  const response = await fetch(`${BRIDGE_URL}/api/offramp/initiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to initiate off-ramp transaction');
  return await response.json();
};

export const getOfframpTransactionStatus = async (transactionId: string) => {
  const response = await fetch(`${BRIDGE_URL}/api/offramp/status/${transactionId}`);
  if (!response.ok) throw new Error('Failed to get transaction status');
  return await response.json();
};

export const getExchangeRate = async (fromCurrency: string, toCurrency: string) => {
  const response = await fetch(`${BRIDGE_URL}/api/rates/${fromCurrency}/${toCurrency}`);
  if (!response.ok) throw new Error('Failed to get exchange rate');
  return await response.json();
};

export const getTreasuryStatus = async () => {
  const response = await fetch(`${BRIDGE_URL}/api/treasury/status`);
  if (!response.ok) throw new Error('Failed to get treasury status');
  return await response.json();
};

export const testWebhook = async (webhookData: any) => {
  const response = await fetch(`${BRIDGE_URL}/api/razorpay/webhook`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Razorpay-Event-Id': `event_${Date.now()}`,
      'X-Razorpay-Signature': 'test_signature'
    },
    body: JSON.stringify(webhookData)
  });
  if (!response.ok) throw new Error('Failed to test webhook');
  return await response.json();
};

// On-ramp API functions
export const createOnrampOrder = async (data: {
  userAddress: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoCurrency: string;
}) => {
  const response = await fetch(`${BRIDGE_URL}/api/onramp/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create on-ramp order');
  return await response.json();
};

export const createOnrampPayment = async (data: {
  orderId: string;
  paymentMethod: string;
  upiId?: string;
}) => {
  const response = await fetch(`${BRIDGE_URL}/api/onramp/create-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!response.ok) throw new Error('Failed to create on-ramp payment');
  return await response.json();
};

export const getOnrampOrderStatus = async (orderId: string) => {
  const response = await fetch(`${BRIDGE_URL}/api/onramp/order-status/${orderId}`);
  if (!response.ok) throw new Error('Failed to get on-ramp order status');
  return await response.json();
};

export const getOnrampStats = async () => {
  const response = await fetch(`${BRIDGE_URL}/api/onramp/stats`);
  if (!response.ok) throw new Error('Failed to get on-ramp statistics');
  return await response.json();
};

// System health and monitoring
export const getSystemHealth = async () => {
  const response = await fetch(`${BRIDGE_URL}/health`);
  if (!response.ok) throw new Error('Failed to get system health');
  return await response.json();
}; 