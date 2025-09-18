import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Box,
  Alert
} from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

// Import components (will be created next)
import KYCStatusCheck from '../components/kyc/KYCStatusCheck';
import RecipientForm from '../components/forms/RecipientForm';
import AmountPaymentForm from '../components/forms/AmountPaymentForm';
import ProcessingStatus from '../components/processing/ProcessingStatus';
import SuccessReceipt from '../components/receipt/SuccessReceipt';

// Types
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

interface ProcessingStatus {
  currentStep: string;
  progress: number;
  mintTxHash?: string;
  burnTxHash?: string;
  beneficiaryId?: string;
  payoutId?: string;
  result?: any;
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
  sessionId: string;
}

const steps = [
  'KYC Verification',
  'Recipient Details',
  'Amount & Payment',
  'Processing',
  'Complete'
];

const AutomatedTransfer: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  // State management
  const [currentStep, setCurrentStep] = useState(0);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Event handlers
  const handleKYCComplete = (status: any) => {
    setKycStatus(status);
    setCurrentStep(1);
    setError(null);
  };

  const handleKYCRequired = () => {
    navigate('/kyc');
  };

  const handleRecipientSubmit = (data: RecipientDetails) => {
    setRecipientDetails(data);
    setCurrentStep(2);
    setError(null);
  };

  const handlePaymentSuccess = (paymentData: PaymentData) => {
    setPaymentData(paymentData);
    setCurrentStep(3);
    setError(null);
  };

  const handleProcessingComplete = (result: any) => {
    setReceipt(result);
    setCurrentStep(4);
    setError(null);
  };

  const handleSendAnother = () => {
    // Reset all state for new transfer
    setCurrentStep(0);
    setKycStatus(null);
    setRecipientDetails(null);
    setPaymentData(null);
    setProcessingStatus(null);
    setReceipt(null);
    setError(null);
  };

  const renderStepContent = () => {
    if (!connected) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h6" gutterBottom>
            Connect Your Wallet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Please connect your Solana wallet to start the transfer process
          </Typography>
          <WalletMultiButton />
        </Box>
      );
    }

    switch (currentStep) {
      case 0: // KYC Status Check
        return (
          <KYCStatusCheck
            walletAddress={publicKey?.toString() || ''}
            onKYCComplete={handleKYCComplete}
            onKYCRequired={handleKYCRequired}
          />
        );

      case 1: // Recipient Details
        return (
          <RecipientForm
            onSubmit={handleRecipientSubmit}
            onBack={() => setCurrentStep(0)}
          />
        );

      case 2: // Amount & Payment
        return (
          <AmountPaymentForm
            recipientDetails={recipientDetails!}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={() => setCurrentStep(1)}
          />
        );

      case 3: // Processing
        return (
          <ProcessingStatus
            paymentData={paymentData!}
            onComplete={handleProcessingComplete}
            onError={(error: string) => setError(error)}
          />
        );

      case 4: // Success
        return (
          <SuccessReceipt
            receipt={receipt!}
            onSendAnother={handleSendAnother}
            onGoHome={() => navigate('/')}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={0} sx={{ p: 4, mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Automated Money Transfer
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Send money directly to bank accounts with real-time processing
        </Typography>

        {connected && (
          <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {renderStepContent()}
      </Paper>
    </Container>
  );
};

export default AutomatedTransfer;