import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { WebSocketService, ProcessingStatus, wsManager } from '../services/websocketService';

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

interface ProcessingState {
  // Current step in the automated transfer process
  currentStep: number;

  // Processing status from WebSocket
  processingStatus: ProcessingStatus | null;

  // Error state
  error: string | null;

  // Loading states
  isProcessing: boolean;
  isConnecting: boolean;

  // Data states
  kycStatus: any;
  recipientDetails: RecipientDetails | null;
  paymentData: PaymentData | null;
  receipt: TransferReceipt | null;

  // WebSocket connection
  wsService: WebSocketService | null;
  wsConnected: boolean;

  // Session information
  sessionId: string | null;
  startTime: number | null;
}

// Actions
type ProcessingAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_KYC_STATUS'; payload: any }
  | { type: 'SET_RECIPIENT_DETAILS'; payload: RecipientDetails }
  | { type: 'SET_PAYMENT_DATA'; payload: PaymentData }
  | { type: 'SET_RECEIPT'; payload: TransferReceipt }
  | { type: 'SET_PROCESSING_STATUS'; payload: ProcessingStatus }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_CONNECTING'; payload: boolean }
  | { type: 'SET_WS_SERVICE'; payload: WebSocketService | null }
  | { type: 'SET_WS_CONNECTED'; payload: boolean }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'RESET_PROCESSING' }
  | { type: 'RESET_ALL' };

// Initial state
const initialState: ProcessingState = {
  currentStep: 0,
  processingStatus: null,
  error: null,
  isProcessing: false,
  isConnecting: false,
  kycStatus: null,
  recipientDetails: null,
  paymentData: null,
  receipt: null,
  wsService: null,
  wsConnected: false,
  sessionId: null,
  startTime: null
};

// Reducer
const processingReducer = (state: ProcessingState, action: ProcessingAction): ProcessingState => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

    case 'SET_KYC_STATUS':
      return { ...state, kycStatus: action.payload };

    case 'SET_RECIPIENT_DETAILS':
      return { ...state, recipientDetails: action.payload };

    case 'SET_PAYMENT_DATA':
      return {
        ...state,
        paymentData: action.payload,
        sessionId: action.payload.sessionId,
        startTime: Date.now()
      };

    case 'SET_RECEIPT':
      return { ...state, receipt: action.payload };

    case 'SET_PROCESSING_STATUS':
      return { ...state, processingStatus: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };

    case 'SET_CONNECTING':
      return { ...state, isConnecting: action.payload };

    case 'SET_WS_SERVICE':
      return { ...state, wsService: action.payload };

    case 'SET_WS_CONNECTED':
      return { ...state, wsConnected: action.payload };

    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload };

    case 'RESET_PROCESSING':
      return {
        ...state,
        processingStatus: null,
        error: null,
        isProcessing: false,
        receipt: null,
        wsService: null,
        wsConnected: false
      };

    case 'RESET_ALL':
      return {
        ...initialState,
        // Keep some persistent data if needed
      };

    default:
      return state;
  }
};

// Context
interface ProcessingContextType {
  state: ProcessingState;

  // Step management
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Data management
  setKYCStatus: (status: any) => void;
  setRecipientDetails: (details: RecipientDetails) => void;
  setPaymentData: (data: PaymentData) => void;
  setReceipt: (receipt: TransferReceipt) => void;

  // Processing management
  setProcessingStatus: (status: ProcessingStatus) => void;
  setError: (error: string | null) => void;
  setProcessing: (processing: boolean) => void;

  // WebSocket management
  connectWebSocket: (sessionId: string) => Promise<void>;
  disconnectWebSocket: () => void;

  // Reset functions
  resetProcessing: () => void;
  resetAll: () => void;

  // Utility functions
  getElapsedTime: () => number;
  formatElapsedTime: () => string;
}

const ProcessingContext = createContext<ProcessingContextType | undefined>(undefined);

// Provider component
interface ProcessingProviderProps {
  children: ReactNode;
}

