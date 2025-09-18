export interface ProcessingStatus {
  currentStep: string;
  progress: number;
  details?: {
    mintTxHash?: string;
    burnTxHash?: string;
    beneficiaryId?: string;
    payoutId?: string;
    transactionId?: string;
    error?: string;
    [key: string]: any;
  };
}

export type StatusCallback = (status: ProcessingStatus) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private callbacks: Set<StatusCallback> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private isDestroyed = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    if (this.isDestroyed || this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `ws://localhost:3002/status/${this.sessionId}`;
        console.log('Connecting to WebSocket:', wsUrl);

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('WebSocket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;

          if (this.reconnectAttempts === 0) {
            // Only reject on first connection attempt
            reject(error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;

          if (!this.isDestroyed && this.shouldReconnect(event.code)) {
            this.scheduleReconnect();
          }
        };

        // Connection timeout
        setTimeout(() => {
          if (this.isConnecting && this.ws?.readyState !== WebSocket.OPEN) {
            this.isConnecting = false;
            this.ws?.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, 10000); // 10 second timeout

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Subscribe to status updates
   */
  subscribeToStatus(callback: StatusCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Send a message to the server
   */
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    this.isDestroyed = true;
    this.callbacks.clear();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /**
   * Get current connection state
   */
  getState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (this.isConnecting) return 'connecting';

    switch (this.ws?.readyState) {
      case WebSocket.OPEN: return 'open';
      case WebSocket.CONNECTING: return 'connecting';
      case WebSocket.CLOSING: return 'closing';
      case WebSocket.CLOSED:
      default: return 'closed';
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleMessage(data: any): void {
    console.log('WebSocket message received:', data);

    // Validate message structure
    if (!this.isValidStatusMessage(data)) {
      console.warn('Invalid status message format:', data);
      return;
    }

    // Notify all subscribers
    this.callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in status callback:', error);
      }
    });
  }

  private isValidStatusMessage(data: any): data is ProcessingStatus {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.currentStep === 'string' &&
      typeof data.progress === 'number'
    );
  }

  private shouldReconnect(closeCode: number): boolean {
    // Don't reconnect on normal closure or if max attempts reached
    if (closeCode === 1000 || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return false;
    }

    // Don't reconnect on certain error codes
    const noReconnectCodes = [1002, 1003, 1005, 1006, 1009, 1010, 1011];
    return !noReconnectCodes.includes(closeCode);
  }

  private scheduleReconnect(): void {
    if (this.isDestroyed || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`Scheduling WebSocket reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    setTimeout(() => {
      if (!this.isDestroyed && !this.isConnected()) {
        console.log(`Attempting WebSocket reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        this.connect().catch(error => {
          console.error('WebSocket reconnect failed:', error);
        });
      }
    }, delay);
  }
}

/**
 * WebSocket service factory
 */
export const createWebSocketService = (sessionId: string): WebSocketService => {
  return new WebSocketService(sessionId);
};

/**
 * WebSocket connection manager for handling multiple sessions
 */
export class WebSocketManager {
  private static instance: WebSocketManager;
  private connections: Map<string, WebSocketService> = new Map();

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Get or create WebSocket service for session
   */
  getService(sessionId: string): WebSocketService {
    if (!this.connections.has(sessionId)) {
      const service = new WebSocketService(sessionId);
      this.connections.set(sessionId, service);
    }

    return this.connections.get(sessionId)!;
  }

  /**
   * Remove WebSocket service for session
   */
  removeService(sessionId: string): void {
    const service = this.connections.get(sessionId);
    if (service) {
      service.disconnect();
      this.connections.delete(sessionId);
    }
  }

  /**
   * Disconnect all WebSocket services
   */
  disconnectAll(): void {
    this.connections.forEach(service => service.disconnect());
    this.connections.clear();
  }

  /**
   * Get connection status for all services
   */
  getConnectionStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    this.connections.forEach((service, sessionId) => {
      status[sessionId] = service.getState();
    });
    return status;
  }
}

// Export default instance
export const wsManager = WebSocketManager.getInstance();