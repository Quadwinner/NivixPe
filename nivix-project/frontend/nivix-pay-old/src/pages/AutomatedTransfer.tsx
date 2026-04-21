import React, { useState } from 'react';
import { motion } from 'framer-motion';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PaymentIcon from '@mui/icons-material/Payment';
import WaitlistModal from '../components/WaitlistModal';

const FEATURES = [
  {
    icon: VerifiedUserIcon,
    title: 'Identity Verification',
    desc: 'Quick, secure KYC process compliant with RBI and FEMA regulations.',
  },
  {
    icon: AutorenewIcon,
    title: 'Real-time Processing',
    desc: 'Automated transfers with instant settlement and full transparency.',
  },
  {
    icon: PaymentIcon,
    title: 'Direct to Bank',
    desc: 'Funds arrive directly into any bank account — no extra steps.',
  },
];

/* ── Animated globe SVG ─────────────────────────────────────────────────── */
const GlobeGraphic = () => (
  <svg
    viewBox="0 0 200 200"
    className="w-full h-full"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Outer ring */}
    <circle cx="100" cy="100" r="80" stroke="rgba(12,206,196,0.15)" strokeWidth="1" />
    <circle cx="100" cy="100" r="60" stroke="rgba(12,206,196,0.2)" strokeWidth="1" />
    <circle cx="100" cy="100" r="40" stroke="rgba(12,206,196,0.25)" strokeWidth="1" />

    {/* Horizontal equator ellipses */}
    <ellipse cx="100" cy="100" rx="80" ry="28" stroke="rgba(12,206,196,0.18)" strokeWidth="0.8" />
    <ellipse cx="100" cy="100" rx="80" ry="56" stroke="rgba(12,206,196,0.12)" strokeWidth="0.8" />

    {/* Vertical meridian */}
    <ellipse cx="100" cy="100" rx="28" ry="80" stroke="rgba(12,206,196,0.18)" strokeWidth="0.8" />

    {/* Transfer arc — highlighted */}
    <path
      d="M 30 100 Q 100 20 170 100"
      stroke="url(#arcGrad)"
      strokeWidth="2"
      strokeLinecap="round"
    />

    {/* Node dots */}
    <circle cx="30" cy="100" r="5" fill="#0CE4C4" opacity="0.9" />
    <circle cx="170" cy="100" r="5" fill="#0A4174" stroke="#0CE4C4" strokeWidth="1.5" />
    <circle cx="100" cy="54" r="3.5" fill="#0CE4C4" opacity="0.7" />

    {/* Pulse rings around source node */}
    <circle cx="30" cy="100" r="10" stroke="#0CE4C4" strokeWidth="0.8" opacity="0.4" />
    <circle cx="30" cy="100" r="17" stroke="#0CE4C4" strokeWidth="0.5" opacity="0.2" />

    {/* Moving dot on arc (static representation) */}
    <circle cx="100" cy="54" r="4" fill="white" opacity="0.95" />

    <defs>
      <linearGradient id="arcGrad" x1="30" y1="100" x2="170" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0CE4C4" />
        <stop offset="1" stopColor="#0A4174" />
      </linearGradient>
    </defs>
  </svg>
);

