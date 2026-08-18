import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpDown,
  Clock,
  ShieldCheck,
  Landmark,
  Zap,
  Wallet,
  UserCheck,
  Banknote,
  Check,
  Minus,
  Lock,
  Eye,
  FileText,
  ChevronDown,
  Copy,
  Users,
  Briefcase,
  Coins,
  GraduationCap,
} from 'lucide-react';
import CookieConsent from '../components/CookieConsent';
import WaitlistModal from '../components/WaitlistModal';

/* Implemented from the Stitch design (project NivixPe Web v2, design system
   "NivixPe Brand v2"). Container 1280px, 112px section rhythm, level-1/level-3
   navy-tinted shadows, Sora headings, DM Sans body, Space Mono for all figures. */

const ease = [0.16, 1, 0.3, 1] as const;
const reveal = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.55, delay, ease },
});

const SHADOW_1 = '0 1px 2px rgba(4,33,64,.04), 0 1px 3px rgba(4,33,64,.06)';
const SHADOW_3 = '0 4px 8px rgba(4,33,64,.04), 0 12px 28px rgba(4,33,64,.08)';
const GRAD_PRIMARY = 'linear-gradient(135deg, #0A4174 0%, #0C7075 100%)';
const GRAD_DARK = 'linear-gradient(135deg, #001D39 0%, #073155 50%, #0A4174 100%)';

const heroTrust = [
  { icon: ShieldCheck, label: 'KYC on Hyperledger Fabric' },
  { icon: Landmark, label: 'RBI & FEMA aligned' },
  { icon: Zap, label: 'T+0 settlement' },
];

const partners = ['Solana', 'Hyperledger', 'Razorpay', 'Circle', 'AWS'];

/* Figures below track the PRD targets: sub-2-minute settlement, under 1% platform
   fee against 6-7% traditional, and 24/7 availability. */
const proofStats = [
  { value: '< 2 min', label: 'Settlement', note: 'Versus 3–5 business days traditionally' },
  { value: '< 1%', label: 'Platform fee', note: 'Versus 6–7% on traditional services' },
  { value: '24/7', label: 'Availability', note: 'No banking-hours restriction' },
  { value: '$700B', label: 'Market served', note: 'Annual global remittance volume' },
];

const comparisonRows = [
  { label: 'Total fee', nivix: 'Under 1%', bank: '6–7%', app: '2–5%' },
  { label: 'Settlement time', nivix: 'Under 2 minutes', bank: '3–5 business days', app: '1–2 days' },
  { label: 'Weekend availability', nivix: 'Always on', bank: 'Closed', app: 'Limited' },
  { label: 'Tracking', nivix: 'On-chain, per step', bank: 'Manual SWIFT trace', app: 'App only' },
  { label: 'Compliance', nivix: 'KYC/AML on Fabric', bank: 'Bank-internal', app: 'Provider-internal' },
  { label: 'Recipient payout', nivix: 'Local bank account', bank: 'Local bank account', app: 'Wallet or bank' },
];

/* Segments and volumes taken from the PRD's target user section. */
const audiences = [
  {
    icon: Users,
    title: 'Remittance senders',
    body: 'Migrant workers sending wages home each month, who lose 6–7% to fees and wait days for the transfer to clear.',
    volume: '$200 – $2,000',
    volumeLabel: 'per transaction',
  },
  {
    icon: Briefcase,
    title: 'Small businesses',
    body: 'Freelancers and e-commerce sellers invoicing international clients, held up by settlement delays and conversion costs.',
    volume: '$500 – $10,000',
    volumeLabel: 'per transaction',
  },
  {
    icon: Coins,
    title: 'Crypto cash-out',
    body: 'Holders converting digital assets into local currency without routing through an exchange withdrawal queue.',
    volume: '$100 – $50,000',
    volumeLabel: 'per transaction',
  },
];

