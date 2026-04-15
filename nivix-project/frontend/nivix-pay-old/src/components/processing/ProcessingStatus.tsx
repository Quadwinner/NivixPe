import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Alert,
  Chip,
  Grid,
  CircularProgress,
  Button
} from '@mui/material';
import {
  CheckCircle,
  LocalFireDepartment,
  PersonAdd,
  Send,
  AccountBalance,
  Security,
  Speed
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createBurnInstruction,
  getMint
} from '@solana/spl-token';

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
      const ws = new WebSocket(`ws://localhost:3002/status/${paymentData.sessionId}`);

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
      if (!publicKey || !signTransaction) {
        throw new Error('Wallet not connected or cannot sign transactions');
      }

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
      const tokenAmount = BigInt(Math.floor(paymentData.amount * Math.pow(10, mintInfo.decimals)));
      const tokenBalance = await connection.getTokenAccountBalance(userTokenAccount);
      const availableAmount = BigInt(tokenBalance.value.amount);

      if (availableAmount < tokenAmount) {
        throw new Error(
          `Insufficient token balance for burn. Required: ${tokenAmount.toString()} base units, available: ${availableAmount.toString()} base units`
        );
      }

      console.log(`🔥 Burning ${tokenAmount.toString()} token units (${paymentData.amount} USD) from mint ${mintPubkey.toBase58()}`);

      // Create burn instruction
      const burnInstruction = createBurnInstruction(
        userTokenAccount,
        mintPubkey,
        publicKey,
        tokenAmount
      );

      // Create transaction
      const transaction = new Transaction().add(burnInstruction);

      // Get recent blockhash
      const blockhashInfo = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhashInfo.blockhash;
      transaction.lastValidBlockHeight = blockhashInfo.lastValidBlockHeight;
      transaction.feePayer = publicKey;

      // Sign transaction
      const signedTransaction = await signTransaction(transaction);

      // Send transaction
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed'
      });

      // Confirm transaction
      await connection.confirmTransaction(signature, 'confirmed');

      console.log(`✅ Token burn successful! Transaction: ${signature}`);

      // Notify backend about burn completion
      await completeBurnAndPayout(signature);

      return signature;

    } catch (error) {
      console.error('❌ Token burning failed:', error);
      setError(`Token burning failed: ${error}`);
      throw error;
    } finally {
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

  const getStepColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed': return 'success.main';
      case 'processing': return 'primary.main';
      case 'error': return 'error.main';
      default: return 'grey.400';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Automated Processing
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mb: 2 }}>
            <Speed color="primary" />
            <Typography variant="body2" color="text.secondary">
              Processing Time: {formatTime(elapsedTime)}
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />

          <Typography variant="body2" color="text.secondary">
            {progress.toFixed(0)}% Complete
          </Typography>
        </Box>

        {/* Processing Steps */}
        <Stepper activeStep={currentStepIndex} orientation="vertical">
          {steps.map((step) => (
            <Step key={step.id}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: getStepColor(step.status),
                      color: 'white',
                      mr: 1
                    }}
                  >
                    {step.status === 'processing' ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      React.cloneElement(step.icon as React.ReactElement, { sx: { fontSize: 16 } })
                    )}
                  </Box>
                )}
              >
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {step.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {step.description}
                  </Typography>

                  {step.status === 'processing' && (
                    <Chip
                      label="Processing..."
                      size="small"
                      color="primary"
                      sx={{ mt: 1 }}
                    />
                  )}

                  {step.status === 'completed' && step.timestamp && (
                    <Typography variant="caption" color="success.main" display="block" sx={{ mt: 1 }}>
                      ✓ Completed at {new Date(step.timestamp).toLocaleTimeString()}
                    </Typography>
                  )}

                  {step.txHash && (
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      TX: {step.txHash.substring(0, 8)}...{step.txHash.substring(-8)}
                    </Typography>
                  )}
                </Box>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Transfer Details */}
        <Card sx={{ mt: 3, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Transfer Details
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Amount:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {paymentData.amount.toFixed(2)} USDC
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">To:</Typography>
                <Typography variant="body2">
                  {paymentData.recipientDetails.name}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Account:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  ***{paymentData.recipientDetails.accountNumber.slice(-4)}
                </Typography>
              </Grid>

              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">Session ID:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {paymentData.sessionId.substring(0, 12)}...
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Burn Confirmation Required */}
        {burnRequired && currentStepIndex === 2 && !isBurning && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" gutterBottom>
              🔥 <strong>Token Burn Required:</strong> To complete the transfer, you need to approve burning your {paymentData.amount} USD tokens.
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This will convert your tokens to fiat and send {paymentData.recipientDetails.name} the money.
            </Typography>
            <Button
              variant="contained"
              onClick={burnUserTokens}
              disabled={!publicKey || isBurning}
              startIcon={isBurning ? <CircularProgress size={16} /> : <LocalFireDepartment />}
              color="warning"
              sx={{ mt: 2 }}
            >
              {isBurning ? 'Burning Tokens...' : '🔥 Confirm & Burn Tokens'}
            </Button>
          </Alert>
        )}

        {/* Success Message */}
        {isComplete && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              🎉 Transfer completed successfully! Money has been sent to {paymentData.recipientDetails.name}.
            </Typography>
          </Alert>
        )}

        {/* Connection Status */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Chip
            label={wsConnection ? 'Real-time updates active' : 'Polling for updates'}
            size="small"
            color={wsConnection ? 'success' : 'warning'}
            variant="outlined"
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProcessingStatus;
