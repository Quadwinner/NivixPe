import React, { useState, useEffect } from 'react';
import {
  User,
  Landmark,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';

interface RecipientDetails {
  name: string;
  accountNumber: string;
  ifscCode: string;
  email: string;
  phone: string;
}

interface RecipientFormProps {
  onSubmit: (data: RecipientDetails) => void;
  onBack: () => void;
  initialData?: RecipientDetails;
}

interface BankInfo {
  bankName: string;
  branchName: string;
  city: string;
  state: string;
  valid: boolean;
}

const SHADOW_1 = '0 1px 2px rgba(4,33,64,.04), 0 1px 3px rgba(4,33,64,.06)';
const GRAD_PRIMARY = 'linear-gradient(135deg, #0A4174 0%, #0C7075 100%)';

/* ── Field primitives, styled to match the redesigned shell ── */
const labelClass =
  'font-display mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500';

const fieldClass = (hasError: boolean, hasLeftIcon: boolean, hasRightSlot: boolean) =>
  [
    'w-full rounded-xl border bg-white text-[15px] text-ink-900 outline-none transition-all',
    'placeholder:text-ink-300',
    'h-[52px]',
    hasLeftIcon ? 'pl-11' : 'pl-4',
    hasRightSlot ? 'pr-11' : 'pr-4',
    hasError
      ? 'border-[#FF4D4F] focus:border-[#FF4D4F] focus:ring-4 focus:ring-[rgba(255,77,79,0.14)]'
      : 'border-[rgba(4,33,64,0.14)] hover:border-ink-300 focus:border-navy-600 focus:ring-4 focus:ring-[rgba(10,65,116,0.14)]',
  ].join(' ');

const RecipientForm: React.FC<RecipientFormProps> = ({ onSubmit, onBack, initialData }) => {
  const [formData, setFormData] = useState<RecipientDetails>(
    initialData || {
      name: '',
      accountNumber: '',
      ifscCode: '',
      email: '',
      phone: '',
    }
  );

  const [errors, setErrors] = useState<Partial<RecipientDetails>>({});
  const [isValidatingIFSC, setIsValidatingIFSC] = useState(false);
  const [bankInfo, setBankInfo] = useState<BankInfo | null>(null);
  const [savedRecipients, setSavedRecipients] = useState<RecipientDetails[]>([]);

  // Load saved recipients from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nivix_saved_recipients');
    if (saved) {
      try {
        setSavedRecipients(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading saved recipients:', error);
      }
    }
  }, []);

  // IFSC Code validation and bank info fetching
  const validateIFSC = async (ifsc: string) => {
    if (!ifsc || ifsc.length !== 11) {
      setBankInfo(null);
      return false;
    }

    setIsValidatingIFSC(true);
    try {
      // In a real application, you would call an IFSC validation API
      // For now, we'll simulate with basic validation
      const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

      if (!ifscPattern.test(ifsc)) {
        setBankInfo(null);
        return false;
      }

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock bank info based on IFSC code prefix
      const bankCode = ifsc.substring(0, 4);
      const mockBankInfo: BankInfo = {
        bankName: getBankNameFromCode(bankCode),
        branchName: 'Main Branch',
        city: 'Mumbai',
        state: 'Maharashtra',
        valid: true,
      };

      setBankInfo(mockBankInfo);
      return true;
    } catch (error) {
      console.error('IFSC validation error:', error);
      setBankInfo(null);
      return false;
    } finally {
      setIsValidatingIFSC(false);
    }
  };

  const getBankNameFromCode = (code: string): string => {
    const bankCodes: { [key: string]: string } = {
      SBIN: 'State Bank of India',
      HDFC: 'HDFC Bank',
      ICIC: 'ICICI Bank',
      UTIB: 'Axis Bank',
      KKBK: 'Kotak Mahindra Bank',
      PUNB: 'Punjab National Bank',
      BARB: 'Bank of Baroda',
      CNRB: 'Canara Bank',
      UBIN: 'Union Bank of India',
      IDIB: 'Indian Bank',
    };
    return bankCodes[code] || 'Unknown Bank';
  };

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Partial<RecipientDetails> = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.name)) {
      newErrors.name = 'Name should only contain letters and spaces';
    }

    // Account number validation
    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d{9,18}$/.test(formData.accountNumber.replace(/\s/g, ''))) {
      newErrors.accountNumber = 'Account number should be 9-18 digits';
    }

    // IFSC validation
    if (!formData.ifscCode.trim()) {
      newErrors.ifscCode = 'IFSC code is required';
    } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.ifscCode)) {
      newErrors.ifscCode = 'Invalid IFSC code format (e.g., SBIN0000123)';
    } else if (bankInfo && !bankInfo.valid) {
      newErrors.ifscCode = 'Invalid IFSC code';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.replace(/[^\d]/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit Indian mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form field changes
  const handleChange =
    (field: keyof RecipientDetails) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      // Special handling for different fields
      let processedValue = value;
      if (field === 'ifscCode') {
        processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      } else if (field === 'phone') {
        processedValue = value.replace(/[^\d]/g, '');
      } else if (field === 'accountNumber') {
        processedValue = value.replace(/[^\d]/g, '');
      }

      setFormData((prev) => ({
        ...prev,
        [field]: processedValue,
      }));

      // Clear error for this field
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }

      // Validate IFSC on change
      if (field === 'ifscCode' && processedValue.length === 11) {
        validateIFSC(processedValue);
      }
    };

  // Handle saved recipient selection
  const handleRecipientSelect = (recipient: RecipientDetails) => {
    setFormData(recipient);
    setErrors({});
    if (recipient.ifscCode) {
      validateIFSC(recipient.ifscCode);
    }
  };

  // Save recipient for future use
  const saveRecipient = () => {
    const updated = [
      formData,
      ...savedRecipients.filter((r) => r.accountNumber !== formData.accountNumber),
    ].slice(0, 5); // Keep only 5 recent recipients

    setSavedRecipients(updated);
    localStorage.setItem('nivix_saved_recipients', JSON.stringify(updated));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm() && (!formData.ifscCode || bankInfo?.valid)) {
      saveRecipient();
      onSubmit(formData);
    }
  };

  const isSubmitDisabled =
    isValidatingIFSC || (formData.ifscCode.length === 11 && !bankInfo?.valid);

  const renderError = (field: keyof RecipientDetails) =>
    errors[field] ? (
      <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium" style={{ color: '#C2292B' }}>
        <AlertCircle size={13} className="shrink-0" />
        {errors[field]}
      </p>
    ) : null;

  return (
    <div>
      {/* ── Heading ── */}
      <div className="mb-7">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-ink-900">
          Recipient details
        </h2>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-500">
          Where should the money land? Enter the destination bank account.
        </p>
      </div>

      {/* ── Recent recipients ── */}
      {savedRecipients.length > 0 && (
        <div className="mb-7">
          <p className={labelClass}>Recent recipients</p>
          <div className="flex flex-wrap gap-2">
            {savedRecipients.map((recipient, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleRecipientSelect(recipient)}
                className="font-display inline-flex items-center gap-2 rounded-full border border-[rgba(4,33,64,0.14)] bg-white px-3.5 py-2 text-[13px] font-semibold text-ink-700 outline-none transition-all hover:border-teal-300 hover:bg-teal-50/60 hover:text-navy-700 focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
                style={{ boxShadow: SHADOW_1 }}
              >
                <span
                  aria-hidden="true"
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-navy-50 text-[10px] font-bold text-navy-600"
                >
                  {recipient.name.charAt(0).toUpperCase()}
                </span>
                {recipient.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Account holder name */}
          <div className="md:col-span-2">
            <label className={labelClass} htmlFor="recipient-name">
              Account holder name
            </label>
            <div className="relative">
              <User
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="recipient-name"
                value={formData.name}
                onChange={handleChange('name')}
                placeholder="Full name as per bank records"
                aria-invalid={!!errors.name}
                className={fieldClass(!!errors.name, true, false)}
              />
            </div>
            {renderError('name')}
          </div>

          {/* Account number */}
          <div>
            <label className={labelClass} htmlFor="recipient-account">
              Account number
            </label>
            <div className="relative">
              <Landmark
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="recipient-account"
                value={formData.accountNumber}
                onChange={handleChange('accountNumber')}
                placeholder="9–18 digits"
                inputMode="numeric"
                aria-invalid={!!errors.accountNumber}
                className={`${fieldClass(!!errors.accountNumber, true, false)} font-mono`}
              />
            </div>
            {renderError('accountNumber')}
          </div>

          {/* IFSC */}
          <div>
            <label className={labelClass} htmlFor="recipient-ifsc">
              IFSC code
            </label>
            <div className="relative">
              <Landmark
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="recipient-ifsc"
                value={formData.ifscCode}
                onChange={handleChange('ifscCode')}
                placeholder="SBIN0000123"
                maxLength={11}
                aria-invalid={!!errors.ifscCode}
                className={`${fieldClass(!!errors.ifscCode, true, true)} font-mono uppercase`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2">
                {isValidatingIFSC ? (
                  <Loader2 size={17} className="animate-spin text-navy-400" />
                ) : bankInfo?.valid ? (
                  <Check size={17} strokeWidth={3} style={{ color: '#00A876' }} />
                ) : formData.ifscCode.length > 0 ? (
                  <AlertCircle size={17} style={{ color: '#FF4D4F' }} />
                ) : null}
              </span>
            </div>
            {renderError('ifscCode')}

            {bankInfo && bankInfo.valid && !errors.ifscCode && (
              <div
                className="mt-2 flex items-start gap-2 rounded-lg px-3 py-2"
                style={{ backgroundColor: 'rgba(0,196,140,0.10)' }}
              >
                <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0" style={{ color: '#06845F' }} />
                <p className="text-xs font-medium leading-snug" style={{ color: '#06845F' }}>
                  {bankInfo.bankName} · {bankInfo.branchName} · {bankInfo.city}
                </p>
              </div>
            )}
          </div>

          {/* Email */}
          <div>
            <label className={labelClass} htmlFor="recipient-email">
              Email address
            </label>
            <div className="relative">
              <Mail
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="recipient-email"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                placeholder="recipient@example.com"
                aria-invalid={!!errors.email}
                className={fieldClass(!!errors.email, true, false)}
              />
            </div>
            {renderError('email')}
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass} htmlFor="recipient-phone">
              Phone number
            </label>
            <div className="relative">
              <Phone
                size={17}
                aria-hidden="true"
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
              />
              <input
                id="recipient-phone"
                value={formData.phone}
                onChange={handleChange('phone')}
                placeholder="9876543210"
                maxLength={10}
                inputMode="numeric"
                aria-invalid={!!errors.phone}
                className={`${fieldClass(!!errors.phone, true, false)} font-mono`}
              />
            </div>
            {renderError('phone')}
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="mt-8 flex flex-col gap-3 border-t border-[rgba(4,33,64,0.08)] pt-7 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="font-display inline-flex h-[52px] items-center justify-center gap-2 rounded-xl border border-[rgba(4,33,64,0.14)] bg-white px-6 text-sm font-semibold text-ink-700 outline-none transition-colors hover:bg-ink-50 focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.14)]"
            style={{ boxShadow: SHADOW_1 }}
          >
            <ArrowLeft size={16} />
            Back
          </button>

          <button
            type="submit"
            disabled={isSubmitDisabled}
            className="font-display inline-flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white outline-none transition-all hover:-translate-y-px focus-visible:ring-4 focus-visible:ring-[rgba(10,65,116,0.24)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            style={{
              background: GRAD_PRIMARY,
              boxShadow: '0 4px 14px rgba(10,65,116,0.24)',
            }}
          >
            {isValidatingIFSC ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Checking IFSC
              </>
            ) : (
              <>
                Continue to payment
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecipientForm;
