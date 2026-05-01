import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LaserHero } from '../components/ui/laser-focus-crypto-hero-section';
import { GlowCard } from '../components/ui/spotlight-card';
import CookieConsent from '../components/CookieConsent';
import WaitlistModal from '../components/WaitlistModal';

const Home: React.FC = () => {
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  const openWaitlist = () => setWaitlistOpen(true);

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="overflow-hidden min-h-screen bg-white">
      <WaitlistModal isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} />
      {/* 
        NEW LASER FOCUS HERO SECTION
        This replaces the old gradient hero while matching the NivixPe colour system perfectly
      */}
      <LaserHero onMakeTransfer={openWaitlist} onSeeHowItWorks={scrollToHowItWorks} onOpenWaitlist={openWaitlist} />

      {/* Beta Launch Banner — teal brand strip */}
      <div className="relative z-20 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-navy-700), var(--color-navy-600), var(--color-teal-600))' }}>
        <div className="max-w-7xl mx-auto px-6 py-6 relative">
          <div className="flex items-center justify-center gap-6 flex-wrap">
            {/* Beta Badge */}
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full border-2 shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.35)' }}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white shadow-lg"></span>
              </span>
              <span className="font-display text-sm font-black text-white tracking-wider uppercase">
                Beta Launch
              </span>
            </div>
            
            {/* Main Message */}
            <div className="text-center">
              <p className="text-white font-display text-lg md:text-xl font-bold">
                India-UAE Trade Corridor{' '}
                <span className="font-black" style={{ color: 'var(--color-ink-900)', backgroundColor: 'rgba(255,255,255,0.9)', padding: '2px 8px', borderRadius: '4px' }}>Beta</span>
                {' '}— Q1 2026
              </p>
              <p className="font-body text-sm mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Be among the <span className="font-bold text-white">first</span> to eliminate SWIFT delays. Priority access available now!
              </p>
            </div>
            
            {/* CTA Button */}
            <button
              onClick={openWaitlist}
              className="px-6 py-3 font-display font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
              style={{ backgroundColor: 'white', color: 'var(--color-teal-600)' }}
            >
              Join Waitlist
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Beta Badges */}
      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shimmer {
          0% { background-position: -250% 0, 0 0; }
          100% { background-position: 250% 0, 0 0; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>

      {/* Stats / Ticker Section — white background */}
      <div className="relative z-20 bg-white border-b" style={{ borderColor: '#E5E8EF' }}>
        <div className="max-w-7xl mx-auto px-6 py-8 relative">
          <div className="flex items-center justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{ backgroundColor: 'rgba(12,112,117,0.06)', borderColor: 'rgba(12,112,117,0.2)' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--color-teal-500)' }}></span>
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--color-teal-500)' }}></span>
              </span>
              <span className="font-display text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-teal-600)' }}>Live Network Stats</span>
            </div>
          </div>
            
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="h-full"
            >
              <GlowCard 
                glowColor="teal" 
                customSize={true} 
                className="text-center h-full transition-all duration-300 hover:shadow-md !border-2 !border-[var(--color-teal-500)]"
                style={{ backgroundColor: '#F8F9FC' }}
              >
                <div className="text-xs font-display uppercase tracking-widest mb-2" style={{ color: 'var(--color-ink-500)' }}>Settlement Time</div>
                <div className="font-mono text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--color-teal-600)' }}>&lt; 10s</div>
                <div className="text-xs" style={{ color: 'var(--color-ink-400)' }}>enterprise infrastructure</div>
              </GlowCard>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="h-full"
            >
              <GlowCard 
                glowColor="teal" 
                customSize={true} 
                className="text-center h-full transition-all duration-300 hover:shadow-md !border-2 !border-[var(--color-teal-500)]"
                style={{ backgroundColor: '#F8F9FC' }}
              >
                <div className="text-xs font-display uppercase tracking-widest mb-2" style={{ color: 'var(--color-ink-500)' }}>Transaction Fees</div>
                <div className="font-mono text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--color-teal-600)' }}>0%</div>
                <div className="text-xs" style={{ color: 'var(--color-ink-400)' }}>vs SWIFT avg $25</div>
              </GlowCard>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="col-span-2 md:col-span-1 h-full"
            >
              <GlowCard 
                glowColor="navy" 
                customSize={true} 
                className="text-center h-full transition-all duration-300 hover:shadow-md !border-2 !border-[var(--color-navy-500)]"
                style={{ backgroundColor: '#F8F9FC' }}
              >
                <div className="text-xs font-display uppercase tracking-widest mb-2" style={{ color: 'var(--color-ink-500)' }}>Beta Launch</div>
                <div className="font-mono text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--color-navy-600)' }}>Q1 2026</div>
                <div className="text-xs" style={{ color: 'var(--color-ink-400)' }}>India-UAE corridor</div>
              </GlowCard>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Problem / Solution Section — dark theme */}
      <section id="how-it-works" className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-navy-800), var(--color-navy-700))' }}>
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(12,112,117,0.15), transparent 70%)' }}></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-24"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border" style={{ backgroundColor: 'rgba(229,53,53,0.15)', borderColor: 'rgba(229,53,53,0.3)', color: '#FF6B6B' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
              The Problem
            </div>
            <h2 className="text-[36px] md:text-[52px] font-display font-bold mb-5 tracking-[-0.03em] leading-[1.1]" style={{ color: 'white' }}>
              Traditional payments are{' '}
              <span className="font-black" style={{ color: '#FF6B6B' }}>broken</span>.
            </h2>
            <p className="text-lg font-body mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
              We combined the security of banks with the speed of modern payment infrastructure to create the perfect global transfer system.
            </p>
            {/* Beta Highlight */}
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 shadow-[0_0_20px_rgba(20,184,166,0.3)] backdrop-blur-md" style={{ backgroundColor: 'rgba(20,184,166,0.15)', borderColor: 'rgba(20,184,166,0.5)' }}>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#5EEAD4' }}></span>
                <span className="relative inline-flex rounded-full h-3 w-3 shadow-[0_0_10px_rgba(94,234,212,0.8)]" style={{ backgroundColor: '#5EEAD4' }}></span>
              </span>
              <span className="font-display text-base font-bold tracking-wider text-white">
                Beta launching Q1 2026 — <span className="text-teal-300 font-black">India-UAE corridor</span>
              </span>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                  </svg>
                ),
                title: 'Traditional Banks',
                description: 'Takes 3-5 business days. Not open on weekends. Averages $25-45 in hidden fees and markup.',
                badge: 'Slow & Expensive',
                type: 'negative',
                stats: ['3-5 days', '$25-45 fees', 'Business hours only']
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 8.25h3m-3 3h3m-3 3h3" />
                  </svg>
                ),
                title: 'Fintech Apps',
                description: 'Faster, but still charge 2-5% on conversion rates. Limited crypto support and custodial risks.',
                badge: 'Better, but limited',
                type: 'warning',
                stats: ['1-2 days', '2-5% fees', 'Limited crypto']
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                ),
                title: 'NivixPe',
                description: 'Instant settlement. Costs fractions of a penny. 24/7 blockchain availability with full fiat support.',
                badge: 'Fast & Transparent',
                type: 'positive',
                stats: ['< 10 seconds', 'Zero fees vs SWIFT', '24/7 available', 'Beta: Q1 2026']
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative group"
              >
                <GlowCard 
                  glowColor={item.type === 'positive' ? 'teal' : 'ink'} 
                  customSize={true} 
                  className={`h-full transition-all duration-300 hover:shadow-lg !p-7 !border-2 ${
                    item.type === 'positive' ? '!border-[var(--color-teal-500)]' : item.type === 'warning' ? '!border-orange-400/60' : '!border-red-400/60'
                  }`}
                  style={item.type === 'positive' ? {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 0 30px rgba(12,112,117,0.2)'
                  } : {
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                    item.type === 'positive'
                      ? ''
                      : item.type === 'warning'
                      ? ''
                      : ''
                  }`} style={{
                    backgroundColor: item.type === 'positive' ? 'rgba(12,112,117,0.2)' : 'rgba(255,255,255,0.1)',
                    color: item.type === 'positive' ? 'var(--color-teal-400)' : 'rgba(255,255,255,0.7)'
                  }}>
                    {item.icon}
                  </div>
                  
                  {/* Badge */}
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-display font-bold uppercase tracking-wider ${
                      item.type === 'positive' ? 'text-teal-300' :
                      item.type === 'warning' ? 'text-amber-300' :
                      'text-red-300'
                    }`} style={{
                      backgroundColor: item.type === 'positive' ? 'rgba(12,112,117,0.2)' : item.type === 'warning' ? 'rgba(217,119,6,0.2)' : 'rgba(220,38,38,0.2)',
                      border: `1px solid ${item.type === 'positive' ? 'rgba(12,112,117,0.4)' : item.type === 'warning' ? 'rgba(217,119,6,0.4)' : 'rgba(220,38,38,0.4)'}`
                    }}>
                      {item.badge}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-display font-bold mb-3" style={{ color: 'white' }}>
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="font-body text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.7)' }}>
                    {item.description}
                  </p>

                  {/* Stats */}
                  <div className="space-y-2 mb-6">
                    {item.stats.map((stat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          item.type === 'positive' ? 'bg-teal-400' :
                          item.type === 'warning' ? 'bg-orange-400' :
                          'bg-red-400'
                        }`}></div>
                        <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.8)' }}>{stat}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA for NivixPe */}
                  {item.type === 'positive' && (
                    <>
                      <button
                        onClick={openWaitlist}
                        className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-teal-500 to-teal-400 text-white font-display font-bold rounded-xl hover:shadow-[0_0_30px_rgba(20,184,166,0.4)] transition-all duration-300 flex items-center justify-center gap-2 group"
                      >
                        Join Beta Waitlist
                        <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </button>
                      {/* Beta Exclusive Badge */}
                      <div className="mt-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 text-sm font-display font-bold shadow-lg" style={{ backgroundColor: 'var(--color-navy-600)', borderColor: 'var(--color-navy-500)', color: 'white' }}>
                          <svg className="w-4 h-4 text-teal-300" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Beta Exclusive — Priority Support
                        </span>
                      </div>
                    </>
                  )}
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience / Use Cases — white */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(12,112,117,0.04), transparent 70%)' }}></div>
        
        {/* Animated background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-blue-500/10 via-teal-500/10 to-transparent rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-purple-500/10 via-teal-500/10 to-transparent rounded-full blur-[120px]"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-teal-400/30 backdrop-blur-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400"></span>
                </span>
                <span className="font-display text-xs font-bold text-teal-300 tracking-wider uppercase">Beta Q1 2026</span>
              </div>
              
              <h2 className="text-[36px] md:text-[50px] font-display font-bold mb-6 tracking-[-0.03em] leading-[1.05]" style={{ color: 'var(--color-ink-900)' }}>
                Designed for global{' '}
                <span className="font-black" style={{ color: 'var(--color-teal-600)' }}>citizens</span>{' '}
                and{' '}
                <span className="font-black" style={{ color: 'var(--color-navy-600)' }}>businesses</span>
              </h2>
              
              <div className="space-y-8">
                {[
                  {
                    title: 'Freelancers & Remote Workers',
                    desc: 'Get paid globally in seconds, not days. Receive in USDC, convert instantly, and keep more of what you earn.',
                    icon: (
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    ),
                    borderColor: 'rgba(10,65,116,0.3)'
                  },
                  {
                    title: 'Cross-Border Families',
                    desc: 'Send money home instantly, with near-zero fees. No intermediaries. No hidden costs. Just direct transfers.',
                    icon: (
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253M3 12c0 .778.099 1.533.284 2.253" />
                      </svg>
                    ),
                    borderColor: 'rgba(12,112,117,0.3)'
                  },
                  {
                    title: 'Global Businesses',
                    desc: 'Run global payroll and treasury in real time. Pay anyone, anywhere, with precision and full control.',
                    icon: (
                      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                      </svg>
                    ),
                    borderColor: 'rgba(10,65,116,0.3)'
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    className="group relative"
                  >
                    <GlowCard 
                      glowColor={i === 1 ? 'teal' : 'navy'}
                      customSize={true}
                      className={`flex gap-4 !p-5 rounded-xl transition-all duration-300 hover:shadow-md group !border-2 ${
                        i === 1 ? '!border-[var(--color-teal-500)]' : '!border-[var(--color-navy-500)]'
                      }`}
                      style={{ backgroundColor: 'white' }}
                    >
                      <div className="w-12 h-12 shrink-0 rounded-xl flex items-center justify-center shadow-sm border group-hover:scale-110 transition-transform duration-300" style={{ backgroundColor: 'rgba(12,112,117,0.06)', border: '1px solid rgba(12,112,117,0.15)', color: 'var(--color-teal-600)' }}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-display font-bold mb-2 leading-tight group-hover:text-teal-600 transition-colors" style={{ color: 'var(--color-ink-900)' }}>{item.title}</h4>
                        <p className="font-body text-sm leading-relaxed mb-3" style={{ color: 'var(--color-ink-500)' }}>{item.desc}</p>
                        <button
                          onClick={openWaitlist}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors group/btn"
                          style={{ color: 'var(--color-teal-600)' }}
                        >
                          Join Beta Waitlist
                          <svg className="w-4 h-4 transform group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </div>
                    </GlowCard>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* Right: Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative lg:pl-10"
            >
              {/* Glow effects */}
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-teal-400/20 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-blue-400/10 rounded-full blur-[120px]"></div>
              
              <div className="relative rounded-3xl border-2 shadow-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0A1628, #0D2040)', borderColor: 'rgba(12,112,117,0.35)' }}>
                {/* Header */}
                <div className="border-b border-white/10 bg-gradient-to-r from-teal-500/10 to-transparent px-8 py-6 flex items-center justify-between">
                  <div>
                    <div className="font-display font-bold text-white text-lg mb-1">Recent Activity</div>
                    <div className="text-xs text-gray-300">Real-time payment activity</div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/70"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/70"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/70"></div>
                  </div>
                </div>
                
                {/* Transactions */}
                <div className="p-8 space-y-6">
                  {[
                    { name: 'Upwork Payment', type: 'Received', amount: '+ $1,250.00', time: '2 mins ago', hash: '8xLm...Kk9v', color: 'teal' },
                    { name: 'Mom in Mexico', type: 'Sent', amount: '- $500.00', time: '1 hr ago', hash: '3mPz...B7Rq', color: 'blue' },
                    { name: 'Server Hosting', type: 'Sent', amount: '- $45.99', time: 'Yesterday', hash: '9vWc...L2Nj', color: 'purple' },
                  ].map((tx, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-teal-400/40 transition-all duration-300 group backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          tx.type === 'Received' 
                            ? 'bg-gradient-to-br from-teal-500/30 to-teal-500/10 text-teal-300 border border-teal-400/40' 
                            : 'bg-gradient-to-br from-white/10 to-white/5 text-gray-300 border border-white/20'
                        }`}>
                          {tx.type === 'Received' ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                          ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                          )}
                        </div>
                        <div>
                          <div className="font-display font-bold text-white text-base mb-1 group-hover:text-teal-300 transition-colors">{tx.name}</div>
                          <div className="font-body text-xs text-gray-400">{tx.time} · Instant</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-mono font-bold text-lg mb-1 ${tx.type === 'Received' ? 'text-teal-400' : 'text-white'}`}>{tx.amount}</div>
                        <span
                          className="font-mono text-[10px] text-teal-400/70 cursor-default"
                        >
                          {tx.hash}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* Footer */}
                <div className="bg-gradient-to-r from-teal-500/10 to-transparent px-8 py-5 flex items-center justify-between border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                    <span className="font-body text-xs text-gray-300">Powered by enterprise-grade infrastructure</span>
                  </div>
                  <div className="font-display text-xs font-bold text-teal-400 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Verified
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Demo Video Section — dark theme */}
      <section className="py-24 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-navy-800), var(--color-navy-700))' }}>
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(12,112,117,0.15), transparent 70%)' }}></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,65,116,0.15), transparent 70%)' }}></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6 border" style={{ backgroundColor: 'rgba(12,112,117,0.15)', borderColor: 'rgba(12,112,117,0.3)', color: 'var(--color-teal-400)' }}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              See It In Action
            </div>
            <h2 className="text-[36px] md:text-[52px] font-display font-bold mb-5 tracking-[-0.03em] leading-[1.1]" style={{ color: 'white' }}>
              Watch NivixPe in{' '}
              <span className="font-black" style={{ color: 'var(--color-teal-400)' }}>Action</span>
            </h2>
            <p className="text-lg font-body mb-8 leading-relaxed max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.7)' }}>
              See how easy it is to send money across borders in under 10 seconds with NivixPe's India-UAE corridor.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Placeholder for video - will be replaced with actual demo video */}
            <div className="relative rounded-3xl overflow-hidden border-2 shadow-2xl" style={{ borderColor: 'rgba(12,112,117,0.35)' }}>
              {/* Placeholder content - replace src with actual video URL when available */}
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(12,112,117,0.2)', border: '2px solid rgba(12,112,117,0.4)' }}>
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-teal-400)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-display font-bold mb-3" style={{ color: 'white' }}>
                    Demo Video Coming Soon
                  </h3>
                  <p className="text-base font-body max-w-md mx-auto" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    We're preparing an exciting demo showcasing the speed and simplicity of NivixPe transfers.
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full border" style={{ backgroundColor: 'rgba(12,112,117,0.15)', borderColor: 'rgba(12,112,117,0.35)' }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--color-teal-500)' }}></span>
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--color-teal-500)' }}></span>
                    </span>
                    <span className="font-display text-sm font-bold tracking-wide" style={{ color: 'var(--color-teal-400)' }}>
                      Beta Q1 2026
                    </span>
                  </div>
                </div>
              </div>
              {/* Uncomment and use VideoPlayer component when video is ready:
              <VideoPlayer src="/path/to/your/demo-video.mp4" />
              */}
            </div>
            
            {/* Decorative glow effects */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-teal-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          </motion.div>
        </div>
      </section>

      {/* Trust & Architecture Section — dark theme */}
      <section className="py-24 overflow-hidden relative" style={{ background: 'linear-gradient(135deg, var(--color-navy-800), var(--color-navy-700))' }}>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,65,116,0.04), transparent 65%)' }}></div>
        
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-teal-500/15 to-blue-500/10 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/10 to-teal-500/15 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)]"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6" style={{ backgroundColor: 'rgba(12,112,117,0.15)', borderColor: 'rgba(12,112,117,0.35)' }}
            >
              <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-display text-xs font-bold tracking-wider uppercase" style={{ color: 'var(--color-teal-400)' }}>Dual-Layer Architecture</span>
            </motion.div>
            
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-[36px] md:text-[50px] font-display font-bold mb-6 tracking-[-0.03em] leading-[1.1]"
              style={{ color: 'white' }}
            >
              Built on <span className="font-black" style={{ color: 'var(--color-teal-400)' }}>Trust</span>.<br/>
              Powered by <span className="font-black" style={{ color: 'var(--color-teal-300)' }}>Speed</span>.
            </motion.h2>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-lg font-body max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              NivixPe bridges fiat banking compliance with enterprise payment infrastructure for global transfers.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Solana Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative group h-full"
            >
              <GlowCard glowColor="teal" customSize={true} className="h-full w-full !p-8 z-10 !border-2 !border-[var(--color-teal-500)]" style={{ backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                {/* Icon */}
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(12,112,117,0.2)', color: 'var(--color-teal-400)' }}>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>

                           <h3 className="text-2xl font-display font-bold mb-4" style={{ color: 'white' }}>
                  Transfer Engine
                </h3>

                {/* Description */}
                <p className="font-body text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  All value transfers occur on enterprise-grade settlement infrastructure ensuring sub-2-second finality and fees under a fraction of a cent. Smart routing automates payments instantly.
                </p>

                {/* Features */}
                <div className="space-y-4">
                  {[
                    { text: 'India-UAE Trade Corridor (Beta Q1 2026)', link: null },
                    { text: 'Up to 65,000 TPS throughput', link: null },
                    { text: 'Programmable escrow & routing', link: null },
                    { text: 'Transparent transaction history', link: null }
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3 group/item">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(12,112,117,0.2)', border: '1px solid rgba(12,112,117,0.35)' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--color-teal-400)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {feature.link ? (
                        <a href={feature.link} target="_blank" rel="noopener noreferrer" className="font-body text-sm hover:underline transition-colors block" style={{ color: 'var(--color-teal-300)' }}>
                          {feature.text}
                        </a>
                      ) : (
                        <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{feature.text}</span>
                      )}
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>

            {/* Identity & Compliance Card */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative group h-full"
            >
              <GlowCard glowColor="navy" customSize={true} className="h-full w-full !p-8 z-10 !border-2 !border-[var(--color-teal-500)]" style={{ backgroundColor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                {/* Icon */}
                <div className="mb-6">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(10,65,116,0.2)', border: '1px solid rgba(10,65,116,0.3)', color: 'var(--color-navy-400)' }}>
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-2xl font-display font-bold mb-4" style={{ color: 'white' }}>
                  Identity & Compliance Layer
                </h3>

                {/* Description */}
                <p className="font-body text-base leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Identity and KYC data is never exposed publicly. It resides on a permissioned, institutional-grade private network ensuring complete privacy and regulatory compliance.
                </p>

                {/* Features */}
                <div className="space-y-4">
                  {[
                    'Bank-grade data protection',
                    'Compliant with RBI, FEMA regulations',
                    'Private node architecture',
                    'Priority beta support included'
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: 'rgba(10,65,116,0.2)', border: '1px solid rgba(10,65,116,0.3)' }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#60A5FA' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-body text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>{feature}</span>
                    </div>
                  ))}
                </div>
              </GlowCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section — White background with styled card */}
      <section className="py-24 relative overflow-hidden bg-white">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(12,112,117,0.08), transparent 65%)' }}></div>
        
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-teal-500/10 via-blue-500/5 to-purple-500/5 rounded-full blur-[150px]"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main CTA Card */}
            <div className="relative rounded-[40px] p-12 md:p-20 border-2 overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--color-navy-800), var(--color-navy-700), var(--color-teal-700))', borderColor: 'rgba(12,112,117,0.3)' }}>
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-transparent to-blue-500/10 opacity-50"></div>
              
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-400/20 rounded-full blur-[100px]"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px]"></div>
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="mb-8"
                >
                  {/* Enhanced Beta Badge */}
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border-2 backdrop-blur-sm shadow-lg" style={{ background: 'linear-gradient(135deg, rgba(12,112,117,0.2), rgba(10,65,116,0.2))', borderColor: 'rgba(15,150,136,0.4)' }}>
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-400 shadow-lg"></span>
                    </span>
                    <span className="font-display text-sm font-black text-white tracking-wider uppercase">
                      <span className="font-black" style={{ color: 'var(--color-teal-300)' }}>Beta Launch Q1 2026</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(15,150,136,0.2)', borderColor: 'rgba(15,150,136,0.4)', border: '1px solid', color: 'var(--color-teal-200)' }}>
                      Limited Spots
                    </span>
                  </div>
                </motion.div>

                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                  className="text-[36px] md:text-[50px] font-display font-bold text-white mb-6 tracking-[-0.03em] leading-[1.1]"
                >
                  Join the{' '}
                  <span className="font-black" style={{ color: 'var(--color-teal-300)' }}>Beta</span>.<br/>
                  Start transacting <span className="font-black" style={{ color: 'rgba(255,255,255,0.85)' }}>immediately</span>.
                </motion.h2>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                  className="text-xl font-body mb-12 max-w-2xl mx-auto leading-relaxed"
                  style={{ color: 'var(--color-ink-300)' }}
                >
                  Join our <span className="font-bold" style={{ color: 'var(--color-teal-300)' }}>India-UAE beta</span> launching <span className="font-bold" style={{ color: 'var(--color-teal-400)' }}>Q1 2026</span>. Be among the first to experience instant cross-border transfers with zero SWIFT delays.
                </motion.p>
                
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center mb-10"
                >
                  <button
                    onClick={openWaitlist}
                    className="px-12 py-5 rounded-2xl text-lg font-display font-bold text-white shadow-[0_0_40px_rgba(20,184,166,0.3)] hover:shadow-[0_0_60px_rgba(20,184,166,0.5)] transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
                    style={{ background: 'linear-gradient(135deg, var(--color-teal-500), var(--color-teal-400))' }}
                  >
                    Secure My Spot
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </motion.div>
                
                {/* Beta Perks */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="mb-12"
                >
                  <div className="inline-flex flex-wrap items-center justify-center gap-4 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold text-white">Priority Support</span>
                    </div>
                    <div className="w-px h-4 bg-white/20"></div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <span className="text-sm font-semibold text-white">Exclusive Beta Features</span>
                    </div>
                    <div className="w-px h-4 bg-white/20"></div>
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span className="text-sm font-semibold text-white">Early Access Rewards</span>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                  className="mb-12"
                >
                  <p className="text-base text-gray-300">Get priority access when we launch. <button onClick={openWaitlist} className="text-teal-300 hover:text-teal-200 font-semibold transition-colors border-b border-teal-400/30 hover:border-teal-300 bg-transparent">Join the waitlist →</button></p>
                  <div className="mt-3 text-sm" style={{ color: 'var(--color-ink-400)' }}>
                    <span className="inline-flex items-center gap-1">
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Beta testers get priority onboarding assistance
                    </span>
                  </div>
                </motion.div>
                

                {/* Trust badges */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-12 pt-8 border-t border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-5 h-5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-display font-bold text-white">Bank-Grade</div>
                      <div className="text-xs" style={{ color: 'var(--color-ink-400)' }}>Security</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-5 h-5 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-display font-bold text-white">Instant</div>
                      <div className="text-xs" style={{ color: 'var(--color-ink-400)' }}>Settlement</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-5 h-5 text-teal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-display font-bold text-white">Minimal</div>
                      <div className="text-xs" style={{ color: 'var(--color-ink-400)' }}>Fees</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cookie Consent */}
      <CookieConsent />
    </div>
  );
};

export default Home;
