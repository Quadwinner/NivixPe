import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Zap,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';

/* Shared visual constants, matching the redesigned wizard shell. */
const SH1 = '0 1px 2px rgba(4,33,64,.04), 0 1px 3px rgba(4,33,64,.06)';
const GRAD = 'linear-gradient(135deg, #0A4174 0%, #0C7075 100%)';
const LABEL =
  'font-display mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500';

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

const TREASURY_SUPPORTED_TOKEN_CODES = new Set([
  'USD', 'EUR', 'INR', 'GBP', 'JPY', 'CAD', 'AUD'
]);

/* Matches the corridor defaults in bridge-service/src/offramp/offramp-engine.js:
   platformFee 0.5% + networkFee 0.2% + corridorFee 0.1%. */
const DEFAULT_FEE_RATE = 0.008;

const AmountPaymentForm: React.FC<AmountPaymentFormProps> = ({
  recipientDetails,
  onPaymentSuccess,
  onBack
}) => {
  const { publicKey, connected } = useWallet();

  // State management
  const [amount, setAmount] = useState<number>(1000);
  const [fromCurrency, setFromCurrency] = useState<string>('INR');
  const [toCurrency, setToCurrency] = useState<string>('USD');
  const [exchangeRate, setExchangeRate] = useState<number>(0.012); // Default INR to USD rate

  /* Fee ratio. Was hardcoded at 1.5%, which contradicted the backend: the
     corridor defaults in bridge-service/src/offramp/offramp-engine.js are
     platform 0.5% + network 0.2% + corridor 0.1% = 0.8%. This now reads the real
     figure from /api/offramp/quote and falls back to that 0.8% default. */
  const [fees, setFees] = useState<number>(DEFAULT_FEE_RATE);
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

  const receiveTokenCurrencies = availableCurrencies.filter((c) =>
    TREASURY_SUPPORTED_TOKEN_CODES.has(c.code)
  );

  // Calculated values - dynamic currency conversion
  const cryptoEquivalent = amount * exchangeRate; // Convert from fiat to crypto
  const feeAmount = cryptoEquivalent * fees;
  const netAmount = cryptoEquivalent - feeAmount;

  // Quick amount presets
  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  useEffect(() => {
    if (!TREASURY_SUPPORTED_TOKEN_CODES.has(toCurrency)) {
      setToCurrency('USD');
    }
  }, [toCurrency]);

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

    // Read the real fee breakdown for this corridor. Non-blocking: on any
    // failure we keep the engine's default ratio rather than guessing.
    try {
      const quoteResponse = await fetch(`${BRIDGE_URL}/api/offramp/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromCurrency, toCurrency, amount: 1000 }),
      });

      if (quoteResponse.ok) {
        const quoteJson = await quoteResponse.json();
        const converted = quoteJson?.quote?.convertedAmount;
        const total = quoteJson?.quote?.totalFees;

        if (typeof converted === 'number' && converted > 0 && typeof total === 'number') {
          setFees(total / converted);
        }
      }
    } catch (error) {
      console.warn('Falling back to default fee ratio:', error);
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
    if (!connected || !publicKey) {
      throw new Error('Connect your Solana wallet before paying');
    }

    try {
      // Step 1: Create automated transfer order (like PaymentApp but with transfer flag)
      const orderResponse = await fetch(`${BRIDGE_URL}/api/onramp/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAddress: publicKey.toBase58(),
          fiatAmount: amount,
          fiatCurrency: fromCurrency,
          cryptoCurrency: toCurrency,
          // Mark this as automated transfer so backend processes it correctly
          automatedTransfer: true,
          recipientDetails: recipientDetails,
          transferType: 'automated_payout'
        })
      });

      const orderJson = await orderResponse.json().catch(() => ({}));

      if (!orderResponse.ok) {
        const msg =
          (orderJson as { error?: string }).error ||
          `Failed to create transfer order (${orderResponse.status})`;
        throw new Error(msg);
      }

      if (!(orderJson as { success?: boolean }).success) {
        throw new Error((orderJson as { error?: string }).error || 'Failed to create transfer order');
      }

      const orderResult = orderJson;

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

      const paymentJson = await paymentResponse.json().catch(() => ({}));

      if (!paymentResponse.ok) {
        throw new Error(
          (paymentJson as { error?: string }).error ||
            `Failed to create payment (${paymentResponse.status})`
        );
      }

      if (!(paymentJson as { success?: boolean }).success) {
        throw new Error((paymentJson as { error?: string }).error || 'Failed to create payment');
      }

      const paymentResult = paymentJson;

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

    if (!connected || !publicKey) {
      setError('Connect your Solana wallet before paying');
      return;
    }

    const walletAddress = publicKey.toBase58();

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
          user_address: walletAddress
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

  const amountError = error && error.includes('amount') ? error : null;
  const otherError = error && !error.includes('amount') ? error : null;
  const fromSymbol = getCurrencySymbol(fromCurrency);
  const toSymbol = getCurrencySymbol(toCurrency);

  return (
    <div>
      {/* ── Heading ── */}
      <div className="mb-7">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-ink-900">
          Amount &amp; payment
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500">
          How much are you sending to{' '}
          <span className="font-semibold text-ink-800">{recipientDetails.name}</span>?
        </p>
      </div>

      {/* ── Quick select ── */}
      <div className="mb-5">
        <p className={LABEL}>Quick select</p>
        <div className="flex flex-wrap gap-2">
          {quickAmounts.map((quickAmount) => {
            const isActive = amount === quickAmount;
            return (
              <button
                key={quickAmount}
                type="button"
                onClick={() => handleAmountChange(quickAmount)}
                className={`font-mono rounded-full px-4 py-2 text-[13px] font-bold outline-none transition-all focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)] ${
                  isActive
                    ? 'text-white'
                    : 'border border-[rgba(4,33,64,0.14)] bg-white text-ink-600 hover:border-teal-300 hover:text-navy-700'
                }`}
                style={isActive ? { background: GRAD } : { boxShadow: SH1 }}
              >
                {fromSymbol}
                {quickAmount.toLocaleString()}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Amount ── */}
      <div className="mb-5">
        <label className={LABEL} htmlFor="transfer-amount">
          You send
        </label>
        <div
          className={`rounded-xl border bg-white px-5 py-4 transition-all focus-within:ring-4 ${
            amountError
              ? 'border-[#FF4D4F] focus-within:ring-[rgba(255,77,79,0.14)]'
              : 'border-[rgba(4,33,64,0.14)] focus-within:border-navy-600 focus-within:ring-[rgba(10,65,116,0.14)]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl font-bold text-ink-400">{fromSymbol}</span>
            <input
              id="transfer-amount"
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(Number(e.target.value))}
              min={100}
              max={200000}
              className="font-mono w-full border-none bg-transparent p-0 text-3xl font-bold text-ink-900 outline-none focus:ring-0"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              aria-label="From currency"
              className="font-display shrink-0 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm font-semibold text-ink-900 outline-none focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
              style={{ boxShadow: SH1 }}
            >
              {availableCurrencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>
        {amountError ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#C2292B' }}>
            <AlertCircle size={13} className="shrink-0" />
            {amountError}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-ink-400">
            Min {fromSymbol}100 · Max {fromSymbol}2,00,000
          </p>
        )}
      </div>

      {/* ── Token received ── */}
      <div className="mb-6">
        <label className={LABEL} htmlFor="receive-token">
          Token you receive
        </label>
        <select
          id="receive-token"
          value={toCurrency}
          onChange={(e) => setToCurrency(e.target.value)}
          className="font-display h-[52px] w-full rounded-xl border border-[rgba(4,33,64,0.14)] bg-white px-4 text-[15px] font-medium text-ink-900 outline-none transition-all focus:border-navy-600 focus:ring-4 focus:ring-[rgba(10,65,116,0.14)]"
        >
          {receiveTokenCurrencies.map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.code} — on-chain token
            </option>
          ))}
        </select>
      </div>

      {/* ── Summary ── */}
      {amount > 0 && (
        <div
          className="mb-5 overflow-hidden rounded-2xl border"
          style={{ borderColor: 'rgba(12,112,117,0.22)', backgroundColor: 'rgba(225,245,245,0.35)' }}
        >
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(12,112,117,0.16)' }}>
            <span className={`${LABEL} mb-0`}>Transfer summary</span>
            {isLoadingRates && <Loader2 size={14} className="animate-spin text-navy-400" />}
          </div>

          <div className="space-y-3 px-5 py-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-ink-500">Amount ({fromCurrency})</span>
              <span className="font-mono text-sm font-bold text-ink-900">
                {fromSymbol}
                {amount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-ink-500">Exchange rate</span>
              <span className="font-mono text-sm text-ink-800">
                1 {fromCurrency} = {exchangeRate.toFixed(6)} {toCurrency}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-ink-500">{toCurrency} equivalent</span>
              <span className="font-mono text-sm text-ink-800">
                {toSymbol}
                {cryptoEquivalent.toFixed(2)}
              </span>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-[13px] text-ink-500">
                Total fee ({(fees * 100).toFixed(2)}%)
              </span>
              <span className="font-mono text-sm font-semibold" style={{ color: '#8A6200' }}>
                -{toSymbol}
                {feeAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div
            className="flex items-center justify-between gap-4 px-5 py-4"
            style={{ borderTop: '1px solid rgba(12,112,117,0.16)', backgroundColor: 'rgba(255,255,255,0.6)' }}
          >
            <span className="font-display text-sm font-bold text-ink-900">Recipient receives</span>
            <span className="font-mono text-xl font-bold text-teal-600">
              {toSymbol}
              {netAmount.toFixed(2)} {toCurrency}
            </span>
          </div>

          <div className="flex items-center gap-2 px-5 pb-4">
            <Zap size={13} className="text-teal-500" />
            <span className="text-xs text-ink-500">Automated processing: ~60 seconds</span>
          </div>
        </div>
      )}

      {/* ── Recipient recap ── */}
      <div
        className="mb-5 rounded-2xl border border-[rgba(4,33,64,0.08)] bg-white p-5"
        style={{ boxShadow: SH1 }}
      >
        <p className={LABEL}>Transfer details</p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
          {[
            { k: 'To', v: recipientDetails.name, mono: false },
            { k: 'Account', v: `••••${recipientDetails.accountNumber.slice(-4)}`, mono: true },
            { k: 'IFSC', v: recipientDetails.ifscCode, mono: true },
            { k: 'Phone', v: recipientDetails.phone, mono: true },
          ].map((row) => (
            <div key={row.k}>
              <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">{row.k}</p>
              <p
                className={`mt-0.5 text-sm font-semibold text-ink-800 ${row.mono ? 'font-mono' : ''}`}
              >
                {row.v}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Security note ── */}
      <div
        className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3.5"
        style={{ backgroundColor: 'rgba(10,65,116,0.06)' }}
      >
        <ShieldCheck size={16} className="mt-0.5 shrink-0 text-navy-600" />
        <p className="text-[13px] leading-relaxed text-ink-600">
          Your payment is secured by Razorpay and settled on-chain via USD tokens.
        </p>
      </div>

      {/* ── Error ── */}
      {otherError && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-xl border px-4 py-3.5"
          style={{ backgroundColor: 'rgba(255,77,79,0.08)', borderColor: 'rgba(255,77,79,0.26)' }}
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" style={{ color: '#C2292B' }} />
          <p className="text-sm leading-relaxed" style={{ color: '#C2292B' }}>
            {otherError}
          </p>
        </div>
      )}

      {/* ── Processing ── */}
      {isProcessing && (
        <div className="mb-5">
          <p className="mb-2 flex items-center gap-2 text-[13px] font-medium text-ink-500">
            <Loader2 size={14} className="animate-spin" />
            Preparing payment gateway...
          </p>
          <div className="h-1 w-full overflow-hidden rounded-full bg-ink-100">
            <div className="h-full w-1/3 animate-pulse rounded-full" style={{ background: GRAD }} />
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col gap-3 border-t border-[rgba(4,33,64,0.08)] pt-7 sm:flex-row">
        <button
          type="button"
          onClick={onBack}
          disabled={isProcessing}
          className="font-display inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[rgba(4,33,64,0.14)] bg-white px-6 text-sm font-semibold text-ink-700 outline-none transition-colors hover:bg-ink-50 focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)] disabled:cursor-not-allowed disabled:opacity-50"
          style={{ boxShadow: SH1 }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <button
          type="button"
          onClick={openRazorpayCheckout}
          disabled={amount <= 0 || isProcessing || !validateAmount() || !connected || !publicKey}
          className="font-display inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white outline-none transition-all hover:-translate-y-px focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.24)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          style={{ background: GRAD, boxShadow: '0 4px 14px rgba(10,65,116,0.24)' }}
        >
          {isProcessing ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard size={17} />
              Pay {fromSymbol}
              {amount.toLocaleString()}
            </>
          )}
        </button>
      </div>

      {!connected && (
        <p className="mt-3 text-center text-[13px] text-ink-400">
          Connect your wallet to continue.
        </p>
      )}
    </div>
  );
};

export default AmountPaymentForm;
