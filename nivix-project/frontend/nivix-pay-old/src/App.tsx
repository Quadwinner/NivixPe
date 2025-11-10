import React, { useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { 
  ConnectionProvider, 
  WalletProvider 
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  TorusWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';

// Import pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Send from './pages/Send';
import Receive from './pages/Receive';
import LiquidityPools from './pages/LiquidityPools';
import Profile from './pages/Profile';
import KYC from './pages/KYC';
import KYCAdmin from './pages/KYCAdmin';
import OfframpTesting from './pages/OfframpTesting';
import ComprehensiveTesting from './pages/ComprehensiveTesting';
import PaymentApp from './pages/PaymentApp';
import AdminDashboard from './pages/AdminDashboard';
import CompleteOffRamp from './pages/CompleteOffRamp';
import CashfreeTestPage from './pages/CashfreeTestPage';
import SimplePayout from './pages/SimplePayout';
import AutomatedTransfer from './pages/AutomatedTransfer';
import Header from './components/Header';
import Footer from './components/Footer';

// Import contexts
import { ProcessingProvider } from './contexts/ProcessingContext';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Create theme - Modern minimal white/grey theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563EB',
    },
    secondary: {
      main: '#14B8A6',
    },
    background: {
      default: '#F7F8FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827',
      secondary: '#374151',
    },
  },
  typography: {
    fontFamily: '"Inter", "Outfit", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'
  const network = WalletAdapterNetwork.Devnet;
  
  // Establish a connection to the Solana RPC endpoint
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  
  // Initialize wallet adapters with useMemo to prevent unnecessary re-renders
  const wallets = useMemo(
    () => [
      // Phantom and Solflare are now automatically detected as Standard Wallets
      // Only include TorusWalletAdapter for now
      new TorusWalletAdapter()
    ],
    [network]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>
            <ProcessingProvider>
              <Router>
                <div className="app min-h-screen flex flex-col bg-background">
                  <Header />
                  <main className="flex-1 w-full">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/send" element={<Send />} />
                      <Route path="/receive" element={<Receive />} />
                      <Route path="/liquidity-pools" element={<LiquidityPools />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/kyc" element={<KYC />} />
                      <Route path="/kyc-admin" element={<KYCAdmin />} />
                      <Route path="/automated-transfer" element={<AutomatedTransfer />} />
                      <Route path="/offramp-testing" element={<OfframpTesting />} />
                      <Route path="/comprehensive-testing" element={<ComprehensiveTesting />} />
                      <Route path="/payment-app" element={<PaymentApp />} />
                      <Route path="/admin-dashboard" element={<AdminDashboard />} />
                      <Route path="/complete-offramp" element={<CompleteOffRamp />} />
                      <Route path="/cashfree-test" element={<CashfreeTestPage />} />
                      <Route path="/simple-payout" element={<SimplePayout />} />
                    </Routes>
                  </main>
                  <Footer />
                </div>
              </Router>
            </ProcessingProvider>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ThemeProvider>
  );
}

export default App;
