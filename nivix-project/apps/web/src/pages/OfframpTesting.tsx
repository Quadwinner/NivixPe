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
  Tooltip
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  AccountBalance as BankIcon,
  TrendingUp as RateIcon,
  Receipt as QuoteIcon,
  Send as InitiateIcon,
  CheckCircle as StatusIcon,
  Webhook as WebhookIcon
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';

const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');

interface Quote {
  quoteId: string;
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  exchangeRate: number;
  convertedAmount: number;
  fees: {
    platformFee: number;
    networkFee: number;
    corridorFee: number;
    totalFees: number;
  };
  netAmount: number;
  corridor: string;
  paymentMethod: string;
  estimatedTime: string;
  validUntil: string;
}

interface Transaction {
  transactionId: string;
  quoteId: string;
  status: string;
  userAddress: string;
  razorpayOrderId?: string;
  estimatedCompletion?: string;
  completedAt?: string;
  bankTransferRef?: string;
}

const OfframpTesting: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // System Status
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [treasuryStatus, setTreasuryStatus] = useState<any>(null);
  const [exchangeRates, setExchangeRates] = useState<any>({});

  // Quote Testing
  const [quoteForm, setQuoteForm] = useState({
    amount: 100,
    fromCurrency: 'USD',
    toCurrency: 'INR',
    corridor: 'IN'
  });
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  // Initiation Testing
  const [initiationForm, setInitiationForm] = useState({
    accountNumber: '1234567890',
    ifscCode: 'HDFC0000123',
    accountName: 'Test User',
    accountType: 'savings',
    upiId: 'testuser@paytm',
    phone: '9876543210'
  });
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  // Transaction Status
  const [statusTransactionId, setStatusTransactionId] = useState('');
  const [transactionStatus, setTransactionStatus] = useState<any>(null);

  // Test Results
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    timestamp: string;
  }>>([]);

  const addTestResult = (test: string, status: 'success' | 'error' | 'warning', message: string) => {
    setTestResults(prev => [{
      test,
      status,
      message,
      timestamp: new Date().toLocaleTimeString()
    }, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  // System Health Check
  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BRIDGE_URL}/health`);
      const data = await response.json();
      setSystemHealth(data);
      addTestResult('Health Check', 'success', `System status: ${data.status}`);
    } catch (err: any) {
      addTestResult('Health Check', 'error', err.message);
    }
    setLoading(false);
  };

  // Treasury Status Check
  const checkTreasuryStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BRIDGE_URL}/api/treasury/status`);
      const data = await response.json();
      setTreasuryStatus(data);
      addTestResult('Treasury Status', 'success', `Treasury: ${data.status?.status || 'Unknown'}`);
    } catch (err: any) {
      addTestResult('Treasury Status', 'error', err.message);
    }
    setLoading(false);
  };

  // Exchange Rates Check
  const checkExchangeRates = async () => {
    setLoading(true);
    try {
      const pairs = ['USD/INR', 'INR/USD'];
      const rates: any = {};
      
      for (const pair of pairs) {
        const [from, to] = pair.split('/');
        const response = await fetch(`${BRIDGE_URL}/api/rates/${from}/${to}`);
        const data = await response.json();
        rates[pair] = data.success ? data.rate : 'Error';
      }
      
      setExchangeRates(rates);
      addTestResult('Exchange Rates', 'success', `Fetched ${Object.keys(rates).length} rates`);
    } catch (err: any) {
      addTestResult('Exchange Rates', 'error', err.message);
    }
    setLoading(false);
  };

  // Get Off-ramp Quote
  const getQuote = async () => {
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
          ...quoteForm,
          userAddress: publicKey.toBase58()
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentQuote(data.quote);
        addTestResult('Off-ramp Quote', 'success', `Quote ID: ${data.quote.quoteId}`);
        setSuccess(`Quote generated! Net amount: ₹${data.quote.netAmount}`);
      } else {
        addTestResult('Off-ramp Quote', 'error', data.message);
        setError(data.message);
      }
    } catch (err: any) {
      addTestResult('Off-ramp Quote', 'error', err.message);
      setError(err.message);
    }
    setLoading(false);
  };

  // Initiate Off-ramp Transaction
  const initiateTransaction = async () => {
    if (!currentQuote) {
      setError('Please get a quote first');
      return;
    }

    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BRIDGE_URL}/api/offramp/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: currentQuote.quoteId,
          userAddress: publicKey.toBase58(),
          beneficiaryDetails: initiationForm
        })
      });

      const data = await response.json();
      if (data.success) {
        setCurrentTransaction(data.transaction);
        addTestResult('Off-ramp Initiation', 'success', `Transaction ID: ${data.transaction.transactionId}`);
        setSuccess(`Transaction initiated! ID: ${data.transaction.transactionId}`);
      } else {
        addTestResult('Off-ramp Initiation', 'warning', data.message);
        setError(data.message);
      }
    } catch (err: any) {
      addTestResult('Off-ramp Initiation', 'error', err.message);
      setError(err.message);
    }
    setLoading(false);
  };

  // Check Transaction Status
  const checkTransactionStatus = async () => {
    const txId = statusTransactionId || currentTransaction?.transactionId;
    if (!txId) {
      setError('Please enter a transaction ID or initiate a transaction first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BRIDGE_URL}/api/offramp/status/${txId}`);
      const data = await response.json();
      
      if (response.status === 404) {
        addTestResult('Transaction Status', 'warning', 'Transaction not found (expected for test)');
        setTransactionStatus({ error: 'Transaction not found (expected for test)' });
      } else if (data.success) {
        setTransactionStatus(data.transaction);
        addTestResult('Transaction Status', 'success', `Status: ${data.transaction.status}`);
      } else {
        addTestResult('Transaction Status', 'error', data.message);
        setError(data.message);
      }
    } catch (err: any) {
      addTestResult('Transaction Status', 'error', err.message);
      setError(err.message);
    }
    setLoading(false);
  };

  // Test Webhook Endpoint
  const testWebhook = async () => {
    setLoading(true);
    try {
      const webhookPayload = {
        event: 'payout.processed',
        payload: {
          payout: {
            entity: {
              id: `pout_test_${Date.now()}`,
              fund_account_id: `fa_test_${Date.now()}`,
              amount: 8315,
              currency: 'INR',
              status: 'processed',
              utr: `UTR${Date.now()}`,
              mode: 'UPI',
              purpose: 'payout',
              created_at: Math.floor(Date.now() / 1000),
              processed_at: Math.floor(Date.now() / 1000)
            }
          }
        }
      };

      const response = await fetch(`${BRIDGE_URL}/api/razorpay/webhook`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Razorpay-Event-Id': `event_${Date.now()}`,
          'X-Razorpay-Signature': 'test_signature'
        },
        body: JSON.stringify(webhookPayload)
      });

      const data = await response.json();
      if (data.success) {
        addTestResult('Webhook Test', 'success', 'Webhook processed successfully');
        setSuccess('Webhook test completed successfully!');
      } else {
        addTestResult('Webhook Test', 'error', data.message);
        setError(data.message);
      }
    } catch (err: any) {
      addTestResult('Webhook Test', 'error', err.message);
      setError(err.message);
    }
    setLoading(false);
  };

  // Run All Tests
  const runAllTests = async () => {
    setTestResults([]);
    await checkSystemHealth();
    await new Promise(resolve => setTimeout(resolve, 500));
    await checkTreasuryStatus();
    await new Promise(resolve => setTimeout(resolve, 500));
    await checkExchangeRates();
    await new Promise(resolve => setTimeout(resolve, 500));
    await testWebhook();
  };

  useEffect(() => {
    checkSystemHealth();
    checkTreasuryStatus();
    checkExchangeRates();
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🧪 Off-ramp Testing Dashboard
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Test the complete off-ramp functionality with real APIs
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* System Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">🔍 System Status</Typography>
                <Button 
                  startIcon={<RefreshIcon />} 
                  onClick={runAllTests}
                  disabled={loading}
                >
                  Run All Tests
                </Button>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <BankIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Health Check</Typography>
                    <Chip 
                      label={systemHealth?.status || 'Unknown'} 
                      color={systemHealth?.status === 'ok' ? 'success' : 'error'}
                      size="small"
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <BankIcon color="secondary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Treasury</Typography>
                    <Chip 
                      label={treasuryStatus?.status?.status || 'Unknown'} 
                      color={treasuryStatus?.status?.status === 'OPERATIONAL' ? 'success' : 'error'}
                      size="small"
                    />
                  </Paper>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <RateIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h6">Exchange Rates</Typography>
                    <Typography variant="body2">
                      USD/INR: {exchangeRates['USD/INR'] || 'Loading...'}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Quote Testing */}
        <Grid item xs={12} md={6}>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <QuoteIcon sx={{ mr: 1 }} />
              <Typography variant="h6">💰 Off-ramp Quote</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={quoteForm.amount}
                    onChange={(e) => setQuoteForm({...quoteForm, amount: Number(e.target.value)})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>From Currency</InputLabel>
                    <Select
                      value={quoteForm.fromCurrency}
                      onChange={(e) => setQuoteForm({...quoteForm, fromCurrency: e.target.value})}
                    >
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="GBP">GBP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>To Currency</InputLabel>
                    <Select
                      value={quoteForm.toCurrency}
                      onChange={(e) => setQuoteForm({...quoteForm, toCurrency: e.target.value})}
                    >
                      <MenuItem value="INR">INR</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Corridor</InputLabel>
                    <Select
                      value={quoteForm.corridor}
                      onChange={(e) => setQuoteForm({...quoteForm, corridor: e.target.value})}
                    >
                      <MenuItem value="IN">India</MenuItem>
                      <MenuItem value="US">United States</MenuItem>
                      <MenuItem value="EU">Europe</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={getQuote}
                    disabled={loading || !connected}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Get Quote'}
                  </Button>
                </Grid>
              </Grid>

              {currentQuote && (
                <Box mt={2}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Quote Details:</Typography>
                  <Typography variant="body2">Quote ID: {currentQuote.quoteId}</Typography>
                  <Typography variant="body2">Exchange Rate: {currentQuote.exchangeRate}</Typography>
                  <Typography variant="body2">Total Fees: ${currentQuote.fees.totalFees}</Typography>
                  <Typography variant="body2" color="primary">Net Amount: ₹{currentQuote.netAmount}</Typography>
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Transaction Initiation */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <InitiateIcon sx={{ mr: 1 }} />
              <Typography variant="h6">🚀 Initiate Transaction</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Account Number"
                    value={initiationForm.accountNumber}
                    onChange={(e) => setInitiationForm({...initiationForm, accountNumber: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="IFSC Code"
                    value={initiationForm.ifscCode}
                    onChange={(e) => setInitiationForm({...initiationForm, ifscCode: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Account Name"
                    value={initiationForm.accountName}
                    onChange={(e) => setInitiationForm({...initiationForm, accountName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="UPI ID"
                    value={initiationForm.upiId}
                    onChange={(e) => setInitiationForm({...initiationForm, upiId: e.target.value})}
                    helperText="Example: username@bank"
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={initiationForm.phone}
                    onChange={(e) => setInitiationForm({...initiationForm, phone: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={initiateTransaction}
                    disabled={loading || !currentQuote || !connected}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Initiate Transaction'}
                  </Button>
                </Grid>
              </Grid>

              {currentTransaction && (
                <Box mt={2}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Transaction Details:</Typography>
                  <Typography variant="body2">Transaction ID: {currentTransaction.transactionId}</Typography>
                  <Typography variant="body2">Status: {currentTransaction.status}</Typography>
                  {currentTransaction.razorpayOrderId && (
                    <Typography variant="body2">Razorpay Order: {currentTransaction.razorpayOrderId}</Typography>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Transaction Status */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <StatusIcon sx={{ mr: 1 }} />
              <Typography variant="h6">📊 Transaction Status</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Transaction ID"
                    value={statusTransactionId}
                    onChange={(e) => setStatusTransactionId(e.target.value)}
                    placeholder={currentTransaction?.transactionId || 'Enter transaction ID'}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    fullWidth 
                    variant="contained" 
                    onClick={checkTransactionStatus}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Check Status'}
                  </Button>
                </Grid>
              </Grid>

              {transactionStatus && (
                <Box mt={2}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>Status Details:</Typography>
                  {transactionStatus.error ? (
                    <Typography variant="body2" color="warning.main">{transactionStatus.error}</Typography>
                  ) : (
                    <>
                      <Typography variant="body2">Status: {transactionStatus.status}</Typography>
                      <Typography variant="body2">Amount: {transactionStatus.amount}</Typography>
                      {transactionStatus.bankTransferRef && (
                        <Typography variant="body2">UTR: {transactionStatus.bankTransferRef}</Typography>
                      )}
                    </>
                  )}
                </Box>
              )}
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Webhook Testing */}
        <Grid item xs={12} md={6}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <WebhookIcon sx={{ mr: 1 }} />
              <Typography variant="h6">🔔 Webhook Testing</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" gutterBottom>
                Test the Razorpay webhook endpoint with a simulated payout event.
              </Typography>
              <Button 
                fullWidth 
                variant="contained" 
                onClick={testWebhook}
                disabled={loading}
                sx={{ mt: 2 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Test Webhook'}
              </Button>
            </AccordionDetails>
          </Accordion>
        </Grid>

        {/* Test Results */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>📋 Test Results</Typography>
              {testResults.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No test results yet. Run some tests to see results here.
                </Typography>
              ) : (
                <List>
                  {testResults.map((result, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              size="small" 
                              label={result.test} 
                              color={result.status === 'success' ? 'success' : result.status === 'error' ? 'error' : 'warning'} 
                            />
                            <Typography variant="body2">{result.message}</Typography>
                          </Box>
                        }
                        secondary={result.timestamp}
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OfframpTesting;


