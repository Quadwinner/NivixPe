import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SendIcon from '@mui/icons-material/Send';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import PersonIcon from '@mui/icons-material/Person';
import PaymentIcon from '@mui/icons-material/Payment';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import KYCStatusCheck from '../components/kyc/KYCStatusCheck';
import RecipientForm from '../components/forms/RecipientForm';
import AmountPaymentForm from '../components/forms/AmountPaymentForm';
import ProcessingStatus from '../components/processing/ProcessingStatus';
import SuccessReceipt from '../components/receipt/SuccessReceipt';
import { Card } from '../components/ui/Card';

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
  { label: 'KYC Verification', icon: VerifiedUserIcon },
  { label: 'Recipient Details', icon: PersonIcon },
  { label: 'Amount & Payment', icon: PaymentIcon },
  { label: 'Processing', icon: AutorenewIcon },
  { label: 'Complete', icon: DoneAllIcon }
];

const AutomatedTransfer: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        <div className="text-center py-16">
          <div className="mb-8 relative inline-block">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full animate-pulse" />
            <AccountBalanceWalletIcon className="w-24 h-24 text-accent mx-auto relative z-10 drop-shadow-2xl" style={{ fontSize: '6rem' }} />
          </div>
          <h3 className="text-2xl font-bold text-text mb-3">Connect Your Wallet</h3>
          <p className="text-text-muted mb-8 max-w-md mx-auto leading-relaxed">
            Please connect your Solana wallet to start the automated money transfer process
          </p>
          <WalletMultiButton className="!bg-gradient-to-r !from-accent-600 !to-accent-700 hover:!from-accent-700 hover:!to-accent-800 !rounded-xl !px-8 !py-3 !font-semibold !shadow-lg hover:!shadow-xl !transition-all !duration-300" />
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <KYCStatusCheck
            walletAddress={publicKey?.toString() || ''}
            onKYCComplete={handleKYCComplete}
            onKYCRequired={handleKYCRequired}
          />
        );
      case 1:
        return (
          <RecipientForm
            onSubmit={handleRecipientSubmit}
            onBack={() => setCurrentStep(0)}
          />
        );
      case 2:
        return (
          <AmountPaymentForm
            recipientDetails={recipientDetails!}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        return (
          <ProcessingStatus
            paymentData={paymentData!}
            onComplete={handleProcessingComplete}
            onError={(error: string) => setError(error)}
          />
        );
      case 4:
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-50/20 to-background">
      <div className="max-w-5xl mx-auto py-8 px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <div className="mb-6 relative inline-block">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-accent/30 blur-3xl rounded-full"
            />
            <motion.div
              animate={{
                y: [0, -10, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <SendIcon className="w-16 h-16 text-accent mx-auto relative z-10 drop-shadow-2xl" style={{ fontSize: '4rem' }} />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-700 via-blue-600 to-accent-600 bg-clip-text text-transparent tracking-tight"
            style={{ letterSpacing: '-0.02em' }}
          >
            Automated Money Transfer
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed"
          >
            Send money directly to bank accounts with real-time blockchain processing
          </motion.p>
        </motion.div>

        {/* Main Card */}
        <Card className="bg-white/90 backdrop-blur-sm shadow-2xl border-accent/20 mb-8">
          {/* Step Progress */}
          {connected && (
            <div className="mb-10">
              <div className="relative">
                {/* Desktop Progress Bar */}
                <div className="hidden md:flex items-center justify-between">
                  {steps.map((step, index) => {
                    const StepIcon = step.icon;
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isPending = index > currentStep;

                    return (
                      <React.Fragment key={step.label}>
                        <div className="flex flex-col items-center flex-1 relative z-10">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 mb-3 ${
                            isCompleted
                              ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-lg scale-110'
                              : isCurrent
                              ? 'bg-gradient-to-br from-accent to-accent-700 text-white ring-4 ring-accent/30 shadow-xl scale-110 animate-pulse'
                              : 'bg-gray-100 text-gray-400 border-2 border-gray-200'
                          }`}>
                            {isCompleted ? (
                              <CheckCircleIcon className="w-8 h-8" />
                            ) : (
                              <StepIcon className="w-8 h-8" />
                            )}
                          </div>
                          <p className={`text-xs font-semibold text-center transition-colors ${
                            isCompleted || isCurrent ? 'text-text' : 'text-text-muted'
                          }`}>
                            {step.label}
                          </p>
                        </div>
                        {index < steps.length - 1 && (
                          <div className="flex-1 h-1.5 mx-4 -mt-6 rounded-full overflow-hidden bg-gray-200">
                            <div
                              className={`h-full transition-all duration-500 rounded-full ${
                                index < currentStep
                                  ? 'bg-gradient-to-r from-green-400 to-green-600 w-full'
                                  : 'w-0'
                              }`}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Mobile Progress */}
                <div className="md:hidden">
                  <div className="flex items-center justify-center mb-6">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCurrent = index === currentStep;
                      if (!isCurrent) return null;

                      return (
                        <div key={step.label} className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent to-accent-700 text-white flex items-center justify-center mb-3 shadow-xl">
                            <StepIcon className="w-10 h-10" />
                          </div>
                          <p className="text-sm font-bold text-text">{step.label}</p>
                          <p className="text-xs text-text-muted mt-1">Step {index + 1} of {steps.length}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-2 justify-center">
                    {steps.map((_, index) => (
                      <div
                        key={index}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index < currentStep
                            ? 'w-8 bg-green-500'
                            : index === currentStep
                            ? 'w-16 bg-accent'
                            : 'w-8 bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border-2 border-red-300 rounded-2xl flex items-center gap-3 shadow-lg animate-scale-in">
              <div className="w-10 h-10 bg-red-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="animate-fade-in">
            {renderStepContent()}
          </div>
        </Card>

        {/* Info Cards */}
        {!connected && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <VerifiedUserIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Secure KYC</h3>
              <p className="text-sm text-text-muted">
                Private verification with Hyperledger Fabric blockchain
              </p>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <AutorenewIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Real-time Processing</h3>
              <p className="text-sm text-text-muted">
                Automated transfers with instant blockchain confirmation
              </p>
            </Card>

            <Card className="text-center hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm">
              <div className="w-14 h-14 mx-auto mb-4 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <PaymentIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-text mb-2">Direct to Bank</h3>
              <p className="text-sm text-text-muted">
                Send money directly to any bank account instantly
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AutomatedTransfer;
