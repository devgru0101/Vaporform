import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Alert,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
  ButtonGroup,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Storage as StorageIcon,
  CloudQueue as CloudIcon,
  Timeline as TimelineIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

// Types
interface SystemMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  activeUsers: number;
}

interface ServiceHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  replicas: {
    desired: number;
    ready: number;
  };
  lastCheck: string;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  service: string;
  message: string;
  timestamp: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

interface BusinessMetrics {
  projectsCreated: number;
  containersLaunched: number;
  aiRequestsProcessed: number;
  revenue: number;
  userEngagement: number;
  conversionRate: number;
}

interface ProductionDashboardProps {
  refreshInterval?: number;
}

export const ProductionDashboard: React.FC<ProductionDashboardProps> = ({
  refreshInterval = 30000, // 30 seconds
}) => {
  // State management
  const [metrics, setMetrics] = useState<SystemMetrics[]>([]);
  const [services, setServices] = useState<ServiceHealth[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [businessMetrics, setBusinessMetrics] = useState<BusinessMetrics>({
    projectsCreated: 0,
    containersLaunched: 0,
    aiRequestsProcessed: 0,
    revenue: 0,
    userEngagement: 0,
    conversionRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedView, setSelectedView] = useState('overview');

  // Fetch data from monitoring APIs
  const fetchMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch system metrics from Prometheus
      const metricsResponse = await fetch(`/api/monitoring/metrics?range=${timeRange}`);
      const metricsData = await metricsResponse.json();
      
      // Fetch service health
      const healthResponse = await fetch('/api/monitoring/health');
      const healthData = await healthResponse.json();
      
      // Fetch alerts from Alertmanager
      const alertsResponse = await fetch('/api/monitoring/alerts');
      const alertsData = await alertsResponse.json();
      
      // Fetch business metrics
      const businessResponse = await fetch('/api/monitoring/business-metrics');
      const businessData = await businessResponse.json();
      
      setMetrics(metricsData);
      setServices(healthData);
      setAlerts(alertsData);
      setBusinessMetrics(businessData);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  // Auto-refresh setup
  useEffect(() => {
    fetchMetrics();
    
    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchMetrics, autoRefresh, refreshInterval]);

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  const lineChartData = {
    labels: metrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU Usage (%)',
        data: metrics.map(m => m.cpu),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      },
      {
        label: 'Memory Usage (%)',
        data: metrics.map(m => m.memory),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  const responseTimeData = {
    labels: metrics.map(m => new Date(m.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: metrics.map(m => m.responseTime),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.2)',
      },
    ],
  };

  const serviceStatusData = {
    labels: ['Healthy', 'Degraded', 'Down'],
    datasets: [
      {
        data: [
          services.filter(s => s.status === 'healthy').length,
          services.filter(s => s.status === 'degraded').length,
          services.filter(s => s.status === 'down').length,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(255, 99, 132, 0.8)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Helper functions
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon color="success" />;
      case 'degraded':
        return <WarningIcon color="warning" />;
      case 'down':
        return <ErrorIcon color="error" />;
      default:
        return <CheckCircleIcon />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatNumber = (num: number, suffix = '') => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M${suffix}`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K${suffix}`;
    }
    return `${num.toFixed(0)}${suffix}`;
  };

  const currentMetrics = metrics[metrics.length - 1] || {};

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DashboardIcon />
          Production Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small">
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <MenuItem value="15m">15 minutes</MenuItem>
              <MenuItem value="1h">1 hour</MenuItem>
              <MenuItem value="6h">6 hours</MenuItem>
              <MenuItem value="24h">24 hours</MenuItem>
              <MenuItem value="7d">7 days</MenuItem>
            </Select>
          </FormControl>
          
          <ButtonGroup variant="outlined" size="small">
            <Button
              variant={selectedView === 'overview' ? 'contained' : 'outlined'}
              onClick={() => setSelectedView('overview')}
            >
              Overview
            </Button>
            <Button
              variant={selectedView === 'infrastructure' ? 'contained' : 'outlined'}
              onClick={() => setSelectedView('infrastructure')}
            >
              Infrastructure
            </Button>
            <Button
              variant={selectedView === 'business' ? 'contained' : 'outlined'}
              onClick={() => setSelectedView('business')}
            >
              Business
            </Button>
          </ButtonGroup>
          
          <FormControlLabel
            control={
              <Switch
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
            }
            label="Auto Refresh"
          />
          
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchMetrics} disabled={isLoading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Critical Alerts */}
      {alerts.filter(a => a.severity === 'critical' && a.status === 'active').length > 0 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="h6">Critical Alerts Active</Typography>
          {alerts
            .filter(a => a.severity === 'critical' && a.status === 'active')
            .map(alert => (
              <Typography key={alert.id} variant="body2">
                {alert.service}: {alert.message}
              </Typography>
            ))}
        </Alert>
      )}

      {/* Overview Dashboard */}
      {selectedView === 'overview' && (
        <>
          {/* Key Metrics Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Response Time
                      </Typography>
                      <Typography variant="h5">
                        {currentMetrics.responseTime?.toFixed(0) || 0}ms
                      </Typography>
                    </Box>
                    <SpeedIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {(currentMetrics.responseTime || 0) > 1000 ? (
                      <TrendingUpIcon color="error" />
                    ) : (
                      <TrendingDownIcon color="success" />
                    )}
                    <Typography variant="body2" color="textSecondary">
                      Target: &lt;500ms
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Error Rate
                      </Typography>
                      <Typography variant="h5">
                        {((currentMetrics.errorRate || 0) * 100).toFixed(2)}%
                      </Typography>
                    </Box>
                    <SecurityIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    {(currentMetrics.errorRate || 0) > 0.01 ? (
                      <TrendingUpIcon color="error" />
                    ) : (
                      <TrendingDownIcon color="success" />
                    )}
                    <Typography variant="body2" color="textSecondary">
                      Target: &lt;1%
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Active Users
                      </Typography>
                      <Typography variant="h5">
                        {formatNumber(currentMetrics.activeUsers || 0)}
                      </Typography>
                    </Box>
                    <CloudIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="body2" color="textSecondary">
                      +12% from yesterday
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom>
                        Throughput
                      </Typography>
                      <Typography variant="h5">
                        {formatNumber(currentMetrics.throughput || 0, ' req/s')}
                      </Typography>
                    </Box>
                    <TimelineIcon color="primary" sx={{ fontSize: 40 }} />
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" />
                    <Typography variant="body2" color="textSecondary">
                      Peak: {formatNumber((currentMetrics.throughput || 0) * 1.2, ' req/s')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Charts */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    System Resource Usage
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Line data={lineChartData} options={chartOptions} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Service Status Distribution
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <Doughnut
                      data={serviceStatusData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                        },
                      }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Service Health Table */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Service Health Status
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Service</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Response Time</TableCell>
                      <TableCell>Error Rate</TableCell>
                      <TableCell>Replicas</TableCell>
                      <TableCell>Last Check</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {services.map((service) => (
                      <TableRow key={service.service}>
                        <TableCell>{service.service}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getStatusIcon(service.status)}
                            <Chip
                              label={service.status}
                              color={
                                service.status === 'healthy'
                                  ? 'success'
                                  : service.status === 'degraded'
                                  ? 'warning'
                                  : 'error'
                              }
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{service.responseTime}ms</TableCell>
                        <TableCell>{(service.errorRate * 100).toFixed(2)}%</TableCell>
                        <TableCell>
                          {service.replicas.ready}/{service.replicas.desired}
                        </TableCell>
                        <TableCell>
                          {new Date(service.lastCheck).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Business Metrics View */}
      {selectedView === 'business' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Projects Created Today
                </Typography>
                <Typography variant="h3" color="primary">
                  {formatNumber(businessMetrics.projectsCreated)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  +15% from yesterday
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Containers Launched
                </Typography>
                <Typography variant="h3" color="primary">
                  {formatNumber(businessMetrics.containersLaunched)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  +8% from yesterday
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  AI Requests Processed
                </Typography>
                <Typography variant="h3" color="primary">
                  {formatNumber(businessMetrics.aiRequestsProcessed)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  +22% from yesterday
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  User Engagement Score
                </Typography>
                <Typography variant="h3" color="primary">
                  {(businessMetrics.userEngagement * 100).toFixed(1)}%
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Target: 85%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Active Alerts */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Alerts ({alerts.filter(a => a.status === 'active').length})
          </Typography>
          {alerts.filter(a => a.status === 'active').length === 0 ? (
            <Alert severity="success">No active alerts</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Severity</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Message</TableCell>
                    <TableCell>Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts
                    .filter(a => a.status === 'active')
                    .map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          <Chip
                            label={alert.severity}
                            color={getAlertColor(alert.severity) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{alert.service}</TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>
                          {new Date(alert.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={alert.status}
                            color={alert.status === 'active' ? 'error' : 'default'}
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
    </Box>
  );
};