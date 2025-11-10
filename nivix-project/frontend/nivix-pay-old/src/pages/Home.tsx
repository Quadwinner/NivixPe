import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);

  // Show floating CTA after scrolling
  useEffect(() => {
    const handleScroll = () => {
      setShowFloatingCTA(window.scrollY > 800);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="bg-white overflow-hidden">
      {/* Floating CTA Button */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: showFloatingCTA ? 1 : 0, y: showFloatingCTA ? 0 : 100 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-8 right-8 z-50"
      >
        <Button
          size="lg"
          onClick={() => document.getElementById('hero-cta')?.scrollIntoView({ behavior: 'smooth' })}
          className="!bg-gradient-to-r from-accent to-accent-800 hover:shadow-glow !rounded-full !px-8 !py-4 !font-semibold !text-white shadow-premium transform hover:scale-105 transition-all duration-200"
        >
          Get Started →
        </Button>
      </motion.div>

      {/* Hero Section - Modern Fintech Design */}
      <section className="relative py-28 lg:py-36 bg-gradient-to-b from-[#EEF2FF] via-[#F9FAFB] to-[#FFFFFF] overflow-hidden">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, -50, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 right-20 w-[500px] h-[500px] bg-blue-400/30 rounded-full blur-3xl opacity-30"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, 80, 0],
              scale: [1, 1.15, 1],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -bottom-32 -left-32 w-[600px] h-[600px] bg-accent/20 rounded-full blur-3xl opacity-20"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          {/* Two Column Layout */}
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Left Column - Text Content (60%) */}
            <motion.div
              initial="initial"
              animate="animate"
              variants={staggerContainer}
              className="lg:col-span-3"
            >
              {/* Brand Tagline */}
              <motion.div variants={fadeInUp} className="mb-6">
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                  Built on Solana • Real-time Global Transfers
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                variants={fadeInUp}
                className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1]"
              >
                Send Money Anywhere,{' '}
                <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Pay Almost Nothing
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={fadeInUp}
                className="text-lg lg:text-xl text-gray-600 max-w-xl leading-relaxed mb-8"
              >
                Experience the power of blockchain transfers with the simplicity of your local bank.
                Send SOL, USDC, or convert to INR, USD, EUR — instantly and securely.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                variants={fadeInUp}
                id="hero-cta"
                className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6"
              >
                <button className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-base hover:bg-blue-700 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg">
                  Get Started
                </button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/automated-transfer')}
                  className="!border-2 !border-blue-600 !text-blue-600 hover:!bg-blue-50 !px-8 !py-4 !text-base !font-semibold !rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105"
                >
                  See How It Works →
                </Button>
              </motion.div>

              {/* Trust Signals */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-8"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔒</span>
                  <span className="font-medium">Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚡</span>
                  <span className="font-medium">Instant</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🌍</span>
                  <span className="font-medium">Multi-Currency Support</span>
                </div>
              </motion.div>

              {/* Quick Stats - Inline/Compact */}
              <motion.div
                variants={fadeInUp}
                className="border-t border-gray-200 pt-6"
              >
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      $<CountUp end={0.00001} decimals={5} duration={2} />
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Avg. Fee
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      &lt;<CountUp end={1} duration={2} /> sec
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Transfer Time
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      <CountUp end={24} duration={2} />/7
                    </div>
                    <div className="text-xs text-gray-600 uppercase tracking-wide">
                      Always Online
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Right Column - Hero Illustration (40%) */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-2 hidden lg:block"
            >
              <div className="relative">
                {/* Main Illustration Container */}
                <motion.div
                  animate={{
                    y: [0, -20, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="relative"
                >
                  {/* 3D Card Visual */}
                  <div className="relative w-full aspect-square max-w-md mx-auto">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-3xl blur-2xl" />

                    {/* Main Card */}
                    <motion.div
                      whileHover={{ scale: 1.05, rotateY: 5 }}
                      className="relative bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl shadow-2xl p-8 transform perspective-1000"
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Card Content */}
                      <div className="text-white space-y-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-sm opacity-80 mb-1">From</div>
                            <div className="font-bold text-xl">🇺🇸 USD</div>
                          </div>
                          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </div>
                        </div>

                        <div className="text-center py-4">
                          <div className="text-5xl font-bold mb-2">$1,000</div>
                          <div className="text-sm opacity-80">Instant Transfer</div>
                        </div>

                        <div className="flex justify-between items-end">
                          <div>
                            <div className="text-sm opacity-80 mb-1">To</div>
                            <div className="font-bold text-xl">🇮🇳 INR</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs opacity-80">Fee</div>
                            <div className="font-bold text-green-300">$0.00001</div>
                          </div>
                        </div>
                      </div>

                      {/* Decorative Elements */}
                      <div className="absolute -top-4 -right-4 w-24 h-24 bg-purple-500/30 rounded-full blur-xl" />
                      <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-blue-400/30 rounded-full blur-xl" />
                    </motion.div>

                    {/* Floating Currency Icons */}
                    <motion.div
                      animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute -top-8 -left-8 bg-white rounded-2xl shadow-xl p-4 text-3xl"
                    >
                      💸
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                      transition={{ duration: 3.5, repeat: Infinity }}
                      className="absolute -bottom-4 -right-8 bg-white rounded-2xl shadow-xl p-4 text-3xl"
                    >
                      ⚡
                    </motion.div>

                    <motion.div
                      animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="absolute top-1/4 -right-12 bg-white rounded-2xl shadow-xl p-4 text-3xl"
                    >
                      🌍
                    </motion.div>
                  </div>
                </motion.div>

                {/* Success Indicator */}
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Transfer Complete!</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Exchange Rate Ticker */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-accent-50 to-blue-50 py-3 border-y border-accent/10"
      >
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-8 overflow-x-auto scrollbar-hide">
            <span className="text-sm font-semibold text-accent whitespace-nowrap">Live Rates:</span>
            {[
              { pair: 'SOL/USD', rate: '142.50', change: '+2.4%' },
              { pair: 'USDC/INR', rate: '83.25', change: '+0.1%' },
              { pair: 'SOL/EUR', rate: '131.20', change: '+1.8%' },
              { pair: 'USDC/USD', rate: '1.00', change: '0.0%' }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-sm whitespace-nowrap">
                <span className="font-medium text-[#111827]">{item.pair}</span>
                <span className="text-[#6B7280]">{item.rate}</span>
                <span className="text-green-600 text-xs">{item.change}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Why Section - Two Column Layout */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative">
        {/* Background Illustration */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 border-4 border-accent rounded-full" />
          <div className="absolute bottom-1/3 right-1/4 w-24 h-24 border-4 border-accent rounded-full" />
          <div className="absolute top-1/2 right-1/3 w-16 h-16 border-4 border-accent rounded-full" />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">
              Why We Built This
            </h2>
            <p className="text-xl text-[#6B7280] mb-12 max-w-3xl">
              Traditional money transfers are broken. We're fixing them with blockchain technology.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: '🏦',
                title: 'Traditional Banks',
                description: 'International transfers take 3-5 business days and cost $15-45 per transaction. Weekend? Forget about it. You\'re waiting till Monday.',
                badge: '❌ Too slow, too expensive',
                badgeColor: 'text-red-600'
              },
              {
                icon: '💸',
                title: 'Money Transfer Apps',
                description: 'Apps like Wise or Western Union are better, but still charge 2-5% fees. Plus, they don\'t support crypto at all.',
                badge: '⚠️ Limited, still pricey',
                badgeColor: 'text-orange-600'
              },
              {
                icon: '⚡',
                title: 'Nivix Pay',
                description: 'Instant transfers, crypto or fiat. Pay fractions of a cent. No business hours - it\'s blockchain, it never sleeps.',
                badge: '✓ Fast, cheap, always works',
                badgeColor: 'text-green-600',
                highlight: true
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className={`bg-white h-full ${item.highlight ? 'border-2 border-accent ring-2 ring-accent/10' : 'border border-[#E5E7EB]'} shadow-card hover:shadow-premium transition-all duration-200`}>
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className={`text-xl font-semibold mb-3 ${item.highlight ? 'text-accent' : 'text-[#111827]'}`}>
                    {item.title}
                  </h3>
                  <p className="text-[#6B7280] mb-4 text-sm leading-relaxed">
                    {item.description}
                  </p>
                  <div className={`text-xs font-medium ${item.badgeColor}`}>
                    {item.badge}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Who Uses Section - Enhanced with Avatars */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">
              Who Uses Nivix Pay?
            </h2>
            <p className="text-xl text-[#6B7280]">Real people, real needs</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '👨‍💻',
                avatar: '🧑‍💻',
                name: 'Sarah',
                role: 'Freelancers',
                title: 'Freelancers Getting Paid',
                description: 'Sarah is a graphic designer in India working with clients in the US. Instead of losing 5% to PayPal and waiting 3 days, she gets paid in USDC instantly. Then converts to INR directly to her bank account - all in under a minute.',
                savings: 'Saves ~$150 per month in fees',
                microcopy: 'Perfect for remote workers & contractors'
              },
              {
                icon: '🏠',
                avatar: '👨‍👩‍👧',
                name: 'Miguel',
                role: 'Families',
                title: 'Sending Money Home',
                description: 'Miguel works in Spain but sends money to his family in Mexico every month. Traditional remittance services charge him €25-40 per transfer. With Nivix, he pays less than a cent and his family receives it instantly.',
                savings: 'Saves ~€350 per year',
                microcopy: 'Trusted by families worldwide'
              },
              {
                icon: '🛍️',
                avatar: '🏪',
                name: 'Alex',
                role: 'Businesses',
                title: 'E-commerce Merchants',
                description: 'An online store accepts payments globally. Credit card processors take 2.9% + $0.30 per transaction. With Nivix, they accept crypto payments for almost free, and can convert to their local currency whenever they want.',
                savings: 'Saves thousands on fees annually',
                microcopy: 'Scale globally without high fees'
              }
            ].map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
              >
                <Card className="bg-white border border-[#E5E7EB] hover:border-accent shadow-card hover:shadow-premium transition-all duration-200 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-5xl">{useCase.avatar}</div>
                    <div>
                      <div className="text-xs font-semibold text-accent uppercase tracking-wide mb-1">
                        {useCase.role}
                      </div>
                      <h3 className="text-xl font-semibold text-[#111827]">
                        {useCase.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-[#6B7280] mb-3 leading-relaxed text-sm">
                    {useCase.description}
                  </p>
                  <div className="text-sm text-accent font-medium mb-2">
                    {useCase.savings}
                  </div>
                  <div className="text-xs text-[#9CA3AF] italic">
                    {useCase.microcopy}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Horizontal Flow */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">
              How Does It Work?
            </h2>
            <p className="text-xl text-[#6B7280] max-w-3xl mx-auto">
              We're combining Solana's speed with Hyperledger's security for the perfect money transfer experience
            </p>
          </motion.div>

          {/* Horizontal Step Flow */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Connection Lines - Desktop */}
            <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-accent/20 via-accent/50 to-accent/20" style={{ top: '48px' }} />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10">
              {[
                {
                  number: 1,
                  title: 'Connect Wallet',
                  description: 'Use Phantom, Solflare, or any Solana wallet',
                  icon: '🔗'
                },
                {
                  number: 2,
                  title: 'Verify Once',
                  description: 'Quick KYC verification (takes 2 minutes)',
                  icon: '✓'
                },
                {
                  number: 3,
                  title: 'Send Money',
                  description: 'Choose crypto or fiat, enter amount',
                  icon: '💸'
                },
                {
                  number: 4,
                  title: 'Done!',
                  description: 'Money arrives in seconds, not days',
                  icon: '🎉'
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.15 }}
                  className="flex flex-col items-center text-center relative"
                >
                  {/* Step Circle with Glow */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative mb-4"
                  >
                    <div className="absolute inset-0 bg-accent/20 rounded-full blur-xl" />
                    <div className="relative w-24 h-24 bg-gradient-to-br from-accent to-accent-800 text-white rounded-full flex items-center justify-center text-3xl font-bold shadow-glow">
                      {step.icon}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border-2 border-accent rounded-full flex items-center justify-center text-sm font-bold text-accent shadow-md">
                      {step.number}
                    </div>
                  </motion.div>

                  <h3 className="text-lg font-semibold text-[#111827] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#6B7280]">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Technology Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-8 mt-16"
          >
            <Card className="bg-white border border-[#E5E7EB] shadow-card hover:shadow-premium transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔗</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#111827] mb-3">
                    Solana Blockchain
                  </h3>
                  <p className="text-[#6B7280] leading-relaxed mb-3 text-sm">
                    Solana can process over 65,000 transactions per second. That's faster than Visa.
                    And it costs almost nothing - literally fractions of a penny per transaction.
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-accent font-medium hover:underline cursor-pointer">
                    Learn more about Solana →
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-white border border-[#E5E7EB] shadow-card hover:shadow-premium transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="text-4xl">🔐</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#111827] mb-3">
                    Hyperledger Fabric KYC
                  </h3>
                  <p className="text-[#6B7280] leading-relaxed mb-3 text-sm">
                    Your identity is verified once and stored on Hyperledger Fabric - a private blockchain used by IBM,
                    Walmart, and major banks. Your data stays private and secure.
                  </p>
                  <div className="inline-flex items-center gap-2 text-sm text-accent font-medium">
                    Your data stays private
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Pricing Table with Glassmorphism */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">
              Let's Be Honest About Fees
            </h2>
            <p className="text-xl text-[#6B7280]">Sending $1,000 internationally</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-premium"
          >
            <div className="overflow-x-auto">
              <table className="w-full bg-white">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-[#111827]">Service</th>
                    <th className="px-6 py-4 text-left font-semibold text-[#111827]">Fee</th>
                    <th className="px-6 py-4 text-left font-semibold text-[#111827]">Time</th>
                    <th className="px-6 py-4 text-left font-semibold text-[#111827]">Exchange Rate Markup</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {[
                    { service: 'Bank Wire Transfer', fee: '$25-45', time: '3-5 business days', markup: '~3-5%' },
                    { service: 'Western Union', fee: '$15-30', time: 'Minutes to days', markup: '~2-4%' },
                    { service: 'Wise (formerly TransferWise)', fee: '$4-8', time: '1-2 business days', markup: 'Real rate (best traditional option)' },
                    { service: 'PayPal', fee: '$5-15', time: 'Instant', markup: '~4-5%' }
                  ].map((row, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                      className="transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-[#6B7280]">{row.service}</td>
                      <td className="px-6 py-4 text-[#111827]">{row.fee}</td>
                      <td className="px-6 py-4 text-[#111827]">{row.time}</td>
                      <td className="px-6 py-4 text-[#111827]">{row.markup}</td>
                    </motion.tr>
                  ))}

                  {/* Nivix Pay Row - Highlighted */}
                  <motion.tr
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-accent-50 to-blue-50 relative"
                  >
                    <td className="px-6 py-4 font-semibold text-accent relative">
                      <div className="flex items-center gap-3">
                        Nivix Pay
                        <span className="px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full shadow-sm">
                          Best Value
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-accent">$0.00001</td>
                    <td className="px-6 py-4 font-semibold text-accent">&lt;1 second</td>
                    <td className="px-6 py-4 font-semibold text-accent">Real market rate</td>
                  </motion.tr>
                </tbody>
              </table>
            </div>
          </motion.div>

          <p className="text-sm text-[#9CA3AF] mt-6 text-center">
            * Fees and times vary by country and payment method. Bank exchange rates often hide 3-5% markup in the rate.
          </p>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-4">
              Loved by Users Worldwide
            </h2>
            <p className="text-xl text-[#6B7280]">What people say about Nivix Pay</p>
          </motion.div>

          {/* Testimonial Cards with Carousel Support */}
          <div className="grid md:grid-cols-3 gap-6 overflow-x-auto md:overflow-visible pb-4 md:pb-0">
            {[
              {
                quote: "I was skeptical at first, but after my first transfer, I was blown away. My client in the US paid me in USDC and I had INR in my bank account in less than 2 minutes. No more waiting for PayPal to 'process' for 3 days.",
                name: 'Priya K.',
                role: 'Freelance Developer',
                location: 'Mumbai',
                avatar: '👩‍💻',
                rating: 5
              },
              {
                quote: "Finally, a way to send money to my family that doesn't eat up half of it in fees. I used to lose $30-40 per transfer. Now it's basically free. This is what fintech should be.",
                name: 'Carlos M.',
                role: 'Construction Worker',
                location: 'Barcelona',
                avatar: '👨‍🔧',
                rating: 5
              },
              {
                quote: "We integrated Nivix Pay for our e-commerce store and cut our payment processing costs by 70%. Plus, our international customers love that they can pay with crypto. Win-win.",
                name: 'Sarah T.',
                role: 'E-commerce Owner',
                location: 'London',
                avatar: '👩‍💼',
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="min-w-[300px] md:min-w-0"
              >
                <Card className="bg-white border border-[#E5E7EB] shadow-card hover:shadow-premium transition-all duration-200 h-full">
                  {/* Star Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-[#6B7280] mb-6 italic leading-relaxed text-sm">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-[#E5E7EB]">
                    <div className="text-3xl">{testimonial.avatar}</div>
                    <div>
                      <div className="font-semibold text-[#111827]">{testimonial.name}</div>
                      <div className="text-sm text-[#6B7280]">
                        {testimonial.role}, {testimonial.location}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-[#111827] mb-12">
              Questions People Actually Ask
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                question: 'Do I need to know about cryptocurrency?',
                answer: 'Nope. You can send and receive money in your local currency (USD, INR, EUR, etc.) just like any other app. The blockchain stuff happens in the background. If you want to use crypto, that\'s cool too - but it\'s not required.'
              },
              {
                question: 'Is this legal?',
                answer: 'Yes! We\'re fully compliant with financial regulations. That\'s why we do KYC verification - it\'s required by law for any financial service. We work with licensed payment processors for fiat currency conversions.'
              },
              {
                question: 'What if something goes wrong?',
                answer: 'Every transaction is recorded on the blockchain, so there\'s a permanent record. If there\'s an issue, we can trace exactly what happened. Plus, we have customer support - real humans who actually respond.'
              },
              {
                question: 'How do you make money if fees are so low?',
                answer: 'Good question! We make a tiny margin on currency conversions (way less than banks). For crypto-to-crypto transfers, we literally don\'t make money - the blockchain fee is $0.00001 and that goes to validators, not us. Our business model is volume, not gouging each transaction.'
              },
              {
                question: 'Can I try it without risking a lot of money?',
                answer: 'Absolutely. Start with a small test transaction - send yourself $10 to see how it works. There\'s no minimum, and with fees this low, even testing costs you almost nothing.'
              },
              {
                question: 'Which countries do you support?',
                answer: 'We support 150+ countries and multiple currencies including USD, EUR, GBP, INR, and more. If you can access Solana, you can use Nivix Pay. Check our supported countries list for details.'
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white border border-[#E5E7EB] hover:border-accent shadow-card hover:shadow-premium transition-all duration-200">
                  <h3 className="text-lg font-semibold text-[#111827] mb-3">
                    {faq.question}
                  </h3>
                  <p className="text-[#6B7280] leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-24 bg-gradient-to-r from-accent to-accent-800 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }} />
        </div>

        <div className="max-w-[1200px] mx-auto px-6 lg:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Stop Overpaying?
            </h2>
            <p className="text-xl text-white/90 mb-10 leading-relaxed max-w-3xl mx-auto">
              Connect your wallet and try your first transaction. If it doesn't work as advertised,
              we'll be shocked (but also sorry and we'll fix it).
            </p>
            <WalletMultiButton className="!bg-white !text-accent hover:!bg-gray-100 !rounded-lg !px-8 !py-4 !font-semibold !text-lg shadow-premium transform hover:scale-105 transition-all duration-200" />
            <p className="text-sm text-white/70 mt-6">
              No signup forms, no credit card required, no monthly fees. Just connect and go.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Premium Dark Footer */}
      <footer className="bg-[#0F172A] text-white py-12">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-800 rounded-lg flex items-center justify-center font-bold text-xl">
                  N
                </div>
                <span className="text-2xl font-bold">Nivix Pay</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                The fastest, cheapest way to send money globally. Built on Solana blockchain with
                enterprise-grade security.
              </p>
              {/* Social Links */}
              <div className="flex items-center gap-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API Docs</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Integrations</a></li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-400 text-sm text-center md:text-left">
                Built on <span className="text-white font-medium">Solana</span> blockchain ·
                KYC powered by <span className="text-white font-medium">Hyperledger Fabric</span>
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-white transition-colors">Legal</a>
              </div>
            </div>
            <p className="text-gray-500 text-sm text-center mt-4">
              © 2025 Nivix Pay. Licensed and compliant. Not financial advice, just really cheap money transfers.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
