import React from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import SendIcon from '@mui/icons-material/Send';
import QrCodeIcon from '@mui/icons-material/QrCode';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import TimelineIcon from '@mui/icons-material/Timeline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LocalAtmIcon from '@mui/icons-material/LocalAtm';
import PublicIcon from '@mui/icons-material/Public';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PaymentIcon from '@mui/icons-material/Payment';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-50/30 to-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/10 via-purple-400/10 to-accent/10 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="text-center mb-16 animate-fade-in">
            <div className="mb-8 relative inline-block">
              <div className="absolute inset-0 bg-accent/30 blur-3xl rounded-full animate-pulse" />
              <AccountBalanceWalletIcon
                className="w-32 h-32 text-accent mx-auto relative z-10 drop-shadow-2xl"
                style={{ fontSize: '8rem' }}
              />
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-accent-700 via-accent to-accent-600 bg-clip-text text-transparent leading-tight">
              The Future of Payments
              <br />
              <span className="text-4xl md:text-6xl">Powered by Blockchain</span>
            </h1>

            <p className="text-xl md:text-2xl text-text-muted mb-12 max-w-3xl mx-auto leading-relaxed">
              Experience lightning-fast, secure, and low-cost transactions with Nivix Pay.
              Send money globally using cryptocurrency or local currency.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <WalletMultiButton className="!bg-gradient-to-r !from-accent-600 !to-accent-700 hover:!from-accent-700 hover:!to-accent-800 !rounded-xl !px-10 !py-4 !font-bold !text-lg !shadow-xl hover:!shadow-2xl !transition-all !duration-300" />
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate('/automated-transfer')}
                className="flex items-center gap-2 !border-2 !border-accent !text-accent hover:!bg-accent hover:!text-white !px-10 !py-4 !text-lg"
              >
                Learn More
                <ArrowForwardIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-20">
            <Card className="text-center bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <ShowChartIcon className="w-12 h-12 text-accent mx-auto mb-3" />
              <div className="text-4xl font-bold text-text mb-2">$0.00001</div>
              <div className="text-sm text-text-muted font-medium">Transaction Fee</div>
            </Card>

            <Card className="text-center bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <TimelineIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <div className="text-4xl font-bold text-text mb-2">&lt;1s</div>
              <div className="text-sm text-text-muted font-medium">Transaction Speed</div>
            </Card>

            <Card className="text-center bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <PublicIcon className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <div className="text-4xl font-bold text-text mb-2">6+</div>
              <div className="text-sm text-text-muted font-medium">Currencies</div>
            </Card>

            <Card className="text-center bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <SecurityIcon className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <div className="text-4xl font-bold text-text mb-2">100%</div>
              <div className="text-sm text-text-muted font-medium">Secure</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto">
              Everything you need for modern digital payments in one platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/90 backdrop-blur-sm border-transparent hover:border-accent/30">
              <div className="relative">
                <div className="absolute -top-6 left-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow">
                    <TrendingUpIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="pt-12">
                  <h3 className="text-2xl font-bold text-text mb-3">Lightning Fast Transactions</h3>
                  <p className="text-text-muted leading-relaxed mb-4">
                    Execute transactions in under 1 second with Solana's high-performance blockchain.
                    No more waiting hours or days for confirmations.
                  </p>
                  <ul className="space-y-2 text-sm text-text-muted">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      65,000+ transactions per second
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      400ms block time
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-green-600" />
                      Instant settlement
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Feature 2 */}
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/90 backdrop-blur-sm border-transparent hover:border-accent/30">
              <div className="relative">
                <div className="absolute -top-6 left-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow">
                    <SwapHorizIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="pt-12">
                  <h3 className="text-2xl font-bold text-text mb-3">Multi-Currency Support</h3>
                  <p className="text-text-muted leading-relaxed mb-4">
                    Seamlessly swap between cryptocurrencies and fiat currencies with real-time exchange rates and liquidity pools.
                  </p>
                  <ul className="space-y-2 text-sm text-text-muted">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                      SOL, USDC, USD, INR, EUR, GBP
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                      Real-time exchange rates
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-blue-600" />
                      Deep liquidity pools
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Feature 3 */}
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:scale-105 bg-white/90 backdrop-blur-sm border-transparent hover:border-accent/30">
              <div className="relative">
                <div className="absolute -top-6 left-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-2xl transition-shadow">
                    <QrCodeIcon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="pt-12">
                  <h3 className="text-2xl font-bold text-text mb-3">Secure & Private KYC</h3>
                  <p className="text-text-muted leading-relaxed mb-4">
                    Your identity is verified and stored on Hyperledger Fabric, ensuring complete privacy and regulatory compliance.
                  </p>
                  <ul className="space-y-2 text-sm text-text-muted">
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-purple-600" />
                      Private blockchain storage
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-purple-600" />
                      Enterprise-grade encryption
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4 text-purple-600" />
                      Regulatory compliant
                    </li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">
              How It Works
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto">
              Get started in just 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card className="text-center bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                1
              </div>
              <AccountBalanceWalletIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text mb-3">Connect Wallet</h3>
              <p className="text-text-muted leading-relaxed">
                Link your Solana wallet securely to the platform using Phantom, Solflare, or any compatible wallet
              </p>
            </Card>

            <Card className="text-center bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                2
              </div>
              <VerifiedUserIcon className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text mb-3">Verify KYC</h3>
              <p className="text-text-muted leading-relaxed">
                Complete one-time KYC verification. Your data is stored privately on Hyperledger Fabric blockchain
              </p>
            </Card>

            <Card className="text-center bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                3
              </div>
              <PaymentIcon className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text mb-3">Choose Service</h3>
              <p className="text-text-muted leading-relaxed">
                Select from transfers, swaps, or liquidity pools. Set amount and recipient details
              </p>
            </Card>

            <Card className="text-center bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-500 to-orange-700 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
                4
              </div>
              <AutorenewIcon className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-text mb-3">Instant Confirmation</h3>
              <p className="text-text-muted leading-relaxed">
                Transaction completes instantly with blockchain confirmation and receipt
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-white/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-text mb-4">
              Why Choose Nivix Pay?
            </h2>
            <p className="text-xl text-text-muted max-w-3xl mx-auto">
              Built for the modern world with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <SecurityIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text mb-2">Bank-Grade Security</h3>
                  <p className="text-text-muted leading-relaxed">
                    Your transactions are protected by enterprise-level encryption, multi-signature verification,
                    and the immutability of blockchain technology. Every transaction is transparent and traceable.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <SpeedIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text mb-2">Lightning Fast</h3>
                  <p className="text-text-muted leading-relaxed">
                    Transactions complete in under 1 second, powered by Solana's high-performance blockchain.
                    Process up to 65,000 transactions per second with 400ms block times.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <VerifiedUserIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text mb-2">Privacy-First KYC</h3>
                  <p className="text-text-muted leading-relaxed">
                    Your identity verification is stored securely on Hyperledger Fabric private blockchain,
                    ensuring complete privacy while maintaining regulatory compliance.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center flex-shrink-0 shadow-md">
                  <LocalAtmIcon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-text mb-2">Minimal Fees</h3>
                  <p className="text-text-muted leading-relaxed">
                    Pay only $0.00001 average transaction fee - thousands of times cheaper than traditional
                    payment systems. No hidden charges or monthly fees.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="bg-gradient-to-r from-accent to-accent-700 text-white border-0 shadow-2xl">
            <div className="text-center py-12">
              <SendIcon className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Get Started?</h2>
              <p className="text-white/90 mb-10 max-w-2xl mx-auto text-xl leading-relaxed">
                Join thousands of users already experiencing the future of payments.
                Connect your wallet and start transacting in seconds.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <WalletMultiButton className="!bg-white !text-accent hover:!bg-gray-100 !rounded-xl !px-10 !py-4 !font-bold !text-lg !shadow-xl hover:!shadow-2xl !transition-all !duration-300" />
                <Button
                  onClick={() => navigate('/automated-transfer')}
                  className="!bg-white/20 !text-white hover:!bg-white/30 !border-2 !border-white/50 !rounded-xl !px-10 !py-4 !font-bold !text-lg"
                >
                  Explore Features
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-12 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-text-muted">
            Powered by <span className="font-semibold text-accent">Solana</span> & <span className="font-semibold text-accent">Hyperledger Fabric</span>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
