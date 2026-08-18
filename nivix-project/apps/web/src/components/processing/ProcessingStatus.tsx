import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Loader2, Flame } from 'lucide-react';
// MUI icons are still referenced by the `steps` state below; only the MUI
// layout components were replaced with Tailwind markup.
import {
  CheckCircle,
  LocalFireDepartment,
  PersonAdd,
  Send,
  AccountBalance,
  Security,
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createBurnInstruction,
  getMint
} from '@solana/spl-token';

/* Visual constants, matching the redesigned wizard shell. */
const PS_SH1 = '0 1px 2px rgba(4,33,64,.04), 0 1px 3px rgba(4,33,64,.06)';
const PS_GRAD = 'linear-gradient(135deg, #0A4174 0%, #0C7075 100%)';

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

interface ProcessingStatusProps {
  paymentData: PaymentData;
  onComplete: (result: any) => void;
  onError: (error: string) => void;
}

interface ProcessingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp?: string;
  txHash?: string;
  details?: any;
}

const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');
const DEFAULT_USD_MINT = process.env.REACT_APP_USD_MINT_ADDRESS || '7bBhRdeA8onCTZa3kBwWpQVhuQdVzhMgLEvDTrjwWX5T';

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  paymentData,
  onComplete,
  onError
}) => {
  const { publicKey, signTransaction } = useWallet();
  const connection = new Connection('https://api.devnet.solana.com', {
    commitment: 'confirmed',
    confirmTransactionInitialTimeout: 60000,
  });

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  // New state for burn process
  const [burnRequired, setBurnRequired] = useState(false);
  const [offrampOrderId, setOfframpOrderId] = useState<string | null>(null);
  const [isBurning, setIsBurning] = useState(false);
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [burnMintAddress, setBurnMintAddress] = useState<string>(DEFAULT_USD_MINT);
  const [burnCryptoAmount, setBurnCryptoAmount] = useState<number | null>(null);
  const burnInProgressRef = useRef(false);

  const [steps, setSteps] = useState<ProcessingStep[]>([
    {
      id: 'payment_verified',
      title: 'Payment Verified',
      description: 'Razorpay payment confirmation received',
      icon: <CheckCircle />,
      status: 'completed'
    },
    {
      id: 'minting_usdc',
      title: 'Minting USDC Tokens',
      description: 'Creating USDC tokens on Solana blockchain',
      icon: <Security />,
      status: 'processing'
    },
    {
      id: 'burning_usdc',
      title: 'Burning USDC Tokens',
      description: 'User confirms burning USDC tokens',
      icon: <LocalFireDepartment />,
      status: 'pending'
    },
    {
      id: 'creating_beneficiary',
      title: 'Creating Beneficiary',
      description: 'Setting up recipient in banking system',
      icon: <PersonAdd />,
      status: 'pending'
    },
    {
      id: 'sending_money',
      title: 'Sending Money',
      description: 'Transferring funds to recipient account',
      icon: <Send />,
      status: 'pending'
    },
    {
      id: 'transfer_complete',
      title: 'Transfer Complete',
      description: 'Money successfully sent to recipient',
      icon: <AccountBalance />,
      status: 'pending'
    }
  ]);

  // Timer for elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    if (paymentData.sessionId) {
      connectWebSocket();
    }

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [paymentData.sessionId]);

  // Start automated processing
  useEffect(() => {
    startAutomatedProcessing();
  }, []);

  const connectWebSocket = () => {
    try {
      // Derived from BRIDGE_URL so it follows the deployed host and upgrades to
      // wss:// automatically over HTTPS. Previously hardcoded to localhost,
      // which broke real-time updates in any deployed environment.
      const wsBase = BRIDGE_URL.replace(/^http(s?):\/\//, (_m, secure) =>
        secure ? 'wss://' : 'ws://'
      );
      const ws = new WebSocket(`${wsBase}/status/${paymentData.sessionId}`);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnection(ws);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleStatusUpdate(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnection(null);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
    }
  };

  const startAutomatedProcessing = async () => {
    try {
      console.log('Starting automated processing monitoring for order:', paymentData.orderId);
      // The onramp system automatically starts processing after payment verification
      // We just need to poll the order status to track progress
      pollOrderStatus();
    } catch (error: any) {
      console.error('Error starting processing:', error);
      setError(error.message);
      onError(error.message);
    }
  };

  const handleOrderStatusUpdate = (order: any) => {
    console.log('Order status update:', order);

    // Update progress based on order status and step progression
    let newProgress = progress;

    // Enhanced status handling (based on PaymentApp logic)
    if (order.status === 'payment_verified' || order.status === 'created') {
      updateStepToCompleted('payment_verified');
      updateStepToProcessing('minting_usdc');
      setCurrentStepIndex(1);
      newProgress = 15;
    } else if (order.status === 'processing') {
      updateStepToCompleted('payment_verified');
      updateStepToCompleted('minting_usdc');

      // Check if this is automated transfer requiring burn
      if (order.burnRequired || order.readyForBurn) {
        setBurnRequired(true);
        setOfframpOrderId(order.offrampOrderId);
        setMintTxHash(order.mintTransactionHash || order.transactionSignature);
        setBurnMintAddress(order.cryptoTokenMint || order.receiveTokenMint || order.tokenMint || DEFAULT_USD_MINT);
        setBurnCryptoAmount(order.receiveAmount || order.cryptoAmount || order.tokenAmount || null);
        updateStepToProcessing('burning_usdc');
        setCurrentStepIndex(2);
        newProgress = 35;
      } else {
        // Regular onramp - skip burn step
        updateStepToProcessing('creating_beneficiary');
        setCurrentStepIndex(3);
        newProgress = 60;
      }
    } else if (order.transactionSignature && !order.deliveredAt) {
      // USDC minted, now burning; skip beneficiary UI since server handles Cashgram
      updateStepToCompleted('payment_verified');
      updateStepToCompleted('minting_usdc');
      updateStepToCompleted('burning_usdc');
      updateStepToCompleted('creating_beneficiary');
      updateStepToProcessing('sending_money');
      setCurrentStepIndex(4);
      newProgress = 80;
    } else if (order.beneficiaryId || order.payoutInitiated || order.payoutReference) {
      // Payout initiated (Cashgram created), now sending money
      updateStepToCompleted('payment_verified');
      updateStepToCompleted('minting_usdc');
      updateStepToCompleted('burning_usdc');
      updateStepToCompleted('creating_beneficiary');
      updateStepToProcessing('sending_money');
      setCurrentStepIndex(4);
      newProgress = 80;
    } else if (order.status === 'delivered' || order.deliveredAt || order.status === 'completed') {
      // Complete all remaining steps
      updateStepToCompleted('payment_verified');
      updateStepToCompleted('minting_usdc');
      updateStepToCompleted('burning_usdc');
      updateStepToCompleted('creating_beneficiary');
      updateStepToCompleted('sending_money');
      updateStepToCompleted('transfer_complete');

      setCurrentStepIndex(5);
      setIsComplete(true);
      newProgress = 100;

      // Complete the flow
      setTimeout(() => {
        onComplete({
          transactionId: order.id,
          timestamp: new Date().toISOString(),
          recipient: paymentData.recipientDetails,
          amount: paymentData.amount,
          processingTime: formatTime(elapsedTime),
          transactionHashes: {
            mint: order.transactionSignature || '',
            burn: order.burnTransactionHash || order.transactionSignature || ''
          },
          payoutId: order.payoutId || order.id,
          sessionId: paymentData.sessionId
        });
      }, 2000);
    } else if (order.status === 'failed' || order.status === 'error') {
      setError(`Transfer failed: ${order.failureReason || order.error || 'Unknown error'}`);
      onError(`Transfer failed: ${order.failureReason || order.error || 'Unknown error'}`);

      // Mark current step as error
      if (currentStepIndex < steps.length) {
        setSteps(prevSteps => {
          const newSteps = [...prevSteps];
          newSteps[currentStepIndex].status = 'error';
          return newSteps;
        });
      }
    }

    // Update progress (only increase, never decrease)
    if (newProgress > progress) {
      setProgress(newProgress);
    }
  };

  const pollOrderStatus = async () => {
    try {
      const response = await fetch(`${BRIDGE_URL}/api/onramp/order-status/${paymentData.orderId}`);

      if (response.ok) {
        const result = await response.json();
        console.log('Order status polling result:', result);

        if (result.success && result.order) {
          handleOrderStatusUpdate(result.order);

          // Also trigger automated transfer processing if needed (from PaymentApp logic)
          if (result.order.status === 'payment_verified' && !result.order.processingStarted) {
            console.log('Payment verified, triggering automated processing...');
            await triggerAutomatedProcessing(result.order);
          }
        }
      }

      // Continue polling every 3 seconds until complete
      if (!isComplete && !error) {
        setTimeout(pollOrderStatus, 3000);
      }
    } catch (error: any) {
      console.error('Error polling order status:', error);
      // Continue polling even if one request fails
      if (!isComplete && !error) {
        setTimeout(pollOrderStatus, 5000); // Retry with longer interval on error
      }
    }
  };

  // Burn user's tokens (from PaymentApp logic)
  const burnUserTokens = async (): Promise<string | null> => {
    try {
      if (burnInProgressRef.current) {
        console.log('🔥 Burn request ignored because another burn is already in progress');
        return null;
      }

      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected or cannot sign transactions');
      }

      burnInProgressRef.current = true;
      setIsBurning(true);
      console.log(`🔥 Starting token burn for automated transfer`);

      const mintPubkey = new PublicKey(burnMintAddress);

      // Get user's token account
      const userTokenAccount = await getAssociatedTokenAddress(
        mintPubkey,
        publicKey
      );

      // Read mint decimals and current balance from chain before creating burn transaction.
      const mintInfo = await getMint(connection, mintPubkey);
      // Use crypto receive amount from order (not fiat payment amount) to avoid burning wrong quantity.
      const amountToBurn = burnCryptoAmount !== null ? burnCryptoAmount : paymentData.amount;
      const tokenAmount = BigInt(Math.floor(amountToBurn * Math.pow(10, mintInfo.decimals)));
      const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
      const availableAmount = BigInt(tokenBalance.value.amount);

      if (availableAmount < tokenAmount) {
        throw new Error(
          `Insufficient token balance for burn. Required: ${tokenAmount.toString()} base units, available: ${availableAmount.toString()} base units`
        );
      }

      console.log(`🔥 Burning ${tokenAmount.toString()} token units (${amountToBurn} tokens) from mint ${mintPubkey.toBase58()}`);

      // Create burn instruction
      const burnInstruction = createBurnInstruction(
        userTokenAccount,
        mintPubkey,
        publicKey,
        tokenAmount
      );

      const signaturesBeforeBurn = new Set<string>(
        (await connection.getSignaturesForAddress(publicKey, { limit: 20 }, 'confirmed'))
          .map((item) => item.signature)
      );

      const sendFreshBurnTransaction = async (): Promise<{
        signature: string;
        blockhash: string;
        lastValidBlockHeight: number;
      }> => {
        const transaction = new Transaction().add(burnInstruction);
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.lastValidBlockHeight = lastValidBlockHeight;
        transaction.feePayer = publicKey;

        const signedTransaction = await signTransaction(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });

        return { signature, blockhash, lastValidBlockHeight };
      };

      let signature: string | null = null;
      let confirmationContext: { blockhash: string; lastValidBlockHeight: number } | null = null;

      try {
        const sentTransaction = await sendFreshBurnTransaction();
        signature = sentTransaction.signature;
        confirmationContext = {
          blockhash: sentTransaction.blockhash,
          lastValidBlockHeight: sentTransaction.lastValidBlockHeight
        };
      } catch (sendError: any) {
        const message = sendError?.message || String(sendError);
        if (!message.includes('already been processed')) {
          throw sendError;
        }

        console.warn('⚠️ Burn transaction already processed by network, attempting signature recovery');

        for (let attempt = 0; attempt < 3; attempt++) {
          const recentSignatures = await connection.getSignaturesForAddress(publicKey, { limit: 20 }, 'confirmed');
          const recoveredSignature = recentSignatures.find(
            (item) => !signaturesBeforeBurn.has(item.signature)
          )?.signature;

          if (recoveredSignature) {
            signature = recoveredSignature;
            break;
          }

          await new Promise((resolve) => setTimeout(resolve, 1200));
        }

        if (!signature) {
          const fallbackSignature = (await connection.getSignaturesForAddress(publicKey, { limit: 1 }, 'confirmed'))[0]?.signature;
          if (fallbackSignature) {
            signature = fallbackSignature;
          }
        }
      }

      if (!signature) {
        throw new Error('Burn transaction was already processed but signature could not be recovered. Please retry once.');
      }

      if (confirmationContext) {
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash: confirmationContext.blockhash,
          lastValidBlockHeight: confirmationContext.lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }
      } else {
        await connection.confirmTransaction(signature, 'confirmed');
      }

      console.log(`✅ Token burn successful! Transaction: ${signature}`);

      // Notify backend about burn completion
      await completeBurnAndPayout(signature);

      return signature;

    } catch (error: any) {
      console.error('❌ Token burning failed:', error);
      const message = error?.message || String(error);
      setError(`Token burning failed: ${message}`);
      throw error;
    } finally {
      burnInProgressRef.current = false;
      setIsBurning(false);
    }
  };

  // Complete burn and trigger payout
  const completeBurnAndPayout = async (burnTxHash: string) => {
    try {
      if (!offrampOrderId) {
        throw new Error('No offramp order ID available');
      }

      const response = await fetch(`${BRIDGE_URL}/api/offramp/complete-burn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offrampOrderId,
          burnTransactionHash: burnTxHash,
          userAddress: publicKey?.toString()
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('✅ Burn completed, payout initiated');
        // Move immediately past beneficiary creation (handled server-side)
        updateStepToCompleted('burning_usdc');
        updateStepToCompleted('creating_beneficiary');
        updateStepToProcessing('sending_money');
        setCurrentStepIndex(4);
        setProgress(80);

        // Since Cashgram link is already issued, finalize after brief delay
        setTimeout(() => {
          updateStepToCompleted('sending_money');
          updateStepToCompleted('transfer_complete');
          setCurrentStepIndex(5);
          setIsComplete(true);
          setProgress(100);
          onComplete({
            transactionId: result.withdrawalTransactionId || paymentData.orderId,
            timestamp: new Date().toISOString(),
            recipient: paymentData.recipientDetails,
            amount: paymentData.amount,
            processingTime: formatTime(elapsedTime),
            transactionHashes: {
              mint: mintTxHash || '',
              burn: burnTxHash || ''
            },
            payoutId: result.payoutReference || '',
            cashgramLink: result.cashgramLink || undefined,
            payoutProvider: result.provider || undefined,
            sessionId: paymentData.sessionId
          });
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to complete burn and payout');
      }
    } catch (error) {
      console.error('❌ Failed to complete burn and payout:', error);
      setError(`Failed to complete transfer: ${error}`);
    }
  };

  // Fixed automated processing logic - Use existing backend functionality
  const triggerAutomatedProcessing = async (order: any) => {
    try {
      console.log('Triggering automated transfer processing for order:', order.id);

      // Check if the order is completed and has tokens minted
      if (order.transactionSignature && order.status === 'processing') {
        console.log('Tokens have been minted, checking if burn is required...');

        // For automated transfers, we need to wait for user to confirm burn
        if (order.automatedTransfer || paymentData.automatedTransfer) {
          setBurnRequired(true);
          setOfframpOrderId(order.offrampOrderId || order.id);
          setMintTxHash(order.transactionSignature);
          setBurnMintAddress(order.cryptoTokenMint || order.receiveTokenMint || order.tokenMint || DEFAULT_USD_MINT);
          setBurnCryptoAmount(order.receiveAmount || order.cryptoAmount || order.tokenAmount || null);
          console.log('Automated transfer detected - user burn confirmation required');
        } else {
          console.log('Regular onramp flow - no burn required');
        }
      }
    } catch (error) {
      console.error('Error in automated processing logic:', error);
      // Don't fail the whole flow
    }
  };

  const updateStepToCompleted = (stepId: string) => {
    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const stepIndex = newSteps.findIndex(step => step.id === stepId);
      if (stepIndex !== -1) {
        newSteps[stepIndex].status = 'completed';
        newSteps[stepIndex].timestamp = new Date().toISOString();
      }
      return newSteps;
    });
  };

  const updateStepToProcessing = (stepId: string) => {
    setSteps(prevSteps => {
      const newSteps = [...prevSteps];
      const stepIndex = newSteps.findIndex(step => step.id === stepId);
      if (stepIndex !== -1) {
        newSteps[stepIndex].status = 'processing';
        newSteps[stepIndex].timestamp = new Date().toISOString();
      }
      return newSteps;
    });
  };

  const handleStatusUpdate = (data: any) => {
    console.log('WebSocket status update received:', data);

    const { currentStep, progress: newProgress, details } = data;

    // Update progress
    if (newProgress !== undefined) {
      setProgress(newProgress);
    }

    // Update steps based on current step
    setSteps(prevSteps => {
      const newSteps = [...prevSteps];

      switch (currentStep) {
        case 'minting':
          updateStepStatus(newSteps, 'minting_usdc', 'processing', details);
          setCurrentStepIndex(1);
          break;

        case 'mint_complete':
          updateStepStatus(newSteps, 'minting_usdc', 'completed', details);
          updateStepStatus(newSteps, 'burning_usdc', 'processing');
          setCurrentStepIndex(2);
          break;

        case 'burning':
          updateStepStatus(newSteps, 'burning_usdc', 'processing', details);
          setCurrentStepIndex(2);
          break;

        case 'burn_complete':
          updateStepStatus(newSteps, 'burning_usdc', 'completed', details);
          updateStepStatus(newSteps, 'creating_beneficiary', 'processing');
          setCurrentStepIndex(3);
          break;

        case 'creating_beneficiary':
          updateStepStatus(newSteps, 'creating_beneficiary', 'processing', details);
          setCurrentStepIndex(3);
          break;

        case 'beneficiary_created':
          updateStepStatus(newSteps, 'creating_beneficiary', 'completed', details);
          updateStepStatus(newSteps, 'sending_money', 'processing');
          setCurrentStepIndex(4);
          break;

        case 'sending_money':
          updateStepStatus(newSteps, 'sending_money', 'processing', details);
          setCurrentStepIndex(4);
          break;

        case 'transfer_complete':
          updateStepStatus(newSteps, 'sending_money', 'completed', details);
          updateStepStatus(newSteps, 'transfer_complete', 'completed', details);
          setCurrentStepIndex(5);
          setIsComplete(true);

          // Complete the flow
          setTimeout(() => {
            onComplete({
              transactionId: details?.transactionId || paymentData.orderId,
              timestamp: new Date().toISOString(),
              recipient: paymentData.recipientDetails,
              amount: paymentData.amount,
              processingTime: formatTime(elapsedTime),
              transactionHashes: {
                mint: details?.mintTxHash || '',
                burn: details?.burnTxHash || ''
              },
              payoutId: details?.payoutId || '',
              sessionId: paymentData.sessionId
            });
          }, 2000);
          break;

        case 'error':
          const errorMessage = details?.error || 'Processing failed';
          setError(errorMessage);
          onError(errorMessage);

          // Mark current step as error
          if (currentStepIndex < newSteps.length) {
            newSteps[currentStepIndex].status = 'error';
          }
          break;
      }

      return newSteps;
    });
  };

  const updateStepStatus = (
    steps: ProcessingStep[],
    stepId: string,
    status: ProcessingStep['status'],
    details?: any
  ) => {
    const stepIndex = steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      steps[stepIndex].status = status;
      steps[stepIndex].timestamp = new Date().toISOString();

      if (details?.txHash) {
        steps[stepIndex].txHash = details.txHash;
      }

      if (details) {
        steps[stepIndex].details = details;
      }
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Step colours are now driven by `statusStyles` in the render below.

  const statusStyles: Record<
    ProcessingStep['status'],
    { bg: string; ring?: string; text: string }
  > = {
    completed: { bg: 'linear-gradient(135deg, #0F9688 0%, #0C7075 100%)', text: '#FFFFFF' },
    processing: {
      bg: 'linear-gradient(135deg, #0A4174 0%, #0C7075 100%)',
      ring: '0 0 0 4px rgba(12,112,117,0.18)',
      text: '#FFFFFF',
    },
    error: { bg: '#FF4D4F', text: '#FFFFFF' },
    pending: { bg: '#FFFFFF', text: '#A6AEBB' },
  };

  return (
    <div>
      {/* ── Header: elapsed + progress ── */}
      <div className="mb-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-ink-900">
              Processing your transfer
            </h2>
            <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500">
              Keep this page open. Each step is confirmed on-chain as it completes.
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-2xl font-bold leading-none text-navy-600">
              {formatTime(elapsedTime)}
            </p>
            <p className="font-display mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
              Elapsed
            </p>
          </div>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          style={{ backgroundColor: '#E8EBF1' }}
        >
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${progress}%`, background: PS_GRAD }}
          />
        </div>
        <p className="font-mono mt-2 text-[12px] text-ink-400">
          {progress.toFixed(0)}% complete
        </p>
      </div>

      {/* ── Vertical timeline ── */}
      <ol className="relative">
        {steps.map((step, index) => {
          const style = statusStyles[step.status];
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Connector */}
              {!isLast && (
                <span
                  aria-hidden="true"
                  className="absolute left-[15px] top-9 h-[calc(100%-1.5rem)] w-0.5"
                  style={{
                    backgroundColor: step.status === 'completed' ? '#0F9688' : '#E8EBF1',
                  }}
                />
              )}

              {/* Marker */}
              <span
                className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300"
                style={{
                  background: style.bg,
                  color: style.text,
                  borderColor: step.status === 'pending' ? 'rgba(4,33,64,0.14)' : 'transparent',
                  boxShadow: style.ring,
                }}
              >
                {step.status === 'processing' ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : step.status === 'completed' ? (
                  <Check size={15} strokeWidth={3} />
                ) : step.status === 'error' ? (
                  <AlertCircle size={15} />
                ) : (
                  <span className="font-mono text-[11px] font-bold">{index + 1}</span>
                )}
              </span>

              {/* Body */}
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={`font-display text-[15px] font-bold ${
                      step.status === 'pending' ? 'text-ink-400' : 'text-ink-900'
                    }`}
                  >
                    {step.title}
                  </p>
                  {step.status === 'processing' && (
                    <span
                      className="font-display rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ backgroundColor: 'rgba(12,112,117,0.12)', color: '#0C7075' }}
                    >
                      In progress
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{step.description}</p>

                {step.status === 'completed' && step.timestamp && (
                  <p
                    className="mt-1.5 flex items-center gap-1.5 text-[12px] font-medium"
                    style={{ color: '#06845F' }}
                  >
                    <Check size={12} strokeWidth={3} />
                    Completed at {new Date(step.timestamp).toLocaleTimeString()}
                  </p>
                )}

                {step.txHash && (
                  <p className="font-mono mt-1.5 break-all text-[11px] text-ink-400">
                    tx {step.txHash.substring(0, 10)}…{step.txHash.slice(-8)}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* ── Burn confirmation ── */}
      {burnRequired && currentStepIndex === 2 && !isBurning && (
        <div
          className="mt-7 rounded-2xl border p-5"
          style={{ backgroundColor: 'rgba(255,184,0,0.09)', borderColor: 'rgba(255,184,0,0.32)' }}
        >
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: 'rgba(255,184,0,0.18)', color: '#8A6200' }}
            >
              <Flame size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-[15px] font-bold" style={{ color: '#7A5600' }}>
                Your approval is needed
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: '#7A5600' }}>
                Approve burning {paymentData.amount} USD tokens from your wallet. This converts them
                to fiat and releases the payout to {paymentData.recipientDetails.name}. Nothing moves
                without your signature.
              </p>
              <button
                type="button"
                onClick={burnUserTokens}
                disabled={!publicKey || isBurning}
                className="font-display mt-4 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white outline-none transition-all hover:-translate-y-px focus-visible:ring-4 focus-visible:ring-[rgba(255,184,0,0.35)] disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: '#B98700', boxShadow: '0 4px 14px rgba(185,135,0,0.28)' }}
              >
                <Flame size={16} />
                Confirm and burn tokens
              </button>
            </div>
          </div>
        </div>
      )}

      {isBurning && (
        <div
          className="mt-7 flex items-center gap-3 rounded-2xl border p-5"
          style={{ backgroundColor: 'rgba(255,184,0,0.09)', borderColor: 'rgba(255,184,0,0.32)' }}
        >
          <Loader2 size={17} className="animate-spin" style={{ color: '#8A6200' }} />
          <p className="text-sm font-medium" style={{ color: '#7A5600' }}>
            Burning tokens — confirm the transaction in your wallet.
          </p>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div
          role="alert"
          className="mt-7 flex items-start gap-3 rounded-2xl border p-4"
          style={{ backgroundColor: 'rgba(255,77,79,0.08)', borderColor: 'rgba(255,77,79,0.26)' }}
        >
          <AlertCircle size={17} className="mt-0.5 shrink-0" style={{ color: '#C2292B' }} />
          <p className="text-sm leading-relaxed" style={{ color: '#C2292B' }}>
            {error}
          </p>
        </div>
      )}

      {/* ── Success ── */}
      {isComplete && (
        <div
          className="mt-7 flex items-start gap-3 rounded-2xl border p-5"
          style={{ backgroundColor: 'rgba(0,196,140,0.10)', borderColor: 'rgba(0,196,140,0.30)' }}
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(0,196,140,0.20)', color: '#06845F' }}
          >
            <Check size={18} strokeWidth={3} />
          </span>
          <div>
            <p className="font-display text-[15px] font-bold" style={{ color: '#06845F' }}>
              Transfer complete
            </p>
            <p className="mt-1 text-[13px] leading-relaxed" style={{ color: '#06845F' }}>
              The money has been sent to {paymentData.recipientDetails.name}.
            </p>
          </div>
        </div>
      )}

      {/* ── Transfer details ── */}
      <div
        className="mt-7 rounded-2xl border border-[rgba(4,33,64,0.08)] bg-white p-5"
        style={{ boxShadow: PS_SH1 }}
      >
        <p className="font-display mb-4 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
          Transfer details
        </p>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {[
            { k: 'Amount', v: `${paymentData.amount.toFixed(2)} USDC`, mono: true },
            { k: 'To', v: paymentData.recipientDetails.name, mono: false },
            {
              k: 'Account',
              v: `••••${paymentData.recipientDetails.accountNumber.slice(-4)}`,
              mono: true,
            },
            { k: 'Session', v: `${paymentData.sessionId.substring(0, 12)}…`, mono: true },
          ].map((row) => (
            <div key={row.k}>
              <p className="text-[11px] uppercase tracking-[0.1em] text-ink-400">{row.k}</p>
              <p
                className={`mt-0.5 break-all text-sm font-semibold text-ink-800 ${
                  row.mono ? 'font-mono' : ''
                }`}
              >
                {row.v}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Connection status ── */}
      <div className="mt-5 flex justify-center">
        <span
          className="font-display inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
          style={
            wsConnection
              ? {
                  backgroundColor: 'rgba(0,196,140,0.10)',
                  borderColor: 'rgba(0,196,140,0.28)',
                  color: '#06845F',
                }
              : {
                  backgroundColor: 'rgba(255,184,0,0.10)',
                  borderColor: 'rgba(255,184,0,0.30)',
                  color: '#8A6200',
                }
          }
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${wsConnection ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: wsConnection ? '#00C48C' : '#B98700' }}
          />
          {wsConnection ? 'Live updates active' : 'Polling for updates'}
        </span>
      </div>
    </div>
  );
};

export default ProcessingStatus;
