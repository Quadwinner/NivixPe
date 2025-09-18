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

// Create theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#5D5FEF',
    },
    secondary: {
      main: '#45B26B',
    },
    background: {
      default: '#17171A',
      paper: '#1E1E22',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
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
                <div className="app">
                  <Header />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
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
