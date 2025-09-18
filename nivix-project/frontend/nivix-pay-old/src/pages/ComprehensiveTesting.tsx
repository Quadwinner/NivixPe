import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Chip,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Tab,
  Tabs,
  Container
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  AccountBalance as BankIcon,
  TrendingUp as RateIcon,
  Receipt as QuoteIcon,
  Send as InitiateIcon,
  CheckCircle as StatusIcon,
  Webhook as WebhookIcon,
  CurrencyExchange as OnRampIcon,
  CallMade as OffRampIcon,
  Security as KYCIcon,
  Pool as PoolIcon
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';

const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`testing-tabpanel-${index}`}
      aria-labelledby={`testing-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ComprehensiveTesting: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // System Status
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [poolsData, setPoolsData] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<any>(null);

  // On-ramp Testing
  const [onrampForm, setOnrampForm] = useState({
    fiatAmount: 100,
    fiatCurrency: 'USD',
    cryptoCurrency: 'USD',
    paymentMethod: 'upi',
    upiId: 'test@paytm'
  });
  const [onrampOrder, setOnrampOrder] = useState<any>(null);
  const [paymentData, setPaymentData] = useState<any>(null);

  // Off-ramp Testing
  const [offrampForm, setOfframpForm] = useState({
    amount: 100,
    fromCurrency: 'USD',
    toCurrency: 'USD',
    userAddress: ''
  });
  const [offrampQuote, setOfframpQuote] = useState<any>(null);
  const [withdrawalForm, setWithdrawalForm] = useState({
    accountName: 'Test User',
    upiId: 'testuser@paytm'
  });
  const [withdrawalTransaction, setWithdrawalTransaction] = useState<any>(null);

  // KYC Testing
  const [kycForm, setKycForm] = useState({
    fullName: 'Test User',
    countryCode: 'US',
    riskScore: 1
  });

  // Test Results
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    timestamp: string;
    data?: any;
  }>>([]);

  const addTestResult = (test: string, status: 'success' | 'error' | 'warning', message: string, data?: any) => {
    setTestResults(prev => [{
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString(),
      data
    }, ...prev.slice(0, 19)]); // Keep last 20 results
  };

  // Initialize form with wallet address
  useEffect(() => {
    if (connected && publicKey) {
      setOfframpForm(prev => ({ ...prev, userAddress: publicKey.toBase58() }));
    }
  }, [connected, publicKey]);

  // System Health Check
  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BRIDGE_URL}/health`);
      const data = await response.json();
      setSystemHealth(data);
      addTestResult('System Health', 'success', `Status: ${data.status}`, data);
    } catch (err: any) {
      addTestResult('System Health', 'error', err.message);
    }
    setLoading(false);
  };

  // Check Liquidity Pools
  const checkLiquidityPools = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BRIDGE_URL}/api/pools`);
      const data = await response.json();
      setPoolsData(data);
      if (data.success && data.pools) {
        addTestResult('Liquidity Pools', 'success', `Found ${data.pools.length} pools`, data);
      } else {
        addTestResult('Liquidity Pools', 'warning', 'No pools found or invalid response', data);
      }
    } catch (err: any) {
      addTestResult('Liquidity Pools', 'error', err.message);
    }
    setLoading(false);
  };

  // Test KYC Storage
  const testKYCStorage = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const kycData = {
        userAddress: publicKey.toBase58(),
        fullName: kycForm.fullName,
        kycVerified: true,
        verificationDate: new Date().toISOString(),
        riskScore: kycForm.riskScore,
        countryCode: kycForm.countryCode
      };

      const response = await fetch(`${BRIDGE_URL}/api/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycData)
      });

      const result = await response.json();
      if (result.success) {
        addTestResult('KYC Storage', 'success', `Stored KYC data: ${result.verification_id}`, result);
        setSuccess('KYC data stored successfully');
        
        // Check KYC status after storage
        setTimeout(checkKYCStatus, 1000);
      } else {
        addTestResult('KYC Storage', 'error', result.message || 'Failed to store KYC', result);
      }
    } catch (err: any) {
      addTestResult('KYC Storage', 'error', err.message);
    }
    setLoading(false);
  };

  // Check KYC Status
  const checkKYCStatus = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BRIDGE_URL}/api/kyc/status/${publicKey.toBase58()}`);
      const data = await response.json();
      setKycStatus(data);
      
      if (data.success && data.verified) {
        addTestResult('KYC Status', 'success', 'User is KYC verified', data);
      } else {
        addTestResult('KYC Status', 'warning', data.message || 'User not verified', data);
      }
    } catch (err: any) {
      addTestResult('KYC Status', 'error', err.message);
    }
    setLoading(false);
  };

  // Test On-ramp Flow
  const testOnrampFlow = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Step 1: Create On-ramp Order
      const orderData = {
        userAddress: publicKey.toBase58(),
        fiatAmount: onrampForm.fiatAmount,
        fiatCurrency: onrampForm.fiatCurrency,
        cryptoCurrency: onrampForm.cryptoCurrency
      };

      const orderResponse = await fetch(`${BRIDGE_URL}/api/onramp/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const orderResult = await orderResponse.json();
      if (orderResult.success) {
        setOnrampOrder(orderResult);
        addTestResult('On-ramp Order', 'success', `Order created: ${orderResult.orderId}`, orderResult);

        // Step 2: Create Payment
        const paymentRequestData = {
          orderId: orderResult.orderId,
          paymentMethod: onrampForm.paymentMethod,
          upiId: onrampForm.upiId
        };

        const paymentResponse = await fetch(`${BRIDGE_URL}/api/onramp/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(paymentRequestData)
        });

        const paymentResult = await paymentResponse.json();
        if (paymentResult.success) {
          setPaymentData(paymentResult);
          addTestResult('On-ramp Payment', 'success', `Payment created: ${paymentResult.razorpayOrderId}`, paymentResult);
          setSuccess(`On-ramp flow initiated! Order: ${orderResult.orderId}`);
        } else {
          addTestResult('On-ramp Payment', 'error', paymentResult.error || 'Payment creation failed', paymentResult);
        }
      } else {
        addTestResult('On-ramp Order', 'error', orderResult.error || 'Order creation failed', orderResult);
      }
    } catch (err: any) {
      addTestResult('On-ramp Flow', 'error', err.message);
    }
    setLoading(false);
  };

  // Test Off-ramp Flow
  const testOfframpFlow = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Step 1: Get Quote
      const quoteData = {
        fromCurrency: offrampForm.fromCurrency,
        toCurrency: offrampForm.toCurrency,
        amount: offrampForm.amount.toString(),
        userAddress: publicKey.toBase58()
      };

      const quoteResponse = await fetch(`${BRIDGE_URL}/api/offramp/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData)
      });

      const quoteResult = await quoteResponse.json();
      if (quoteResult.success) {
        setOfframpQuote(quoteResult);
        addTestResult('Off-ramp Quote', 'success', `Quote: ${quoteResult.quote.quoteId}`, quoteResult);

        // Step 2: Initiate Withdrawal
        const withdrawalData = {
          quoteId: quoteResult.quote.quoteId,
          beneficiaryDetails: {
            accountName: withdrawalForm.accountName,
            upiId: withdrawalForm.upiId
          }
        };

        const withdrawalResponse = await fetch(`${BRIDGE_URL}/api/offramp/initiate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(withdrawalData)
        });

        const withdrawalResult = await withdrawalResponse.json();
        if (withdrawalResult.success) {
          setWithdrawalTransaction(withdrawalResult);
          addTestResult('Off-ramp Withdrawal', 'success', `Transaction: ${withdrawalResult.transactionId}`, withdrawalResult);
          setSuccess(`Off-ramp withdrawal initiated! Transaction: ${withdrawalResult.transactionId}`);
        } else {
          addTestResult('Off-ramp Withdrawal', 'error', withdrawalResult.message || 'Withdrawal failed', withdrawalResult);
        }
      } else {
        addTestResult('Off-ramp Quote', 'error', quoteResult.message || 'Quote generation failed', quoteResult);
      }
    } catch (err: any) {
      addTestResult('Off-ramp Flow', 'error', err.message);
    }
    setLoading(false);
  };

  // Run All Tests
  const runAllTests = async () => {
    setTestResults([]);
    await checkSystemHealth();
    await checkLiquidityPools();
    if (connected && publicKey) {
      await testKYCStorage();
      await testOnrampFlow();
      await testOfframpFlow();
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ width: '100%', typography: 'body1' }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          🧪 Nivix Comprehensive Testing Suite
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
          Test all Nivix functionality with real Razorpay test keys and Solana devnet integration.
          Connect your wallet to test on-ramp and off-ramp flows.
        </Typography>

        {!connected && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Connect your wallet to test on-ramp and off-ramp functionality
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="testing tabs">
            <Tab label="System Overview" icon={<StatusIcon />} />
            <Tab label="On-ramp Testing" icon={<OnRampIcon />} />
            <Tab label="Off-ramp Testing" icon={<OffRampIcon />} />
            <Tab label="KYC Testing" icon={<KYCIcon />} />
            <Tab label="Test Results" icon={<RefreshIcon />} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* System Overview */}
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={runAllTests}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
                >
                  Run All Tests
                </Button>
                <Button variant="outlined" onClick={checkSystemHealth} disabled={loading}>
                  Check Health
                </Button>
                <Button variant="outlined" onClick={checkLiquidityPools} disabled={loading}>
                  Check Pools
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <StatusIcon sx={{ mr: 1 }} />
                    System Health
                  </Typography>
                  {systemHealth ? (
                    <Box>
                      <Chip 
                        label={systemHealth.status} 
                        color={systemHealth.status === 'ok' ? 'success' : 'error'} 
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Service: {systemHealth.service}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Version: {systemHealth.version}
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">Features:</Typography>
                        {systemHealth.features && Object.entries(systemHealth.features).map(([key, value]) => (
                          <Chip 
                            key={key}
                            label={key}
                            size="small"
                            color={value ? 'success' : 'default'}
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Click "Check Health" to test system status
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <PoolIcon sx={{ mr: 1 }} />
                    Liquidity Pools
                  </Typography>
                  {poolsData ? (
                    <Box>
                      <Chip 
                        label={`${poolsData.pools?.length || 0} pools`} 
                        color={poolsData.pools?.length > 0 ? 'success' : 'warning'} 
                        sx={{ mb: 1 }}
                      />
                      {poolsData.pools && poolsData.pools.length > 0 && (
                        <Box>
                          <Typography variant="caption" display="block">Sample pools:</Typography>
                          {poolsData.pools.slice(0, 3).map((pool: any, index: number) => (
                            <Typography key={index} variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                              {pool.sourceCurrency}→{pool.destinationCurrency} (Rate: {pool.exchangeRate})
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Click "Check Pools" to load liquidity data
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <KYCIcon sx={{ mr: 1 }} />
                    KYC Status
                  </Typography>
                  {connected ? (
                    <Box>
                      {kycStatus ? (
                        <Box>
                          <Chip 
                            label={kycStatus.verified ? 'Verified' : 'Not Verified'} 
                            color={kycStatus.verified ? 'success' : 'warning'} 
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            {kycStatus.message}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Click "Check KYC" in KYC Testing tab
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Connect wallet to check KYC status
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* On-ramp Testing */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <OnRampIcon sx={{ mr: 1 }} />
                    On-ramp Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Fiat Amount"
                        type="number"
                        value={onrampForm.fiatAmount}
                        onChange={(e) => setOnrampForm({...onrampForm, fiatAmount: Number(e.target.value)})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Fiat Currency</InputLabel>
                        <Select
                          value={onrampForm.fiatCurrency}
                          onChange={(e) => setOnrampForm({...onrampForm, fiatCurrency: e.target.value})}
                        >
                          <MenuItem value="USD">USD</MenuItem>
                          <MenuItem value="EUR">EUR</MenuItem>
                          <MenuItem value="INR">INR</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Crypto Currency</InputLabel>
                        <Select
                          value={onrampForm.cryptoCurrency}
                          onChange={(e) => setOnrampForm({...onrampForm, cryptoCurrency: e.target.value})}
                        >
                          <MenuItem value="USD">USD Token</MenuItem>
                          <MenuItem value="EUR">EUR Token</MenuItem>
                          <MenuItem value="INR">INR Token</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="UPI ID"
                        value={onrampForm.upiId}
                        onChange={(e) => setOnrampForm({...onrampForm, upiId: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={testOnrampFlow}
                        disabled={loading || !connected}
                        startIcon={loading ? <CircularProgress size={20} /> : <OnRampIcon />}
                      >
                        Test On-ramp Flow
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    On-ramp Results
                  </Typography>
                  {onrampOrder && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Order Details:</Typography>
                      <Typography variant="body2">Order ID: {onrampOrder.orderId}</Typography>
                      <Typography variant="body2">Amount: {onrampOrder.fiatAmount} {onrampOrder.fiatCurrency}</Typography>
                      <Typography variant="body2">Status: {onrampOrder.status}</Typography>
                    </Box>
                  )}
                  {paymentData && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Payment Details:</Typography>
                      <Typography variant="body2">Razorpay Order: {paymentData.razorpayOrderId}</Typography>
                      <Typography variant="body2">Payment URL: Available</Typography>
                    </Box>
                  )}
                  {!onrampOrder && (
                    <Typography variant="body2" color="text.secondary">
                      Run on-ramp test to see results here
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Off-ramp Testing */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <OffRampIcon sx={{ mr: 1 }} />
                    Off-ramp Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount"
                        type="number"
                        value={offrampForm.amount}
                        onChange={(e) => setOfframpForm({...offrampForm, amount: Number(e.target.value)})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>From Currency</InputLabel>
                        <Select
                          value={offrampForm.fromCurrency}
                          onChange={(e) => setOfframpForm({...offrampForm, fromCurrency: e.target.value})}
                        >
                          <MenuItem value="USD">USD</MenuItem>
                          <MenuItem value="EUR">EUR</MenuItem>
                          <MenuItem value="INR">INR</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>To Currency</InputLabel>
                        <Select
                          value={offrampForm.toCurrency}
                          onChange={(e) => setOfframpForm({...offrampForm, toCurrency: e.target.value})}
                        >
                          <MenuItem value="USD">USD</MenuItem>
                          <MenuItem value="EUR">EUR</MenuItem>
                          <MenuItem value="INR">INR</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="UPI ID"
                        value={withdrawalForm.upiId}
                        onChange={(e) => setWithdrawalForm({...withdrawalForm, upiId: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Account Name"
                        value={withdrawalForm.accountName}
                        onChange={(e) => setWithdrawalForm({...withdrawalForm, accountName: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={testOfframpFlow}
                        disabled={loading || !connected}
                        startIcon={loading ? <CircularProgress size={20} /> : <OffRampIcon />}
                      >
                        Test Off-ramp Flow
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Off-ramp Results
                  </Typography>
                  {offrampQuote && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>Quote Details:</Typography>
                      <Typography variant="body2">Quote ID: {offrampQuote.quote.quoteId}</Typography>
                      <Typography variant="body2">Exchange Rate: {offrampQuote.quote.exchangeRate}</Typography>
                      <Typography variant="body2">Net Amount: {offrampQuote.quote.netAmount}</Typography>
                      <Typography variant="body2">Total Fees: {offrampQuote.quote.fees?.total}</Typography>
                    </Box>
                  )}
                  {withdrawalTransaction && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>Transaction Details:</Typography>
                      <Typography variant="body2">Transaction ID: {withdrawalTransaction.transactionId}</Typography>
                      <Typography variant="body2">Route: {withdrawalTransaction.routeUsed}</Typography>
                      <Typography variant="body2">Status: {withdrawalTransaction.status}</Typography>
                    </Box>
                  )}
                  {!offrampQuote && (
                    <Typography variant="body2" color="text.secondary">
                      Run off-ramp test to see results here
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* KYC Testing */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <KYCIcon sx={{ mr: 1 }} />
                    KYC Configuration
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={kycForm.fullName}
                        onChange={(e) => setKycForm({...kycForm, fullName: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Country Code</InputLabel>
                        <Select
                          value={kycForm.countryCode}
                          onChange={(e) => setKycForm({...kycForm, countryCode: e.target.value})}
                        >
                          <MenuItem value="US">US</MenuItem>
                          <MenuItem value="IN">IN</MenuItem>
                          <MenuItem value="GB">GB</MenuItem>
                          <MenuItem value="EU">EU</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Risk Score</InputLabel>
                        <Select
                          value={kycForm.riskScore}
                          onChange={(e) => setKycForm({...kycForm, riskScore: Number(e.target.value)})}
                        >
                          <MenuItem value={1}>Low (1)</MenuItem>
                          <MenuItem value={2}>Medium (2)</MenuItem>
                          <MenuItem value={3}>High (3)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        onClick={testKYCStorage}
                        disabled={loading || !connected}
                        startIcon={loading ? <CircularProgress size={20} /> : <KYCIcon />}
                      >
                        Submit KYC
                      </Button>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={checkKYCStatus}
                        disabled={loading || !connected}
                      >
                        Check Status
                      </Button>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    KYC Results
                  </Typography>
                  {kycStatus && (
                    <Box>
                      <Chip 
                        label={kycStatus.verified ? 'Verified' : 'Not Verified'} 
                        color={kycStatus.verified ? 'success' : 'warning'} 
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2">Message: {kycStatus.message}</Typography>
                      {connected && (
                        <Typography variant="body2" sx={{ mt: 1, fontSize: '0.75rem' }}>
                          Address: {publicKey?.toBase58()}
                        </Typography>
                      )}
                    </Box>
                  )}
                  {!kycStatus && (
                    <Typography variant="body2" color="text.secondary">
                      Submit or check KYC to see results here
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={4}>
          {/* Test Results */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <RefreshIcon sx={{ mr: 1 }} />
                Test Results Log
              </Typography>
              <List sx={{ maxHeight: 600, overflow: 'auto' }}>
                {testResults.length === 0 ? (
                  <ListItem>
                    <ListItemText 
                      primary="No test results yet" 
                      secondary="Run tests to see results here"
                    />
                  </ListItem>
                ) : (
                  testResults.map((result, index) => (
                    <ListItem key={index} divider>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip 
                              label={result.test} 
                              size="small" 
                              color={result.status === 'success' ? 'success' : result.status === 'error' ? 'error' : 'warning'}
                            />
                            <Typography variant="caption">{result.timestamp}</Typography>
                          </Box>
                        }
                        secondary={result.message}
                      />
                    </ListItem>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </Container>
  );
};

export default ComprehensiveTesting;








