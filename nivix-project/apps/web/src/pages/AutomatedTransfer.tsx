import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  User,
  CreditCard,
  RefreshCw,
  CheckCheck,
  Check,
  Wallet,
  Landmark,
  Zap,
  AlertCircle,
} from 'lucide-react';
import KYCStatusCheck from '../components/kyc/KYCStatusCheck';
import RecipientForm from '../components/forms/RecipientForm';
import AmountPaymentForm from '../components/forms/AmountPaymentForm';
import ProcessingStatus from '../components/processing/ProcessingStatus';
import SuccessReceipt from '../components/receipt/SuccessReceipt';

/* Visual language matches the redesigned Home page:
   1280px frame, navy-tinted elevation, Sora headings, Space Mono figures. */
const ease = [0.16, 1, 0.3, 1] as const;
const SHADOW_1 = '0 1px 2px rgba(4,33,64,.04), 0 1px 3px rgba(4,33,64,.06)';
const SHADOW_3 = '0 4px 8px rgba(4,33,64,.04), 0 12px 28px rgba(4,33,64,.08)';
const GRAD_PRIMARY = 'linear-gradient(135deg, #0A4174 0%, #0C7075 100%)';

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

/** Renamed from `ProcessingStatus` so it no longer shadows the imported component. */
interface ProcessingState {
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
  cashgramLink?: string;
  payoutProvider?: string;
  sessionId: string;
}

const steps = [
  { label: 'Verify identity', icon: ShieldCheck },
  { label: 'Recipient', icon: User },
  { label: 'Amount & payment', icon: CreditCard },
  { label: 'Processing', icon: RefreshCw },
  { label: 'Receipt', icon: CheckCheck },
];

const reassurance = [
  {
    icon: ShieldCheck,
    title: 'Private KYC',
    body: 'Verified against a permissioned Hyperledger Fabric network. Your documents never touch a public chain.',
  },
  {
    icon: Zap,
    title: 'Live settlement',
    body: 'Mint, burn and payout are tracked step by step as each one confirms on-chain.',
  },
  {
    icon: Landmark,
    title: 'Straight to the bank',
    body: 'Funds land in any Indian bank account by IFSC, with the payout reference on your receipt.',
  },
];

