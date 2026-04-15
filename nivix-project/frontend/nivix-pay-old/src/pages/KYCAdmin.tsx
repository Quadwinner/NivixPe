import React, { useState, useEffect } from 'react';

const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

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
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
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
  
  useEffect(() => {
    if (connected && publicKey) {
      const address = publicKey.toString();
      setNewKYCData(prev => ({ ...prev, solanaAddress: address }));
      setSearchAddress(address);
    }
  }, [connected, publicKey]);
  
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 6000);
  };
  
  const handleNewKYCChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewKYCData({ ...newKYCData, [name]: value });
  };
  
  const handleUpdateKYCChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUpdateKYCData({ ...updateKYCData, [name]: value });
  };
  
  const handleSearch = async () => {
    if (!searchAddress) {
      showNotification('Please enter a Solana address', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSearchResult(null);
    
    try {
      const blockchainResponse = await fetch('http://localhost:3002/api/fabric/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcn: 'GetKYCStatus',
          args: [searchAddress]
        })
      });
      
      const responseJson = await blockchainResponse.json();
      
      if (!responseJson.success || !responseJson.data) {
        showNotification('No KYC record found for this address', 'error');
        return;
      }
      
      const outputData = responseJson.data;
      
      if (outputData.includes('no KYC record found') || outputData.includes('Error:')) {
        showNotification('No KYC record found for this address', 'error');
        return;
      }
      
      const jsonStartIndex = outputData.lastIndexOf('{');
      const jsonEndIndex = outputData.lastIndexOf('}') + 1;
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        const jsonPart = outputData.substring(jsonStartIndex, jsonEndIndex);
        
        try {
          const blockchainData = JSON.parse(jsonPart);
          
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
          showNotification('Error parsing KYC data from blockchain', 'error');
        }
      } else {
        showNotification('Invalid blockchain data format', 'error');
      }
    } catch (error) {
      setError('Failed to retrieve KYC data from blockchain. Please ensure the blockchain network and bridge service are running.');
      showNotification('Error fetching KYC data from blockchain', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitKYC = async () => {
    if (!newKYCData.userId || !newKYCData.solanaAddress || !newKYCData.fullName || !newKYCData.countryCode) {
      showNotification('Please fill all required fields', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const blockchainResponse = await fetch('http://localhost:3002/api/fabric/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      if (!responseJson.success) {
        throw new Error('Failed to submit KYC data to blockchain');
      }
      
      setSuccess('KYC data submitted successfully to blockchain');
      showNotification('KYC data submitted successfully to blockchain', 'success');
      
      setNewKYCData({
        userId: '',
        solanaAddress: connected && publicKey ? publicKey.toString() : '',
        fullName: '',
        countryCode: '',
        idDocuments: ['passport']
      });
    } catch (error) {
      setError('Failed to submit KYC data to blockchain');
      showNotification('Error submitting KYC data to blockchain', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateKYC = async () => {
    if (!updateKYCData.userId || !updateKYCData.solanaAddress) {
      showNotification('Please fill all required fields', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const blockchainResponse = await fetch('http://localhost:3002/api/fabric/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      
      if (!responseJson.success) {
        throw new Error('Failed to update KYC status on blockchain');
      }
      
      showNotification('KYC status updated successfully on blockchain', 'success');
      setSuccess('KYC status updated successfully on blockchain');
      
      setUpdateKYCData({
        userId: '',
        solanaAddress: '',
        kycVerified: 'true',
        riskScore: '50'
      });
    } catch (error) {
      setError('Failed to update KYC status on blockchain');
      showNotification('Error updating KYC status on blockchain', 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCountrySearch = async () => {
    if (!countryFilter) {
      showNotification('Please enter a country code', 'error');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const blockchainResponse = await fetch('http://localhost:3002/api/fabric/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcn: 'QueryKYCByCountry',
          args: [countryFilter]
        })
      });
      
      const responseJson = await blockchainResponse.json();
      
      if (!responseJson.success || !responseJson.data) {
        setCountryResults([]);
        showNotification(`No KYC records found for country ${countryFilter}`, 'error');
        return;
      }
      
      const outputData = responseJson.data;
      const jsonStartIndex = outputData.lastIndexOf('[');
      const jsonEndIndex = outputData.lastIndexOf(']') + 1;
      
      if (jsonStartIndex >= 0 && jsonEndIndex > jsonStartIndex) {
        const jsonPart = outputData.substring(jsonStartIndex, jsonEndIndex);
        
        try {
          const recordsData = JSON.parse(jsonPart);
          
          if (Array.isArray(recordsData) && recordsData.length > 0) {
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
          setCountryResults([]);
          showNotification(`Error parsing KYC records for country ${countryFilter}`, 'error');
        }
      } else {
        setCountryResults([]);
        showNotification(`No KYC records found for country ${countryFilter}`, 'error');
      }
    } catch (error) {
      setError('Failed to search KYC by country on blockchain');
      showNotification('Error searching KYC by country on blockchain', 'error');
      setCountryResults([]);
    } finally {
      setLoading(false);
    }
  };
  
  const tabs = [
    { id: 'search', label: 'Search KYC', icon: SearchIcon },
    { id: 'submit', label: 'Submit KYC', icon: AddCircleOutlineIcon },
    { id: 'update', label: 'Update Status', icon: VerifiedUserIcon },
    { id: 'country', label: 'Search by Country', icon: SearchIcon }
  ];
  
  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text">KYC Admin Dashboard</h1>
        <WalletMultiButton />
      </div>
      
      {!connected && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm text-yellow-800">Please connect your wallet to use all features</p>
        </div>
      )}
      
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}
      
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg flex items-center gap-3 ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {notification.message}
          </p>
          <button onClick={() => setNotification(null)} className="text-text-muted hover:text-text">
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`p-4 rounded-xl border transition-all duration-200 flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-accent text-white border-accent'
                  : 'bg-surface border-border text-text hover:bg-gray-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
      
      {activeTab === 'search' && (
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <SearchIcon className="w-6 h-6 text-text-muted" />
            <h2 className="text-xl font-semibold text-text">Search KYC Record</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-3">
              <Input
            label="Solana Address"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
                placeholder="Enter Solana address"
          />
            </div>
          <Button
              variant="primary"
            onClick={handleSearch}
            disabled={loading}
              className="flex items-center justify-center gap-2"
          >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <SearchIcon className="w-5 h-5" />
              )}
            Search
          </Button>
          </div>
      
      {searchResult && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-text mb-4">KYC Record</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {Object.entries(searchResult).map(([key, value]) => (
                      <tr key={key} className="border-b border-border">
                        <td className="py-3 px-4 bg-gray-50 font-semibold text-text text-sm">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </td>
                        <td className="py-3 px-4 text-text">
                          {key === 'kycVerified' ? (
                            <Badge variant={value ? 'success' : 'warning'}>
                              {value ? 'Verified' : 'Not Verified'}
                            </Badge>
                    ) : (
                            String(value)
                    )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
      
      {activeTab === 'submit' && (
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <AddCircleOutlineIcon className="w-6 h-6 text-text-muted" />
            <h2 className="text-xl font-semibold text-text">Submit New KYC Record</h2>
          </div>
      
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
            label="User ID"
            name="userId"
            value={newKYCData.userId}
            onChange={handleNewKYCChange}
            required
          />
            <Input
            label="Solana Address"
            name="solanaAddress"
            value={newKYCData.solanaAddress}
            onChange={handleNewKYCChange}
            required
          />
            <Input
            label="Full Name"
            name="fullName"
            value={newKYCData.fullName}
            onChange={handleNewKYCChange}
            required
          />
            <div>
              <label className="block text-sm font-medium text-text mb-2">Country Code</label>
              <select
              name="countryCode"
              value={newKYCData.countryCode}
              onChange={handleNewKYCChange}
                className="input"
              required
            >
                <option value="">Select Country</option>
                <option value="US">United States (US)</option>
                <option value="IN">India (IN)</option>
                <option value="CA">Canada (CA)</option>
                <option value="UK">United Kingdom (UK)</option>
                <option value="AU">Australia (AU)</option>
              </select>
            </div>
            <div className="md:col-span-2">
          <Button
                variant="primary"
            onClick={handleSubmitKYC}
            disabled={loading}
                className="w-full flex items-center justify-center gap-2"
          >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <AddCircleOutlineIcon className="w-5 h-5" />
                )}
            Submit KYC Data
          </Button>
            </div>
          </div>
        </Card>
      )}
      
      {activeTab === 'update' && (
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <VerifiedUserIcon className="w-6 h-6 text-text-muted" />
            <h2 className="text-xl font-semibold text-text">Update KYC Verification Status</h2>
          </div>
      
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
            label="User ID"
            name="userId"
            value={updateKYCData.userId}
            onChange={handleUpdateKYCChange}
            required
          />
            <Input
            label="Solana Address"
            name="solanaAddress"
            value={updateKYCData.solanaAddress}
            onChange={handleUpdateKYCChange}
            required
          />
            <div>
              <label className="block text-sm font-medium text-text mb-2">KYC Verified</label>
              <select
              name="kycVerified"
              value={updateKYCData.kycVerified}
              onChange={handleUpdateKYCChange}
                className="input"
              required
            >
                <option value="true">Yes (Verified)</option>
                <option value="false">No (Not Verified)</option>
              </select>
            </div>
            <Input
            label="Risk Score (0-100)"
            name="riskScore"
            type="number"
            value={updateKYCData.riskScore}
            onChange={handleUpdateKYCChange}
              min="0"
              max="100"
            required
          />
            <div className="md:col-span-2">
          <Button
                variant="primary"
            onClick={handleUpdateKYC}
            disabled={loading}
                className="w-full flex items-center justify-center gap-2"
          >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <VerifiedUserIcon className="w-5 h-5" />
                )}
            Update KYC Status
          </Button>
            </div>
          </div>
        </Card>
      )}
      
      {activeTab === 'country' && (
        <Card>
          <div className="flex items-center gap-2 mb-6">
            <SearchIcon className="w-6 h-6 text-text-muted" />
            <h2 className="text-xl font-semibold text-text">Search KYC Records by Country</h2>
          </div>
      
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="md:col-span-3">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Country Code</label>
                <select
              value={countryFilter}
                  onChange={(e) => setCountryFilter(e.target.value)}
                  className="input"
              required
            >
                  <option value="">Select Country</option>
                  <option value="US">United States (US)</option>
                  <option value="IN">India (IN)</option>
                  <option value="CA">Canada (CA)</option>
                  <option value="UK">United Kingdom (UK)</option>
                  <option value="AU">Australia (AU)</option>
                </select>
              </div>
            </div>
          <Button
              variant="primary"
            onClick={handleCountrySearch}
            disabled={loading}
              className="flex items-center justify-center gap-2"
          >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <SearchIcon className="w-5 h-5" />
              )}
            Search
          </Button>
          </div>
      
      {countryResults.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-text mb-4">
            KYC Records for {countryFilter}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">User ID</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Solana Address</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Full Name</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">KYC Status</th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                {countryResults.map((record, index) => (
                      <tr key={index} className="border-b border-border hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-text">{record.userId}</td>
                        <td className="py-3 px-4 text-sm text-text">{record.solanaAddress}</td>
                        <td className="py-3 px-4 text-sm text-text">{record.fullName}</td>
                        <td className="py-3 px-4">
                          <Badge variant={record.kycVerified ? 'success' : 'warning'}>
                            {record.kycVerified ? 'Verified' : 'Not Verified'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-text">{record.riskScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default KYCAdmin; 
