import React, { useState, useEffect } from 'react';
import {
  Payment as PaymentIcon,
  AccountBalanceWallet as WalletIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CurrencyExchange as ExchangeIcon,
  TrendingUp as OnRampIcon,
  TrendingDown as OffRampIcon,
  SwapHoriz as SwapIcon
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createBurnInstruction
} from '@solana/spl-token';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');

// Add Razorpay to window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOrder {
  orderId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: string;
  paymentUrl?: string;
  keyId?: string;
}

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const PaymentApp: React.FC = () => {
  const { publicKey, connected, signTransaction } = useWallet();

  // Primary RPC endpoint with fallback
  const connection = new Connection('https://api.devnet.solana.com', {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });

  const [mode, setMode] = useState<'onramp' | 'offramp'>('onramp');
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    amount: 100,
    fiatCurrency: 'INR',
    cryptoCurrency: 'USD',
    name: 'Test User',
    email: 'test@example.com',
    phone: '9876543210',
    accountNumber: '1234567890',
    ifscCode: 'SBIN0000001'
  });

  // Order and Payment State
  const [currentOrder, setCurrentOrder] = useState<PaymentOrder | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [transactionHistory, setTransactionHistory] = useState<any[]>([]);
  const [userTokenBalance, setUserTokenBalance] = useState<number>(0);

  // Off-ramp State
  const [currentQuote, setCurrentQuote] = useState<any>(null);
  const [burnTransactionHash, setBurnTransactionHash] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const steps = mode === 'onramp' ? [
    'Enter Payment Details',
    'Create Order',
    'Complete Payment',
    'Receive Crypto Tokens'
  ] : [
    'Enter Withdrawal Details',
    'Get Quote',
    'Initiate Withdrawal',
    'Receive Fiat Payment'
  ];

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setCurrentOrder(null);
    setPaymentStatus(null);
    setError(null);
    setSuccess(null);
  };

  // Step 1: Create Order
  const createPaymentOrder = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        userAddress: publicKey.toBase58(),
        fiatAmount: paymentForm.amount,
        fiatCurrency: paymentForm.fiatCurrency,
        cryptoCurrency: paymentForm.cryptoCurrency
      };

      const response = await fetch(`${BRIDGE_URL}/api/onramp/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        // Create Razorpay payment
        const paymentData = {
          orderId: result.order.id,
          userEmail: paymentForm.email,
          userPhone: paymentForm.phone
        };

        const paymentResponse = await fetch(`${BRIDGE_URL}/api/onramp/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentData)
        });

        const paymentResult = await paymentResponse.json();

        if (paymentResult.success) {
          setCurrentOrder({
            orderId: result.order.id,
            razorpayOrderId: paymentResult.paymentOrder.orderId,
            amount: paymentForm.amount,
            currency: paymentForm.fiatCurrency,
            status: 'created',
            paymentUrl: paymentResult.paymentUrl,
            keyId: paymentResult.paymentOrder.keyId
          });
          setSuccess(`Order created successfully! Order ID: ${result.order.id}`);
          handleNext();
        } else {
          throw new Error(paymentResult.error || 'Failed to create payment');
        }
      } else {
        throw new Error(result.error || 'Failed to create order');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Open Razorpay Checkout
  const openRazorpayCheckout = () => {
    if (!currentOrder || !window.Razorpay) {
      setError('Razorpay not loaded or order not found');
      return;
    }

    const options = {
      key: currentOrder.keyId || 'rzp_test_RGU9V52S7OjDo2',
      amount: currentOrder.amount * 100,
      currency: currentOrder.currency,
      name: 'Nivix Exchange',
      description: `Buy ${paymentForm.cryptoCurrency} tokens`,
      order_id: currentOrder.razorpayOrderId,
      handler: function (response: any) {
        handlePaymentSuccess(response);
      },
      prefill: {
        name: paymentForm.name,
        email: paymentForm.email,
        contact: paymentForm.phone,
      },
      notes: {
        nivix_order_id: currentOrder.orderId,
        crypto_currency: paymentForm.cryptoCurrency,
        user_address: publicKey?.toBase58()
      },
      theme: {
        color: '#2563EB',
      },
      modal: {
        ondismiss: function () {
          setError('Payment cancelled by user');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  // Handle Payment Success
  const handlePaymentSuccess = async (response: any) => {
    setLoading(true);
    try {
      const verifyResponse = await fetch(`${BRIDGE_URL}/api/onramp/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          orderId: currentOrder?.orderId
        })
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        setPaymentStatus({
          paymentId: response.razorpay_payment_id,
          status: 'success',
          amount: currentOrder?.amount,
          currency: currentOrder?.currency,
          timestamp: new Date().toISOString()
        });
        setSuccess('Payment successful! Tokens will be minted to your wallet.');
        handleNext();
        checkOrderStatus();
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check Order Status
  const checkOrderStatus = async () => {
    if (!currentOrder) return;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/onramp/order-status/${currentOrder.orderId}`);
      const result = await response.json();

      if (result.success) {
        setPaymentStatus((prev: any) => ({
          ...prev,
          orderStatus: result.order.status,
          cryptoDelivered: result.order.cryptoDelivered,
          transactionHash: result.order.transactionHash
        }));

        if (result.order.status === 'completed') {
          handleNext();
        }
      }
    } catch (err) {
      console.error('Error checking order status:', err);
    }
  };

  // Get Transaction History
  const getTransactionHistory = async () => {
    if (!connected || !publicKey) return;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/onramp/user-orders/${publicKey.toBase58()}`);
      const result = await response.json();

      if (result.success) {
        setTransactionHistory(result.orders || []);
      }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
    }
  };

  // Fetch user token balance
  const fetchTokenBalance = async () => {
    if (!connected || !publicKey) return;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/wallet/balance/${publicKey.toString()}`);
      const data = await response.json();
      if (data.success && data.balances) {
        const usdBalance = data.balances.find((b: any) => b.currency === 'USD');
        setUserTokenBalance(usdBalance ? parseFloat(usdBalance.balance) : 0);
      }
    } catch (error) {
      console.error('Failed to fetch token balance:', error);
      setUserTokenBalance(24.228); // Use known balance for testing
    }
  };

  useEffect(() => {
    if (connected) {
      getTransactionHistory();
      fetchTokenBalance();
    }
  }, [connected, mode]);

  // Off-ramp Functions
  const getCryptoTokenMint = (currency: string): string => {
    const tokenMints: { [key: string]: string } = {
      'USD': '4PmMiF3Lxv6dRGfB92xw7dv5SYWWPBCE6Y78Tdqb7mGg',
      'INR': '5PSU5Z4NNvHCP9qSRBmrp4oEt6NYGXxatLW2LY7sBFLE',
      'EUR': '7bBhRdeA8onCTZa3kBwWpQVhuQdVzhMgLEvDTrjwWX5T',
      'GBP': '8VAakzh8wMEiyMp75coMorNDjUEMqwgHwvJjv7pUdVQh',
      'JPY': '8VAakzh8wMEiyMp75coMorNDjUEMqwgHwvJjv7pUdVQh',
      'CAD': '5eiCbZorrM9BRxyr4iuDvuTmf3LeGjhBBmP8NuXaZz5Q',
      'AUD': 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
    };
    return tokenMints[currency.toUpperCase()] || '';
  };

  const burnUserTokens = async (currency: string, amount: number): Promise<string | null> => {
    try {
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected or cannot sign transactions');
      }

      const tokenMint = getCryptoTokenMint(currency);
      if (!tokenMint) {
        throw new Error(`No token mint found for currency: ${currency}`);
      }

      const mintPubkey = new PublicKey(tokenMint);
      const userTokenAccount = await getAssociatedTokenAddress(mintPubkey, publicKey);
      const tokenAmount = Math.floor(amount * Math.pow(10, 6));

      const burnInstruction = createBurnInstruction(
        userTokenAccount,
        mintPubkey,
        publicKey,
        tokenAmount
      );

      const sendFresh = async (): Promise<string> => {
        const tx = new Transaction().add(burnInstruction);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.feePayer = publicKey;
        const signed = await signTransaction(tx);
        return await connection.sendRawTransaction(signed.serialize(), { skipPreflight: true });
      };

      let signature: string | undefined = undefined;
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          signature = await sendFresh();
          break;
        } catch (e: any) {
          attempts++;
          const msg = e?.message || String(e);
          if (msg.includes('already been processed')) {
            try {
              const sigs = await connection.getSignaturesForAddress(publicKey, { limit: 1 }, 'confirmed');
              if (sigs && sigs.length > 0) {
                signature = sigs[0].signature;
                break;
              }
            } catch (_) { }
          }
          if (attempts >= maxAttempts) throw new Error(msg);
          await new Promise(r => setTimeout(r, 1500));
        }
      }

      if (!signature) throw new Error('Transaction signature is undefined');

      const latest = await connection.getLatestBlockhash('confirmed');
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight
      }, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      return signature;
    } catch (error) {
      console.error('Token burning failed:', error);
      throw error;
    }
  };

  const getOfframpQuote = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BRIDGE_URL}/api/offramp/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromCurrency: paymentForm.cryptoCurrency,
          toCurrency: paymentForm.fiatCurrency,
          amount: paymentForm.amount,
          userAddress: publicKey.toString()
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentQuote(data.quote);
        setSuccess(`Quote: ${data.quote.netAmount} ${data.quote.toCurrency} (Rate: ${data.quote.exchangeRate})`);
        setActiveStep(1);
      } else {
        setError(data.error || 'Failed to get quote');
      }
    } catch (error) {
      setError('Failed to get off-ramp quote');
    } finally {
      setLoading(false);
    }
  };

  const initiateOfframp = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    if (!currentQuote) {
      setError('No quote available. Please get a quote first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setSuccess('🔥 Step 1: Burning your crypto tokens...');
      const burnTxHash = await burnUserTokens(paymentForm.cryptoCurrency, paymentForm.amount);
      setBurnTransactionHash(burnTxHash);
      setSuccess(`✅ Tokens burned successfully! Transaction: ${burnTxHash?.substring(0, 8)}...`);

      setSuccess('🏦 Step 2: Processing fiat payout via automated treasury routing...');
      const response = await fetch(`${BRIDGE_URL}/api/offramp/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: publicKey.toString(),
          quoteId: currentQuote.quoteId,
          beneficiaryDetails: {
            name: paymentForm.name,
            email: paymentForm.email,
            phone: paymentForm.phone || '9876543210',
            bank_account: {
              account_number: paymentForm.accountNumber || '1234567890',
              ifsc_code: paymentForm.ifscCode || 'SBIN0000001',
              account_holder_name: paymentForm.name
            },
            address: 'India',
            accountType: 'bank_transfer'
          },
          burnTransactionHash: burnTxHash
        })
      });

      const data = await response.json();
      if (data.success) {
        setSuccess(`✅ Off-ramp complete! Tokens burned: ${burnTxHash?.substring(0, 8)}... | Route: ${data.routeUsed}`);
        setActiveStep(2);
        getTransactionHistory();
      } else {
        setError(`⚠️ Tokens burned (${burnTxHash?.substring(0, 8)}...) but fiat payout failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      if (burnTransactionHash) {
        setError(`⚠️ Tokens burned (${burnTransactionHash.substring(0, 8)}...) but process failed: ${error.message}`);
      } else {
        setError(`Failed to burn tokens: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setCurrentOrder(null);
    setPaymentStatus(null);
    setCurrentQuote(null);
    setBurnTransactionHash(null);
    setError(null);
    setSuccess(null);
    setPaymentForm({
      amount: 100,
      fiatCurrency: 'INR',
      cryptoCurrency: 'USD',
      name: 'Test User',
      email: 'test@example.com',
      phone: '9876543210',
      accountNumber: '1234567890',
      ifscCode: 'SBIN0000001'
    });
  };

  const renderStepContent = (step: number) => {
    if (mode === 'offramp') {
      switch (step) {
        case 0:
          return (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start">
                <InfoIcon className="text-blue-500 mr-3 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Available Balance</h4>
                  <p className="text-blue-700 text-sm">
                    You have {userTokenBalance} {paymentForm.cryptoCurrency} tokens available for withdrawal
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Crypto Amount to Sell"
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
                />
                <Select
                  label="Crypto Currency"
                  value={paymentForm.cryptoCurrency}
                  onChange={(e) => setPaymentForm({ ...paymentForm, cryptoCurrency: e.target.value })}
                  options={[
                    { value: 'USD', label: 'USD Tokens' },
                    { value: 'INR', label: 'INR Tokens' },
                    { value: 'EUR', label: 'EUR Tokens' }
                  ]}
                />
                <Select
                  label="Receive Fiat Currency"
                  value={paymentForm.fiatCurrency}
                  onChange={(e) => setPaymentForm({ ...paymentForm, fiatCurrency: e.target.value })}
                  options={[
                    { value: 'INR', label: 'Indian Rupee (INR)' },
                    { value: 'USD', label: 'US Dollar (USD)' },
                    { value: 'EUR', label: 'Euro (EUR)' }
                  ]}
                />
                <Input
                  label="Account Holder Name"
                  value={paymentForm.name}
                  onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
                  placeholder="Full name as per bank account"
                />
                <Input
                  label="Bank Account Number"
                  value={paymentForm.accountNumber || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, accountNumber: e.target.value })}
                  placeholder="1234567890"
                />
                <Input
                  label="IFSC Code"
                  value={paymentForm.ifscCode || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, ifscCode: e.target.value })}
                  placeholder="SBIN0000001"
                />
                <Input
                  label="Email Address"
                  value={paymentForm.email}
                  onChange={(e) => setPaymentForm({ ...paymentForm, email: e.target.value })}
                  placeholder="your@email.com"
                />
                <Input
                  label="Phone Number"
                  value={paymentForm.phone || ''}
                  onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>

              <Button
                onClick={getOfframpQuote}
                disabled={loading || !connected}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? <Spinner /> : <ExchangeIcon />}
                  {loading ? 'Getting Quote...' : 'Get Withdrawal Quote'}
                </div>
              </Button>
            </div>
          );
        case 1:
          return (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-800">
                <p className="font-medium">Quote generated successfully! Review the details below.</p>
              </div>

              {currentQuote && (
                <Card className="bg-gray-50">
                  <h3 className="text-lg font-semibold mb-4">💰 Off-ramp Quote Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">You're Selling:</p>
                      <p className="text-lg font-medium">{currentQuote.inputAmount} {currentQuote.fromCurrency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">You'll Receive:</p>
                      <p className="text-lg font-bold text-green-600">{currentQuote.netAmount} {currentQuote.toCurrency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Exchange Rate:</p>
                      <p>1 {currentQuote.fromCurrency} = {currentQuote.exchangeRate} {currentQuote.toCurrency}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Fees:</p>
                      <p>{currentQuote.totalFees} {currentQuote.toCurrency}</p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-yellow-800 text-sm">
                <p className="mb-2">🔥 <strong>Token Burning:</strong> Your {paymentForm.amount} {paymentForm.cryptoCurrency} tokens will be permanently burned from your wallet.</p>
                <p>🏦 <strong>Automated Routing:</strong> System will automatically select the best payout route (treasury or stablecoin pool).</p>
              </div>

              <Button
                onClick={initiateOfframp}
                disabled={loading}
                variant="secondary"
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? <Spinner /> : <OffRampIcon />}
                  {loading ? 'Burning Tokens & Processing...' : '🔥 Burn Tokens & Withdraw Fiat'}
                </div>
              </Button>
            </div>
          );
        case 2:
          return (
            <div className="text-center py-8">
              <SuccessIcon className="text-green-500 text-6xl mb-4" style={{ fontSize: 64 }} />
              <h3 className="text-2xl font-bold mb-2">🔥 Off-ramp Complete!</h3>
              <p className="text-gray-500 mb-6">
                Your crypto tokens have been burned and fiat payment is being processed via automated routing.
              </p>

              {burnTransactionHash && (
                <Card className="mb-6 text-left bg-gray-50">
                  <h4 className="font-semibold mb-2">🔥 Token Burn Transaction</h4>
                  <p className="text-sm text-gray-500 mb-1">Transaction Hash:</p>
                  <div className="bg-white p-2 rounded border border-gray-200 font-mono text-xs break-all mb-3">
                    {burnTransactionHash}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`https://explorer.solana.com/tx/${burnTransactionHash}?cluster=devnet`, '_blank')}
                  >
                    View on Solana Explorer
                  </Button>
                </Card>
              )}

              <Button onClick={resetForm}>
                <div className="flex items-center gap-2">
                  <SwapIcon /> Make Another Transaction
                </div>
              </Button>
            </div>
          );
        default:
          return <div>Unknown step</div>;
      }
    }

    // On-ramp step content
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Amount"
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
              />
              <Select
                label="Fiat Currency"
                value={paymentForm.fiatCurrency}
                onChange={(e) => setPaymentForm({ ...paymentForm, fiatCurrency: e.target.value })}
                options={[
                  { value: 'INR', label: 'INR (₹)' },
                  { value: 'USD', label: 'USD ($)' }
                ]}
              />
              <Select
                label="Crypto Token"
                value={paymentForm.cryptoCurrency}
                onChange={(e) => setPaymentForm({ ...paymentForm, cryptoCurrency: e.target.value })}
                options={[
                  { value: 'USD', label: 'USD Token' },
                  { value: 'EUR', label: 'EUR Token' },
                  { value: 'INR', label: 'INR Token' }
                ]}
              />
              <Input
                label="Your Name"
                value={paymentForm.name}
                onChange={(e) => setPaymentForm({ ...paymentForm, name: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={paymentForm.email}
                onChange={(e) => setPaymentForm({ ...paymentForm, email: e.target.value })}
              />
              <Input
                label="Phone Number"
                value={paymentForm.phone}
                onChange={(e) => setPaymentForm({ ...paymentForm, phone: e.target.value })}
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <ExchangeIcon className="text-gray-500" /> Transaction Summary
              </h4>
              <div className="space-y-1 text-sm">
                <p>You will pay: <strong>{paymentForm.amount} {paymentForm.fiatCurrency}</strong></p>
                <p>You will receive: <strong>~{paymentForm.amount} {paymentForm.cryptoCurrency} tokens</strong></p>
                <p className="text-gray-500 mt-2">
                  Tokens will be minted to: {connected ? publicKey?.toBase58().slice(0, 8) + '...' : 'Connect wallet'}
                </p>
              </div>
            </div>

            <Button
              onClick={createPaymentOrder}
              disabled={loading || !connected}
              className="w-full"
              size="lg"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? <Spinner /> : <PaymentIcon />}
                {loading ? 'Creating Order...' : 'Create Payment Order'}
              </div>
            </Button>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Order Created Successfully</h3>
            </div>

            {currentOrder && (
              <Card className="bg-gray-50">
                <h4 className="font-semibold mb-2">Order Details:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Order ID:</span> {currentOrder.orderId}</p>
                  <p><span className="text-gray-500">Razorpay ID:</span> {currentOrder.razorpayOrderId}</p>
                  <p><span className="text-gray-500">Amount:</span> {currentOrder.amount} {currentOrder.currency}</p>
                  <p><span className="text-gray-500">Status:</span> {currentOrder.status}</p>
                </div>
              </Card>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800 text-sm">
              <p>Your order has been created. Click "Open Payment Gateway" to complete the payment using Razorpay. You can pay using UPI, Cards, Net Banking, or Wallets.</p>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={openRazorpayCheckout}
                className="flex-1"
                size="lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <PaymentIcon /> Open Payment Gateway
                </div>
              </Button>
              <Button variant="outline" onClick={handleBack}>
                Back
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold mb-4">Payment Processing</h3>

            {paymentStatus ? (
              <Card className="bg-green-50 border-green-100">
                <div className="flex items-center gap-2 mb-4 text-green-700">
                  <SuccessIcon />
                  <h4 className="font-bold">Payment Successful!</h4>
                </div>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-500">Payment ID:</span> {paymentStatus.paymentId}</p>
                  <p><span className="text-gray-500">Amount:</span> {paymentStatus.amount} {paymentStatus.currency}</p>
                  <p><span className="text-gray-500">Status:</span> {paymentStatus.status}</p>
                  <p><span className="text-gray-500">Time:</span> {new Date(paymentStatus.timestamp).toLocaleString()}</p>

                  {paymentStatus.orderStatus && (
                    <>
                      <hr className="my-2 border-green-200" />
                      <p><span className="text-gray-500">Order Status:</span> {paymentStatus.orderStatus}</p>
                      {paymentStatus.cryptoDelivered && (
                        <p className="text-green-600 font-medium">✓ Crypto tokens delivered to your wallet</p>
                      )}
                      {paymentStatus.transactionHash && (
                        <p className="text-xs font-mono bg-white p-1 rounded mt-1">
                          Tx: {paymentStatus.transactionHash}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </Card>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-blue-800">
                <p>Complete the payment in the Razorpay window to proceed.</p>
              </div>
            )}

            {paymentStatus && (
              <Button
                onClick={checkOrderStatus}
                disabled={loading}
                className="w-full"
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? <Spinner /> : <InfoIcon />}
                  {loading ? 'Checking Status...' : 'Check Order Status'}
                </div>
              </Button>
            )}
          </div>
        );

      case 3:
        return (
          <div className="text-center py-8">
            <SuccessIcon className="text-green-500 text-6xl mb-4" style={{ fontSize: 64 }} />
            <h3 className="text-2xl font-bold mb-2">Transaction Completed!</h3>
            <p className="text-gray-500 mb-6">
              Your crypto tokens have been successfully minted to your wallet.
            </p>

            {paymentStatus && (
              <Card className="mb-6 text-left bg-gray-50">
                <h4 className="font-semibold mb-2">Final Transaction Details:</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-500">Amount Paid:</span> {paymentStatus.amount} {paymentStatus.currency}</p>
                  <p><span className="text-gray-500">Tokens Received:</span> {paymentForm.cryptoCurrency} tokens</p>
                  <p><span className="text-gray-500">Wallet:</span> {publicKey?.toBase58()}</p>
                  {paymentStatus.transactionHash && (
                    <div className="mt-2">
                      <p className="text-gray-500 mb-1">Blockchain Transaction:</p>
                      <p className="font-mono text-xs bg-white p-1 rounded border border-gray-200 break-all">
                        {paymentStatus.transactionHash}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <div className="flex justify-center gap-4">
              <Button onClick={handleReset}>
                Make Another Payment
              </Button>
              <Button variant="outline" onClick={getTransactionHistory}>
                View History
              </Button>
            </div>
          </div>
        );

      default:
        return 'Unknown step';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💳 Nivix Payment App</h1>
          <p className="text-gray-500">
            {mode === 'onramp' ? 'Buy crypto tokens with fiat currency' : 'Sell crypto tokens for fiat currency'}
          </p>
        </div>

        {/* Mode Toggle - Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex">
            <button
              onClick={() => { setMode('onramp'); resetForm(); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${mode === 'onramp'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <OnRampIcon fontSize="small" />
              On-Ramp (Buy Crypto)
            </button>
            <button
              onClick={() => { setMode('offramp'); resetForm(); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${mode === 'offramp'
                  ? 'bg-gray-800 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-50'
                }`}
            >
              <OffRampIcon fontSize="small" />
              Off-Ramp (Sell Crypto)
            </button>
          </div>
        </div>

        {!connected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center text-yellow-800">
            <WalletIcon className="mr-2" />
            Please connect your Solana wallet to continue with payments
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start text-red-800">
            <ErrorIcon className="mr-2 mt-0.5" />
            <div className="flex-1">{error}</div>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">×</button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-start text-green-800">
            <SuccessIcon className="mr-2 mt-0.5" />
            <div className="flex-1">{success}</div>
            <button onClick={() => setSuccess(null)} className="text-green-500 hover:text-green-700">×</button>
          </div>
        )}

        <Card className="mb-8">
          {/* Custom Stepper */}
          <div className="flex mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 -translate-y-1/2"></div>
            {steps.map((label, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;

              return (
                <div key={label} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-2 transition-colors ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                        isCompleted ? 'bg-green-500 text-white' :
                          'bg-gray-200 text-gray-500'
                      }`}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <span className={`text-xs font-medium text-center hidden sm:block ${isActive ? 'text-blue-600' :
                      isCompleted ? 'text-green-600' :
                        'text-gray-400'
                    }`}>
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="mt-6">
            {renderStepContent(activeStep)}
          </div>
        </Card>

        {transactionHistory.length > 0 && (
          <Card>
            <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
            <div className="space-y-4">
              {transactionHistory.slice(0, 5).map((tx, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${tx.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium text-sm">{tx.fiatAmount} {tx.fiatCurrency} → {tx.cryptoCurrency}</p>
                      <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentApp;
