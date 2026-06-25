import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import LanguageIcon from '@mui/icons-material/Language';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { connected, publicKey, disconnect } = useWallet();
  const [copySuccess, setCopySuccess] = useState(false);
  
  const [userData, setUserData] = useState({
    username: 'Nivix User',
    email: 'user@nivixpay.com',
    avatar: '',
    notificationsEnabled: true,
    language: 'en',
    kycVerified: true,
    homeCurrency: 'USD'
  });

  const handleCopyAddress = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey.toString());
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setUserData({ ...userData, [name]: checked });
  };

  if (!connected) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text mb-4">User Profile</h1>
          <p className="text-lg text-text-muted mb-8">
            Connect your wallet to view and manage your profile
          </p>
          
          <Card className="max-w-md mx-auto bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-text mb-2">Connect Wallet</h2>
              <p className="text-sm text-text-muted mb-6">
                Connect your Solana wallet to access your profile
              </p>
                  <WalletMultiButton />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card>
            <div className="flex flex-col items-center mb-6">
              <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center text-white text-3xl font-bold mb-4">
                {userData.username.charAt(0).toUpperCase()}
              </div>
              
              <h2 className="text-xl font-semibold text-text mb-1">{userData.username}</h2>
              <p className="text-sm text-text-muted mb-4">{userData.email}</p>
              
              {userData.kycVerified ? (
                <Badge variant="success" className="flex items-center gap-1">
                  <VerifiedUserIcon className="w-4 h-4" />
                  KYC Verified
                </Badge>
              ) : (
                <Button size="sm" variant="outline" onClick={() => navigate('/kyc')}>
                  Complete KYC
                </Button>
              )}
            </div>
            
            <div className="border-t border-border pt-6 mb-6">
              <h4 className="text-sm font-semibold text-text mb-3">Wallet Address</h4>
            
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
                <p className="text-xs text-text-muted truncate flex-1 mr-2">
                {publicKey?.toString()}
                </p>
                <button
                onClick={handleCopyAddress}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    copySuccess
                      ? 'bg-green-100 text-green-700'
                      : 'bg-accent text-white hover:bg-accent-700'
                  }`}
              >
                  <ContentCopyIcon className="w-3 h-3" />
                {copySuccess ? 'Copied' : 'Copy'}
                </button>
              </div>
            
            <Button 
                variant="outline" 
                className="w-full"
              onClick={() => disconnect()}
            >
              Disconnect Wallet
            </Button>
            </div>
          </Card>
        </div>
        
        {/* Settings */}
        <div className="md:col-span-2">
          <Card>
            <h2 className="text-2xl font-semibold text-text mb-6">Account Settings</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <Input
                  label="Username"
                  name="username"
                  value={userData.username}
                  onChange={handleSettingsChange}
                />
              <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={userData.email}
                  onChange={handleSettingsChange}
                />
              <div>
                <label className="block text-sm font-medium text-text mb-2">Home Currency</label>
                <select
                    name="homeCurrency"
                    value={userData.homeCurrency}
                    onChange={handleSelectChange}
                  className="input"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-text mb-2">Language</label>
                <select
                    name="language"
                    value={userData.language}
                    onChange={handleSelectChange}
                  className="input"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="hi">Hindi</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
            </div>
            
            <div className="border-t border-border pt-6 mb-6">
              <h3 className="text-lg font-semibold text-text mb-4">Preferences</h3>
            
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <NotificationsIcon className="w-5 h-5 text-text-muted" />
                  <div>
                    <p className="text-sm font-medium text-text">Notifications</p>
                    <p className="text-xs text-text-muted">Receive alerts for transactions and updates</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                  name="notificationsEnabled"
                  checked={userData.notificationsEnabled}
                  onChange={handleToggleChange}
                    className="sr-only peer"
                />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                </label>
              </div>
            </div>
            
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold text-text mb-4">Security</h3>
            
              <div className="space-y-3">
                <div 
                  onClick={() => navigate('/kyc')}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <VerifiedUserIcon className="w-5 h-5 text-text-muted" />
                    <div>
                      <p className="text-sm font-medium text-text">KYC Verification</p>
                      <p className="text-xs text-text-muted">
                        {userData.kycVerified ? 'Verified' : 'Not verified'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={userData.kycVerified ? 'success' : 'warning'}>
                    {userData.kycVerified ? 'Complete' : 'Incomplete'}
                  </Badge>
                </div>
              
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <SecurityIcon className="w-5 h-5 text-text-muted" />
                    <div>
                      <p className="text-sm font-medium text-text">Security Settings</p>
                      <p className="text-xs text-text-muted">Configure 2FA and other security options</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button variant="primary">Save Changes</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile; 
