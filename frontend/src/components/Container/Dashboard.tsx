import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Delete,
  MoreVert,
  MonitorHeart,
  Network,
  Security,
  Settings,
  Terminal,
  Visibility,
  Warning,
  CheckCircle,
  Error,
  InfoOutlined,
  TrendingUp,
  Storage,
  Memory,
  Speed,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useContainers } from '../../hooks/useContainers';
import { Container, ContainerMetrics, ContainerStatus } from '../../types/container';

interface ContainerDashboardProps {
  projectId?: string;
  containerId?: string;
  onContainerSelect?: (containerId: string) => void;
  onCreateContainer?: () => void;
}

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
      id={`container-tabpanel-${index}`}
      aria-labelledby={`container-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export const ContainerDashboard: React.FC<ContainerDashboardProps> = ({
  projectId,
  containerId,
  onContainerSelect,
  onCreateContainer,
}) => {
  const {
    containers,
    metrics,
    isLoading,
    error,
    startContainer,
    stopContainer,
    restartContainer,
    deleteContainer,
    getContainerMetrics,
    refreshContainers,
  } = useContainers();

  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<string | null>(null);
  const [metricsTimeRange, setMetricsTimeRange] = useState('1h');

  // Filter containers by project if specified
  const filteredContainers = projectId 
    ? containers.filter(c => c.projectId === projectId)
    : containers;

  // Auto-select container if containerId is provided
  useEffect(() => {
    if (containerId) {
      const container = containers.find(c => c.id === containerId);
      if (container) {
        setSelectedContainer(container);
      }
    } else if (filteredContainers.length > 0 && !selectedContainer) {
      setSelectedContainer(filteredContainers[0]);
    }
  }, [containerId, containers, filteredContainers, selectedContainer]);

  // Refresh metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedContainer) {
        getContainerMetrics(selectedContainer.id, metricsTimeRange);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [selectedContainer, metricsTimeRange, getContainerMetrics]);

  const handleContainerAction = useCallback(async (containerId: string, action: string) => {
    try {
      switch (action) {
        case 'start':
          await startContainer(containerId);
          break;
        case 'stop':
          await stopContainer(containerId);
          break;
        case 'restart':
          await restartContainer(containerId);
          break;
        case 'delete':
          setContainerToDelete(containerId);
          setDeleteDialogOpen(true);
          break;
      }
      setActionMenuAnchor(null);
    } catch (error) {
      console.error(`Failed to ${action} container:`, error);
    }
  }, [startContainer, stopContainer, restartContainer]);

  const handleDeleteConfirm = useCallback(async () => {
    if (containerToDelete) {
      try {
        await deleteContainer(containerToDelete);
        if (selectedContainer?.id === containerToDelete) {
          setSelectedContainer(null);
        }
        setDeleteDialogOpen(false);
        setContainerToDelete(null);
      } catch (error) {
        console.error('Failed to delete container:', error);
      }
    }
  }, [containerToDelete, deleteContainer, selectedContainer]);

  const getStatusColor = (status: ContainerStatus): string => {
    switch (status) {
      case 'running': return 'success';
      case 'stopped': return 'default';
      case 'error': return 'error';
      case 'creating': return 'info';
      case 'restarting': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: ContainerStatus) => {
    switch (status) {
      case 'running': return <CheckCircle color="success" />;
      case 'stopped': return <Stop color="disabled" />;
      case 'error': return <Error color="error" />;
      case 'creating': return <CircularProgress size={20} />;
      case 'restarting': return <Refresh color="warning" />;
      default: return <InfoOutlined />;
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const renderContainerList = () => (
    <Grid container spacing={2}>
      {filteredContainers.map((container) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={container.id}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: selectedContainer?.id === container.id ? 2 : 0,
              borderColor: 'primary.main',
              '&:hover': { elevation: 4 }
            }}
            onClick={() => {
              setSelectedContainer(container);
              onContainerSelect?.(container.id);
            }}
          >
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <Typography variant="h6" component="div" noWrap>
                  {container.name}
                </Typography>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActionMenuAnchor(e.currentTarget);
                    setSelectedContainer(container);
                  }}
                >
                  <MoreVert />
                </IconButton>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                {getStatusIcon(container.status)}
                <Chip
                  label={container.status}
                  color={getStatusColor(container.status) as any}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={1}>
                {container.image}
              </Typography>
              
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {container.ports.map(p => `${p.external}:${p.internal}`).join(', ')}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatUptime(container.health?.uptime || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      ))}
      
      {onCreateContainer && (
        <Grid item xs={12} sm={6} md={4} lg={3}>
          <Card 
            sx={{ 
              cursor: 'pointer',
              border: '2px dashed',
              borderColor: 'primary.main',
              '&:hover': { bgcolor: 'action.hover' }
            }}
            onClick={onCreateContainer}
          >
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="primary">
                + Create Container
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Deploy a new container
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderMetricsCharts = () => {
    const containerMetrics = selectedContainer ? metrics[selectedContainer.id] : null;
    
    if (!containerMetrics || containerMetrics.length === 0) {
      return (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">
            No metrics data available
          </Typography>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {/* CPU Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU Usage
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={containerMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="cpu.usage" 
                    stroke="#8884d8" 
                    fill="#8884d8"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Memory Usage */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Memory Usage
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={containerMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Area 
                    type="monotone" 
                    dataKey="memory.usagePercent" 
                    stroke="#82ca9d" 
                    fill="#82ca9d"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Network I/O */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network I/O
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={containerMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Line 
                    type="monotone" 
                    dataKey="network.rxBytes" 
                    stroke="#ffc658" 
                    name="RX Bytes"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="network.txBytes" 
                    stroke="#ff7300" 
                    name="TX Bytes"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Disk I/O */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Disk I/O
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={containerMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="disk.readBytes" fill="#8884d8" name="Read" />
                  <Bar dataKey="disk.writeBytes" fill="#82ca9d" name="Write" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    );
  };

  const renderContainerDetails = () => {
    if (!selectedContainer) {
      return (
        <Box textAlign="center" py={4}>
          <Typography color="text.secondary">
            Select a container to view details
          </Typography>
        </Box>
      );
    }

    return (
      <Box>
        {/* Container Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1">
              {selectedContainer.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {selectedContainer.image}
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            {selectedContainer.status === 'stopped' && (
              <Button
                variant="contained"
                color="success"
                startIcon={<PlayArrow />}
                onClick={() => handleContainerAction(selectedContainer.id, 'start')}
              >
                Start
              </Button>
            )}
            {selectedContainer.status === 'running' && (
              <Button
                variant="contained"
                color="warning"
                startIcon={<Stop />}
                onClick={() => handleContainerAction(selectedContainer.id, 'stop')}
              >
                Stop
              </Button>
            )}
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={() => handleContainerAction(selectedContainer.id, 'restart')}
            >
              Restart
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Delete />}
              onClick={() => handleContainerAction(selectedContainer.id, 'delete')}
            >
              Delete
            </Button>
          </Box>
        </Box>

        {/* Status Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <MonitorHeart color="primary" />
                  <Typography variant="h6">Status</Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  {getStatusIcon(selectedContainer.status)}
                  <Typography variant="h5">
                    {selectedContainer.status}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Speed color="primary" />
                  <Typography variant="h6">CPU</Typography>
                </Box>
                <Typography variant="h5" mt={1}>
                  {selectedContainer.resources?.cpuLimit || 1} cores
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={75} // Would come from metrics
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Memory color="primary" />
                  <Typography variant="h6">Memory</Typography>
                </Box>
                <Typography variant="h5" mt={1}>
                  {formatBytes((selectedContainer.resources?.memoryLimit || 512) * 1024 * 1024)}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={60} // Would come from metrics
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1}>
                  <Storage color="primary" />
                  <Typography variant="h6">Storage</Typography>
                </Box>
                <Typography variant="h5" mt={1}>
                  {formatBytes((selectedContainer.resources?.storageLimit || 1024) * 1024 * 1024)}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={45} // Would come from metrics
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={selectedTab} onChange={(_, newValue) => setSelectedTab(newValue)}>
            <Tab label="Overview" />
            <Tab label="Metrics" />
            <Tab label="Logs" />
            <Tab label="Network" />
            <Tab label="Security" />
            <Tab label="Configuration" />
          </Tabs>
        </Box>

        <TabPanel value={selectedTab} index={0}>
          {/* Overview */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Container Information
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>ID</strong></TableCell>
                          <TableCell>{selectedContainer.id}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Project</strong></TableCell>
                          <TableCell>{selectedContainer.projectId}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Image</strong></TableCell>
                          <TableCell>{selectedContainer.image}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Created</strong></TableCell>
                          <TableCell>{new Date(selectedContainer.createdAt).toLocaleString()}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Uptime</strong></TableCell>
                          <TableCell>{formatUptime(selectedContainer.health?.uptime || 0)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Port Mappings
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Host Port</TableCell>
                          <TableCell>Container Port</TableCell>
                          <TableCell>Protocol</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedContainer.ports.map((port, index) => (
                          <TableRow key={index}>
                            <TableCell>{port.external}</TableCell>
                            <TableCell>{port.internal}</TableCell>
                            <TableCell>{port.protocol}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Environment Variables
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Variable</TableCell>
                          <TableCell>Value</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Object.entries(selectedContainer.environment).map(([key, value]) => (
                          <TableRow key={key}>
                            <TableCell><code>{key}</code></TableCell>
                            <TableCell><code>{value}</code></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={selectedTab} index={1}>
          {/* Metrics */}
          <Box mb={2}>
            <Button
              variant={metricsTimeRange === '1h' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setMetricsTimeRange('1h')}
              sx={{ mr: 1 }}
            >
              1H
            </Button>
            <Button
              variant={metricsTimeRange === '24h' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setMetricsTimeRange('24h')}
              sx={{ mr: 1 }}
            >
              24H
            </Button>
            <Button
              variant={metricsTimeRange === '7d' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setMetricsTimeRange('7d')}
            >
              7D
            </Button>
          </Box>
          {renderMetricsCharts()}
        </TabPanel>

        <TabPanel value={selectedTab} index={2}>
          {/* Logs */}
          <Typography>Container logs will be displayed here</Typography>
        </TabPanel>

        <TabPanel value={selectedTab} index={3}>
          {/* Network */}
          <Typography>Network configuration will be displayed here</Typography>
        </TabPanel>

        <TabPanel value={selectedTab} index={4}>
          {/* Security */}
          <Typography>Security settings will be displayed here</Typography>
        </TabPanel>

        <TabPanel value={selectedTab} index={5}>
          {/* Configuration */}
          <Typography>Container configuration will be displayed here</Typography>
        </TabPanel>
      </Box>
    );
  };

  if (isLoading && containers.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Container Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={refreshContainers}
            disabled={isLoading}
          >
            Refresh
          </Button>
          {onCreateContainer && (
            <Button
              variant="contained"
              onClick={onCreateContainer}
            >
              Create Container
            </Button>
          )}
        </Box>
      </Box>

      {containers.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" gutterBottom>
              No containers found
            </Typography>
            <Typography color="text.secondary" paragraph>
              Create your first container to get started with containerized development.
            </Typography>
            {onCreateContainer && (
              <Button
                variant="contained"
                size="large"
                onClick={onCreateContainer}
              >
                Create Container
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Container List View */}
          {!containerId && renderContainerList()}
          
          {/* Container Details View */}
          {(containerId || selectedContainer) && renderContainerDetails()}
        </>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={() => setActionMenuAnchor(null)}
      >
        {selectedContainer?.status === 'stopped' && (
          <MenuItem onClick={() => handleContainerAction(selectedContainer.id, 'start')}>
            <PlayArrow sx={{ mr: 1 }} />
            Start
          </MenuItem>
        )}
        {selectedContainer?.status === 'running' && (
          <MenuItem onClick={() => handleContainerAction(selectedContainer.id, 'stop')}>
            <Stop sx={{ mr: 1 }} />
            Stop
          </MenuItem>
        )}
        <MenuItem onClick={() => handleContainerAction(selectedContainer?.id || '', 'restart')}>
          <Refresh sx={{ mr: 1 }} />
          Restart
        </MenuItem>
        <MenuItem onClick={() => handleContainerAction(selectedContainer?.id || '', 'delete')}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Container</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this container? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};