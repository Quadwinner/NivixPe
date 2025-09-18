const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));

const BRIDGE_BASE = process.env.BRIDGE_BASE_URL || 'http://localhost:3002';
const PORT = process.env.AUTOMATED_TRANSFER_PORT || 3001;

function normalizeBeneficiary(input) {
  const b = input || {};
  const bank = b.bank_account || {};
  return {
    name: b.name || b.accountName || bank.account_holder_name,
    email: b.email,
    phone: b.phone,
    address: b.address,
    accountType: b.accountType || 'bank_transfer',
    accountNumber: b.accountNumber || bank.account_number,
    ifscCode: b.ifscCode || b.ifsc || bank.ifsc_code,
    bank_account: {
      account_number: bank.account_number || b.accountNumber,
      ifsc_code: bank.ifsc_code || b.ifscCode || b.ifsc,
      account_holder_name: bank.account_holder_name || b.name || b.accountName
    }
  };
}

app.post('/automated-transfer', async (req, res) => {
  try {
    const { userAddress, amountInUSD, fromCurrency, toCurrency, burnTransactionHash, recipient } = req.body;
    const sourceCurrency = fromCurrency || 'USD';
    const targetCurrency = toCurrency || 'INR';

    if (!userAddress || !burnTransactionHash || (!amountInUSD && sourceCurrency === 'USD')) {
      return res.status(400).json({ success: false, error: 'Missing userAddress, burnTransactionHash or amountInUSD' });
    }

    // 1) Get quote from bridge (reuses same logic as PaymentApp)
    const quoteResp = await axios.post(`${BRIDGE_BASE}/api/offramp/quote`, {
      fromCurrency: sourceCurrency,
      toCurrency: targetCurrency,
      amount: amountInUSD,
      userAddress
    }, { timeout: 20000 });

    const quote = quoteResp.data;
    if (!quote.success) {
      return res.status(400).json({ success: false, step: 'quote', error: quote.error || 'Quote failed' });
    }

    // 2) Normalize beneficiary
    const beneficiaryDetails = normalizeBeneficiary(recipient);
    if (!beneficiaryDetails.name || !beneficiaryDetails.bank_account?.account_number || !beneficiaryDetails.bank_account?.ifsc_code) {
      return res.status(400).json({ success: false, step: 'normalize', error: 'Complete bank details required (name, account_number, ifsc_code)' });
    }

    // 3) Initiate payout via bridge (uses Cashgram path internally)
    const initResp = await axios.post(`${BRIDGE_BASE}/api/offramp/initiate`, {
      quoteId: quote.quoteId || quote.id || 'auto_flow',
      userAddress,
      beneficiaryDetails,
      burnTransactionHash,
      kycVerified: true
    }, { timeout: 60000 });

    const initResult = initResp.data;
    if (!initResult.success) {
      return res.status(400).json({ success: false, step: 'initiate', error: initResult.message || 'Initiation failed', details: initResult });
    }

    return res.json({ success: true, quote, result: initResult });
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    return res.status(status || 500).json({ success: false, error: data?.message || error.message, data });
  }
});

app.get('/healthz', async (req, res) => {
  try {
    const health = await axios.get(`${BRIDGE_BASE}/health`, { timeout: 5000 }).then(r => r.data).catch(() => null);
    res.json({ ok: true, bridge: health ? 'up' : 'down' });
  } catch (_) {
    res.json({ ok: true, bridge: 'unknown' });
  }
});

app.listen(PORT, () => {
  console.log(`Automated Transfer server listening on http://localhost:${PORT}`);
});



