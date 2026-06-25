import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, Alert, CircularProgress, Paper } from '@mui/material';

type BankAccount = {
  account_number: string;
  ifsc_code: string;
  account_holder_name: string;
};

type Recipient = {
  name: string;
  email: string;
  phone: string;
  bank_account: BankAccount;
  address: string;
};

const SimplePayout: React.FC = () => {
  const [recipient, setRecipient] = useState<Recipient>({
    name: '',
    email: '',
    phone: '',
    bank_account: { account_number: '', ifsc_code: '', account_holder_name: '' },
    address: ''
  });
  const [amount, setAmount] = useState<number>(100);
  const [currency, setCurrency] = useState<string>('INR');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<any>(null);

  const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL as string) || 'http://localhost:3002';

  const updateField = (path: string, value: string) => {
    setRecipient(prev => {
      const clone: any = { ...prev };
      const parts = path.split('.');
      let ref: any = clone;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        ref[key] = ref[key] || {};
        ref = ref[key];
      }
      ref[parts[parts.length - 1]] = value;
      return clone as Recipient;
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);
    setLastResponse(null);

    try {
      // Minimal direct payout using backend test endpoint (real Cashfree when IP whitelisted)
      const body = {
        amount,
        currency,
        recipient,
        burn_transaction_hash: `manual_${Date.now()}`,
        transaction_id: `simple_${Date.now()}`,
        quote_id: `simple_quote_${Date.now()}`
      };

      const resp = await fetch(`${BRIDGE_URL}/api/test/cashfree-payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await resp.json();
      setLastResponse(data);

      if (data.success) {
        setSuccess(`✅ Payout initiated. Tx: ${data.transaction_id} | Status: ${data.status}`);
      } else {
        setError(`❌ Payout failed: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      setError(`❌ Network Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, margin: '0 auto', p: 2 }}>
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            🚀 Simple Payout
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter recipient details and amount. This calls the backend payout endpoint directly.
          </Typography>
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Amount</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Amount"
                type="number"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value))}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Currency"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                helperText="Use INR for Cashfree"
                fullWidth
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Recipient</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField label="Name" value={recipient.name} onChange={e => updateField('name', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Phone" value={recipient.phone} onChange={e => updateField('phone', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Email" value={recipient.email} onChange={e => updateField('email', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField label="Address" value={recipient.address} onChange={e => updateField('address', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>Bank Account</Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Account Holder Name" value={recipient.bank_account.account_holder_name} onChange={e => updateField('bank_account.account_holder_name', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="Account Number" value={recipient.bank_account.account_number} onChange={e => updateField('bank_account.account_number', e.target.value)} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField label="IFSC Code" value={recipient.bank_account.ifsc_code} onChange={e => updateField('bank_account.ifsc_code', e.target.value)} fullWidth />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Button variant="contained" color="primary" onClick={handleSubmit} disabled={loading || !recipient.name || !recipient.bank_account.account_number || !recipient.bank_account.ifsc_code} fullWidth sx={{ py: 1.5 }}>
        {loading ? <CircularProgress size={22} /> : 'Send Payout'}
      </Button>

      <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
        <Typography variant="subtitle1" gutterBottom>Last Response</Typography>
        <pre style={{ margin: 0, fontSize: 12 }}>
{JSON.stringify(lastResponse, null, 2)}
        </pre>
      </Paper>
    </Box>
  );
};

export default SimplePayout;



