import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Grid,
  Alert,
  Divider,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  Download,
  Send,
  Share,
  Print,
  Home,
  ContentCopy,
  AccountBalance,
  Speed,
  Security
} from '@mui/icons-material';

interface RecipientDetails {
  name: string;
  accountNumber: string;
  ifscCode: string;
  email: string;
  phone: string;
}

interface TransferReceipt {
  transactionId: string;
  timestamp: string;
  recipient: RecipientDetails;
  amount: number;
  processingTime: string;
  transactionHashes: {
    mint: string;
    burn: string;
  };
  payoutId: string;
  cashgramLink?: string;
  payoutProvider?: string;
  sessionId: string;
}

interface SuccessReceiptProps {
  receipt: TransferReceipt;
  onSendAnother: () => void;
  onGoHome: () => void;
}

const SuccessReceipt: React.FC<SuccessReceiptProps> = ({
  receipt,
  onSendAnother,
  onGoHome
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownloadReceipt = () => {
    const receiptData = {
      transferDetails: {
        transactionId: receipt.transactionId,
        timestamp: receipt.timestamp,
        amount: `${receipt.amount} USDC`,
        processingTime: receipt.processingTime,
        status: 'Completed'
      },
      recipient: {
        name: receipt.recipient.name,
        accountNumber: receipt.recipient.accountNumber,
        ifscCode: receipt.recipient.ifscCode,
        email: receipt.recipient.email,
        phone: receipt.recipient.phone
      },
      blockchain: {
        mintTransaction: receipt.transactionHashes.mint,
        burnTransaction: receipt.transactionHashes.burn,
        payoutId: receipt.payoutId,
        cashgramLink: receipt.cashgramLink || null,
        payoutProvider: receipt.payoutProvider || null,
        sessionId: receipt.sessionId
      },
      meta: {
        service: 'Nivix Automated Transfer',
        downloadedAt: new Date().toISOString(),
        version: '1.0'
      }
    };

    const jsonContent = JSON.stringify(receiptData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `nivix-transfer-receipt-${receipt.transactionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transfer Receipt - ${receipt.transactionId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .success { color: #4caf50; }
            .section { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 8px 0; }
            .label { font-weight: bold; }
            .value { font-family: monospace; }
            .divider { border-top: 1px solid #ccc; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Transfer Successful</h1>
            <h2 class="success">Nivix Automated Transfer</h2>
          </div>

          <div class="section">
            <h3>Transfer Details</h3>
            <div class="detail-row">
              <span class="label">Transaction ID:</span>
              <span class="value">${receipt.transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="label">Amount Sent:</span>
              <span class="value">${receipt.amount} USDC</span>
            </div>
            <div class="detail-row">
              <span class="label">Processing Time:</span>
              <span class="value">${receipt.processingTime}</span>
            </div>
            <div class="detail-row">
              <span class="label">Timestamp:</span>
              <span class="value">${new Date(receipt.timestamp).toLocaleString()}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <h3>Recipient Information</h3>
            <div class="detail-row">
              <span class="label">Name:</span>
              <span class="value">${receipt.recipient.name}</span>
            </div>
            <div class="detail-row">
              <span class="label">Account Number:</span>
              <span class="value">***${receipt.recipient.accountNumber.slice(-4)}</span>
            </div>
            <div class="detail-row">
              <span class="label">IFSC Code:</span>
              <span class="value">${receipt.recipient.ifscCode}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="section">
            <h3>Blockchain Transactions</h3>
            <div class="detail-row">
              <span class="label">Mint TX:</span>
              <span class="value">${receipt.transactionHashes.mint}</span>
            </div>
            <div class="detail-row">
              <span class="label">Burn TX:</span>
              <span class="value">${receipt.transactionHashes.burn}</span>
            </div>
            <div class="detail-row">
              <span class="label">Payout ID:</span>
              <span class="value">${receipt.payoutId}</span>
            </div>
            ${receipt.cashgramLink ? `
            <div class="detail-row">
              <span class="label">Cashgram Link:</span>
              <span class="value">${receipt.cashgramLink}</span>
            </div>
            ` : ''}
          </div>

          <div class="section" style="text-align: center; margin-top: 40px;">
            <p style="color: #666;">Generated by Nivix Automated Transfer System</p>
            <p style="color: #666; font-size: 12px;">Printed on ${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Money Transfer Successful',
      text: `Successfully sent ${receipt.amount} USDC to ${receipt.recipient.name} via Nivix`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying URL
      handleCopy(window.location.href, 'URL');
    }
  };

  return (
    <Card>
      <CardContent>
        {/* Success Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <CheckCircle sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom color="success.main">
            Transfer Successful! 🎉
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Money has been sent to {receipt.recipient.name}
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Chip
              icon={<Speed />}
              label={`Completed in ${receipt.processingTime}`}
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<Security />}
              label="Blockchain Verified"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Box>

        {/* Transfer Summary */}
        <Card sx={{
          mb: 3,
          bgcolor: 'transparent',
          border: '1px solid',
          borderColor: 'success.main',
          backgroundColor: 'rgba(76, 175, 80, 0.08)'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              💰 Transfer Summary
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Amount Sent:</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {receipt.amount.toFixed(2)} USDC
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Transaction ID:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                    {receipt.transactionId}
                  </Typography>
                  <Tooltip title={copied === 'Transaction ID' ? 'Copied!' : 'Copy Transaction ID'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(receipt.transactionId, 'Transaction ID')}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Processing Time:</Typography>
                <Typography variant="body1" color="text.primary" fontWeight="bold">
                  {receipt.processingTime}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Completed At:</Typography>
                <Typography variant="body1" color="text.primary">
                  {new Date(receipt.timestamp).toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Recipient Details */}
        <Card sx={{
          mb: 3,
          bgcolor: 'transparent',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'rgba(158, 158, 158, 0.08)'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              👤 Recipient Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Name:</Typography>
                <Typography variant="body1" color="text.primary" fontWeight="bold">
                  {receipt.recipient.name}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Bank Account:</Typography>
                <Typography variant="body1" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                  ***{receipt.recipient.accountNumber.slice(-4)}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">IFSC Code:</Typography>
                <Typography variant="body1" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                  {receipt.recipient.ifscCode}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Contact:</Typography>
                <Typography variant="body1" color="text.primary">
                  {receipt.recipient.phone}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Blockchain Transactions */}
        <Card sx={{
          mb: 3,
          bgcolor: 'transparent',
          border: '1px solid',
          borderColor: 'primary.main',
          backgroundColor: 'rgba(25, 118, 210, 0.08)'
        }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary.main">
              🔗 Blockchain Transactions
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Mint Transaction:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {receipt.transactionHashes.mint}
                  </Typography>
                  <Tooltip title={copied === 'Mint TX' ? 'Copied!' : 'Copy Mint Transaction'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(receipt.transactionHashes.mint, 'Mint TX')}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Burn Transaction:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {receipt.transactionHashes.burn}
                  </Typography>
                  <Tooltip title={copied === 'Burn TX' ? 'Copied!' : 'Copy Burn Transaction'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(receipt.transactionHashes.burn, 'Burn TX')}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="text.secondary">Payout ID:</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontFamily: 'monospace' }}>
                    {receipt.payoutId}
                  </Typography>
                  <Tooltip title={copied === 'Payout ID' ? 'Copied!' : 'Copy Payout ID'}>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(receipt.payoutId, 'Payout ID')}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {receipt.cashgramLink ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Cashgram link issued via Cashfree. The recipient can complete payout using the link below.
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                size="small"
                onClick={() => window.open(receipt.cashgramLink, '_blank', 'noopener,noreferrer')}
              >
                Open Cashgram Link
              </Button>
            </Box>
          </Alert>
        ) : null}

        {/* Action Buttons */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Receipt Actions
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Download />}
                onClick={handleDownloadReceipt}
              >
                Download
              </Button>
            </Grid>

            <Grid item xs={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Print />}
                onClick={handlePrintReceipt}
              >
                Print
              </Button>
            </Grid>

            <Grid item xs={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Share />}
                onClick={handleShare}
              >
                Share
              </Button>
            </Grid>

            <Grid item xs={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<AccountBalance />}
                href={`https://explorer.solana.com/tx/${receipt.transactionHashes.mint}?cluster=devnet`}
                target="_blank"
              >
                View on Explorer
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Next Actions */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onGoHome}
            startIcon={<Home />}
          >
            Go to Dashboard
          </Button>

          <Button
            variant="contained"
            onClick={onSendAnother}
            startIcon={<Send />}
            sx={{ flex: 1 }}
            size="large"
          >
            Send Another Transfer
          </Button>
        </Box>

        {/* Security Note */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            🔒 Your transfer is secured by blockchain technology and verified on Solana.
            The recipient should receive the money in their bank account within 24 hours.
          </Typography>
        </Alert>

        {/* Copy Success Feedback */}
        {copied && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {copied} copied to clipboard!
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default SuccessReceipt;
