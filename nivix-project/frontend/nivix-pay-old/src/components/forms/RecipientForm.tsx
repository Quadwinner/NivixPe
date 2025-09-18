import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Alert,
  CircularProgress,
  InputAdornment,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Person,
  AccountBalance,
  Email,
  Phone,
  ArrowBack,
  ArrowForward,
  Check,
  ErrorOutline
} from '@mui/icons-material';

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

// Common Indian banks for autocomplete
const popularBanks = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Indian Bank'
];

const RecipientForm: React.FC<RecipientFormProps> = ({
  onSubmit,
  onBack,
  initialData
}) => {
  const [formData, setFormData] = useState<RecipientDetails>(initialData || {
    name: '',
    accountNumber: '',
    ifscCode: '',
    email: '',
    phone: ''
  });

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
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock bank info based on IFSC code prefix
      const bankCode = ifsc.substring(0, 4);
      const mockBankInfo: BankInfo = {
        bankName: getBankNameFromCode(bankCode),
        branchName: 'Main Branch',
        city: 'Mumbai',
        state: 'Maharashtra',
        valid: true
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
      'SBIN': 'State Bank of India',
      'HDFC': 'HDFC Bank',
      'ICIC': 'ICICI Bank',
      'UTIB': 'Axis Bank',
      'KKBK': 'Kotak Mahindra Bank',
      'PUNB': 'Punjab National Bank',
      'BARB': 'Bank of Baroda',
      'CNRB': 'Canara Bank',
      'UBIN': 'Union Bank of India',
      'IDIB': 'Indian Bank'
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
  const handleChange = (field: keyof RecipientDetails) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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

    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
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
    const updated = [formData, ...savedRecipients.filter(r =>
      r.accountNumber !== formData.accountNumber
    )].slice(0, 5); // Keep only 5 recent recipients

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

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recipient Details
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Enter the recipient's bank account information
        </Typography>

        {/* Saved Recipients */}
        {savedRecipients.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Recent Recipients
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {savedRecipients.map((recipient, index) => (
                <Chip
                  key={index}
                  label={recipient.name}
                  onClick={() => handleRecipientSelect(recipient)}
                  variant="outlined"
                  size="small"
                />
              ))}
            </Box>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Account Holder Name */}
            <Grid item xs={12}>
              <TextField
                label="Account Holder Name"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  )
                }}
                placeholder="Enter full name as per bank records"
              />
            </Grid>

            {/* Account Number */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Account Number"
                value={formData.accountNumber}
                onChange={handleChange('accountNumber')}
                error={!!errors.accountNumber}
                helperText={errors.accountNumber}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalance />
                    </InputAdornment>
                  )
                }}
                placeholder="Enter account number"
              />
            </Grid>

            {/* IFSC Code */}
            <Grid item xs={12} md={6}>
              <TextField
                label="IFSC Code"
                value={formData.ifscCode}
                onChange={handleChange('ifscCode')}
                error={!!errors.ifscCode}
                helperText={errors.ifscCode}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalance />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {isValidatingIFSC ? (
                        <CircularProgress size={20} />
                      ) : bankInfo?.valid ? (
                        <Check color="success" />
                      ) : formData.ifscCode.length > 0 ? (
                        <ErrorOutline color="error" />
                      ) : null}
                    </InputAdornment>
                  )
                }}
                placeholder="e.g., SBIN0000123"
                inputProps={{ maxLength: 11 }}
              />

              {bankInfo && bankInfo.valid && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'success.50', borderRadius: 1 }}>
                  <Typography variant="caption" color="success.main">
                    ✓ {bankInfo.bankName}, {bankInfo.branchName}, {bankInfo.city}
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Email */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  )
                }}
                placeholder="recipient@example.com"
              />
            </Grid>

            {/* Phone */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Phone Number"
                value={formData.phone}
                onChange={handleChange('phone')}
                error={!!errors.phone}
                helperText={errors.phone}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  )
                }}
                placeholder="9876543210"
                inputProps={{ maxLength: 10 }}
              />
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
            <Button
              variant="outlined"
              onClick={onBack}
              startIcon={<ArrowBack />}
            >
              Back
            </Button>

            <Button
              type="submit"
              variant="contained"
              endIcon={<ArrowForward />}
              disabled={isValidatingIFSC || (formData.ifscCode.length === 11 && !bankInfo?.valid)}
              sx={{ flex: 1 }}
            >
              Continue to Payment
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default RecipientForm;