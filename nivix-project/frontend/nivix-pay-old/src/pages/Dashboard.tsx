import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import SendIcon from '@mui/icons-material/Send';
import QrCodeIcon from '@mui/icons-material/QrCode';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { fetchWalletData, fetchTransactionHistory } from '../services/apiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kycStatus, setKycStatus] = useState(true);

  // Redirect to home if not connected
  useEffect(() => {
    if (!connected) {
      navigate('/');
    }
  }, [connected, navigate]);

  useEffect(() => {
    if (connected && publicKey) {
      fetchData();
    } else {
      // Reset data when wallet disconnects
      setWallets([]);
      setTransactions([]);
    }
  }, [connected, publicKey]);

  const fetchData = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const [walletData, transactionData] = await Promise.all([
        fetchWalletData(publicKey.toString()),
        fetchTransactionHistory(publicKey.toString())
      ]);
      setWallets(Array.isArray(walletData) ? walletData : []);
      setTransactions(Array.isArray(transactionData) ? transactionData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load wallet data. Please try again.');
      // Set empty arrays on error
      setWallets([]);
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const totalBalance = wallets.reduce((sum, wallet) => sum + (wallet.value_usd || 0), 0);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return date.toLocaleDateString(undefined, options);
    } catch {
      return 'N/A';
    }
  };

  const truncateAddress = (address: string) => {
    if (!address || address === 'Your wallet') return address;
    if (address.length <= 8) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getCurrencyIcon = (currency: string) => {
    const icons: Record<string, string> = {
      'SOL': '♦️',
      'USDC': '💵',
      'USD': '$',
      'INR': '₹',
      'EUR': '€',
      'GBP': '£',
    };
    return icons[currency] || '💳';
  };

  // Not connected state
  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent-50/30 to-background">
        <div className="max-w-6xl mx-auto py-16 px-4">
          {/* Hero Section */}
          <div className="text-center mb-16 animate-fade-in">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full animate-pulse" />
              <AccountBalanceWalletIcon className="w-24 h-24 text-accent mx-auto relative z-10 drop-shadow-2xl" style={{ fontSize: '6rem' }} />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-text mb-6 bg-gradient-to-r from-accent-700 via-accent to-accent-600 bg-clip-text text-transparent">
              Welcome to Nivix Pay
            </h1>
            <p className="text-xl text-text-muted mb-10 max-w-2xl mx-auto leading-relaxed">
              Experience the future of payments with our hybrid blockchain system
            </p>

            {/* Connect Card */}
            <Card className="max-w-lg mx-auto mb-16 bg-white/80 backdrop-blur-sm border-accent/30 shadow-2xl hover:shadow-accent/20 transition-all duration-300 transform hover:scale-[1.02]">
              <div className="text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-accent to-accent-700 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                    <AccountBalanceWalletIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-text mb-3">Connect Your Wallet</h2>
                <p className="text-text-muted mb-8 leading-relaxed">
                  Securely connect your Solana wallet to start sending and receiving payments instantly
                </p>
                <div className="flex justify-center">
                  <WalletMultiButton className="!bg-gradient-to-r !from-accent-600 !to-accent-700 hover:!from-accent-700 hover:!to-accent-800 !rounded-xl !px-8 !py-3 !font-semibold !shadow-lg hover:!shadow-xl !transition-all !duration-300" />
                </div>
              </div>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-center text-text mb-10">Powerful Features</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-transparent hover:border-accent/30">
                <div className="relative">
                  <div className="absolute -top-6 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow">
                      <TrendingUpIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="pt-12">
                    <h3 className="text-xl font-bold text-text mb-3">Lightning Fast</h3>
                    <p className="text-text-muted leading-relaxed">
                      Execute transactions in milliseconds with Solana's high-performance blockchain infrastructure
                    </p>
                  </div>
                </div>
              </Card>

              {/* Feature 2 */}
              <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-transparent hover:border-accent/30">
                <div className="relative">
                  <div className="absolute -top-6 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow">
                      <SwapHorizIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="pt-12">
                    <h3 className="text-xl font-bold text-text mb-3">Multi-Currency</h3>
                    <p className="text-text-muted leading-relaxed">
                      Seamlessly swap between SOL, USDC, USD, INR, EUR, and GBP with real-time exchange rates
                    </p>
                  </div>
                </div>
              </Card>

              {/* Feature 3 */}
              <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-transparent hover:border-accent/30">
                <div className="relative">
                  <div className="absolute -top-6 left-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow">
                      <QrCodeIcon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="pt-12">
                    <h3 className="text-xl font-bold text-text mb-3">Secure & Private</h3>
                    <p className="text-text-muted leading-relaxed">
                      Enterprise-grade security with private KYC verification powered by Hyperledger Fabric
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Stats Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <Card className="text-center bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
              <ShowChartIcon className="w-12 h-12 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold text-text mb-2">$0.00001</div>
              <div className="text-sm text-text-muted">Average Transaction Fee</div>
            </Card>
            <Card className="text-center bg-gradient-to-br from-green-50 to-green-100/50 border-green-200">
              <TimelineIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-text mb-2">&lt;1s</div>
              <div className="text-sm text-text-muted">Transaction Speed</div>
            </Card>
            <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <AccountBalanceWalletIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-text mb-2">6+</div>
              <div className="text-sm text-text-muted">Supported Currencies</div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-50/20 to-background">
      <div className="max-w-7xl mx-auto py-8 px-4">
        {/* KYC Warning */}
        {!kycStatus && (
          <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 border border-yellow-300 rounded-2xl flex items-center justify-between shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-sm font-medium text-yellow-900">
                Your KYC verification is incomplete. Some features may be limited.
              </p>
            </div>
            <Button size="sm" onClick={() => navigate('/kyc')} className="!bg-yellow-600 hover:!bg-yellow-700">
              Complete KYC
            </Button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-300 rounded-2xl flex items-center justify-between shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-400 rounded-xl flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchData} className="!border-red-400 !text-red-700 hover:!bg-red-50">
              Retry
            </Button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-accent to-accent-700 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Balance</p>
                {isLoading ? (
                  <div className="h-8 w-24 bg-white/20 rounded animate-pulse" />
                ) : (
                  <h3 className="text-2xl font-bold">${totalBalance.toFixed(2)}</h3>
                )}
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <AccountBalanceWalletIcon className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Received</p>
                <h3 className="text-2xl font-bold">
                  {transactions.filter(tx => tx.type === 'received').length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowDownwardIcon className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Total Sent</p>
                <h3 className="text-2xl font-bold">
                  {transactions.filter(tx => tx.type === 'sent').length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <ArrowUpwardIcon className="w-6 h-6" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Wallets</p>
                <h3 className="text-2xl font-bold">{wallets.length}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <TrendingUpIcon className="w-6 h-6" />
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Balance Summary Card */}
          <div className="lg:col-span-1">
            <Card className="bg-white/90 backdrop-blur-sm border-accent/20 h-full shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-text flex items-center gap-2">
                  <AccountBalanceWalletIcon className="w-6 h-6 text-accent" />
                  My Wallets
                </h2>
                <button
                  onClick={fetchData}
                  disabled={isLoading}
                  className="p-2 rounded-xl hover:bg-accent/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                  aria-label="Refresh"
                >
                  <RefreshIcon className={`w-5 h-5 text-accent group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="mb-6">
                {isLoading ? (
                  <div className="h-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-2xl animate-pulse" />
                ) : (
                  <div className="bg-gradient-to-br from-accent/10 via-accent/5 to-transparent p-6 rounded-2xl border border-accent/20">
                    <p className="text-sm text-text-muted mb-2">Total Balance</p>
                    <h3 className="text-4xl font-bold bg-gradient-to-r from-accent-700 to-accent-500 bg-clip-text text-transparent">
                      ${totalBalance.toFixed(2)}
                    </h3>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mb-6">
                <Button
                  variant="primary"
                  className="flex-1 flex items-center justify-center gap-2 !bg-gradient-to-r !from-accent-600 !to-accent-700 hover:!from-accent-700 hover:!to-accent-800 !shadow-lg hover:!shadow-xl transition-all duration-300"
                  onClick={() => navigate('/send')}
                >
                  <SendIcon className="w-5 h-5" />
                  Send
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 flex items-center justify-center gap-2 hover:!border-accent hover:!text-accent transition-all duration-300"
                  onClick={() => navigate('/receive')}
                >
                  <QrCodeIcon className="w-5 h-5" />
                  Receive
                </Button>
              </div>

              <div className="border-t border-border/50 pt-6">
                <h4 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  Assets
                </h4>

                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="h-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : wallets.length > 0 ? (
                  <div className="space-y-3">
                    {wallets.map((wallet, index) => (
                      <div
                        key={wallet.id || wallet.currency}
                        className="group relative overflow-hidden p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl hover:shadow-lg transition-all duration-300 border border-transparent hover:border-accent/30"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/10 flex items-center justify-center text-2xl shadow-sm">
                              {wallet.icon || getCurrencyIcon(wallet.currency)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-text">{wallet.currency || 'Unknown'}</p>
                              <p className="text-xs text-text-muted font-medium">
                                {typeof wallet.balance === 'number'
                                  ? wallet.balance.toFixed(wallet.currency === 'SOL' ? 3 : 2)
                                  : '0.00'} {wallet.currency || ''}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-text">
                              ${typeof wallet.value_usd === 'number' ? wallet.value_usd.toFixed(2) : '0.00'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <AccountBalanceWalletIcon className="w-10 h-10 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-text-muted">No wallets found</p>
                    <p className="text-xs text-text-muted mt-1">Connect a wallet to get started</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Transaction History Card */}
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-text flex items-center gap-2">
                  <TimelineIcon className="w-6 h-6 text-accent" />
                  Transaction History
                </h2>
                {transactions.length > 0 && (
                  <Badge variant="info" className="!px-4 !py-2">{transactions.length} transactions</Badge>
                )}
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-border/50">
                        <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Type</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Amount</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">From</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden md:table-cell">To</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider hidden lg:table-cell">Date</th>
                        <th className="text-left py-4 px-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx, index) => (
                        <tr
                          key={tx.id || index}
                          className="border-b border-border/30 hover:bg-accent/5 transition-all duration-200 group"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                                tx.type === 'received'
                                  ? 'bg-green-100 text-green-600'
                                  : tx.type === 'sent'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-yellow-100 text-yellow-600'
                              }`}>
                                {tx.type === 'received' ? (
                                  <ArrowDownwardIcon className="w-5 h-5" />
                                ) : tx.type === 'sent' ? (
                                  <ArrowUpwardIcon className="w-5 h-5" />
                                ) : (
                                  <SwapHorizIcon className="w-5 h-5" />
                                )}
                              </div>
                              <span className="text-sm font-semibold text-text capitalize">{tx.type || 'unknown'}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-sm font-bold ${
                              tx.type === 'received' ? 'text-green-600' : 'text-text'
                            }`}>
                              {tx.type === 'received' ? '+' : '-'} {tx.amount || 0} {tx.currency || 'SOL'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-text-muted font-mono hidden md:table-cell">
                            {truncateAddress(tx.from || 'N/A')}
                          </td>
                          <td className="py-4 px-4 text-sm text-text-muted font-mono hidden md:table-cell">
                            {truncateAddress(tx.to || 'N/A')}
                          </td>
                          <td className="py-4 px-4 text-xs text-text-muted hidden lg:table-cell">
                            {formatDate(tx.date || '')}
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={
                              tx.status === 'completed' || tx.status === 'COMPLETED'
                                ? 'success'
                                : tx.status === 'pending' || tx.status === 'PENDING'
                                ? 'warning'
                                : 'error'
                            }>
                              {tx.status || 'unknown'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-accent/10 to-accent/5 rounded-3xl flex items-center justify-center">
                    <TrendingUpIcon className="w-12 h-12 text-accent opacity-40" />
                  </div>
                  <h3 className="text-lg font-bold text-text mb-2">No transactions yet</h3>
                  <p className="text-sm text-text-muted mb-6">Your transaction history will appear here</p>
                  <Button onClick={() => navigate('/send')} className="!bg-gradient-to-r !from-accent-600 !to-accent-700">
                    <SendIcon className="w-5 h-5 mr-2" />
                    Send Your First Payment
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
