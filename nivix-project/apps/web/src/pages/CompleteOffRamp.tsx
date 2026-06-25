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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  IconButton,
  Tooltip,
  Checkbox,
  FormControlLabel
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
  VerifiedUser as KycIcon,
  Payment as PayoutIcon,
  Security as SecurityIcon,
  Info as InfoIcon,
  Warning as WarningIcon
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

interface KycStatus {
  verified: boolean;
  userId?: string;
  status: string;
  error?: string;
}

interface PayoutDetails {
  name: string;
  email: string;
  phone: string;
  bank_account: {
    account_number: string;
    ifsc_code: string;
    account_holder_name: string;
  };
  address: string;
}

const CompleteOffRamp: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  // KYC Status
  const [kycStatus, setKycStatus] = useState<KycStatus>({ verified: false, status: 'unknown' });
  const [kycLoading, setKycLoading] = useState(false);

  // Quote Form
  const [quoteForm, setQuoteForm] = useState({
    amount: 10,
    fromCurrency: 'USD',
    toCurrency: 'INR',
    corridor: 'IN'
  });
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);

  // KYC Form (simplified for testing)
  const [kycForm, setKycForm] = useState({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '9876543210',
    country: 'IN',
    documentType: 'passport',
    termsAccepted: false
  });

  // Payout Details Form
  const [payoutForm, setPayoutForm] = useState<PayoutDetails>({
    name: 'Test Recipient',
    email: 'recipient@test.com',
    phone: '9876543210',
    bank_account: {
      account_number: '1234567890',
      ifsc_code: 'HDFC0000123',
      account_holder_name: 'Test Recipient'
    },
    address: 'Test Address, Mumbai, India'
  });

  // Transaction Status
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const [payoutStatus, setPayoutStatus] = useState<any>(null);

  // Dialog states
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  const steps = [
    'KYC Verification',
    'Generate Quote',
    'Payout Details',
    'Complete Transaction'
  ];

  // Check KYC Status
  const checkKycStatus = async () => {
    if (!connected || !publicKey) return;

    setKycLoading(true);
    try {
      const response = await fetch(`${BRIDGE_URL}/api/kyc/status/${publicKey.toBase58()}`);
      
      if (response.status === 404) {
        setKycStatus({ verified: false, status: 'not_found' });
      } else if (response.ok) {
        const data = await response.json();
        setKycStatus({
          verified: data.verified || false,
          userId: data.userId,
          status: data.status || 'pending'
        });
      } else {
        setKycStatus({ verified: false, status: 'error' });
      }
    } catch (err: any) {
      console.error('KYC check error:', err);
      setKycStatus({ verified: false, status: 'error', error: err.message });
    }
    setKycLoading(false);
  };

  // Submit KYC (simplified for testing)
  const submitKyc = async () => {
    if (!connected || !publicKey) return;

    setKycLoading(true);
    try {
      const kycData = {
        userId: `test_user_${publicKey.toBase58().substring(0, 8)}`,
        solanaAddress: publicKey.toBase58(),
        fullName: `${kycForm.firstName} ${kycForm.lastName}`,
        countryCode: kycForm.country,
        idDocuments: [kycForm.documentType],
        email: kycForm.email,
        phone: kycForm.phone
      };

      const response = await fetch(`${BRIDGE_URL}/api/kyc/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kycData)
      });

      const result = await response.json();
      if (result.success) {
        setKycStatus({ verified: true, userId: kycData.userId, status: 'approved' });
        setSuccess('KYC verification completed successfully!');
        setActiveStep(1);
        setShowKycDialog(false);
      } else {
        setError(`KYC submission failed: ${result.message}`);
      }
    } catch (err: any) {
      setError(`KYC submission error: ${err.message}`);
    }
    setKycLoading(false);
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
        setSuccess(`Quote generated! Net amount: ₹${data.quote.netAmount}`);
        setActiveStep(2);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Complete Off-ramp Transaction with Automated Payout
  const completeTransaction = async () => {
    if (!currentQuote || !connected || !publicKey) {
      setError('Missing required data for transaction');
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
          burnTransactionHash: `mock_burn_${Date.now()}`, // In real app, this would be actual burn transaction
          beneficiaryDetails: payoutForm
        })
      });

      const data = await response.json();
      if (data.success) {
        setTransactionResult(data);
        setSuccess('🎉 Transaction completed! Automated payout initiated via Cashfree!');
        setActiveStep(3);
        
        // Check payout status after a delay
        setTimeout(() => checkPayoutStatus(data.payout_id), 3000);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Check Payout Status
  const checkPayoutStatus = async (payoutId: string) => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/payout/status/${payoutId}`);
      if (response.ok) {
        const data = await response.json();
        setPayoutStatus(data);
      }
    } catch (err) {
      console.error('Payout status check failed:', err);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      checkKycStatus();
    }
  }, [connected, publicKey]);

  // Render KYC Step
  const renderKycStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        🔒 KYC Verification Required
      </Typography>
      
      {kycLoading ? (
        <Box display="flex" alignItems="center" gap={2}>
          <CircularProgress size={24} />
          <Typography>Checking KYC status...</Typography>
        </Box>
      ) : (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={2}>
                <KycIcon color={kycStatus.verified ? 'success' : 'warning'} />
                <Box>
                  <Typography variant="subtitle1">
                    KYC Status: {kycStatus.verified ? 'Verified' : 'Not Verified'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Status: {kycStatus.status}
                  </Typography>
                </Box>
              </Box>
              
              {kycStatus.verified ? (
                <Chip label="Verified" color="success" />
              ) : (
                <Button
                  variant="contained"
                  startIcon={<SecurityIcon />}
                  onClick={() => setShowKycDialog(true)}
                >
                  Complete KYC
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {kycStatus.verified && (
        <Button
          variant="contained"
          onClick={() => setActiveStep(1)}
          fullWidth
          size="large"
        >
          Continue to Quote Generation
        </Button>
      )}
    </Box>
  );

  // Render Quote Step
  const renderQuoteStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        💰 Generate Off-ramp Quote
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
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
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        onClick={getQuote}
        disabled={loading}
        fullWidth
        size="large"
        sx={{ mb: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Generate Quote'}
      </Button>

      {currentQuote && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Quote Details:</Typography>
            <Typography variant="body2">Quote ID: {currentQuote.quoteId}</Typography>
            <Typography variant="body2">Exchange Rate: {currentQuote.exchangeRate}</Typography>
            <Typography variant="body2">Total Fees: ${currentQuote.fees.totalFees}</Typography>
            <Typography variant="h6" color="primary">Net Amount: ₹{currentQuote.netAmount}</Typography>
            
            <Button
              variant="contained"
              onClick={() => setActiveStep(2)}
              fullWidth
              sx={{ mt: 2 }}
            >
              Continue to Payout Details
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );

  // Render Payout Details Step
  const renderPayoutStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom>
        🏦 Payout Details (Cashfree Integration)
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Automated Payout:</strong> After token burning, the recipient will automatically receive fiat money 
          in their bank account via Cashfree payout API. This process is fully automated.
        </Typography>
      </Alert>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Recipient Name"
            value={payoutForm.name}
            onChange={(e) => setPayoutForm({...payoutForm, name: e.target.value})}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Email"
            value={payoutForm.email}
            onChange={(e) => setPayoutForm({...payoutForm, email: e.target.value})}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Phone"
            value={payoutForm.phone}
            onChange={(e) => setPayoutForm({...payoutForm, phone: e.target.value})}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Account Number"
            value={payoutForm.bank_account.account_number}
            onChange={(e) => setPayoutForm({
              ...payoutForm,
              bank_account: {...payoutForm.bank_account, account_number: e.target.value}
            })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="IFSC Code"
            value={payoutForm.bank_account.ifsc_code}
            onChange={(e) => setPayoutForm({
              ...payoutForm,
              bank_account: {...payoutForm.bank_account, ifsc_code: e.target.value}
            })}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Account Holder Name"
            value={payoutForm.bank_account.account_holder_name}
            onChange={(e) => setPayoutForm({
              ...payoutForm,
              bank_account: {...payoutForm.bank_account, account_holder_name: e.target.value}
            })}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Address"
            multiline
            rows={2}
            value={payoutForm.address}
            onChange={(e) => setPayoutForm({...payoutForm, address: e.target.value})}
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        onClick={() => setShowPayoutDialog(true)}
        fullWidth
        size="large"
        disabled={!currentQuote}
      >
        Review & Complete Transaction
      </Button>
    </Box>
  );

  // Render Transaction Result Step
  const renderResultStep = () => (
    <Box textAlign="center">
      <PayoutIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
      <Typography variant="h5" gutterBottom>
        🎉 Transaction Completed!
      </Typography>
      
      {transactionResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Transaction Details:</Typography>
            <Typography variant="body2">Transaction ID: {transactionResult.transaction_id}</Typography>
            <Typography variant="body2">Payout ID: {transactionResult.payout_id}</Typography>
            <Typography variant="body2">Amount: ₹{transactionResult.amount}</Typography>
            <Typography variant="body2">Recipient: {transactionResult.recipient?.name}</Typography>
            <Typography variant="body2" color="success.main">
              Status: {transactionResult.status}
            </Typography>
          </CardContent>
        </Card>
      )}

      {payoutStatus && (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>Payout Status:</Typography>
            <Typography variant="body2">Provider: {payoutStatus.provider}</Typography>
            <Typography variant="body2">Status: {payoutStatus.status}</Typography>
            <Typography variant="body2">Estimated Arrival: {payoutStatus.estimated_arrival}</Typography>
          </CardContent>
        </Card>
      )}

      <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
        The recipient will receive fiat money directly in their bank account via automated Cashfree payout.
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🚀 Complete Off-ramp with Automated Payout
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Crypto to Fiat with KYC verification and automated Cashfree payout integration
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={activeStep} orientation="vertical">
            <Step>
              <StepLabel>KYC Verification</StepLabel>
              <StepContent>
                {renderKycStep()}
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Generate Quote</StepLabel>
              <StepContent>
                {renderQuoteStep()}
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Payout Details</StepLabel>
              <StepContent>
                {renderPayoutStep()}
              </StepContent>
            </Step>
            
            <Step>
              <StepLabel>Transaction Complete</StepLabel>
              <StepContent>
                {renderResultStep()}
              </StepContent>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* KYC Dialog */}
      <Dialog open={showKycDialog} onClose={() => setShowKycDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Quick KYC Verification</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                value={kycForm.firstName}
                onChange={(e) => setKycForm({...kycForm, firstName: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                value={kycForm.lastName}
                onChange={(e) => setKycForm({...kycForm, lastName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                value={kycForm.email}
                onChange={(e) => setKycForm({...kycForm, email: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone"
                value={kycForm.phone}
                onChange={(e) => setKycForm({...kycForm, phone: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={kycForm.termsAccepted}
                    onChange={(e) => setKycForm({...kycForm, termsAccepted: e.target.checked})}
                  />
                }
                label="I accept the terms and conditions"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowKycDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={submitKyc}
            disabled={kycLoading || !kycForm.termsAccepted}
          >
            {kycLoading ? <CircularProgress size={24} /> : 'Submit KYC'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payout Confirmation Dialog */}
      <Dialog open={showPayoutDialog} onClose={() => setShowPayoutDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>🔐 Confirm Automated Payout Transaction</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Important:</strong> This will burn your tokens and automatically send fiat money to the recipient's bank account via Cashfree payout API.
            </Typography>
          </Alert>
          
          {currentQuote && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Transaction Details:</Typography>
                <Typography variant="body2">Amount: {currentQuote.amount} {currentQuote.fromCurrency}</Typography>
                <Typography variant="body2">Exchange Rate: {currentQuote.exchangeRate}</Typography>
                <Typography variant="body2">Fees: ${currentQuote.fees.totalFees}</Typography>
                <Typography variant="h6" color="primary">Net Payout: ₹{currentQuote.netAmount}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Recipient Details:</Typography>
                <Typography variant="body2">Name: {payoutForm.name}</Typography>
                <Typography variant="body2">Account: {payoutForm.bank_account.account_number}</Typography>
                <Typography variant="body2">IFSC: {payoutForm.bank_account.ifsc_code}</Typography>
                <Typography variant="body2">Phone: {payoutForm.phone}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => {
              setShowPayoutDialog(false);
              completeTransaction();
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Confirm & Execute Payout'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompleteOffRamp;