const SendMoney: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [, setKycStatus] = useState<any>(null);
  const [recipientDetails, setRecipientDetails] = useState<RecipientDetails | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [, setProcessingStatus] = useState<ProcessingState | null>(null);
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
        <div className="px-6 py-16 text-center">
          <span
            aria-hidden="true"
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-white"
            style={{ background: GRAD_PRIMARY, boxShadow: SHADOW_3 }}
          >
            <Wallet size={28} />
          </span>
          <h3 className="font-display text-xl font-bold text-ink-900">Connect your wallet</h3>
          <p className="mx-auto mt-2.5 max-w-md text-[15px] leading-relaxed text-ink-500">
            You approve the token burn from your own wallet during processing, so nothing moves
            without your signature.
          </p>
          <div className="mt-8 flex justify-center">
            <WalletMultiButton />
          </div>
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

  const progressPercent =
    steps.length > 1 ? (Math.min(currentStep, steps.length - 1) / (steps.length - 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#FBFCFD]">
      <div className="mx-auto max-w-[1100px] px-6 py-14 md:px-12 md:py-20">
        {/* ── Page header ── */}
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"
        >
          <div>
            <p className="font-display mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500">
              India–UAE corridor
            </p>
            <h1 className="font-display text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink-900 md:text-[40px]">
              Send money
            </h1>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-500">
              Pay in with UPI or card, settle on Solana, and land funds in any Indian bank account.
              Every step is confirmed on-chain and shown live.
            </p>
          </div>
          {connected && (
            <div className="shrink-0">
              <WalletMultiButton />
            </div>
          )}
        </motion.header>

        {/* ── Wizard ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
        >
          <div
            className="overflow-hidden rounded-2xl border border-[rgba(4,33,64,0.08)] bg-white"
            style={{ boxShadow: SHADOW_3 }}
          >
            {connected && (
              <div
                className="border-b border-[rgba(4,33,64,0.08)] px-6 py-7 md:px-8"
                style={{ backgroundColor: '#F4F6F9' }}
              >
                {/* Mobile: compact progress */}
                <div className="sm:hidden">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                      Step {Math.min(currentStep + 1, steps.length)} of {steps.length}
                    </span>
                    <span className="font-display text-sm font-semibold text-ink-900">
                      {steps[Math.min(currentStep, steps.length - 1)].label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-200">
                    <div
                      className="h-full rounded-full transition-[width] duration-500"
                      style={{
                        width: `${((Math.min(currentStep, steps.length - 1) + 1) / steps.length) * 100}%`,
                        background: GRAD_PRIMARY,
                      }}
                    />
                  </div>
                </div>

                {/* Desktop: full stepper */}
                <ol className="relative hidden items-start justify-between sm:flex" aria-label="Progress">
                  <span
                    aria-hidden="true"
                    className="absolute top-5 h-0.5 bg-ink-200"
                    style={{ left: `${50 / steps.length}%`, right: `${50 / steps.length}%` }}
                  >
                    <span
                      className="block h-full transition-[width] duration-500"
                      style={{ width: `${progressPercent}%`, background: GRAD_PRIMARY }}
                    />
                  </span>

                  {steps.map((step, index) => {
                    const isComplete = index < currentStep;
                    const isCurrent = index === currentStep;
                    const Icon = step.icon;

                    return (
                      <li
                        key={step.label}
                        className="relative flex flex-1 flex-col items-center gap-2 text-center"
                        aria-current={isCurrent ? 'step' : undefined}
                      >
                        <span
                          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300"
                          style={{
                            background: isComplete || isCurrent ? GRAD_PRIMARY : '#FFFFFF',
                            borderColor:
                              isComplete || isCurrent ? 'transparent' : 'rgba(4,33,64,0.14)',
                            color: isComplete || isCurrent ? '#FFFFFF' : '#A6AEBB',
                            boxShadow: isCurrent ? '0 0 0 4px rgba(12,112,117,0.16)' : undefined,
                          }}
                        >
                          {isComplete ? <Check size={17} strokeWidth={3} /> : <Icon size={17} />}
                        </span>
                        <span
                          className={`font-display max-w-[8.5rem] text-[11px] font-semibold uppercase leading-tight tracking-[0.1em] ${
                            isCurrent
                              ? 'text-ink-900'
                              : isComplete
                              ? 'text-ink-500'
                              : 'text-ink-300'
                          }`}
                        >
                          {step.label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}

            <div className="px-6 py-8 md:px-8">
              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-xl border p-4"
                  style={{
                    backgroundColor: 'rgba(255,77,79,0.08)',
                    borderColor: 'rgba(255,77,79,0.26)',
                  }}
                >
                  <AlertCircle size={17} className="mt-0.5 shrink-0" style={{ color: '#C2292B' }} />
                  <p className="text-sm leading-relaxed" style={{ color: '#C2292B' }}>
                    {error}
                  </p>
                </div>
              )}

              <div key={currentStep}>{renderStepContent()}</div>
            </div>
          </div>
        </motion.div>

        {/* ── Reassurance, pre-connect only ── */}
        {!connected && (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {reassurance.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.14 + index * 0.07, ease }}
                >
                  <div
                    className="h-full rounded-2xl border border-[rgba(4,33,64,0.08)] bg-white p-6"
                    style={{ boxShadow: SHADOW_1 }}
                  >
                    <span
                      aria-hidden="true"
                      className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-white"
                      style={{ background: GRAD_PRIMARY }}
                    >
                      <Icon size={19} />
                    </span>
                    <h3 className="font-display text-base font-bold text-ink-900">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendMoney;
