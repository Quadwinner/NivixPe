import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  Divider,
  Chip,
  InputAdornment,
  CircularProgress,
  LinearProgress
} from '@mui/material';
import {
  CurrencyRupee,
  Security,
  Speed,
  ArrowBack,
  Payment
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';

// Add Razorpay to window interface
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RecipientDetails {
  name: string;
  accountNumber: string;
  ifscCode: string;
  email: string;
  phone: string;
}

interface PaymentData {
  paymentId: string;
  orderId: string;
  amount: number;
  recipientDetails: RecipientDetails;
  sessionId: string;
  // Automated transfer fields
  burnRequired?: boolean;
  offrampOrderId?: string;
  mintTransactionHash?: string;
  automatedTransfer?: boolean;
}

interface AmountPaymentFormProps {
  recipientDetails: RecipientDetails;
  onPaymentSuccess: (paymentData: PaymentData) => void;
  onBack: () => void;
}

const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');

const AmountPaymentForm: React.FC<AmountPaymentFormProps> = ({
  recipientDetails,
  onPaymentSuccess,
  onBack
}) => {
  const { publicKey } = useWallet();

  // State management
  const [amount, setAmount] = useState<number>(1000);
  const [inrToUsdRate, setInrToUsdRate] = useState<number>(0.012); // INR to USD rate (1 INR = 0.012 USD)
  const [fees] = useState<number>(0.015); // 1.5%
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculated values - using multiplication for INR to USD conversion
  const usdcEquivalent = amount * inrToUsdRate; // ₹1000 * 0.012 = $12 USD
  const feeAmount = usdcEquivalent * fees;
  const netAmount = usdcEquivalent - feeAmount;

  // Quick amount presets
  const quickAmounts = [500, 1000, 2000, 5000, 10000];

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

  // Fetch live exchange rates
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      // Fetch live exchange rate from your API (INR to USD rate)
      const response = await fetch(`${BRIDGE_URL}/api/rates/INR/USD`);
      if (response.ok) {
        const data = await response.json();
        // API returns INR to USD rate (e.g., 0.012 means 1 INR = 0.012 USD)
        setInrToUsdRate(data.rate || 0.012);
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Use fallback rate - 0.012 means 1 INR = 0.012 USD (or ₹83.5 per USD)
    } finally {
      setIsLoadingRates(false);
    }
  };

  const handleAmountChange = (value: number) => {
    setAmount(value);
    setError(null);
  };

  const validateAmount = (): boolean => {
    if (amount < 100) {
      setError('Minimum transfer amount is ₹100');
      return false;
    }
    if (amount > 200000) {
      setError('Maximum transfer amount is ₹2,00,000');
      return false;
    }
    return true;
  };

  const createRazorpayOrder = async () => {
    try {
      // Step 1: Create automated transfer order (like PaymentApp but with transfer flag)
      const orderResponse = await fetch(`${BRIDGE_URL}/api/onramp/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: publicKey?.toString(),
          fiatAmount: amount,
          fiatCurrency: 'INR',
          cryptoCurrency: 'USD',
          // Mark this as automated transfer so backend processes it correctly
          automatedTransfer: true,
          recipientDetails: recipientDetails,
          transferType: 'automated_payout'
        })
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create transfer order');
      }

      const orderResult = await orderResponse.json();

      // Step 2: Create Razorpay payment
      const paymentResponse = await fetch(`${BRIDGE_URL}/api/onramp/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderResult.order.id,
          userEmail: recipientDetails.email,
          userPhone: recipientDetails.phone
        })
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment');
      }

      const paymentResult = await paymentResponse.json();

      return {
        orderId: orderResult.order.id,
        razorpayOrderId: paymentResult.paymentOrder.orderId,
        keyId: paymentResult.paymentOrder.keyId,
        sessionId: orderResult.order.id // Use order ID as session ID
      };

    } catch (error) {
      throw error;
    }
  };

  const openRazorpayCheckout = async () => {
    if (!window.Razorpay) {
      setError('Payment gateway not loaded. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create order and payment
      const { orderId, razorpayOrderId, keyId, sessionId } = await createRazorpayOrder();

      const options = {
        key: keyId,
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'Nivix Transfer',
        description: `Transfer to ${recipientDetails.name}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          await handlePaymentSuccess(response, orderId, sessionId);
        },
        prefill: {
          name: recipientDetails.name,
          email: recipientDetails.email,
          contact: recipientDetails.phone,
        },
        notes: {
          nivix_order_id: orderId,
          recipient_account: recipientDetails.accountNumber,
          recipient_ifsc: recipientDetails.ifscCode,
          user_address: publicKey?.toString()
        },
        theme: {
          color: '#5D5FEF',
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setError('Payment cancelled by user');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error: any) {
      setError(error.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async (response: any, orderId: string, sessionId: string) => {
    try {
      // Verify payment with backend (using same logic as PaymentApp)
      const verifyResponse = await fetch(`${BRIDGE_URL}/api/onramp/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          orderId: orderId,
          // Add automated transfer info for backend processing
          automatedTransfer: true,
          recipientDetails: recipientDetails,
          transferAmount: netAmount
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Payment verification failed');
      }

      const verificationResult = await verifyResponse.json();

      if (verificationResult.success) {
        // Payment verified successfully
        console.log('Payment verified successfully:', verificationResult);

        // Check if this is an automated transfer requiring burn
        if (verificationResult.burnRequired || verificationResult.readyForBurn) {
          console.log('🔥 Automated transfer detected - burn required');

          // For automated transfers, pass the burn info
          onPaymentSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: orderId,
            amount: netAmount,
            recipientDetails: recipientDetails,
            sessionId: sessionId,
            // Add burn requirement info
            burnRequired: true,
            offrampOrderId: verificationResult.offrampOrderId,
            mintTransactionHash: verificationResult.mintTransactionHash,
            automatedTransfer: true
          });
        } else {
          // Regular onramp - check order status
          console.log('Regular onramp order, checking status...');
          await checkOrderStatus(orderId);

          // Payment verified, proceed to processing
          onPaymentSuccess({
            paymentId: response.razorpay_payment_id,
            orderId: orderId,
            amount: netAmount,
            recipientDetails: recipientDetails,
            sessionId: sessionId
          });
        }
      } else {
        throw new Error(verificationResult.error || 'Payment verification failed');
      }

    } catch (error: any) {
      setError(error.message || 'Payment verification failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Added from PaymentApp - Check Order Status to trigger processing with retry logic
  const checkOrderStatus = async (orderId: string, retryCount = 0) => {
    const maxRetries = 3;

    try {
      const response = await fetch(`${BRIDGE_URL}/api/onramp/order-status/${orderId}`);
      const result = await response.json();

      if (result.success) {
        console.log('Order status after payment verification:', result.order);

        // This triggers the backend to start automated processing
        // The order status check ensures the onramp system knows payment is complete
        if (result.order.status === 'completed') {
          console.log('Order processing completed immediately');
        } else if (result.order.status === 'payment_verified' || result.order.status === 'processing') {
          console.log('Order processing started, will be tracked in ProcessingStatus');
        } else if (result.order.status === 'created' && retryCount < maxRetries) {
          // Payment might not be fully processed yet, retry
          console.log(`Order still in created status, retrying (${retryCount + 1}/${maxRetries})...`);
          setTimeout(() => checkOrderStatus(orderId, retryCount + 1), 2000);
        }
      }
    } catch (err) {
      console.error('Error checking order status:', err);

      // Retry on error if we haven't exceeded max retries
      if (retryCount < maxRetries) {
        console.log(`Retrying order status check (${retryCount + 1}/${maxRetries})...`);
        setTimeout(() => checkOrderStatus(orderId, retryCount + 1), 3000);
      } else {
        console.warn('Max retries exceeded for order status check, proceeding anyway');
      }
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Transfer Amount
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter the amount you want to send to {recipientDetails.name}
        </Typography>

        {/* Quick Amount Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Select
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {quickAmounts.map((quickAmount) => (
              <Chip
                key={quickAmount}
                label={`₹${quickAmount.toLocaleString()}`}
                onClick={() => handleAmountChange(quickAmount)}
                variant={amount === quickAmount ? 'filled' : 'outlined'}
                color={amount === quickAmount ? 'primary' : 'default'}
              />
            ))}
          </Box>
        </Box>

        {/* Amount Input */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Amount (INR)"
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CurrencyRupee />
                  </InputAdornment>
                )
              }}
              inputProps={{ min: 100, max: 200000 }}
              error={!!error && error.includes('amount')}
              helperText={error && error.includes('amount') ? error : 'Min: ₹100, Max: ₹2,00,000'}
            />
          </Grid>
        </Grid>

        {/* Transfer Summary */}
        {amount > 0 && (
          <Card sx={{
            mt: 3,
            bgcolor: 'transparent',
            border: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'rgba(158, 158, 158, 0.08)'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2">
                  Transfer Summary
                </Typography>
                {isLoadingRates && (
                  <CircularProgress size={16} sx={{ ml: 1 }} />
                )}
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount (INR)
                  </Typography>
                  <Typography variant="body1" color="text.primary" fontWeight="bold">
                    ₹{amount.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Exchange Rate
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    ₹{(1 / inrToUsdRate).toFixed(2)} per USD
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    USD Equivalent
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    ${usdcEquivalent.toFixed(2)} USD
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Platform Fee ({(fees * 100).toFixed(1)}%)
                  </Typography>
                  <Typography variant="body1" color="warning.main">
                    -${feeAmount.toFixed(2)} USD
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">
                  Recipient Receives:
                </Typography>
                <Typography variant="h6" color="primary">
                  ${netAmount.toFixed(2)} USD
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}>
                <Speed color="primary" fontSize="small" />
                <Typography variant="caption" color="primary">
                  Automated processing: ~60 seconds
                </Typography>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Security Information */}
        <Alert severity="info" sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Security fontSize="small" />
            <Typography variant="body2">
              Your payment is secured by Razorpay and processed via USD tokens
            </Typography>
          </Box>
        </Alert>

        {/* Error Display */}
        {error && !error.includes('amount') && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Preparing payment gateway...
            </Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            startIcon={<ArrowBack />}
            disabled={isProcessing}
          >
            Back
          </Button>

          <Button
            variant="contained"
            onClick={openRazorpayCheckout}
            disabled={amount <= 0 || isProcessing || !validateAmount()}
            startIcon={<Payment />}
            sx={{ flex: 1 }}
            size="large"
          >
            {isProcessing ? 'Processing...' : `Pay ₹${amount.toLocaleString()}`}
          </Button>
        </Box>

        {/* Recipient Details Summary */}
        <Card sx={{
          mt: 3,
          bgcolor: 'transparent',
          border: '1px solid',
          borderColor: 'primary.main',
          backgroundColor: 'rgba(25, 118, 210, 0.08)'
        }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Transfer Details
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">To:</Typography>
                <Typography variant="body2" color="text.primary">{recipientDetails.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Account:</Typography>
                <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                  ***{recipientDetails.accountNumber.slice(-4)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">IFSC:</Typography>
                <Typography variant="body2" color="text.primary">{recipientDetails.ifscCode}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Phone:</Typography>
                <Typography variant="body2" color="text.primary">{recipientDetails.phone}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default AmountPaymentForm;