export const ProcessingProvider: React.FC<ProcessingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(processingReducer, initialState);

  // Step management
  const setStep = useCallback((step: number) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: state.currentStep + 1 });
  }, [state.currentStep]);

  const prevStep = useCallback(() => {
    dispatch({ type: 'SET_STEP', payload: Math.max(0, state.currentStep - 1) });
  }, [state.currentStep]);

  // Data management
  const setKYCStatus = useCallback((status: any) => {
    dispatch({ type: 'SET_KYC_STATUS', payload: status });
  }, []);

  const setRecipientDetails = useCallback((details: RecipientDetails) => {
    dispatch({ type: 'SET_RECIPIENT_DETAILS', payload: details });
  }, []);

  const setPaymentData = useCallback((data: PaymentData) => {
    dispatch({ type: 'SET_PAYMENT_DATA', payload: data });
  }, []);

  const setReceipt = useCallback((receipt: TransferReceipt) => {
    dispatch({ type: 'SET_RECEIPT', payload: receipt });
  }, []);

  // Processing management
  const setProcessingStatus = useCallback((status: ProcessingStatus) => {
    dispatch({ type: 'SET_PROCESSING_STATUS', payload: status });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setProcessing = useCallback((processing: boolean) => {
    dispatch({ type: 'SET_PROCESSING', payload: processing });
  }, []);

  // WebSocket management
  const connectWebSocket = useCallback(async (sessionId: string) => {
    try {
      dispatch({ type: 'SET_CONNECTING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Disconnect existing connection if any
      if (state.wsService) {
        state.wsService.disconnect();
      }

      // Get or create new WebSocket service
      const wsService = wsManager.getService(sessionId);
      dispatch({ type: 'SET_WS_SERVICE', payload: wsService });

      // Subscribe to status updates
      const unsubscribe = wsService.subscribeToStatus((status: ProcessingStatus) => {
        dispatch({ type: 'SET_PROCESSING_STATUS', payload: status });
      });

      // Connect to WebSocket
      await wsService.connect();
      dispatch({ type: 'SET_WS_CONNECTED', payload: true });

      // Store unsubscribe function for cleanup
      (wsService as any).__unsubscribe = unsubscribe;

    } catch (error: any) {
      console.error('Failed to connect WebSocket:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'WebSocket connection failed' });
      dispatch({ type: 'SET_WS_CONNECTED', payload: false });
    } finally {
      dispatch({ type: 'SET_CONNECTING', payload: false });
    }
  }, [state.wsService]);

  const disconnectWebSocket = useCallback(() => {
    if (state.wsService) {
      // Call unsubscribe if available
      const unsubscribe = (state.wsService as any).__unsubscribe;
      if (unsubscribe) {
        unsubscribe();
      }

      state.wsService.disconnect();
      dispatch({ type: 'SET_WS_SERVICE', payload: null });
      dispatch({ type: 'SET_WS_CONNECTED', payload: false });
    }
  }, [state.wsService]);

  // Reset functions
  const resetProcessing = useCallback(() => {
    disconnectWebSocket();
    dispatch({ type: 'RESET_PROCESSING' });
  }, [disconnectWebSocket]);

  const resetAll = useCallback(() => {
    disconnectWebSocket();
    dispatch({ type: 'RESET_ALL' });
  }, [disconnectWebSocket]);

  // Utility functions
  const getElapsedTime = useCallback((): number => {
    if (!state.startTime) return 0;
    return Math.floor((Date.now() - state.startTime) / 1000);
  }, [state.startTime]);

  const formatElapsedTime = useCallback((): string => {
    const elapsed = getElapsedTime();
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [getElapsedTime]);

  // Context value
  const contextValue: ProcessingContextType = {
    state,
    setStep,
    nextStep,
    prevStep,
    setKYCStatus,
    setRecipientDetails,
    setPaymentData,
    setReceipt,
    setProcessingStatus,
    setError,
    setProcessing,
    connectWebSocket,
    disconnectWebSocket,
    resetProcessing,
    resetAll,
    getElapsedTime,
    formatElapsedTime
  };

  return (
    <ProcessingContext.Provider value={contextValue}>
      {children}
    </ProcessingContext.Provider>
  );
};

// Hook to use processing context
export const useProcessing = (): ProcessingContextType => {
  const context = useContext(ProcessingContext);
  if (context === undefined) {
    throw new Error('useProcessing must be used within a ProcessingProvider');
  }
  return context;
};

// Higher-order component for processing context
export const withProcessing = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  return (props: P) => (
    <ProcessingProvider>
      <Component {...props} />
    </ProcessingProvider>
  );
};

export default ProcessingContext;