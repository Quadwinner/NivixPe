
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  VerifiedUser,
  AccessTime
} from '@mui/icons-material';
import { checkKYCStatus } from '../../services/apiService';

interface KYCStatusCheckProps {
  walletAddress: string;
  onKYCComplete: (status: any) => void;
  onKYCRequired: () => void;
}

interface KYCData {
  verified: boolean;
  status?: string;
  userId?: string;
  submittedAt?: string;
  approvedAt?: string;
}

const KYCStatusCheck: React.FC<KYCStatusCheckProps> = ({
  walletAddress,
  onKYCComplete,
  onKYCRequired
}) => {
  const [kycStatus, setKycStatus] = useState<'checking' | 'verified' | 'pending' | 'required'>('checking');
  const [kycData, setKycData] = useState<KYCData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (walletAddress) {
      checkKYCStatusAsync();
    }
  }, [walletAddress]);

  const checkKYCStatusAsync = async () => {
    try {
      setKycStatus('checking');
      setError(null);

      console.log('Checking KYC status for wallet:', walletAddress);

      // Call the API directly to get more detailed response
      const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');
      const apiResponse = await fetch(`${BRIDGE_URL}/api/kyc/status/${walletAddress}`);

      console.log('KYC API Response status:', apiResponse.status);

      if (apiResponse.status === 404) {
        console.log('KYC not found for wallet, setting as required');
        setKycStatus('required');
        return;
      }

      if (!apiResponse.ok) {
        throw new Error('KYC API error: ' + apiResponse.status);
      }

      const result = await apiResponse.json();
      console.log('KYC API Response data:', result);

      // Check various possible response formats
      const isVerified = result?.status === 'approved' ||
                        result?.kycVerified === true ||
                        result?.verified === true ||
                        result?.status === 'verified';

      const isPending = result?.status === 'pending' ||
                       result?.status === 'submitted' ||
                       result?.status === 'under_review';

      if (isVerified) {
        console.log('KYC is verified, proceeding to next step');
        setKycStatus('verified');
        setKycData(result as KYCData);

        // Automatically proceed to next step
        setTimeout(() => {
          onKYCComplete(result);
        }, 1500);
      } else if (isPending) {
        console.log('KYC is pending');
        setKycStatus('pending');
        setKycData(result as KYCData);
      } else {
        console.log('KYC is required, response:', result);
        setKycStatus('required');
      }

    } catch (error: any) {
      console.error('KYC check error:', error);
      setError('Failed to check KYC status: ' + (error.message || 'Unknown error'));
      setKycStatus('required');
    }
  };

  const handleRetryCheck = () => {
    checkKYCStatusAsync();
  };

  const handleCompleteKYC = () => {
    onKYCRequired();
  };


  const renderStatusIcon = () => {
    switch (kycStatus) {
      case 'checking':
        return <CircularProgress size={48} />;
      case 'verified':
        return <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />;
      case 'pending':
        return <AccessTime sx={{ fontSize: 48, color: 'warning.main' }} />;
      case 'required':
        return <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />;
      default:
        return null;
    }
  };

  const renderStatusContent = () => {
    switch (kycStatus) {
      case 'checking':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              Checking KYC Status...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we verify your account
            </Typography>
          </Box>
        );

      case 'verified':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="success.main">
              ✅ KYC Verified
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your identity has been verified. You can proceed with transfers.
            </Typography>
            {kycData?.userId && (
              <Typography variant="caption" color="text.secondary">
                User ID: {kycData.userId}
              </Typography>
            )}
          </Box>
        );

      case 'pending':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="warning.main">
              ⏳ KYC Under Review
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Your KYC submission is being processed. This usually takes 24-48 hours.
            </Typography>
            <Button
              variant="outlined"
              onClick={handleRetryCheck}
              size="small"
            >
              Check Status Again
            </Button>
          </Box>
        );

      case 'required':
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom color="error.main">
              ❌ KYC Required
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              To send money transfers, you need to complete KYC verification first.
              This ensures compliance with financial regulations and protects your account.
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Required Documents:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • Government-issued Photo ID (Passport, Driver's License, etc.)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • Proof of Address (Utility Bill, Bank Statement, etc.)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                • Selfie for identity verification
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={handleCompleteKYC}
              startIcon={<VerifiedUser />}
              size="large"
              fullWidth
              sx={{ mt: 1 }}
            >
              Complete KYC Verification
            </Button>

          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          KYC Verification Status
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
          {renderStatusIcon()}
          <Box sx={{ mt: 2, width: '100%' }}>
            {renderStatusContent()}
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
            <Button
              size="small"
              onClick={handleRetryCheck}
              sx={{ ml: 1 }}
            >
              Retry
            </Button>
          </Alert>
        )}

        {kycStatus === 'verified' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              🔒 Your transfers are protected by blockchain technology and regulatory compliance.
            </Typography>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default KYCStatusCheck;