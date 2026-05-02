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
import Header from './components/Header';
import Footer from './components/Footer';
import { ProcessingProvider } from './contexts/ProcessingContext';
import '@solana/wallet-adapter-react-ui/styles.css';

// Pages — lazy loaded to reduce initial bundle size
const Home = React.lazy(() => import('./pages/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Send = React.lazy(() => import('./pages/Send'));
const Receive = React.lazy(() => import('./pages/Receive'));
const LiquidityPools = React.lazy(() => import('./pages/LiquidityPools'));
const Profile = React.lazy(() => import('./pages/Profile'));
const KYC = React.lazy(() => import('./pages/KYC'));
const KYCAdmin = React.lazy(() => import('./pages/KYCAdmin'));
const OfframpTesting = React.lazy(() => import('./pages/OfframpTesting'));
const ComprehensiveTesting = React.lazy(() => import('./pages/ComprehensiveTesting'));
const PaymentApp = React.lazy(() => import('./pages/PaymentApp'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const CompleteOffRamp = React.lazy(() => import('./pages/CompleteOffRamp'));
const CashfreeTestPage = React.lazy(() => import('./pages/CashfreeTestPage'));
const SimplePayout = React.lazy(() => import('./pages/SimplePayout'));
const AutomatedTransfer = React.lazy(() => import('./pages/AutomatedTransfer'));

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
                    <React.Suspense fallback={<div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'60vh',fontSize:'1.2rem',color:'#0A4174'}}>Loading...</div>}>
                    <Routes>
                      {/* ── ACTIVE ROUTES (Beta) ── */}
                      <Route path="/" element={<Home />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/kyc" element={<KYC />} />
                      <Route path="/automated-transfer" element={<AutomatedTransfer />} />

                      {/* ── BETA-DISABLED ROUTES ── redirect to Home until post-beta launch ── */}
                      {/* Files are preserved; simply re-add routes below after beta phase */}
                      <Route path="/dashboard" element={<Home />} />
                      <Route path="/send" element={<Home />} />
                      <Route path="/receive" element={<Home />} />
                      <Route path="/liquidity-pools" element={<Home />} />
                      <Route path="/kyc-admin" element={<Home />} />
                      <Route path="/offramp-testing" element={<Home />} />
                      <Route path="/comprehensive-testing" element={<Home />} />
                      <Route path="/payment-app" element={<Home />} />
                      <Route path="/admin-dashboard" element={<Home />} />
                      <Route path="/complete-offramp" element={<Home />} />
                      <Route path="/cashfree-test" element={<Home />} />
                      <Route path="/simple-payout" element={<Home />} />


                    </Routes>
                    </React.Suspense>
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
