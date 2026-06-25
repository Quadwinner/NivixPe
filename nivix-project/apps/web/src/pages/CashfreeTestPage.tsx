import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  marginBottom: theme.spacing(3),
}));

const TestCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(2),
}));

interface CashfreePayoutRequest {
  amount: number;
  currency: string;
  recipient: {
    name: string;
    email: string;
    phone: string;
    bank_account: {
      account_number: string;
      ifsc_code: string;
      account_holder_name: string;
    };
    address: string;
  };
  burn_transaction_hash: string;
  transaction_id: string;
  quote_id: string;
}

const CashfreeTestPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [lastResponse, setLastResponse] = useState<any>(null);
  
  const [payoutData, setPayoutData] = useState<CashfreePayoutRequest>({
    amount: 100,
    currency: 'INR',
    recipient: {
      name: '',
      email: '',
      phone: '',
      bank_account: {
        account_number: '',
        ifsc_code: '',
        account_holder_name: ''
      },
      address: ''
    },
    burn_transaction_hash: '',
    transaction_id: '',
    quote_id: ''
  });

  const BRIDGE_URL = process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002';

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 20)); // Keep last 20 logs
  };

  const clearLogs = () => {
    setDebugLogs([]);
    setLastResponse(null);
  };

  const checkIPStatus = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    addDebugLog('🌐 Checking IP whitelisting status...');

    try {
      // Get current IP
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipResponse.json();
      addDebugLog(`📍 Current public IP: ${ipData.ip}`);

      // Test direct Cashfree API call
      addDebugLog('🔍 Testing direct Cashfree API access...');
      const directResponse = await fetch('https://payout-gamma.cashfree.com/payout/v1/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Id': 'CF10794489D30SP632JPKS73CS1PK0',
          'X-Client-Secret': 'cfsk_ma_test_4e22ebfcd7bc9aa26557ab1b0568c99b_e679569a'
        },
        body: JSON.stringify({})
      });

      const directData = await directResponse.json();
      addDebugLog(`📥 Direct API response: ${JSON.stringify(directData, null, 2)}`);

      if (directData.status === 'SUCCESS') {
        setSuccess(`✅ IP Whitelisting OK! Your IP ${ipData.ip} is whitelisted and Cashfree API is accessible.`);
        addDebugLog('✅ IP whitelisting verified - API accessible');
      } else if (directData.message?.includes('IP not whitelisted')) {
        setError(`❌ IP Not Whitelisted: Your IP ${ipData.ip} needs to be added to Cashfree dashboard. 
        Error: ${directData.message}`);
        addDebugLog(`❌ IP ${ipData.ip} not whitelisted in Cashfree`);
      } else {
        setError(`⚠️ Other API Issue: ${directData.message || 'Unknown error'}`);
        addDebugLog(`⚠️ API issue: ${directData.message}`);
      }

    } catch (error: any) {
      addDebugLog(`❌ Network error: ${error.message}`);
      setError(`❌ Network Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkBackendStatus = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    addDebugLog('🔍 Checking backend bridge service status...');

    try {
      // Check bridge service health
      const healthResponse = await fetch(`${BRIDGE_URL}/api/health`);
      if (healthResponse.ok) {
        addDebugLog('✅ Bridge service is running');
      } else {
        addDebugLog('❌ Bridge service health check failed');
      }

      // Check environment variables
      const envResponse = await fetch(`${BRIDGE_URL}/api/test/cashfree-auth`);
      const envData = await envResponse.json();
      
      addDebugLog(`🔧 Backend environment check:`);
      addDebugLog(`  - Client ID: ${envData.clientId || 'NOT SET'}`);
      addDebugLog(`  - Environment: ${envData.environment || 'unknown'}`);
      addDebugLog(`  - Service: ${envData.success ? 'OK' : 'ERROR'}`);

      if (envData.success) {
        setSuccess('✅ Backend Configuration OK! Bridge service is properly configured.');
      } else {
        setError(`❌ Backend Issue: ${envData.error}`);
      }

    } catch (error: any) {
      addDebugLog(`❌ Backend connection error: ${error.message}`);
      setError(`❌ Cannot connect to backend: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setPayoutData(prev => {
      if (field.includes('.')) {
        const [parent, child, grandchild] = field.split('.');
        if (grandchild) {
          return {
            ...prev,
            [parent]: {
              ...(prev[parent as keyof CashfreePayoutRequest] as any || {}),
              [child]: {
                ...((prev[parent as keyof CashfreePayoutRequest] as any)?.[child] || {}),
                [grandchild]: value
              }
            }
          };
        } else {
          return {
            ...prev,
            [parent]: {
              ...(prev[parent as keyof CashfreePayoutRequest] as any || {}),
              [child]: value
            }
          };
        }
      }
      return { ...prev, [field]: value };
    });
  };

  const testCashfreeAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    addDebugLog('🔐 Starting Cashfree authentication test...');

    try {
      addDebugLog(`📡 Calling: ${BRIDGE_URL}/api/test/cashfree-auth`);
      const response = await fetch(`${BRIDGE_URL}/api/test/cashfree-auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      setLastResponse(data);
      addDebugLog(`📥 Response status: ${response.status}`);
      addDebugLog(`📄 Response data: ${JSON.stringify(data, null, 2)}`);

      if (data.success) {
        setAuthToken(data.token);
        addDebugLog('✅ Authentication successful!');
        setSuccess(`✅ Cashfree Authentication Successful! 
        Token: ${data.token?.substring(0, 20)}...
        Client ID: ${data.clientId}
        Environment: ${data.environment}
        Token Length: ${data.tokenLength}
        Valid For: ${data.validFor}`);
      } else {
        addDebugLog(`❌ Authentication failed: ${data.error}`);
        setError(`❌ Auth Failed: ${data.error}`);
      }
    } catch (error: any) {
      addDebugLog(`❌ Network/Parse error: ${error.message}`);
      setError(`❌ Auth Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCashfreePayout = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    addDebugLog('💰 Starting Cashfree payout test...');

    try {
      addDebugLog(`📡 Calling: ${BRIDGE_URL}/api/test/cashfree-payout`);
      addDebugLog(`📤 Payload: ${JSON.stringify(payoutData, null, 2)}`);
      
      const response = await fetch(`${BRIDGE_URL}/api/test/cashfree-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payoutData)
      });

      const data = await response.json();
      setLastResponse(data);
      addDebugLog(`📥 Response status: ${response.status}`);
      addDebugLog(`📄 Response data: ${JSON.stringify(data, null, 2)}`);

      if (data.success) {
        addDebugLog('✅ Payout successful!');
        setSuccess(`✅ Payout Successful! 
        Transaction ID: ${data.transaction_id} 
        Status: ${data.status}
        Provider: ${data.provider}
        Amount: ${data.amount} ${data.currency}
        Fees: ${data.fees || 0}
        Message: ${data.message}`);
      } else {
        addDebugLog(`❌ Payout failed: ${data.error || data.message}`);
        setError(`❌ Payout Failed: ${data.error || data.message}`);
      }
    } catch (error: any) {
      addDebugLog(`❌ Network/Parse error: ${error.message}`);
      setError(`❌ Payout Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fillSampleData = () => {
    const timestamp = Date.now();
    setPayoutData({
      amount: 100,
      currency: 'INR',
      recipient: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '9876543210',
        bank_account: {
          account_number: '50100012345678',
          ifsc_code: 'HDFC0000001',
          account_holder_name: 'John Doe'
        },
        address: 'Mumbai, Maharashtra, India'
      },
      burn_transaction_hash: `burn_${timestamp.toString().slice(-8)}`,
      transaction_id: `nivix_tx_${timestamp}`,
      quote_id: `quote_${timestamp}`
    });
    addDebugLog('📝 Sample data filled with realistic test values');
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', padding: 2 }}>
      <StyledCard>
        <CardContent>
          <Typography variant="h4" gutterBottom>
            🔧 Cashfree API Testing & Diagnostics
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Complete testing suite for Cashfree authentication and payout API calls
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                🌐 API Endpoint:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                payout-gamma.cashfree.com
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                🔧 Backend:
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {BRIDGE_URL}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                🏷️ Environment:
              </Typography>
              <Typography variant="body2" sx={{ color: 'orange', fontWeight: 'bold' }}>
                SANDBOX
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </StyledCard>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Diagnostic Tests */}
        <Grid item xs={12}>
          <TestCard>
            <Typography variant="h6" gutterBottom>
              🔍 System Diagnostics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  onClick={checkIPStatus}
                  disabled={loading}
                  fullWidth
                  color="info"
                >
                  {loading ? <CircularProgress size={20} /> : '🌐 Check IP Status'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  onClick={checkBackendStatus}
                  disabled={loading}
                  fullWidth
                  color="info"
                >
                  {loading ? <CircularProgress size={20} /> : '🔧 Check Backend'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="outlined"
                  onClick={testCashfreeAuth}
                  disabled={loading}
                  fullWidth
                  color="primary"
                >
                  {loading ? <CircularProgress size={20} /> : '🔐 Test Auth'}
                </Button>
              </Grid>
            </Grid>
            {authToken && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  🎯 Active Token: {authToken.substring(0, 50)}...
                </Typography>
              </Alert>
            )}
          </TestCard>
        </Grid>

        {/* Authentication Test */}
        <Grid item xs={12} md={6}>
          <TestCard>
            <Typography variant="h6" gutterBottom>
              🔐 Step 1: Authentication Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use the diagnostic buttons above first to check system status, then test authentication.
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Endpoint:</strong> https://payout-gamma.cashfree.com/payout/v1/authorize
              </Typography>
              <Typography variant="body2">
                <strong>Client ID:</strong> CF10794489D30SP632JPKS73CS1PK0
              </Typography>
              <Typography variant="body2">
                <strong>Environment:</strong> Sandbox (Test)
              </Typography>
            </Box>
          </TestCard>
        </Grid>

        {/* Quick Fill */}
        <Grid item xs={12} md={6}>
          <TestCard>
            <Typography variant="h6" gutterBottom>
              ⚡ Quick Fill Sample Data
            </Typography>
            <Button
              variant="outlined"
              onClick={fillSampleData}
              fullWidth
              sx={{ mb: 2 }}
            >
              Fill Sample Data
            </Button>
          </TestCard>
        </Grid>

        {/* Payout Details Form */}
        <Grid item xs={12}>
          <TestCard>
            <Typography variant="h6" gutterBottom>
              💰 Step 2: Payout Details
            </Typography>
            
            <Grid container spacing={2}>
              {/* Basic Details */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Amount"
                  type="number"
                  value={payoutData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={payoutData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  >
                    <MenuItem value="INR">INR</MenuItem>
                    <MenuItem value="USD">USD</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Burn Transaction Hash"
                  value={payoutData.burn_transaction_hash}
                  onChange={(e) => handleInputChange('burn_transaction_hash', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Divider sx={{ width: '100%', my: 2 }} />

              {/* Recipient Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  👤 Recipient Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  label="Recipient Name"
                  value={payoutData.recipient.name}
                  onChange={(e) => handleInputChange('recipient.name', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  value={payoutData.recipient.email}
                  onChange={(e) => handleInputChange('recipient.email', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  value={payoutData.recipient.phone}
                  onChange={(e) => handleInputChange('recipient.phone', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Address"
                  value={payoutData.recipient.address}
                  onChange={(e) => handleInputChange('recipient.address', e.target.value)}
                  fullWidth
                />
              </Grid>

              <Divider sx={{ width: '100%', my: 2 }} />

              {/* Bank Details */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  🏦 Bank Account Details
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <TextField
                  label="Account Number"
                  value={payoutData.recipient.bank_account.account_number}
                  onChange={(e) => handleInputChange('recipient.bank_account.account_number', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="IFSC Code"
                  value={payoutData.recipient.bank_account.ifsc_code}
                  onChange={(e) => handleInputChange('recipient.bank_account.ifsc_code', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Account Holder Name"
                  value={payoutData.recipient.bank_account.account_holder_name}
                  onChange={(e) => handleInputChange('recipient.bank_account.account_holder_name', e.target.value)}
                  fullWidth
                />
              </Grid>

              {/* Transaction IDs */}
              <Grid item xs={12} md={6}>
                <TextField
                  label="Transaction ID"
                  value={payoutData.transaction_id}
                  onChange={(e) => handleInputChange('transaction_id', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Quote ID"
                  value={payoutData.quote_id}
                  onChange={(e) => handleInputChange('quote_id', e.target.value)}
                  fullWidth
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={testCashfreePayout}
                disabled={loading || !payoutData.recipient.name}
                size="large"
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : '🚀 Test Cashfree Payout'}
              </Button>
            </Box>
          </TestCard>
        </Grid>

        {/* Debug Logs */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50', height: '400px', overflow: 'hidden' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                📋 Debug Logs
              </Typography>
              <Button size="small" onClick={clearLogs} variant="outlined">
                Clear Logs
              </Button>
            </Box>
            <Box sx={{ height: '320px', overflow: 'auto', fontFamily: 'monospace', fontSize: '11px' }}>
              {debugLogs.length === 0 ? (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No logs yet. Run authentication or payout tests to see debug information.
                </Typography>
              ) : (
                debugLogs.map((log, index) => (
                  <div key={index} style={{ marginBottom: '4px', wordBreak: 'break-all' }}>
                    {log}
                  </div>
                ))
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Last Response */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, bgcolor: 'grey.50', height: '400px', overflow: 'hidden' }}>
            <Typography variant="h6" gutterBottom>
              📄 Last API Response
            </Typography>
            <Box sx={{ height: '320px', overflow: 'auto' }}>
              {lastResponse ? (
                <pre style={{ fontSize: '11px', margin: 0, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(lastResponse, null, 2)}
                </pre>
              ) : (
                <Typography color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  No response yet. Run a test to see the API response.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Request Data Preview */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Typography variant="h6" gutterBottom>
              🔍 Request Data Preview
            </Typography>
            <pre style={{ fontSize: '12px', overflow: 'auto' }}>
              {JSON.stringify(payoutData, null, 2)}
            </pre>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CashfreeTestPage;


