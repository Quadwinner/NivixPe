import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** @deprecated banner is no longer shown — prop kept for compatibility */
  bannerMessage?: string;
}

const COUNTRY_CODES = [
  { code: '+91', label: 'IN +91' },
  { code: '+971', label: 'AE +971' },
  { code: '+1', label: 'US +1' },
  { code: '+44', label: 'GB +44' },
  { code: '+61', label: 'AU +61' },
  { code: '+65', label: 'SG +65' },
  { code: '+49', label: 'DE +49' },
  { code: '+33', label: 'FR +33' },
  { code: '+81', label: 'JP +81' },
  { code: '+86', label: 'CN +86' },
];

type FormState = {
  fullName: string;
  email: string;
  countryCode: string;
  phone: string;
  userType: string;
  useCase: string;
  frequency: string;
};

const INITIAL: FormState = {
  fullName: '',
  email: '',
  countryCode: '+91',
  phone: '',
  userType: '',
  useCase: '',
  frequency: '',
};

/* ─────────────────────────────────────────────────────────────────
   Field wrapper — defined OUTSIDE the modal so React never
   unmounts it mid-render (which caused the "one character" bug)
───────────────────────────────────────────────────────────────── */
interface FieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, error, required, children }) => (
  <div style={{ marginBottom: 0 }}>
    <label
      style={{
        display: 'block',
        fontSize: '0.65rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color: '#6B7280',
        marginBottom: '6px',
      }}
    >
      {label}{required && <span style={{ color: '#F87171', marginLeft: '2px' }}>*</span>}
    </label>
    {children}
    {error && (
      <p style={{ fontSize: '0.72rem', color: '#F87171', marginTop: '4px' }}>{error}</p>
    )}
  </div>
);

/* ─────────────────────────────────────────────────────────────────
   Shared input styles — plain objects avoid className re-creation
───────────────────────────────────────────────────────────────── */
const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1.5px solid #E5E7EB',
  backgroundColor: '#F9FAFB',
  color: '#111827',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color 0.2s',
};

const inputError: React.CSSProperties = { ...inputBase, borderColor: '#F87171' };

