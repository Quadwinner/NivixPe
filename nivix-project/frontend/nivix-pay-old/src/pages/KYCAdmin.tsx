import React, { useState, useEffect } from 'react';
import { 
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider,
  Snackbar,
  IconButton
} from '@mui/material';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import styled from 'styled-components';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { SelectChangeEvent } from '@mui/material';

const StyledWalletButton = styled.div`
  .wallet-adapter-button {
    background-color: #5D5FEF;
    color: white;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 16px;
    font-weight: 600;
  }
`;

const StyledTableCell = styled(TableCell)<{ isHeader?: boolean }>`
  font-weight: ${props => props.isHeader ? 'bold' : 'normal'};
  background-color: ${props => props.isHeader ? '#f5f5f5' : 'inherit'};
`;

// And replace with a HeaderTableCell constant for styling
const headerCellStyle = {
  fontWeight: 'bold',
  backgroundColor: '#f5f5f5'
};

// Interface for KYC record
interface KYCRecord {
  userId: string;
  solanaAddress: string;
  fullName: string;
  kycVerified: boolean;
  verificationDate: string;
  riskScore: number;
  countryCode: string;
}

const KYCAdmin: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form states
  const [searchAddress, setSearchAddress] = useState('');
  const [searchResult, setSearchResult] = useState<KYCRecord | null>(null);
  
  const [newKYCData, setNewKYCData] = useState({
    userId: '',
    solanaAddress: '',
    fullName: '',
    countryCode: '',
    idDocuments: ['passport']
  });
  
  const [updateKYCData, setUpdateKYCData] = useState({
    userId: '',
    solanaAddress: '',
    kycVerified: 'true',
    riskScore: '50'
  });
  
  const [countryFilter, setCountryFilter] = useState('');
  const [countryResults, setCountryResults] = useState<KYCRecord[]>([]);
  
  // Snackbar state
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  
  // Effect to populate wallet address if connected
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toString();
      setNewKYCData(prev => ({ ...prev, solanaAddress: address }));
      setSearchAddress(address);
    }
  }, [connected, publicKey]);
  
  // Show snackbar notification
  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Handle form input changes for new KYC
  const handleNewKYCChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target as HTMLInputElement | { name?: string; value: unknown };
    if (name) {
      setNewKYCData({
        ...newKYCData,
        [name]: value
      });
    }
  };
  
  // Handle form input changes for update KYC
  const handleUpdateKYCChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | SelectChangeEvent<string>) => {
    const { name, value } = e.target as HTMLInputElement | { name?: string; value: unknown };
    if (name) {
      setUpdateKYCData({
        ...updateKYCData,
        [name]: value
      });
    }
  };
  
  // Search KYC by Solana address
  const handleSearch = async () => {
    if (!searchAddress) {
      showNotification('Please enter a Solana address', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSearchResult(null);
    
    try {
      // Use the bridge service to query blockchain data directly
      const blockchainResponse = await fetch('http://localhost:3002/api/fabric/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fcn: 'GetKYCStatus',
          args: [searchAddress]
        })
      });
      
      const responseJson = await blockchainResponse.json();
      console.log('Raw blockchain response:', responseJson);
      
      if (!responseJson.success || !responseJson.data) {
        showNotification('No KYC record found for this address', 'error');
        return;
      }
      
      const outputData = responseJson.data;
      
      // Check if the response contains error message about no KYC record found
      if (outputData.includes('no KYC record found') || outputData.includes('Error:')) {
        showNotification('No KYC record found for this address', 'error');
        return;
      }
      
      // Extract the JSON object from the command output
      const jsonStartIndex = outputData.lastIndexOf('{');
      const jsonEndIndex = outputData.lastIndexOf('}') + 1;
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        const jsonPart = outputData.substring(jsonStartIndex, jsonEndIndex);
        console.log('Extracted JSON part:', jsonPart);
        
        try {
          const blockchainData = JSON.parse(jsonPart);
          
          // Ensure all required fields are present with default values if missing
          const formattedResult = {
            userId: blockchainData.userId || `user_${searchAddress.substring(0, 8)}`,
            solanaAddress: searchAddress,
            fullName: blockchainData.fullName || "Not Provided",
            kycVerified: blockchainData.kycVerified || false,
            verificationDate: blockchainData.verificationDate || "N/A",
            riskScore: blockchainData.riskScore || 0,
            countryCode: blockchainData.countryCode || "Unknown"
          };
          
          setSearchResult(formattedResult);
          showNotification('KYC record found', 'success');
        } catch (jsonError) {
          console.error('Error parsing blockchain data JSON:', jsonError);
          showNotification('Error parsing KYC data from blockchain', 'error');
        }
      } else {
        showNotification('Invalid blockchain data format', 'error');
      }
    } catch (error) {
      console.error('Error searching KYC:', error);
      setError('Failed to retrieve KYC data from blockchain. Please ensure the blockchain network and bridge service are running.');
      showNotification('Error fetching KYC data from blockchain', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Submit new KYC data
  const handleSubmitKYC = async () => {
    if (!newKYCData.userId || !newKYCData.solanaAddress || !newKYCData.fullName || !newKYCData.countryCode) {
      showNotification('Please fill all required fields', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // First submit to the blockchain directly
      const blockchainResponse = await fetch('http://localhost:3002/api/fabric/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fcn: 'CreateKYC',
          args: [
            newKYCData.userId,
            newKYCData.solanaAddress,
            newKYCData.fullName,
            newKYCData.countryCode,
            JSON.stringify(newKYCData.idDocuments)
          ]
        })
      });
      
      const responseJson = await blockchainResponse.json();
      console.log('Submit KYC response:', responseJson);
      
      if (!responseJson.success) {
        throw new Error('Failed to submit KYC data to blockchain');
      }
      
      // Then also store in the API for redundancy
      const apiResponse = await fetch('http://localhost:3002/api/kyc/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newKYCData)
      });
      
      if (!apiResponse.ok) {
        console.warn('API storage failed but blockchain transaction succeeded');
      }
      
      setSuccess('KYC data submitted successfully to blockchain');
      showNotification('KYC data submitted successfully to blockchain', 'success');
      
      // Clear form
      setNewKYCData({
        userId: '',
        solanaAddress: connected && publicKey ? publicKey.toString() : '',
        fullName: '',
        countryCode: '',
        idDocuments: ['passport']
      });
    } catch (error) {
      console.error('Error submitting KYC:', error);
      setError('Failed to submit KYC data to blockchain');
      showNotification('Error submitting KYC data to blockchain', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Update KYC verification status
  const handleUpdateKYC = async () => {
    if (!updateKYCData.userId || !updateKYCData.solanaAddress) {
      showNotification('Please fill all required fields', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Update directly on the blockchain
      const blockchainResponse = await fetch('http://localhost:3002/api/fabric/invoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fcn: 'UpdateKYCStatus',
          args: [
            updateKYCData.userId,
            updateKYCData.solanaAddress,
            updateKYCData.kycVerified,
            updateKYCData.riskScore
          ]
        })
      });
      
      const responseJson = await blockchainResponse.json();
      console.log('Update KYC response:', responseJson);
      
      if (!responseJson.success) {
        throw new Error('Failed to update KYC status on blockchain');
      }
      
      showNotification('KYC status updated successfully on blockchain', 'success');
      setSuccess('KYC status updated successfully on blockchain');
      
      // Clear form
      setUpdateKYCData({
        userId: '',
        solanaAddress: '',
        kycVerified: 'true',
        riskScore: '50'
      });
    } catch (error) {
      console.error('Error updating KYC:', error);
      setError('Failed to update KYC status on blockchain');
      showNotification('Error updating KYC status on blockchain', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  // Search KYC records by country
  const handleCountrySearch = async () => {
    if (!countryFilter) {
      showNotification('Please enter a country code', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Use the bridge service API to query the blockchain directly
      const blockchainResponse = await fetch('http://localhost:3002/api/fabric/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fcn: 'QueryKYCByCountry',
          args: [countryFilter]
        })
      });
      
      const responseJson = await blockchainResponse.json();
      console.log('Raw country search response:', responseJson);
      
      if (!responseJson.success || !responseJson.data) {
        setCountryResults([]);
        showNotification(`No KYC records found for country ${countryFilter}`, 'error');
        return;
      }
      
      const outputData = responseJson.data;
      
      // Check if the response contains a JSON array
      const jsonStartIndex = outputData.lastIndexOf('[');
      const jsonEndIndex = outputData.lastIndexOf(']') + 1;
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        const jsonPart = outputData.substring(jsonStartIndex, jsonEndIndex);
        console.log('Extracted JSON array part:', jsonPart);
        
        try {
          const recordsData = JSON.parse(jsonPart);
          
          if (Array.isArray(recordsData) && recordsData.length > 0) {
            // Format each record to ensure all fields are present
            const formattedResults = recordsData.map((record: any) => ({
              userId: record.userId || `unknown_user`,
              solanaAddress: record.solanaAddress || "unknown_address",
              fullName: record.fullName || "Not Provided",
              kycVerified: record.kycVerified || false,
              verificationDate: record.verificationDate || "N/A",
              riskScore: record.riskScore || 0,
              countryCode: record.countryCode || countryFilter
            }));
            
            setCountryResults(formattedResults);
            showNotification(`Found ${formattedResults.length} KYC records for country ${countryFilter}`, 'success');
          } else {
            setCountryResults([]);
            showNotification(`No KYC records found for country ${countryFilter}`, 'error');
          }
        } catch (jsonError) {
          console.error('Error parsing country data JSON:', jsonError);
          setCountryResults([]);
          showNotification(`Error parsing KYC records for country ${countryFilter}`, 'error');
        }
      } else {
        setCountryResults([]);
        showNotification(`No KYC records found for country ${countryFilter}`, 'error');
      }
    } catch (error) {
      console.error('Error searching by country:', error);
      setError('Failed to search KYC by country on blockchain');
      showNotification('Error searching KYC by country on blockchain', 'error');
      setCountryResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Render search KYC form
  const renderSearchForm = () => (
    <Box component={Paper} p={3} mb={3}>
      <Typography variant="h6" gutterBottom>
        <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Search KYC Record
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <TextField
            fullWidth
            label="Solana Address"
            variant="outlined"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            Search
          </Button>
        </Grid>
      </Grid>
      
      {searchResult && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            KYC Record
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={headerCellStyle}>User ID</TableCell>
                  <TableCell>{searchResult.userId}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Solana Address</TableCell>
                  <TableCell>{searchResult.solanaAddress}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Full Name</TableCell>
                  <TableCell>{searchResult.fullName}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={headerCellStyle}>KYC Verified</TableCell>
                  <TableCell>
                    {searchResult.kycVerified ? (
                      <Alert severity="success" icon={<VerifiedUserIcon />}>Verified</Alert>
                    ) : (
                      <Alert severity="warning" icon={<LockOpenIcon />}>Not Verified</Alert>
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Verification Date</TableCell>
                  <TableCell>{searchResult.verificationDate || 'N/A'}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Risk Score</TableCell>
                  <TableCell>{searchResult.riskScore}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={headerCellStyle}>Country Code</TableCell>
                  <TableCell>{searchResult.countryCode}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
  
  // Render submit KYC form
  const renderSubmitForm = () => (
    <Box component={Paper} p={3} mb={3}>
      <Typography variant="h6" gutterBottom>
        <AddCircleOutlineIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Submit New KYC Record
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="User ID"
            name="userId"
            variant="outlined"
            value={newKYCData.userId}
            onChange={handleNewKYCChange}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Solana Address"
            name="solanaAddress"
            variant="outlined"
            value={newKYCData.solanaAddress}
            onChange={handleNewKYCChange}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            variant="outlined"
            value={newKYCData.fullName}
            onChange={handleNewKYCChange}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="country-label">Country Code</InputLabel>
            <Select
              labelId="country-label"
              label="Country Code"
              name="countryCode"
              value={newKYCData.countryCode}
              onChange={handleNewKYCChange}
              required
            >
              <MenuItem value="US">United States (US)</MenuItem>
              <MenuItem value="IN">India (IN)</MenuItem>
              <MenuItem value="CA">Canada (CA)</MenuItem>
              <MenuItem value="UK">United Kingdom (UK)</MenuItem>
              <MenuItem value="AU">Australia (AU)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleSubmitKYC}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AddCircleOutlineIcon />}
          >
            Submit KYC Data
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Render update KYC form
  const renderUpdateForm = () => (
    <Box component={Paper} p={3} mb={3}>
      <Typography variant="h6" gutterBottom>
        <VerifiedUserIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Update KYC Verification Status
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="User ID"
            name="userId"
            variant="outlined"
            value={updateKYCData.userId}
            onChange={handleUpdateKYCChange}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Solana Address"
            name="solanaAddress"
            variant="outlined"
            value={updateKYCData.solanaAddress}
            onChange={handleUpdateKYCChange}
            required
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="verified-label">KYC Verified</InputLabel>
            <Select
              labelId="verified-label"
              label="KYC Verified"
              name="kycVerified"
              value={updateKYCData.kycVerified}
              onChange={handleUpdateKYCChange}
              required
            >
              <MenuItem value="true">Yes (Verified)</MenuItem>
              <MenuItem value="false">No (Not Verified)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Risk Score (0-100)"
            name="riskScore"
            type="number"
            variant="outlined"
            value={updateKYCData.riskScore}
            onChange={handleUpdateKYCChange}
            InputProps={{ inputProps: { min: 0, max: 100 } }}
            required
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleUpdateKYC}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <VerifiedUserIcon />}
          >
            Update KYC Status
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
  
  // Render country search form
  const renderCountrySearch = () => (
    <Box component={Paper} p={3} mb={3}>
      <Typography variant="h6" gutterBottom>
        <SearchIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Search KYC Records by Country
      </Typography>
      <Divider sx={{ mb: 2 }} />
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          <FormControl fullWidth variant="outlined">
            <InputLabel id="country-filter-label">Country Code</InputLabel>
            <Select
              labelId="country-filter-label"
              label="Country Code"
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value as string)}
              required
            >
              <MenuItem value="US">United States (US)</MenuItem>
              <MenuItem value="IN">India (IN)</MenuItem>
              <MenuItem value="CA">Canada (CA)</MenuItem>
              <MenuItem value="UK">United Kingdom (UK)</MenuItem>
              <MenuItem value="AU">Australia (AU)</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={4}>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={handleCountrySearch}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            Search
          </Button>
        </Grid>
      </Grid>
      
      {countryResults.length > 0 && (
        <Box mt={3}>
          <Typography variant="h6" gutterBottom>
            KYC Records for {countryFilter}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellStyle}>User ID</TableCell>
                  <TableCell sx={headerCellStyle}>Solana Address</TableCell>
                  <TableCell sx={headerCellStyle}>Full Name</TableCell>
                  <TableCell sx={headerCellStyle}>KYC Status</TableCell>
                  <TableCell sx={headerCellStyle}>Risk Score</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {countryResults.map((record, index) => (
                  <TableRow key={index}>
                    <TableCell>{record.userId}</TableCell>
                    <TableCell>{record.solanaAddress}</TableCell>
                    <TableCell>{record.fullName}</TableCell>
                    <TableCell>
                      {record.kycVerified ? (
                        <Alert severity="success" icon={<VerifiedUserIcon />}>Verified</Alert>
                      ) : (
                        <Alert severity="warning" icon={<LockOpenIcon />}>Not Verified</Alert>
                      )}
                    </TableCell>
                    <TableCell>{record.riskScore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1" gutterBottom>
          KYC Admin Dashboard
        </Typography>
        <StyledWalletButton>
          <WalletMultiButton />
        </StyledWalletButton>
      </Box>
      
      {!connected && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Please connect your wallet to use all features
        </Alert>
      )}
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      
      <Box mb={4}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant={activeTab === 'search' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('search')}
              sx={{ mb: 2 }}
            >
              Search KYC
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant={activeTab === 'submit' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('submit')}
              sx={{ mb: 2 }}
            >
              Submit KYC
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant={activeTab === 'update' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('update')}
              sx={{ mb: 2 }}
            >
              Update KYC Status
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              fullWidth
              variant={activeTab === 'country' ? 'contained' : 'outlined'}
              onClick={() => setActiveTab('country')}
              sx={{ mb: 2 }}
            >
              Search by Country
            </Button>
          </Grid>
        </Grid>
      </Box>
      
      {activeTab === 'search' && renderSearchForm()}
      {activeTab === 'submit' && renderSubmitForm()}
      {activeTab === 'update' && renderUpdateForm()}
      {activeTab === 'country' && renderCountrySearch()}
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
};

export default KYCAdmin; 