/* KYC tiers and daily limits, per the PRD's FR-1.2. */
const kycTiers = [
  { level: 'Level 1', name: 'Basic', limit: '$1,000', needs: 'Name, DOB, nationality, email and phone verification' },
  { level: 'Level 2', name: 'Enhanced', limit: '$10,000', needs: 'Government ID, proof of address, selfie verification' },
  { level: 'Level 3', name: 'Business', limit: '$100,000', needs: 'Registration documents, tax ID, beneficial ownership' },
];

const steps = [
  {
    icon: Wallet,
    title: 'Connect a wallet',
    body: 'No account, no password. Connect a Solana wallet and you are ready.',
  },
  {
    icon: UserCheck,
    title: 'Verify once',
    body: 'KYC is checked on a permissioned Hyperledger Fabric network. Your documents never touch a public chain.',
  },
  {
    icon: Zap,
    title: 'Settle on-chain',
    body: 'Funds are minted, routed and burned on Solana, each step confirmed live.',
  },
  {
    icon: Banknote,
    title: 'Land in a bank',
    body: 'The recipient is paid by IFSC, with a payout reference on your receipt.',
  },
];

const securityTiles = [
  { icon: ShieldCheck, label: 'Non-custodial by design' },
  { icon: Lock, label: 'Private KYC collections' },
  { icon: Eye, label: 'Immutable audit trail' },
  { icon: FileText, label: 'RBI and FEMA aligned' },
];

const faqs = [
  {
    q: 'How fast does a transfer actually arrive?',
    a: 'On-chain settlement confirms in seconds. End to end, including the local bank payout, NivixPe targets under two minutes, against three to five business days for a traditional wire.',
  },
  {
    q: 'What does a transfer cost?',
    a: 'Under 1% in platform fees, compared with 6-7% typical of traditional remittance services. The exact fee and exchange rate are shown on the quote before you confirm, so there is no hidden markup.',
  },
  {
    q: 'Is NivixPe custodial?',
    a: 'No. You sign the token burn from your own wallet, so funds never sit in an account we control.',
  },
  {
    q: 'Which documents do I need for KYC?',
    a: 'A government photo ID and a recent proof of address. Documents are verified against a permissioned Hyperledger Fabric network and stored in private collections.',
  },
  {
    q: 'Which corridors are live?',
    a: 'The India–UAE corridor opens first in the Q1 2026 beta, with further corridors added as local payout partners are certified. NivixPe is built for multi-currency, multi-corridor payments rather than a single route.',
  },
  {
    q: 'What happens if a transfer fails?',
    a: 'Every step is recorded on-chain, so a failed payout is traceable to the exact stage. Funds that never reached the payout leg are returned to the originating wallet.',
  },
];

const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');

/** Illustrative send amount for the hero quote. */
const QUOTE_AMOUNT = 1000;

/* Total fee applied to the quote. Mirrors the corridor defaults in
   bridge-service/src/offramp/offramp-engine.js:
   platformFee 0.5% + networkFee 0.2% + corridorFee 0.1%. */
const FEE_RATE = 0.008;

/** Fallback rate used only if the bridge is unreachable. */
const FALLBACK_USD_INR = 95.7;

const codeSnippet = `POST /v1/transfers
{
  "source": { "currency": "USD", "amount": 1000 },
  "destination": {
    "currency": "INR",
    "account": "0012345678",
    "ifsc": "HDFC0000123"
  },
  "reference": "invoice-8842"
}`;