const AutomatedTransfer: React.FC = () => {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const openWaitlist = () => setWaitlistOpen(true);

  return (
    <div className="min-h-screen bg-white">
      <WaitlistModal
        isOpen={waitlistOpen}
        onClose={() => setWaitlistOpen(false)}
        bannerMessage="Transfers go live Q1 2026. Join the waitlist for priority access."
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-[92vh] flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #071525 0%, #0a2540 50%, #0d2d3a 100%)' }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(rgba(12,206,196,1) 1px, transparent 1px), linear-gradient(90deg, rgba(12,206,196,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(12,206,196,0.07), transparent 70%)' }} />
        <div className="absolute bottom-10 right-1/4 w-72 h-72 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(10,65,116,0.3), transparent 70%)' }} />

        <div className="max-w-6xl mx-auto px-6 w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* Left — Text */}
            <div>
              {/* Beta badge */}
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-10"
                style={{ backgroundColor: 'rgba(12,206,196,0.08)', borderColor: 'rgba(12,206,196,0.25)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse inline-block" />
                <span className="font-display text-xs font-bold uppercase tracking-widest text-teal-400">
                  Beta — Q1 2026
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="font-display font-extrabold tracking-tight text-white mb-6"
                style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1 }}
              >
                Transfer Funds.<br />
                <span style={{ background: 'linear-gradient(90deg, #0CE4C4, #5EEAD4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Across Borders.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="font-body text-lg leading-relaxed mb-10"
                style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '420px' }}
              >
                Send money to any bank account, anywhere in the world. Instant settlement, near-zero fees, fully compliant.
              </motion.p>

              {/* Stats row */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-8 mb-10"
              >
                {[
                  { val: '< 10s', label: 'Settlement' },
                  { val: '~0%', label: 'Hidden Fees' },
                  { val: '24 / 7', label: 'Availability' },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="font-display font-black text-2xl text-white">{s.val}</div>
                    <div className="text-xs font-body uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</div>
                  </div>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                onClick={openWaitlist}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 px-9 py-4 rounded-2xl font-display font-bold text-base text-white"
                style={{ background: 'linear-gradient(135deg, #0CE4C4, #0a9c8f)', boxShadow: '0 0 40px rgba(12,206,196,0.25)' }}
              >
                Join the Waitlist
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.button>

              <p className="mt-3 text-xs font-body" style={{ color: 'rgba(255,255,255,0.3)' }}>
                No spam. Priority access for early sign-ups.
              </p>
            </div>

            {/* Right — Globe graphic */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="relative w-80 h-80">
                {/* Outer glow ring */}
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'radial-gradient(circle, rgba(12,206,196,0.06) 0%, transparent 70%)' }}
                />
                {/* Spinning slow ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-2 rounded-full border border-dashed"
                  style={{ borderColor: 'rgba(12,206,196,0.15)' }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-10 rounded-full border border-dashed"
                  style={{ borderColor: 'rgba(12,206,196,0.1)' }}
                />
                {/* Globe SVG */}
                <div className="absolute inset-4">
                  <GlobeGraphic />
                </div>
                {/* Floating "card" callouts */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -right-6 top-8 px-3 py-2 rounded-xl border backdrop-blur-sm text-xs font-display font-bold"
                  style={{ backgroundColor: 'rgba(12,206,196,0.12)', borderColor: 'rgba(12,206,196,0.3)', color: '#0CE4C4' }}
                >
                  $1 USD = ₹84.2 INR
                </motion.div>
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                  className="absolute -left-6 bottom-14 px-3 py-2 rounded-xl border backdrop-blur-sm text-xs font-display font-bold"
                  style={{ backgroundColor: 'rgba(10,65,116,0.5)', borderColor: 'rgba(12,206,196,0.2)', color: 'white' }}
                >
                  ✓ Settled in 6s
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Feature Cards ────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2
              className="text-3xl md:text-4xl font-display font-bold mb-4"
              style={{ color: 'var(--color-ink-900)' }}
            >
              What to expect when we launch
            </h2>
            <p className="text-base font-body max-w-xl mx-auto" style={{ color: 'var(--color-ink-500)' }}>
              The full transfer experience is being finalised for our India-UAE beta corridor.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className="group"
                >
                  <button
                    onClick={openWaitlist}
                    className="w-full text-left rounded-2xl border-2 p-7 transition-all duration-300 hover:shadow-lg hover:border-teal-400 bg-white"
                    style={{ borderColor: 'var(--color-ink-200)' }}
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: 'linear-gradient(135deg, var(--color-teal-500), var(--color-navy-600))' }}
                    >
                      <Icon style={{ fontSize: '1.8rem', color: 'white' }} />
                    </div>
                    <h3 className="text-lg font-display font-bold mb-2" style={{ color: 'var(--color-ink-900)' }}>
                      {feat.title}
                    </h3>
                    <p className="text-sm font-body leading-relaxed" style={{ color: 'var(--color-ink-500)' }}>
                      {feat.desc}
                    </p>
                    <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--color-teal-600)' }}>
                      Register for early access
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section
        className="py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #071525 0%, #0a2540 60%, #0d2d3a 100%)' }}
      >
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-display font-bold text-white mb-3">How it will work</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)' }} className="font-body">
              Four simple steps — start to finish in under a minute.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '01', label: 'Complete KYC', sub: '2 minutes' },
              { step: '02', label: 'Enter Recipient', sub: 'Name & bank details' },
              { step: '03', label: 'Set Amount', sub: 'Live exchange rate' },
              { step: '04', label: 'Confirm & Send', sub: 'Instant settlement' },
            ].map((s, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={openWaitlist}
                className="text-center p-5 rounded-2xl border hover:border-teal-500/40 transition-all duration-300"
                style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 font-display font-black text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #0CE4C4, #0a4174)' }}
                >
                  {s.step}
                </div>
                <p className="text-white font-display font-semibold text-sm mb-1">{s.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.sub}</p>
              </motion.button>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <button
              onClick={openWaitlist}
              className="px-8 py-4 rounded-xl font-display font-bold text-white border-2 transition-all duration-300 hover:bg-teal-500/10"
              style={{ borderColor: 'rgba(12,206,196,0.4)' }}
            >
              Get notified when transfers go live →
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AutomatedTransfer;
