import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { submitKYC } from '../services/apiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const steps = [
  'Personal Information',
  'Address Verification',
  'Identity Documents',
  'Submit & Verify'
];

const KYC: React.FC = () => {
  const navigate = useNavigate();
  const { connected, publicKey } = useWallet();
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    nationality: '',
    streetAddress: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    documentType: '',
    documentNumber: '',
    documentFront: null as File | null,
    documentBack: null as File | null,
    selfie: null as File | null,
    termsAccepted: false
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState('pending');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (name: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, [name]: e.target.files[0] });
    }
  };

  const validateStep = () => {
    const errors: Record<string, string> = {};
    
    switch (activeStep) {
      case 0:
        if (!formData.firstName) errors.firstName = 'First name is required';
        if (!formData.lastName) errors.lastName = 'Last name is required';
        if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        if (!formData.email) {
          errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          errors.email = 'Email is invalid';
        }
        if (!formData.phone) errors.phone = 'Phone number is required';
        if (!formData.nationality) errors.nationality = 'Nationality is required';
        break;
      case 1:
        if (!formData.streetAddress) errors.streetAddress = 'Street address is required';
        if (!formData.city) errors.city = 'City is required';
        if (!formData.state) errors.state = 'State/Province is required';
        if (!formData.postalCode) errors.postalCode = 'Postal code is required';
        if (!formData.country) errors.country = 'Country is required';
        break;
      case 2:
        if (!formData.documentType) errors.documentType = 'Document type is required';
        if (!formData.documentNumber) errors.documentNumber = 'Document number is required';
        if (!formData.documentFront) errors.documentFront = 'Front side of document is required';
        if (!formData.documentBack) errors.documentBack = 'Back side of document is required';
        if (!formData.selfie) errors.selfie = 'Selfie is required';
        break;
      case 3:
        if (!formData.termsAccepted) errors.termsAccepted = 'You must accept the terms and conditions';
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (validateStep()) {
      setIsSubmitting(true);
      try {
        const walletAddress = publicKey?.toString() || '';
        if (!walletAddress) {
          alert('Please connect your wallet first');
          setIsSubmitting(false);
          return;
        }
        
        const userId = `user_${walletAddress.substring(0, 8)}`;
        const kycData = {
          userId: userId,
          solanaAddress: walletAddress,
          fullName: `${formData.firstName} ${formData.lastName}`,
          countryCode: formData.country,
          idDocuments: [formData.documentType]
        };
        
        const result = await submitKYC(kycData);
        if (result.success) {
          setActiveStep(4);
          setKycStatus('pending');
        } else {
          alert(`KYC submission failed: ${result.message || 'Unknown error'}`);
        }
      } catch (error: any) {
        alert(`Error submitting KYC data: ${error?.message || 'Unknown error'}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div>
            <h3 className="text-xl font-semibold text-text mb-2">Personal Information</h3>
            <p className="text-sm text-text-muted mb-6">
              Please provide your basic personal information for KYC verification.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                error={formErrors.firstName}
                />
              <Input
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                error={formErrors.lastName}
                />
              <Input
                  label="Date of Birth"
                  name="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                error={formErrors.dateOfBirth}
                />
              <div>
                <label className="block text-sm font-medium text-text mb-2">Nationality</label>
                <select
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleSelectChange}
                  className={`input ${formErrors.nationality ? 'border-red-500' : ''}`}
                  >
                  <option value="">Select Nationality</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                  <option value="SG">Singapore</option>
                </select>
                  {formErrors.nationality && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.nationality}</p>
                  )}
              </div>
              <Input
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                error={formErrors.email}
                />
              <Input
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                error={formErrors.phone}
                />
            </div>
          </div>
        );
        
      case 1:
        return (
          <div>
            <h3 className="text-xl font-semibold text-text mb-2">Address Information</h3>
            <p className="text-sm text-text-muted mb-6">
              Please provide your current residential address.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Street Address"
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                  error={formErrors.streetAddress}
                />
              </div>
              <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                error={formErrors.city}
                />
              <Input
                  label="State / Province"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                error={formErrors.state}
                />
              <Input
                  label="Postal Code"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                error={formErrors.postalCode}
                />
              <div>
                <label className="block text-sm font-medium text-text mb-2">Country</label>
                <select
                    name="country"
                    value={formData.country}
                    onChange={handleSelectChange}
                  className={`input ${formErrors.country ? 'border-red-500' : ''}`}
                  >
                  <option value="">Select Country</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                  <option value="IN">India</option>
                  <option value="SG">Singapore</option>
                </select>
                  {formErrors.country && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>
                  )}
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div>
            <h3 className="text-xl font-semibold text-text mb-2">Identity Documents</h3>
            <p className="text-sm text-text-muted mb-6">
              Please upload clear photos of your identity documents.
            </p>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Document Type</label>
                  <select
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleSelectChange}
                    className={`input ${formErrors.documentType ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select Document Type</option>
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID Card</option>
                    <option value="driving_license">Driving License</option>
                  </select>
                  {formErrors.documentType && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.documentType}</p>
                  )}
                </div>
                <Input
                  label="Document Number"
                  name="documentNumber"
                  value={formData.documentNumber}
                  onChange={handleChange}
                  error={formErrors.documentNumber}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                    Upload Front Side of Document
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-text-muted">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-text-muted">PNG, JPG, PDF (MAX. 5MB)</p>
                  </div>
                    <input
                      type="file"
                    className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload('documentFront')}
                    />
                </label>
                  {formData.documentFront && (
                  <p className="mt-2 text-sm text-accent">
                    File selected: {formData.documentFront.name}
                  </p>
                  )}
                  {formErrors.documentFront && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.documentFront}</p>
                  )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                    Upload Back Side of Document
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-text-muted">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-text-muted">PNG, JPG, PDF (MAX. 5MB)</p>
                  </div>
                    <input
                      type="file"
                    className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload('documentBack')}
                    />
                </label>
                  {formData.documentBack && (
                  <p className="mt-2 text-sm text-accent">
                    File selected: {formData.documentBack.name}
                  </p>
                  )}
                  {formErrors.documentBack && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.documentBack}</p>
                  )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text mb-2">
                    Upload Selfie with Document
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-8 h-8 mb-2 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-text-muted">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-text-muted">PNG, JPG (MAX. 5MB)</p>
                  </div>
                    <input
                      type="file"
                    className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload('selfie')}
                    />
                </label>
                  {formData.selfie && (
                  <p className="mt-2 text-sm text-accent">
                    File selected: {formData.selfie.name}
                  </p>
                  )}
                  {formErrors.selfie && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.selfie}</p>
                  )}
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div>
            <h3 className="text-xl font-semibold text-text mb-2">Review & Submit</h3>
            <p className="text-sm text-text-muted mb-6">
              Please review your information and accept the terms and conditions.
            </p>
            
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
              <p className="text-sm text-blue-800">
              Your KYC information will be securely stored on the Hyperledger Fabric private blockchain.
              Only authorized validators will be able to verify your identity.
              </p>
            </div>
            
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleChange}
                  className="mt-1 w-5 h-5 text-accent border-border rounded focus:ring-accent"
                />
                <span className="text-sm text-text">
                  I confirm that the information provided is accurate and I accept the terms and conditions.
                </span>
              </label>
              {formErrors.termsAccepted && (
                <p className="mt-1 text-sm text-red-600">{formErrors.termsAccepted}</p>
              )}
            </div>
            
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit KYC Information'
              )}
            </Button>
          </div>
        );
        
      default:
        return null;
    }
  };

  const renderSuccess = () => (
    <div className="text-center py-12">
      <div className="mb-6">
        <CheckCircleIcon className="w-16 h-16 text-green-600 mx-auto" />
      </div>
      <h2 className="text-2xl font-semibold text-text mb-4">KYC Verification Successful!</h2>
      <p className="text-text-muted mb-6">
        Your identity has been verified. You now have full access to the Nivix Protocol.
      </p>
      <Button variant="primary" onClick={() => navigate('/')}>
        Go to Dashboard
      </Button>
    </div>
  );

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text mb-4">KYC Verification</h1>
          <p className="text-lg text-text-muted mb-8">
            Connect your wallet to complete the KYC verification process
          </p>
          
          <Card className="max-w-md mx-auto bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-text mb-2">Connect Wallet</h2>
              <p className="text-sm text-text-muted mb-6">
                Connect your Solana wallet to verify your identity
              </p>
                  <WalletMultiButton />
            </div>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-8">
      <Card>
        {kycStatus === 'approved' ? (
          renderSuccess()
        ) : (
          <>
            <h1 className="text-3xl font-bold text-text mb-6">KYC Verification</h1>
            
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-200 ${
                        index < activeStep
                          ? 'bg-accent text-white'
                          : index === activeStep
                          ? 'bg-accent text-white ring-4 ring-accent/20'
                          : 'bg-gray-200 text-text-muted'
                      }`}>
                        {index < activeStep ? (
                          <CheckCircleIcon className="w-6 h-6" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <p className={`mt-2 text-xs font-medium text-center ${
                        index <= activeStep ? 'text-text' : 'text-text-muted'
                      }`}>
                        {step}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-2 ${
                        index < activeStep ? 'bg-accent' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mb-6">
              {renderStepContent()}
            </div>
            
            {activeStep !== steps.length - 1 && (
              <div className="flex justify-between pt-6 border-t border-border">
                <Button
                  variant="secondary"
                  disabled={activeStep === 0}
                  onClick={handleBack}
                >
                  Back
                </Button>
                <Button variant="primary" onClick={handleNext}>
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default KYC; 
