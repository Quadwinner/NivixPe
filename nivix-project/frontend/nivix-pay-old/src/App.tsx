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

/* ════════════════════════════════════════════
   NIVIXPE MUI THEME — Design System v1.0
   Uses Navy Blue primary, Ocean Teal secondary
   Sora / DM Sans / Space Mono typography
════════════════════════════════════════════ */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0A4174',    // Navy-600 — Primary CTA
      light: '#1A5FA3',   // Navy-500
      dark: '#073155',    // Navy-700
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#0C7075',    // Teal-500 — On-chain / Blockchain
      light: '#0F9688',   // Teal-400
      dark: '#094F54',    // Teal-600
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#FFFFFF',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1C2535', // Ink-800
      secondary: '#56607A', // Ink-500
    },
    success: {
      main: '#00C48C',
    },
    warning: {
      main: '#FFB800',
    },
    error: {
      main: '#FF4D4F',
    },
    info: {
      main: '#7BBDE8',
    },
    divider: '#E5E8EF', // Ink-100
  },
  typography: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    h1: { fontFamily: '"Sora", system-ui, sans-serif', fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontFamily: '"Sora", system-ui, sans-serif', fontWeight: 600, letterSpacing: '-0.02em' },
    h3: { fontFamily: '"Sora", system-ui, sans-serif', fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontFamily: '"Sora", system-ui, sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Sora", system-ui, sans-serif', fontWeight: 500 },
    h6: { fontFamily: '"Sora", system-ui, sans-serif', fontWeight: 500 },
    subtitle1: { fontFamily: '"DM Sans", system-ui, sans-serif' },
    subtitle2: { fontFamily: '"DM Sans", system-ui, sans-serif' },
    body1: { fontFamily: '"DM Sans", system-ui, sans-serif' },
    body2: { fontFamily: '"DM Sans", system-ui, sans-serif' },
    button: { fontFamily: '"Sora", system-ui, sans-serif', fontWeight: 600, textTransform: 'none' as const },
    caption: { fontFamily: '"DM Sans", system-ui, sans-serif' },
    overline: { fontFamily: '"Sora", system-ui, sans-serif', fontWeight: 600, letterSpacing: '0.12em' },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none' as const,
          fontWeight: 600,
          fontFamily: '"Sora", system-ui, sans-serif',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(10, 14, 20, 0.05), 0 10px 30px rgba(10, 14, 20, 0.03)',
        },
      },
    },
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
    []
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect={false}>
          <WalletModalProvider>
            <ProcessingProvider>
              <Router>
                <div className="app min-h-screen flex flex-col">
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
