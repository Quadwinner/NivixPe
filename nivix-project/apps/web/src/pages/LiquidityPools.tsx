import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import AddIcon from '@mui/icons-material/Add';
import SwapIcon from '@mui/icons-material/SwapHoriz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RefreshIcon from '@mui/icons-material/Refresh';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import { 
  fetchLiquidityPools, 
  createLiquidityPool, 
  updatePoolRate, 
  performSwap 
} from '../services/apiService';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';

interface Pool {
  address?: string;
  name: string;
  admin: string;
  sourceCurrency: string;
  destinationCurrency: string;
  sourceMint: string;
  destinationMint: string;
  exchangeRate: string;
  poolFeeRate: string;
  totalSwapped: string;
  totalVolume: string;
  lastUpdated: string;
  isActive: boolean;
  createdAt: string;
}

const LiquidityPools: React.FC = () => {
  const { connected, publicKey, signTransaction } = useWallet();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [createPoolOpen, setCreatePoolOpen] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [rateUpdateOpen, setRateUpdateOpen] = useState(false);
  
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [swapAmount, setSwapAmount] = useState('');
  const [minAmountOut, setMinAmountOut] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newPool, setNewPool] = useState({
    name: '',
    sourceCurrency: 'EUR',
    destinationCurrency: 'USD',
    exchangeRate: 1.1,
    poolFeeRate: 30
  });

  const loadPools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchLiquidityPools();
      if (data.success && data.pools) {
        setPools(data.pools);
      } else {
        setError(data.message || 'Failed to load pools');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPools();
  }, []);

  const createPool = async () => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await createLiquidityPool(newPool);
      if (data.success) {
        setSuccess(`Pool created successfully! Transaction: ${data.transaction}`);
        setCreatePoolOpen(false);
        setTimeout(() => loadPools(), 100);
      } else {
        setError(data.message || 'Failed to create pool');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updatePoolRate = async () => {
    if (!selectedPool) return;
    setLoading(true);
    setError(null);
    try {
      const data = await (updatePoolRate as any)({
        poolAddress: selectedPool.address || selectedPool.name,
        newExchangeRate: parseFloat(newRate)
      });
      if (data.success) {
        setSuccess(`Pool rate updated successfully! New rate: ${data.newRate}`);
        setRateUpdateOpen(false);
        loadPools();
      } else {
        setError(data.message || 'Failed to update pool rate');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = async () => {
    if (!selectedPool || !connected || !publicKey || !signTransaction) {
      setError('Please select a pool and connect your wallet');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await (performSwap as any)({
        poolAddress: selectedPool.address || selectedPool.name,
        amountIn: parseFloat(swapAmount),
        minimumAmountOut: parseFloat(minAmountOut),
        userSourceAccount: publicKey.toString(),
        userDestinationAccount: publicKey.toString(),
        poolSourceAccount: selectedPool.sourceMint,
        poolDestinationAccount: selectedPool.destinationMint
      }, signTransaction);
      if (data.success) {
        setSuccess(`Swap completed successfully! Amount out: ${data.amountOut}`);
        setSwapDialogOpen(false);
        loadPools();
      } else {
        setError(data.message || 'Failed to perform swap');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(parseInt(timestamp)).toLocaleString();
  };

  const formatCurrency = (amount: string) => {
    return parseFloat(amount).toFixed(2);
  };

  return (
    <div className="max-w-7xl mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-text mb-2">Liquidity Pools</h1>
        <p className="text-text-muted mb-6">
          Manage and test liquidity pools for currency swaps
        </p>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center justify-between">
            <p className="text-sm text-green-800">{success}</p>
            <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant="primary"
            onClick={() => setCreatePoolOpen(true)}
            disabled={loading || !connected}
            className="flex items-center gap-2"
          >
            <AddIcon className="w-5 h-5" />
            Create Pool
          </Button>
          <Button
            variant="secondary"
            onClick={loadPools}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshIcon className="w-5 h-5" />
            Refresh
          </Button>
          <Button
            variant="secondary"
            onClick={() => setRateUpdateOpen(true)}
            disabled={loading || pools.length === 0}
            className="flex items-center gap-2"
          >
            <TrendingUpIcon className="w-5 h-5" />
            Update Rate
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSwapDialogOpen(true)}
            disabled={loading || pools.length === 0}
            className="flex items-center gap-2"
          >
            <SwapIcon className="w-5 h-5" />
            Test Swap
          </Button>
        </div>

        {!connected && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2">
            <InfoIcon className="w-5 h-5 text-blue-600" />
            <p className="text-sm text-blue-800">
            Please connect your wallet to interact with liquidity pools
            </p>
          </div>
        )}
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-text mb-6">Active Pools</h2>
          
          {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          </div>
          ) : pools.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-muted">No pools found. Create your first pool to get started.</p>
          </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Pool Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Address</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Currency Pair</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Exchange Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Fee Rate</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Total Volume</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                  {pools.map((pool, index) => (
                  <tr key={index} className="border-b border-border hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <p className="text-sm font-semibold text-text">{pool.name}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs font-mono text-text-muted">
                          {pool.address ? `${pool.address.slice(0, 8)}...${pool.address.slice(-8)}` : 'N/A'}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="info">
                        {pool.sourceCurrency}/{pool.destinationCurrency}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-text">{formatCurrency(pool.exchangeRate)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-text">{pool.poolFeeRate}%</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-text">{formatCurrency(pool.totalVolume)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant={pool.isActive ? 'success' : 'default'}>
                        {pool.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs text-text-muted">{formatDate(pool.createdAt)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <button
                            onClick={() => setSelectedPool(pool)}
                        className={`p-2 rounded-xl transition-colors ${
                          selectedPool?.name === pool.name
                            ? 'bg-accent text-white'
                            : 'bg-gray-100 text-text-muted hover:bg-gray-200'
                        }`}
                        title="Select for operations"
                          >
                        <InfoIcon className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                  ))}
              </tbody>
            </table>
          </div>
          )}
      </Card>

      {/* Create Pool Modal */}
      {createPoolOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface rounded-2xl shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text">Create New Liquidity Pool</h3>
              <button onClick={() => setCreatePoolOpen(false)} className="text-text-muted hover:text-text">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-text-muted mb-4">
            Create a new liquidity pool for testing
              </p>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                <p className="text-sm text-blue-800">This will create a real pool on Solana devnet</p>
              </div>
          
              <Input
            label="Pool Name"
            value={newPool.name}
            onChange={(e) => setNewPool({...newPool, name: e.target.value})}
            placeholder="e.g., EUR-USD Pool"
          />
          
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Source Currency</label>
                  <select
                  value={newPool.sourceCurrency}
                  onChange={(e) => setNewPool({...newPool, sourceCurrency: e.target.value})}
                    className="input"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text mb-2">Destination Currency</label>
                  <select
                  value={newPool.destinationCurrency}
                  onChange={(e) => setNewPool({...newPool, destinationCurrency: e.target.value})}
                    className="input"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="INR">INR</option>
                    <option value="GBP">GBP</option>
                    <option value="JPY">JPY</option>
                    <option value="CAD">CAD</option>
                    <option value="AUD">AUD</option>
                  </select>
                </div>
              </div>
          
              <Input
            label="Exchange Rate"
            type="number"
                value={newPool.exchangeRate.toString()}
            onChange={(e) => setNewPool({...newPool, exchangeRate: parseFloat(e.target.value) || 1.0})}
                step="0.01"
                min="0.01"
          />
          
              <Input
            label="Pool Fee Rate (%)"
            type="number"
                value={newPool.poolFeeRate.toString()}
            onChange={(e) => setNewPool({...newPool, poolFeeRate: parseInt(e.target.value) || 30})}
                min="1"
                max="100"
          />
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setCreatePoolOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={createPool} disabled={loading || !newPool.name}>
                {loading ? 'Creating...' : 'Create Pool'}
          </Button>
            </div>
          </div>
        </div>
      )}

      {/* Update Rate Modal */}
      {rateUpdateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface rounded-2xl shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text">Update Pool Exchange Rate</h3>
              <button onClick={() => setRateUpdateOpen(false)} className="text-text-muted hover:text-text">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Select Pool</label>
                <select
              value={selectedPool?.name || ''}
              onChange={(e) => {
                const pool = pools.find(p => p.name === e.target.value);
                setSelectedPool(pool || null);
              }}
                  className="input"
            >
                  <option value="">Select a pool</option>
              {pools.map((pool, index) => (
                    <option key={index} value={pool.name}>
                  {pool.name} ({pool.sourceCurrency}/{pool.destinationCurrency})
                    </option>
              ))}
                </select>
              </div>
              <Input
            label="New Exchange Rate"
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
                step="0.01"
                min="0.01"
          />
          {selectedPool && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
              Current rate: {formatCurrency(selectedPool.exchangeRate)}
                  </p>
                </div>
          )}
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRateUpdateOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={updatePoolRate} disabled={loading || !selectedPool}>
                {loading ? 'Updating...' : 'Update Rate'}
          </Button>
            </div>
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {swapDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-surface rounded-2xl shadow-lg max-w-md w-full mx-4">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-xl font-semibold text-text">Test Currency Swap</h3>
              <button onClick={() => setSwapDialogOpen(false)} className="text-text-muted hover:text-text">
                <CloseIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text mb-2">Select Pool</label>
                <select
              value={selectedPool?.name || ''}
              onChange={(e) => {
                const pool = pools.find(p => p.name === e.target.value);
                setSelectedPool(pool || null);
              }}
                  className="input"
            >
                  <option value="">Select a pool</option>
              {pools.map((pool, index) => (
                    <option key={index} value={pool.name}>
                  {pool.name} ({pool.sourceCurrency}/{pool.destinationCurrency})
                    </option>
              ))}
                </select>
              </div>
              <Input
            label="Amount In"
            type="number"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
                step="0.01"
                min="0.01"
          />
              <Input
            label="Minimum Amount Out"
            type="number"
            value={minAmountOut}
            onChange={(e) => setMinAmountOut(e.target.value)}
                step="0.01"
                min="0.01"
          />
          {selectedPool && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800">
              Current rate: {formatCurrency(selectedPool.exchangeRate)} | 
              Fee: {selectedPool.poolFeeRate}%
                  </p>
                </div>
          )}
            </div>
            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setSwapDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSwap} disabled={loading || !selectedPool}>
                {loading ? 'Executing...' : 'Execute Swap'}
          </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquidityPools;
