import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  SwapHoriz as SwapIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { useWallet } from '@solana/wallet-adapter-react';
import { 
  fetchLiquidityPools, 
  createLiquidityPool, 
  updatePoolRate, 
  performSwap 
} from '../services/apiService';

interface Pool {
  address?: string; // Pool address on blockchain
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

interface PoolResponse {
  success: boolean;
  pool?: Pool;
  pools?: Pool[];
  message?: string;
  error?: string;
}

const LiquidityPools: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Dialog states
  const [createPoolOpen, setCreatePoolOpen] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [rateUpdateOpen, setRateUpdateOpen] = useState(false);
  
  // Form states
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

  // Load pools on component mount
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
        // Use setTimeout to make this non-blocking
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
        poolAddress: selectedPool.address || selectedPool.name, // Use address if available, fallback to name
        newExchangeRate: parseFloat(newRate)
      });
      
      if (data.success) {
        setSuccess(`Pool rate updated successfully! New rate: ${data.newRate}`);
        setRateUpdateOpen(false);
        loadPools(); // Refresh the list
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
    if (!selectedPool || !connected || !publicKey) {
      setError('Please select a pool and connect your wallet');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await (performSwap as any)({
        poolAddress: selectedPool.address || selectedPool.name, // Use address if available, fallback to name
        amountIn: parseFloat(swapAmount),
        minimumAmountOut: parseFloat(minAmountOut),
        userSourceAccount: publicKey.toString(),
        userDestinationAccount: publicKey.toString(),
        poolSourceAccount: selectedPool.sourceMint,
        poolDestinationAccount: selectedPool.destinationMint
      });
      
      if (data.success) {
        setSuccess(`Swap completed successfully! Amount out: ${data.amountOut}`);
        setSwapDialogOpen(false);
        loadPools(); // Refresh the list
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Liquidity Pools
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage and test liquidity pools for currency swaps
        </Typography>

        {/* Status Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreatePoolOpen(true)}
            disabled={loading || !connected}
          >
            Create Pool
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadPools}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<TrendingUpIcon />}
            onClick={() => setRateUpdateOpen(true)}
            disabled={loading || pools.length === 0}
          >
            Update Rate
          </Button>
          <Button
            variant="outlined"
            startIcon={<SwapIcon />}
            onClick={() => setSwapDialogOpen(true)}
            disabled={loading || pools.length === 0}
          >
            Test Swap
          </Button>
        </Box>

        {/* Wallet Connection Status */}
        {!connected && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <InfoIcon sx={{ mr: 1 }} />
            Please connect your wallet to interact with liquidity pools
          </Alert>
        )}
      </Box>

      {/* Pools Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Pools
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : pools.length === 0 ? (
            <Alert severity="info">
              No pools found. Create your first pool to get started.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Pool Name</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Currency Pair</TableCell>
                    <TableCell>Exchange Rate</TableCell>
                    <TableCell>Fee Rate</TableCell>
                    <TableCell>Total Volume</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pools.map((pool, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {pool.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                          {pool.address ? `${pool.address.slice(0, 8)}...${pool.address.slice(-8)}` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${pool.sourceCurrency}/${pool.destinationCurrency}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(pool.exchangeRate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {pool.poolFeeRate}%
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatCurrency(pool.totalVolume)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={pool.isActive ? 'Active' : 'Inactive'}
                          size="small"
                          color={pool.isActive ? 'success' : 'default'}
                          icon={pool.isActive ? <CheckCircleIcon /> : <ErrorIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(pool.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Select for operations">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedPool(pool)}
                            color={selectedPool?.name === pool.name ? 'primary' : 'default'}
                          >
                            <InfoIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Create Pool Dialog */}
      <Dialog open={createPoolOpen} onClose={() => setCreatePoolOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Liquidity Pool</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a new liquidity pool for testing
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            This will create a real pool on Solana devnet
          </Alert>
          
          <TextField
            fullWidth
            label="Pool Name"
            value={newPool.name}
            onChange={(e) => setNewPool({...newPool, name: e.target.value})}
            sx={{ mb: 2 }}
            placeholder="e.g., EUR-USD Pool"
          />
          
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Source Currency</InputLabel>
                <Select
                  value={newPool.sourceCurrency}
                  onChange={(e) => setNewPool({...newPool, sourceCurrency: e.target.value})}
                >
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="INR">INR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="JPY">JPY</MenuItem>
                  <MenuItem value="CAD">CAD</MenuItem>
                  <MenuItem value="AUD">AUD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Destination Currency</InputLabel>
                <Select
                  value={newPool.destinationCurrency}
                  onChange={(e) => setNewPool({...newPool, destinationCurrency: e.target.value})}
                >
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="INR">INR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                  <MenuItem value="JPY">JPY</MenuItem>
                  <MenuItem value="CAD">CAD</MenuItem>
                  <MenuItem value="AUD">AUD</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <TextField
            fullWidth
            label="Exchange Rate"
            type="number"
            value={newPool.exchangeRate}
            onChange={(e) => setNewPool({...newPool, exchangeRate: parseFloat(e.target.value) || 1.0})}
            sx={{ mb: 2 }}
            inputProps={{ step: "0.01", min: "0.01" }}
          />
          
          <TextField
            fullWidth
            label="Pool Fee Rate (%)"
            type="number"
            value={newPool.poolFeeRate}
            onChange={(e) => setNewPool({...newPool, poolFeeRate: parseInt(e.target.value) || 30})}
            sx={{ mb: 2 }}
            inputProps={{ min: "1", max: "100" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePoolOpen(false)}>Cancel</Button>
          <Button onClick={createPool} variant="contained" disabled={loading || !newPool.name}>
            {loading ? <CircularProgress size={20} /> : 'Create Pool'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Rate Dialog */}
      <Dialog open={rateUpdateOpen} onClose={() => setRateUpdateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Pool Exchange Rate</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Pool</InputLabel>
            <Select
              value={selectedPool?.name || ''}
              onChange={(e) => {
                const pool = pools.find(p => p.name === e.target.value);
                setSelectedPool(pool || null);
              }}
            >
              {pools.map((pool, index) => (
                <MenuItem key={index} value={pool.name}>
                  {pool.name} ({pool.sourceCurrency}/{pool.destinationCurrency})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="New Exchange Rate"
            type="number"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            inputProps={{ step: "0.01", min: "0.01" }}
            sx={{ mb: 2 }}
          />
          {selectedPool && (
            <Alert severity="info">
              Current rate: {formatCurrency(selectedPool.exchangeRate)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRateUpdateOpen(false)}>Cancel</Button>
          <Button onClick={updatePoolRate} variant="contained" disabled={loading || !selectedPool}>
            {loading ? <CircularProgress size={20} /> : 'Update Rate'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Swap Dialog */}
      <Dialog open={swapDialogOpen} onClose={() => setSwapDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Test Currency Swap</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Pool</InputLabel>
            <Select
              value={selectedPool?.name || ''}
              onChange={(e) => {
                const pool = pools.find(p => p.name === e.target.value);
                setSelectedPool(pool || null);
              }}
            >
              {pools.map((pool, index) => (
                <MenuItem key={index} value={pool.name}>
                  {pool.name} ({pool.sourceCurrency}/{pool.destinationCurrency})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Amount In"
            type="number"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
            inputProps={{ step: "0.01", min: "0.01" }}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Minimum Amount Out"
            type="number"
            value={minAmountOut}
            onChange={(e) => setMinAmountOut(e.target.value)}
            inputProps={{ step: "0.01", min: "0.01" }}
            sx={{ mb: 2 }}
          />
          
          {selectedPool && (
            <Alert severity="info">
              Current rate: {formatCurrency(selectedPool.exchangeRate)} | 
              Fee: {selectedPool.poolFeeRate}%
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSwapDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSwap} variant="contained" disabled={loading || !selectedPool}>
            {loading ? <CircularProgress size={20} /> : 'Execute Swap'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LiquidityPools;
