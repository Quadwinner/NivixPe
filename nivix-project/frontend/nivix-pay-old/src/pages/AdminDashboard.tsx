import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Tabs,
  Tab,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  AccountBalance as TreasuryIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminDashboard: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [treasuryData, setTreasuryData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BRIDGE_URL = (process.env.REACT_APP_BRIDGE_URL || 'http://localhost:3002').replace(/\/$/, '');

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [dashboardRes, healthRes, treasuryRes, alertsRes] = await Promise.all([
        fetch(`${BRIDGE_URL}/api/admin/dashboard`),
        fetch(`${BRIDGE_URL}/api/admin/health`),
        fetch(`${BRIDGE_URL}/api/admin/treasury`),
        fetch(`${BRIDGE_URL}/api/admin/alerts`)
      ]);

      const [dashboard, health, treasury, alerts] = await Promise.all([
        dashboardRes.json(),
        healthRes.json(),
        treasuryRes.json(),
        alertsRes.json()
      ]);

      setDashboardData(dashboard.success ? dashboard.dashboard : null);
      setHealthData(health.success ? health.health : null);
      setTreasuryData(treasury.success ? treasury.treasury : null);
      setAlertsData(alerts.success ? alerts.alerts : []);

    } catch (err: any) {
      setError(`Failed to fetch admin data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAdminData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'healthy': return <CheckCircleIcon color="success" />;
      case 'warning': return <WarningIcon color="warning" />;
      case 'critical': return <ErrorIcon color="error" />;
      default: return <CheckCircleIcon color="disabled" />;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading Admin Dashboard...
          </Typography>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchAdminData}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          🔧 Admin Dashboard
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchAdminData}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* System Status Overview */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <DashboardIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">System Status</Typography>
                  <Chip
                    label={healthData?.overall_status || 'Unknown'}
                    color={getStatusColor(healthData?.overall_status || 'unknown')}
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <SecurityIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">Active Alerts</Typography>
                  <Typography variant="h4" color={alertsData?.length > 0 ? 'warning.main' : 'success.main'}>
                    {alertsData?.length || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TreasuryIcon color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">Treasury Liquidity</Typography>
                  <Typography variant="h4" color="primary">
                    ${treasuryData?.liquidity?.total_liquidity_usd?.toLocaleString() || '0'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CheckCircleIcon color="success" sx={{ mr: 2 }} />
                <Box>
                  <Typography variant="h6">Uptime</Typography>
                  <Typography variant="h4" color="success.main">
                    {dashboardData?.uptime ? Math.floor(dashboardData.uptime / 60) : 0}m
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin dashboard tabs">
          <Tab label="System Health" icon={<DashboardIcon />} />
          <Tab label="Treasury" icon={<TreasuryIcon />} />
          <Tab label="Alerts" icon={<WarningIcon />} />
        </Tabs>
      </Paper>

      {/* System Health Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {/* Services Status */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🔧 Services Status
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Uptime</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {healthData?.services && Object.entries(healthData.services).map(([key, service]: [string, any]) => (
                        <TableRow key={key}>
                          <TableCell>{key.replace('_', ' ')}</TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              {getStatusIcon(service.status)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {service.status}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{Math.floor(service.uptime / 60)}m</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Resource Usage */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📊 Resource Usage
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="body2" gutterBottom>
                    Memory: {healthData?.resources?.memory?.usage_percent || 0}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={healthData?.resources?.memory?.usage_percent || 0}
                    color={healthData?.resources?.memory?.usage_percent > 80 ? 'warning' : 'primary'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {healthData?.resources?.memory?.used_mb || 0}MB / {healthData?.resources?.memory?.total_mb || 0}MB
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" gutterBottom>
                    Disk: {healthData?.resources?.disk?.usage_percent || 0}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={healthData?.resources?.disk?.usage_percent || 0}
                    color={healthData?.resources?.disk?.usage_percent > 80 ? 'warning' : 'primary'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {healthData?.resources?.disk?.used_gb || 0}GB / {healthData?.resources?.disk?.total_gb || 0}GB
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Connectivity Status */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🔗 Connectivity Status
                </Typography>
                <Grid container spacing={2}>
                  {healthData?.connectivity && Object.entries(healthData.connectivity).map(([key, conn]: [string, any]) => (
                    <Grid item xs={12} sm={6} md={3} key={key}>
                      <Paper sx={{ p: 2, textAlign: 'center' }}>
                        <Box display="flex" alignItems="center" justifyContent="center" mb={1}>
                          {getStatusIcon(conn.connected ? 'healthy' : 'critical')}
                          <Typography variant="subtitle1" sx={{ ml: 1 }}>
                            {key.replace('_', ' ').toUpperCase()}
                          </Typography>
                        </Box>
                        <Chip
                          label={conn.connected ? 'Connected' : 'Disconnected'}
                          color={conn.connected ? 'success' : 'error'}
                          size="small"
                        />
                        {conn.latency_ms && (
                          <Typography variant="caption" display="block" mt={1}>
                            Latency: {conn.latency_ms}ms
                          </Typography>
                        )}
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Treasury Tab */}
      <TabPanel value={tabValue} index={1}>
        <Grid container spacing={3}>
          {/* Treasury Balances */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  💰 Treasury Balances
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Currency</TableCell>
                        <TableCell align="right">Balance</TableCell>
                        <TableCell align="right">USD Value</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {treasuryData?.balances && Object.entries(treasuryData.balances).map(([currency, balance]: [string, any]) => (
                        <TableRow key={currency}>
                          <TableCell>
                            <Typography variant="h6">{currency}</Typography>
                          </TableCell>
                          <TableCell align="right">
                            {balance.balance?.toLocaleString() || 0}
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body1" color="primary">
                              ${balance.usd_value?.toLocaleString() || 0}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Treasury Metrics */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📈 Treasury Metrics
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Total Liquidity
                  </Typography>
                  <Typography variant="h5" color="primary">
                    ${treasuryData?.liquidity?.total_liquidity_usd?.toLocaleString() || 0}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary">
                    Utilization Rate
                  </Typography>
                  <Typography variant="h6">
                    {treasuryData?.liquidity?.utilization_rate || 0}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={treasuryData?.liquidity?.utilization_rate || 0}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Reserves Ratio
                  </Typography>
                  <Typography variant="h6" color="success.main">
                    {treasuryData?.liquidity?.reserves_ratio || 0}%
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Alerts Tab */}
      <TabPanel value={tabValue} index={2}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              🚨 Active System Alerts
            </Typography>
            
            {!alertsData || alertsData.length === 0 ? (
              <Alert severity="success">
                No active alerts. System is running smoothly!
              </Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Severity</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Created</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {alertsData.map((alert: any, index: number) => (
                      <TableRow key={alert.id || index}>
                        <TableCell>
                          <Chip
                            label={alert.severity}
                            color={getStatusColor(alert.severity)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle2">
                            {alert.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {alert.message}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {new Date(alert.created_at).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.acknowledged ? 'Acknowledged' : 'Active'}
                            color={alert.acknowledged ? 'default' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </TabPanel>
    </Container>
  );
};

export default AdminDashboard;




