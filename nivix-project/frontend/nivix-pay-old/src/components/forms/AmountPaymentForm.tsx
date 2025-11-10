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
  LinearProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CurrencyRupee,
  Security,
  Speed,
  ArrowBack,
  Payment,
  SwapHoriz
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
  const [fromCurrency, setFromCurrency] = useState<string>('INR');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(0.012); // Default INR to USD rate
  const [fees] = useState<number>(0.015); // 1.5%
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available currencies
  const availableCurrencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', icon: '🇮🇳' },
    { code: 'USD', name: 'US Dollar', symbol: '$', icon: '🇺🇸' },
    { code: 'EUR', name: 'Euro', symbol: '€', icon: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', symbol: '£', icon: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', icon: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', icon: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', icon: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', icon: '🇨🇭' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', icon: '🇨🇳' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', icon: '🇸🇬' },
    { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', icon: '🇭🇰' },
    { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', icon: '🇳🇿' },
    { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', icon: '🇸🇪' },
    { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', icon: '🇳🇴' },
    { code: 'DKK', name: 'Danish Krone', symbol: 'kr', icon: '🇩🇰' },
    { code: 'PLN', name: 'Polish Zloty', symbol: 'zł', icon: '🇵🇱' },
    { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč', icon: '🇨🇿' },
    { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft', icon: '🇭🇺' },
    { code: 'RON', name: 'Romanian Leu', symbol: 'lei', icon: '🇷🇴' },
    { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв', icon: '🇧🇬' },
    { code: 'MXN', name: 'Mexican Peso', symbol: '$', icon: '🇲🇽' },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', icon: '🇧🇷' },
    { code: 'ARS', name: 'Argentine Peso', symbol: '$', icon: '🇦🇷' },
    { code: 'CLP', name: 'Chilean Peso', symbol: '$', icon: '🇨🇱' },
    { code: 'COP', name: 'Colombian Peso', symbol: '$', icon: '🇨🇴' },
    { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', icon: '🇵🇪' },
    { code: 'UYU', name: 'Uruguayan Peso', symbol: '$', icon: '🇺🇾' },
    { code: 'VES', name: 'Venezuelan Bolivar', symbol: 'Bs', icon: '🇻🇪' },
    { code: 'ZAR', name: 'South African Rand', symbol: 'R', icon: '🇿🇦' },
    { code: 'EGP', name: 'Egyptian Pound', symbol: '£', icon: '🇪🇬' },
    { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', icon: '🇳🇬' },
    { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', icon: '🇰🇪' },
    { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', icon: '🇬🇭' },
    { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', icon: '🇲🇦' },
    { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', icon: '🇹🇳' },
    { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', icon: '🇩🇿' },
    { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', icon: '🇱🇾' },
    { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', icon: '🇪🇹' },
    { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', icon: '🇺🇬' },
    { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', icon: '🇹🇿' },
    { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF', icon: '🇷🇼' },
    { code: 'BWP', name: 'Botswana Pula', symbol: 'P', icon: '🇧🇼' },
    { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', icon: '🇳🇦' },
    { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$', icon: '🇿🇼' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', icon: '🇦🇪' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س', icon: '🇸🇦' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', icon: '🇶🇦' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', icon: '🇰🇼' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب', icon: '🇧🇭' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', icon: '🇴🇲' },
    { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.ا', icon: '🇯🇴' },
    { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل', icon: '🇱🇧' },
    { code: 'ILS', name: 'Israeli Shekel', symbol: '₪', icon: '🇮🇱' },
    { code: 'TRY', name: 'Turkish Lira', symbol: '₺', icon: '🇹🇷' },
    { code: 'RUB', name: 'Russian Ruble', symbol: '₽', icon: '🇷🇺' },
    { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴', icon: '🇺🇦' },
    { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br', icon: '🇧🇾' },
    { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸', icon: '🇰🇿' },
    { code: 'UZS', name: 'Uzbekistani Som', symbol: 'лв', icon: '🇺🇿' },
    { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'лв', icon: '🇰🇬' },
    { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM', icon: '🇹🇯' },
    { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T', icon: '🇹🇲' },
    { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼', icon: '🇦🇿' },
    { code: 'GEL', name: 'Georgian Lari', symbol: '₾', icon: '🇬🇪' },
    { code: 'AMD', name: 'Armenian Dram', symbol: '֏', icon: '🇦🇲' },
    { code: 'AFN', name: 'Afghan Afghani', symbol: '؋', icon: '🇦🇫' },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', icon: '🇵🇰' },
    { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨', icon: '🇱🇰' },
    { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', icon: '🇧🇩' },
    { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨', icon: '🇳🇵' },
    { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.', icon: '🇧🇹' },
    { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf', icon: '🇲🇻' },
    { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp', icon: '🇮🇩' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', icon: '🇲🇾' },
    { code: 'THB', name: 'Thai Baht', symbol: '฿', icon: '🇹🇭' },
    { code: 'VND', name: 'Vietnamese Dong', symbol: '₫', icon: '🇻🇳' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱', icon: '🇵🇭' },
    { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K', icon: '🇲🇲' },
    { code: 'LAK', name: 'Lao Kip', symbol: '₭', icon: '🇱🇦' },
    { code: 'KHR', name: 'Cambodian Riel', symbol: '៛', icon: '🇰🇭' },
    { code: 'BND', name: 'Brunei Dollar', symbol: 'B$', icon: '🇧🇳' },
    { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$', icon: '🇫🇯' },
    { code: 'PGK', name: 'Papua New Guinea Kina', symbol: 'K', icon: '🇵🇬' },
    { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$', icon: '🇸🇧' },
    { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'Vt', icon: '🇻🇺' },
    { code: 'WST', name: 'Samoan Tala', symbol: 'WS$', icon: '🇼🇸' },
    { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$', icon: '🇹🇴' },
    { code: 'KRW', name: 'South Korean Won', symbol: '₩', icon: '🇰🇷' },
    { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$', icon: '🇹🇼' },
    { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$', icon: '🇲🇴' },
    { code: 'MNT', name: 'Mongolian Tugrik', symbol: '₮', icon: '🇲🇳' },
    { code: 'KPW', name: 'North Korean Won', symbol: '₩', icon: '🇰🇵' }
  ];

  // Calculated values - dynamic currency conversion
  const cryptoEquivalent = amount * exchangeRate; // Convert from fiat to crypto
  const feeAmount = cryptoEquivalent * fees;
  const netAmount = cryptoEquivalent - feeAmount;

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
  }, [fromCurrency, toCurrency]);

  const fetchExchangeRates = async () => {
    setIsLoadingRates(true);
    try {
      // Fetch live exchange rate from your API
      const response = await fetch(`${BRIDGE_URL}/api/rates/${fromCurrency}/${toCurrency}`);
      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data.rate || getFallbackRate(fromCurrency, toCurrency));
      }
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error);
      // Use fallback rate
      setExchangeRate(getFallbackRate(fromCurrency, toCurrency));
    } finally {
      setIsLoadingRates(false);
    }
  };

  const getFallbackRate = (from: string, to: string): number => {
    const rates: Record<string, Record<string, number>> = {
      'INR': { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0095, 'JPY': 1.8, 'CAD': 0.016, 'AUD': 0.018 },
      'USD': { 'INR': 83.5, 'EUR': 0.91, 'GBP': 0.79, 'JPY': 150, 'CAD': 1.35, 'AUD': 1.52 },
      'EUR': { 'USD': 1.10, 'INR': 91.8, 'GBP': 0.87, 'JPY': 165, 'CAD': 1.48, 'AUD': 1.67 },
      'GBP': { 'USD': 1.27, 'EUR': 1.15, 'INR': 105.4, 'JPY': 190, 'CAD': 1.71, 'AUD': 1.92 },
      'JPY': { 'USD': 0.0067, 'EUR': 0.0061, 'INR': 0.56, 'GBP': 0.0053, 'CAD': 0.009, 'AUD': 0.010 },
      'CAD': { 'USD': 0.74, 'EUR': 0.68, 'INR': 61.8, 'GBP': 0.58, 'JPY': 111, 'AUD': 1.13 },
      'AUD': { 'USD': 0.66, 'EUR': 0.60, 'INR': 55.3, 'GBP': 0.52, 'JPY': 99, 'CAD': 0.89 }
    };
    return rates[from]?.[to] || 1.0;
  };

  const getCurrencySymbol = (currency: string): string => {
    const currencyData = availableCurrencies.find(c => c.code === currency);
    return currencyData?.symbol || currency;
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
          fiatCurrency: fromCurrency,
          cryptoCurrency: toCurrency,
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

        {/* Currency Selection */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>From Currency</InputLabel>
              <Select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                label="From Currency"
              >
                {availableCurrencies.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ mr: 1, fontSize: '20px' }}>{currency.icon}</Box>
                      <Typography>{currency.code} - {currency.name}</Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6}>
            <FormControl fullWidth>
              <InputLabel>To Currency</InputLabel>
              <Select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                label="To Currency"
              >
                {availableCurrencies
                  .filter(c => c.code !== fromCurrency)
                  .map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{ mr: 1, fontSize: '20px' }}>{currency.icon}</Box>
                        <Typography>{currency.code} - {currency.name}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Quick Amount Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Select
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {quickAmounts.map((quickAmount) => (
              <Chip
                key={quickAmount}
                label={`${getCurrencySymbol(fromCurrency)}${quickAmount.toLocaleString()}`}
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
              label={`Amount (${fromCurrency})`}
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {getCurrencySymbol(fromCurrency)}
                    </Typography>
                  </InputAdornment>
                )
              }}
              inputProps={{ min: 100, max: 200000 }}
              error={!!error && error.includes('amount')}
              helperText={error && error.includes('amount') ? error : `Min: ${getCurrencySymbol(fromCurrency)}100, Max: ${getCurrencySymbol(fromCurrency)}2,00,000`}
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
                    Amount ({fromCurrency})
                  </Typography>
                  <Typography variant="body1" color="text.primary" fontWeight="bold">
                    {getCurrencySymbol(fromCurrency)}{amount.toLocaleString()}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Exchange Rate
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    {toCurrency} Equivalent
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    {getCurrencySymbol(toCurrency)}{cryptoEquivalent.toFixed(2)} {toCurrency}
                  </Typography>
                </Grid>

                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Platform Fee ({(fees * 100).toFixed(1)}%)
                  </Typography>
                  <Typography variant="body1" color="warning.main">
                    -{getCurrencySymbol(toCurrency)}{feeAmount.toFixed(2)} {toCurrency}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle2">
                  Recipient Receives:
                </Typography>
                <Typography variant="h6" color="primary">
                  {getCurrencySymbol(toCurrency)}{netAmount.toFixed(2)} {toCurrency}
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