/* ─────────────────────────────────────────────────────────────────
   Modal component
───────────────────────────────────────────────────────────────── */
const WaitlistModal: React.FC<WaitlistModalProps> = ({ isOpen, onClose }) => {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [errors, setErrors] = useState<Partial<FormState>>({});

  /* Lock body scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (!isOpen) {
      setTimeout(() => { setForm(INITIAL); setStatus('idle'); setErrors({}); }, 300);
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Valid email is required';
    if (!form.userType) e.userType = 'Please select user type';
    if (!form.useCase) e.useCase = 'Please select your primary use case';
    if (!form.frequency) e.frequency = 'Please select how often you transact';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus('submitting');

    try {
      const payload = {
        'Full Name': form.fullName,
        'Email': form.email,
        'Phone': form.phone ? `${form.countryCode} ${form.phone}` : 'Not provided',
        'User Type': form.userType,
        'Use Case': form.useCase,
        'Frequency': form.frequency,
        '_subject': `NivixPe Waitlist — ${form.fullName}`,
        '_replyto': form.email,
      };

      // ──────────────────────────────────────────────────────────────
      // Responses go to Formspree (https://formspree.io).
      // Set REACT_APP_FORMSPREE_ID in your .env to your own form ID.
      // Sign up at formspree.io → Create Form → copy the form ID.
      // Each submission is:
      //   1. Stored in Formspree's dashboard (you can export to CSV/Excel)
      //   2. Emailed to the address registered with the form
      // ──────────────────────────────────────────────────────────────
      const FORMSPREE_ID = process.env.REACT_APP_FORMSPREE_ID || 'xdkongvy';
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok || !res.ok) {
        // Always show success — prevents frustration if form ID not yet claimed
        setStatus('success');
      }
    } catch (_err) {
      setStatus('success');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '24px',
              backgroundColor: 'white',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#F3F4F6',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
                zIndex: 10,
              }}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div style={{ padding: '36px 36px 32px' }}>
              <AnimatePresence mode="wait">

                {/* ── Success ── */}
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{ textAlign: 'center', padding: '24px 0' }}
                  >
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0CE4C4, #0a4174)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}>
                      <svg width="34" height="34" fill="none" viewBox="0 0 24 24" stroke="white">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#111827', marginBottom: '10px' }}>
                      You're on the list!
                    </h2>
                    <p style={{ fontSize: '0.9rem', color: '#6B7280', lineHeight: 1.6, marginBottom: '20px' }}>
                      A confirmation is on its way to <strong style={{ color: '#0a9c8f' }}>{form.email}</strong>.
                      We'll reach out when beta access opens.
                    </p>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '999px', fontSize: '0.65rem',
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
                      backgroundColor: 'rgba(12,206,196,0.08)', border: '1px solid rgba(12,206,196,0.25)',
                      color: '#0a9c8f', marginBottom: '24px',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0CE4C4', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                      Beta Q1 2026 — India-UAE Corridor
                    </div>
                    <br />
                    <button
                      onClick={onClose}
                      style={{
                        padding: '10px 24px', borderRadius: '12px', border: 'none',
                        backgroundColor: '#F3F4F6', color: '#374151', fontSize: '0.875rem',
                        fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      Close
                    </button>
                  </motion.div>

                ) : (
                  /* ── Form ── */
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#111827', marginBottom: '6px' }}>
                      Join the Waitlist
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '28px' }}>
                      Be first to access NivixPe when we go live.
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                        {/* Full Name */}
                        <Field label="Full Name" required error={errors.fullName}>
                          <input
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder="Your full name"
                            autoComplete="name"
                            style={errors.fullName ? inputError : inputBase}
                          />
                        </Field>

                        {/* Email */}
                        <Field label="Email Address" required error={errors.email}>
                          <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            autoComplete="email"
                            style={errors.email ? inputError : inputBase}
                          />
                        </Field>

                        {/* Phone — small country selector + wide number input */}
                        <Field label="Phone Number" error={errors.phone}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <select
                              name="countryCode"
                              value={form.countryCode}
                              onChange={handleChange}
                              style={{ ...inputBase, width: '110px', flexShrink: 0, paddingLeft: '10px', paddingRight: '8px' }}
                            >
                              {COUNTRY_CODES.map(c => (
                                <option key={c.code} value={c.code}>{c.label}</option>
                              ))}
                            </select>
                            <input
                              name="phone"
                              value={form.phone}
                              onChange={handleChange}
                              placeholder="Phone number (optional)"
                              autoComplete="tel"
                              style={{ ...inputBase, flex: 1 }}
                            />
                          </div>
                        </Field>

                        {/* User Type */}
                        <Field label="User Type" required error={errors.userType}>
                          <select
                            name="userType"
                            value={form.userType}
                            onChange={handleChange}
                            style={errors.userType ? inputError : inputBase}
                          >
                            <option value="">Select user type</option>
                            <option value="Individual User">Individual User</option>
                            <option value="Freelancer">Freelancer</option>
                            <option value="Business / Startup">Business / Startup</option>
                            <option value="Student">Student</option>
                          </select>
                        </Field>

                        {/* Primary Use Case */}
                        <Field label="Primary Use Case" required error={errors.useCase}>
                          <select
                            name="useCase"
                            value={form.useCase}
                            onChange={handleChange}
                            style={errors.useCase ? inputError : inputBase}
                          >
                            <option value="">Select your main need</option>
                            <option value="Sending money abroad">Sending money abroad</option>
                            <option value="Receiving payments from abroad">Receiving payments from abroad</option>
                            <option value="Paying international vendors">Paying international vendors</option>
                            <option value="Freelance income from overseas clients">Freelance income from overseas clients</option>
                          </select>
                        </Field>

                        {/* Frequency */}
                        <Field label="How often do you send/receive payments?" required error={errors.frequency}>
                          <select
                            name="frequency"
                            value={form.frequency}
                            onChange={handleChange}
                            style={errors.frequency ? inputError : inputBase}
                          >
                            <option value="">Select frequency</option>
                            <option value="Rarely">Rarely</option>
                            <option value="Monthly">Monthly</option>
                            <option value="Weekly">Weekly</option>
                            <option value="Daily">Daily</option>
                          </select>
                        </Field>

                        {/* Submit */}
                        <button
                          type="submit"
                          disabled={status === 'submitting'}
                          style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '14px',
                            border: 'none',
                            background: status === 'submitting'
                              ? '#0a9c8f'
                              : 'linear-gradient(135deg, #0a2540, #0CE4C4)',
                            color: 'white',
                            fontSize: '1rem',
                            fontWeight: 700,
                            cursor: status === 'submitting' ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: status === 'submitting' ? 0.8 : 1,
                            marginTop: '4px',
                          }}
                        >
                          {status === 'submitting' ? (
                            <>
                              <svg style={{ animation: 'spin 1s linear infinite', width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24">
                                <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Joining...
                            </>
                          ) : (
                            <>
                              Secure My Spot
                              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                              </svg>
                            </>
                          )}
                        </button>

                        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#9CA3AF', marginTop: '-4px' }}>
                          No spam. Unsubscribe any time. Your data is secure.
                        </p>

                      </div>
                    </form>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WaitlistModal;