const Home: React.FC = () => {
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Live USD→INR rate from the bridge service, used by the hero quote card.
  const [rate, setRate] = useState<number | null>(null);
  const [rateState, setRateState] = useState<'loading' | 'live' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    fetch(`${BRIDGE_URL}/api/rates/USD/INR`, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data?.success && typeof data.rate === 'number') {
          setRate(data.rate);
          setRateState('live');
        } else {
          setRate(FALLBACK_USD_INR);
          setRateState('fallback');
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRate(FALLBACK_USD_INR);
        setRateState('fallback');
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const effectiveRate = rate ?? FALLBACK_USD_INR;
  const recipientAmount = QUOTE_AMOUNT * effectiveRate * (1 - FEE_RATE);

  const openWaitlist = () => setWaitlistOpen(true);

  const scrollToHowItWorks = () => {
    const element = document.getElementById('how-it-works');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-white">
      <WaitlistModal isOpen={waitlistOpen} onClose={() => setWaitlistOpen(false)} />

      {/* ═══════════ HERO ═══════════ */}
      <section
        className="relative overflow-hidden border-b border-[rgba(4,33,64,0.07)]"
        style={{
          background:
            'linear-gradient(180deg, #EEF3F8 0%, #F5F8FB 45%, #FBFCFD 100%)',
        }}
      >
        {/* Layered depth: brand mesh, a faint grid, and two soft aurora blooms */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(at 88% 4%, rgba(12,112,117,0.16) 0px, transparent 46%), radial-gradient(at 4% 92%, rgba(10,65,116,0.14) 0px, transparent 44%), radial-gradient(at 50% 120%, rgba(15,150,136,0.10) 0px, transparent 50%)',
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(4,33,64,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(4,33,64,0.045) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage:
              'radial-gradient(ellipse 75% 65% at 50% 35%, #000 35%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 75% 65% at 50% 35%, #000 35%, transparent 100%)',
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-4 h-[380px] w-[380px] rounded-full blur-[110px]"
          style={{ background: 'rgba(15,150,136,0.20)' }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-28 bottom-0 h-[340px] w-[340px] rounded-full blur-[110px]"
          style={{ background: 'rgba(10,65,116,0.16)' }}
        />

        <div className="relative mx-auto grid max-w-[1280px] items-center gap-16 px-6 py-24 md:px-12 md:py-28 lg:grid-cols-12">
          {/* Copy */}
          <div className="z-10 flex flex-col items-start gap-8 lg:col-span-7">
            <motion.span
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="font-display inline-flex items-center gap-2 rounded-full border border-navy-100 bg-navy-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal-400" />
              Beta Q1 2026 · India–UAE corridor
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.06, ease }}
              className="font-display text-[40px] font-bold leading-[1.08] tracking-[-0.035em] text-ink-900 sm:text-[52px] lg:text-[64px]"
            >
              Send money globally in minutes, not days,{' '}
              <span
                style={{
                  background: 'linear-gradient(120deg, #0A4174 0%, #0C7075 55%, #0F9688 100%)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  color: 'transparent',
                }}
              >
                at a fraction of the cost.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.16, ease }}
              className="max-w-2xl text-[17px] leading-[1.7] text-ink-500 md:text-lg"
            >
              NivixPe settles cross-border payments on Solana and pays out to local bank accounts,
              with KYC and AML handled on a private Hyperledger Fabric ledger. Under 2 minutes and
              under 1% in fees, instead of 3–5 days at 6–7%.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease }}
              className="flex flex-col gap-4 pt-2 sm:flex-row"
            >
              <button
                type="button"
                onClick={openWaitlist}
                className="font-display flex h-[52px] items-center justify-center gap-2 rounded-full px-8 text-[15px] font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-4 focus-visible:ring-navy-600/20"
                style={{ background: GRAD_PRIMARY, boxShadow: SHADOW_3 }}
              >
                Get early access
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={scrollToHowItWorks}
                className="font-display flex h-[52px] items-center justify-center gap-2 rounded-full px-8 text-[15px] font-semibold text-navy-600 outline-none transition-colors hover:bg-navy-50 focus-visible:ring-4 focus-visible:ring-navy-600/20"
              >
                See how it works
                <ArrowRight size={16} />
              </button>
            </motion.div>

            <div className="mt-4 flex w-full flex-wrap items-center gap-6 border-t border-ink-100 pt-8">
              {heroTrust.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-2 text-sm font-medium text-ink-400"
                  >
                    <Icon size={18} className="text-teal-500" />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quote card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.18, ease }}
            className="z-10 w-full lg:col-span-5"
          >
            <div
              className="rounded-2xl border border-white bg-white p-7 transition-transform duration-300 hover:-translate-y-0.5 md:p-8"
              style={{
                boxShadow:
                  '0 1px 1px rgba(4,33,64,0.04), 0 8px 16px rgba(4,33,64,0.06), 0 28px 60px rgba(4,33,64,0.14)',
              }}
            >
              <h3 className="font-display mb-6 text-lg font-semibold text-ink-900">Send money</h3>

              {/* You send */}
              <div className="mb-2 rounded-xl border border-transparent bg-ink-50 p-4">
                <span className="font-display mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-ink-400">
                  You send
                </span>
                <div className="flex items-end justify-between">
                  <span className="font-mono text-3xl font-bold text-ink-900">
                    {QUOTE_AMOUNT.toLocaleString('en-US')}
                  </span>
                  <span
                    className="font-display rounded-lg border border-ink-100 bg-white px-3 py-1.5 font-semibold text-ink-900"
                    style={{ boxShadow: SHADOW_1 }}
                  >
                    USD
                  </span>
                </div>
              </div>

              {/* Fee + rate */}
              <div className="relative my-2 ml-4 space-y-3 border-l-2 border-dashed border-ink-200 py-3 pl-6">
                <span className="absolute -left-[13px] top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white">
                  <ArrowUpDown size={13} className="text-teal-500" />
                </span>
                <div className="flex justify-between text-sm">
                  <span className="text-ink-400">Total fee</span>
                  <span className="font-mono text-ink-800">{(FEE_RATE * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-ink-400">
                    Exchange rate
                    {rateState === 'live' && (
                      <span
                        aria-label="Live rate"
                        className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-teal-400"
                      />
                    )}
                  </span>
                  {rateState === 'loading' ? (
                    <span className="h-4 w-32 animate-pulse rounded bg-ink-100" />
                  ) : (
                    <span className="font-mono text-teal-500">
                      1 USD = {effectiveRate.toFixed(2)} INR
                    </span>
                  )}
                </div>
              </div>

              {/* Recipient gets */}
              <div className="mt-2 rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                <span className="font-display mb-2 block text-xs font-semibold uppercase tracking-[0.1em] text-ink-400">
                  Recipient gets
                </span>
                <div className="flex items-end justify-between">
                  {rateState === 'loading' ? (
                  <span className="h-9 w-40 animate-pulse rounded bg-teal-100/70" />
                ) : (
                  <span className="font-mono text-3xl font-bold text-teal-600">
                    {recipientAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                )}
                  <span
                    className="font-display rounded-lg border border-ink-100 bg-white px-3 py-1.5 font-semibold text-ink-900"
                    style={{ boxShadow: SHADOW_1 }}
                  >
                    INR
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-ink-50 py-3 text-sm text-ink-500">
                <Clock size={16} className="text-success" />
                Arrives in{' '}
                <span className="font-mono font-bold text-ink-800">under 2 minutes</span>
              </div>

              <button
                type="button"
                onClick={openWaitlist}
                className="font-display mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-navy-600 py-3.5 font-semibold text-white outline-none transition-colors hover:bg-navy-700 focus-visible:ring-4 focus-visible:ring-navy-600/20"
              >
                Start transfer
                <ArrowRight size={17} />
              </button>

              <p className="mt-3 text-center text-[11px] text-ink-400">
                {rateState === 'live'
                  ? `Live rate on $${QUOTE_AMOUNT.toLocaleString('en-US')}. Final quote is confirmed before you pay.`
                  : rateState === 'fallback'
                  ? 'Indicative rate — live pricing unavailable right now.'
                  : 'Fetching live rate…'}
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ CREDIBILITY BAND ═══════════ */}
      <section className="border-b border-[rgba(4,33,64,0.07)] bg-white py-9">
        <div className="mx-auto max-w-[1280px] px-6 md:px-12">
          <div className="flex flex-col items-center justify-between gap-7 md:flex-row">
            <span className="font-display shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-400">
              Powered by
            </span>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-60 md:gap-14">
              {partners.map((name) => (
                <span key={name} className="font-display text-lg font-bold text-ink-700">
                  {name}
                </span>
              ))}
            </div>
          </div>

          {/* Real backing and an honest build-status disclosure */}
          <div
            className="mt-8 flex flex-col items-center justify-center gap-3 border-t pt-7 text-center sm:flex-row sm:gap-6"
            style={{ borderColor: 'rgba(4,33,64,0.07)' }}
          >
            <span className="inline-flex items-center gap-2 text-[13px] text-ink-500">
              <GraduationCap size={15} className="text-navy-500" />
              Incubated at Bennett Hatchery, Bennett University
            </span>
            <span
              className="hidden h-3.5 w-px sm:block"
              style={{ backgroundColor: 'rgba(4,33,64,0.14)' }}
            />
            <span
              className="font-display inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{ backgroundColor: 'rgba(255,184,0,0.14)', color: '#8A6200' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#B98700' }} />
              Development phase · Solana devnet
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ PROOF STRIP ═══════════ */}
      <section className="border-b border-[rgba(4,33,64,0.07)] bg-[#F1F5F9]">
        <div className="mx-auto max-w-[1280px] px-6 py-14 md:px-12">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[rgba(4,33,64,0.08)] bg-[rgba(4,33,64,0.08)] md:grid-cols-4">
            {proofStats.map((stat, index) => (
              <motion.div
                key={stat.label}
                {...reveal(index * 0.06)}
                className="bg-white p-6 transition-colors hover:bg-teal-50/30"
              >
                <p className="font-mono text-[28px] font-bold leading-none text-navy-600">
                  {stat.value}
                </p>
                <p className="font-display mt-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-500">{stat.note}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMPARISON ═══════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 md:px-12 md:py-28">
          <motion.div {...reveal()} className="mb-14 max-w-2xl">
            <p className="font-display mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500">
              How we compare
            </p>
            <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-ink-900 md:text-[44px]">
              A tenth of the cost. A fraction of the wait.
            </h2>
          </motion.div>

          <motion.div {...reveal(0.1)} className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr>
                  <th className="w-[28%] pb-5" />
                  <th
                    className="rounded-t-xl px-6 pb-5 pt-5 align-bottom"
                    style={{
                      backgroundColor: 'rgba(12,112,117,0.07)',
                      borderTop: '3px solid #0C7075',
                    }}
                  >
                    <span className="font-display block text-base font-bold text-navy-900">
                      NivixPe
                    </span>
                    <span className="font-display mt-1 block text-[10px] font-semibold uppercase tracking-[0.1em] text-teal-600">
                      On-chain settlement
                    </span>
                  </th>
                  <th className="px-6 pb-5 align-bottom">
                    <span className="font-display text-base font-semibold text-ink-500">
                      Traditional bank
                    </span>
                  </th>
                  <th className="px-6 pb-5 align-bottom">
                    <span className="font-display text-base font-semibold text-ink-500">
                      Money transfer app
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr
                    key={row.label}
                    className="group border-t transition-colors"
                    style={{ borderColor: 'rgba(4,33,64,0.07)' }}
                  >
                    <td className="py-4 pr-4 transition-colors group-hover:bg-ink-50/60">
                      <span className="font-display text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-500">
                        {row.label}
                      </span>
                    </td>
                    <td className="px-6 py-4" style={{ backgroundColor: 'rgba(12,112,117,0.07)' }}>
                      <span className="flex items-center gap-2.5 font-mono text-[15px] font-bold text-navy-900">
                        <span
                          aria-hidden="true"
                          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                          style={{ backgroundColor: 'rgba(0,196,140,0.20)' }}
                        >
                          <Check size={11} strokeWidth={3.5} style={{ color: '#06845F' }} />
                        </span>
                        {row.nivix}
                      </span>
                    </td>
                    <td className="px-6 py-4 transition-colors group-hover:bg-ink-50/60">
                      <span className="flex items-center gap-2.5 font-mono text-sm text-ink-500">
                        <Minus size={13} className="shrink-0 text-ink-300" />
                        {row.bank}
                      </span>
                    </td>
                    <td className="px-6 py-4 transition-colors group-hover:bg-ink-50/60">
                      <span className="flex items-center gap-2.5 font-mono text-sm text-ink-500">
                        <Minus size={13} className="shrink-0 text-ink-300" />
                        {row.app}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ WHO IT'S FOR ═══════════ */}
      <section className="border-t border-[rgba(4,33,64,0.07)] bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 md:px-12 md:py-28">
          <motion.div {...reveal()} className="mb-14 max-w-2xl">
            <p className="font-display mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500">
              Who it&apos;s for
            </p>
            <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-ink-900 md:text-[44px]">
              Built for three kinds of sender.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {audiences.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} {...reveal(index * 0.09)} className="h-full">
                  <div
                    className="flex h-full flex-col rounded-2xl border border-[rgba(4,33,64,0.08)] bg-white p-7 transition-all duration-300 hover:-translate-y-0.5"
                    style={{ boxShadow: SHADOW_1 }}
                  >
                    <span
                      aria-hidden="true"
                      className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ backgroundColor: 'rgba(12,112,117,0.09)', color: '#0C7075' }}
                    >
                      <Icon size={19} />
                    </span>
                    <h3 className="font-display text-lg font-bold text-ink-900">{item.title}</h3>
                    <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-500">{item.body}</p>
                    <div
                      className="mt-6 border-t pt-4"
                      style={{ borderColor: 'rgba(4,33,64,0.08)' }}
                    >
                      <p className="font-mono text-base font-bold text-navy-600">{item.volume}</p>
                      <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-ink-400">
                        {item.volumeLabel}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      {/* scroll-mt offsets the sticky header so the heading is not hidden on anchor jump */}
      <section
        id="how-it-works"
        className="relative scroll-mt-20 overflow-hidden border-y border-[rgba(4,33,64,0.07)]"
        style={{ background: 'linear-gradient(180deg, #F1F5F9 0%, #F7FAFC 100%)' }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(at 15% 0%, rgba(12,112,117,0.10) 0px, transparent 45%), radial-gradient(at 85% 100%, rgba(10,65,116,0.10) 0px, transparent 45%)',
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 py-24 md:px-12 md:py-28">
          <motion.div {...reveal()} className="mb-14 max-w-2xl">
            <p className="font-display mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500">
              How it works
            </p>
            <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-ink-900 md:text-[44px]">
              Four steps. Under a minute.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div key={step.title} {...reveal(index * 0.08)} className="relative">
                  {index < steps.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[calc(100%+0.4rem)] top-10 hidden h-px w-6 bg-ink-200 lg:block"
                    />
                  )}
                  <div
                    className="h-full rounded-2xl border border-white bg-white p-6 transition-all duration-300 hover:-translate-y-0.5"
                    style={{ boxShadow: '0 2px 4px rgba(4,33,64,0.04), 0 10px 24px rgba(4,33,64,0.07)' }}
                  >
                    <div className="mb-5 flex items-start justify-between">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                        style={{ background: GRAD_PRIMARY }}
                      >
                        <Icon size={19} />
                      </span>
                      <span className="font-mono text-[26px] font-bold text-ink-100">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="font-display text-base font-bold text-ink-900">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.body}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════ SECURITY ═══════════ */}
      <section
        id="security"
        className="relative scroll-mt-20 overflow-hidden"
        style={{ background: GRAD_DARK }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 100% 0%, rgba(12,112,117,0.28) 0%, transparent 55%)',
          }}
        />
        <div className="relative mx-auto max-w-[1280px] px-6 py-24 md:px-12 md:py-28">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
            <motion.div {...reveal()}>
              <p className="font-display mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-300">
                Security
              </p>
              <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-white md:text-[44px]">
                Your money never sits with us.
              </h2>
              <p className="mt-6 text-[16px] leading-[1.7] text-white/70">
                NivixPe is non-custodial by design. You approve the token burn from your own wallet,
                so at no point do we hold a balance on your behalf or move funds without your
                signature.
              </p>
              <p className="mt-4 text-[16px] leading-[1.7] text-white/70">
                Identity data is kept off the public chain entirely. KYC records live in private
                collections on a permissioned Hyperledger Fabric network, while only the settlement
                itself is public and auditable.
              </p>
            </motion.div>

            <motion.div {...reveal(0.1)}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {securityTiles.map((tile) => {
                  const Icon = tile.icon;
                  return (
                    <div
                      key={tile.label}
                      className="rounded-2xl border border-white/[0.13] bg-white/[0.06] p-6 backdrop-blur-sm"
                    >
                      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/20 text-teal-300">
                        <Icon size={18} />
                      </span>
                      <p className="font-display text-[15px] font-semibold leading-snug text-white">
                        {tile.label}
                      </p>
                    </div>
                  );
                })}
              </div>
              <p className="mt-6 text-[13px] leading-relaxed text-white/45">
                Beta operates under a regulatory sandbox application. Licence status is published on
                our Compliance page.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ KYC TIERS ═══════════ */}
      <section className="border-b border-[rgba(4,33,64,0.07)] bg-[#F1F5F9]">
        <div className="mx-auto max-w-[1280px] px-6 py-24 md:px-12 md:py-28">
          <motion.div {...reveal()} className="mb-12 max-w-2xl">
            <p className="font-display mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500">
              Verification tiers
            </p>
            <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-ink-900 md:text-[44px]">
              Verify only as far as you need.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-ink-500">
              Higher limits require more verification. Every tier is checked against the private
              compliance ledger, never a public chain.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {kycTiers.map((tier, index) => (
              <motion.div key={tier.level} {...reveal(index * 0.08)} className="h-full">
                <div
                  className="flex h-full flex-col rounded-2xl border border-white bg-white p-7"
                  style={{ boxShadow: '0 2px 4px rgba(4,33,64,0.04), 0 10px 24px rgba(4,33,64,0.07)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-400">
                      {tier.level}
                    </span>
                    <span
                      className="font-display rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ backgroundColor: 'rgba(12,112,117,0.10)', color: '#0C7075' }}
                    >
                      {tier.name}
                    </span>
                  </div>

                  <p className="font-mono mt-5 text-[30px] font-bold leading-none text-navy-600">
                    {tier.limit}
                  </p>
                  <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-ink-400">
                    Daily limit
                  </p>

                  <p
                    className="mt-6 flex-1 border-t pt-4 text-[13px] leading-relaxed text-ink-500"
                    style={{ borderColor: 'rgba(4,33,64,0.08)' }}
                  >
                    {tier.needs}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ DEVELOPERS ═══════════ */}
      <section id="developers" className="scroll-mt-20 bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 md:px-12 md:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <motion.div {...reveal()}>
              <p className="font-display mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500">
                Developers
              </p>
              <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-ink-900 md:text-[40px]">
                One API for payout, settlement and KYC.
              </h2>
              <p className="mt-5 text-[16px] leading-[1.7] text-ink-500">
                Create a transfer with a single call. NivixPe handles the on-chain settlement, the
                compliance check and the bank payout, and streams every state change back to you.
              </p>
              <button
                type="button"
                onClick={openWaitlist}
                className="font-display mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-[rgba(4,33,64,0.14)] px-6 text-sm font-semibold text-navy-600 outline-none transition-colors hover:bg-navy-50 focus-visible:ring-4 focus-visible:ring-navy-600/20"
              >
                Read the docs
                <ArrowRight size={16} />
              </button>
            </motion.div>

            <motion.div {...reveal(0.1)}>
              <div
                className="overflow-hidden rounded-2xl border border-white/10"
                style={{ background: '#04141E', boxShadow: SHADOW_3 }}
              >
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                    <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
                    <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                  </div>
                  <Copy size={14} className="text-white/40" />
                </div>
                <pre className="overflow-x-auto px-6 py-6 font-mono text-[13px] leading-relaxed text-teal-200">
                  {codeSnippet}
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ FAQ ═══════════ */}
      <section className="border-y border-[rgba(4,33,64,0.07)] bg-[#F1F5F9]">
        <div className="mx-auto max-w-[900px] px-6 py-24 md:px-12 md:py-28">
          <motion.div {...reveal()} className="mb-12">
            <p className="font-display mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-500">
              FAQ
            </p>
            <h2 className="font-display text-[32px] font-bold leading-[1.12] tracking-[-0.03em] text-ink-900 md:text-[40px]">
              Questions people ask before their first transfer.
            </h2>

          </motion.div>

          <motion.div
            {...reveal(0.08)}
            className="overflow-hidden rounded-2xl border border-[rgba(4,33,64,0.08)] bg-white"
            style={{ boxShadow: SHADOW_1 }}
          >
            {faqs.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={item.q} className={index > 0 ? 'border-t border-ink-100' : undefined}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left outline-none transition-colors hover:bg-ink-50/60 focus-visible:ring-4 focus-visible:ring-navy-600/15 md:px-7"
                  >
                    <span className="font-display text-[15px] font-semibold text-ink-900 md:text-base">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`shrink-0 text-ink-400 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="answer"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease }}
                        className="overflow-hidden"
                      >
                        <p className="px-6 pb-6 text-[15px] leading-[1.7] text-ink-500 md:px-7">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-6 py-24 md:px-12 md:py-28">
          <motion.div {...reveal()}>
            <div
              className="relative overflow-hidden px-8 py-16 text-center md:px-16 md:py-20"
              style={{ background: GRAD_PRIMARY, borderRadius: 28, boxShadow: SHADOW_3 }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 85% 0%, rgba(15,150,136,0.35) 0%, transparent 55%)',
                }}
              />
              <div className="relative">
                <p className="font-display mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-teal-200">
                  Get early access
                </p>
                <h2 className="font-display text-[30px] font-bold leading-[1.12] tracking-[-0.03em] text-white md:text-[42px]">
                  Be first on the India–UAE corridor.
                </h2>
                <p className="mx-auto mt-5 max-w-lg text-[16px] leading-[1.7] text-white/75">
                  Beta opens Q1 2026 with priority support for early members. Join the waitlist and
                  we will reach out when your slot is ready.
                </p>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={openWaitlist}
                    className="font-display flex h-[52px] items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-navy-700 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-white/40"
                  >
                    Get early access
                    <ArrowRight size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={openWaitlist}
                    className="font-display flex h-[52px] items-center rounded-full border border-white/25 bg-white/10 px-6 text-[15px] font-semibold text-white outline-none transition-colors hover:bg-white/15 focus-visible:ring-4 focus-visible:ring-white/30"
                  >
                    Talk to us
                  </button>
                </div>

                <p className="mt-8 font-mono text-[13px] text-white/55">
                  INR · USDC · EUR · XRP · BTC
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <CookieConsent />
    </div>
  );
};

export default Home;
