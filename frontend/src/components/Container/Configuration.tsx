import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
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
  Slider,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  ExpandMore,
  Add,
  Delete,
  Save,
  Restore,
  Security,
  Network,
  Storage,
  MonitorHeart,
  Speed,
  Memory,
  VpnKey,
  Warning,
  Info,
} from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Container, ContainerConfiguration, ResourceLimits } from '../../types/container';

interface ContainerConfigurationProps {
  container: Container;
  onSave?: (config: ContainerConfiguration) => Promise<void>;
  onCancel?: () => void;
  readOnly?: boolean;
}

interface EnvironmentVariable {
  key: string;
  value: string;
  secret?: boolean;
}

interface PortMapping {
  internal: number;
  external: number;
  protocol: 'tcp' | 'udp';
}

interface VolumeMount {
  hostPath: string;
  containerPath: string;
  readOnly: boolean;
}

export const ContainerConfiguration: React.FC<ContainerConfigurationProps> = ({
  container,
  onSave,
  onCancel,
  readOnly = false,
}) => {
  const [config, setConfig] = useState<ContainerConfiguration>({
    name: container.name,
    image: container.image,
    ports: [...container.ports],
    environment: { ...container.environment },
    volumes: [...container.volumes],
    resources: { ...container.resources },
    networking: container.networking || {
      networkMode: 'bridge',
      hostname: '',
      domainname: '',
    },
    security: container.security || {
      runAsUser: 1001,
      runAsGroup: 1001,
      readOnlyRootFilesystem: false,
      allowPrivilegeEscalation: false,
      dropCapabilities: ['ALL'],
      addCapabilities: [],
      privileged: false,
    },
    scaling: container.scaling || {
      minReplicas: 1,
      maxReplicas: 1,
      currentReplicas: 1,
      autoScalingEnabled: false,
    },
    monitoring: container.monitoring || {
      metricsEnabled: true,
      loggingEnabled: true,
      logLevel: 'info',
      logRetentionDays: 30,
      metricsRetentionDays: 30,
    },
  });

  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [portMappings, setPortMappings] = useState<PortMapping[]>([]);
  const [volumeMounts, setVolumeMounts] = useState<VolumeMount[]>([]);
  const [newEnvVar, setNewEnvVar] = useState<EnvironmentVariable>({ key: '', value: '', secret: false });
  const [newPort, setNewPort] = useState<PortMapping>({ internal: 3000, external: 3000, protocol: 'tcp' });
  const [newVolume, setNewVolume] = useState<VolumeMount>({ hostPath: '', containerPath: '', readOnly: false });
  const [envDialogOpen, setEnvDialogOpen] = useState(false);
  const [portDialogOpen, setPortDialogOpen] = useState(false);
  const [volumeDialogOpen, setVolumeDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state from container data
  useEffect(() => {
    const envVarArray = Object.entries(config.environment).map(([key, value]) => ({
      key,
      value,
      secret: key.toLowerCase().includes('password') || 
              key.toLowerCase().includes('secret') ||
              key.toLowerCase().includes('token') ||
              key.toLowerCase().includes('key'),
    }));
    setEnvVars(envVarArray);
    setPortMappings([...config.ports]);
    setVolumeMounts([...config.volumes]);
  }, [config.environment, config.ports, config.volumes]);

  // Mark changes when config is updated
  useEffect(() => {
    setHasChanges(true);
  }, [config]);

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    try {
      // Convert env vars array back to object
      const environmentObj = envVars.reduce((acc, env) => {
        if (env.key.trim()) {
          acc[env.key] = env.value;
        }
        return acc;
      }, {} as Record<string, string>);

      const updatedConfig = {
        ...config,
        environment: environmentObj,
        ports: portMappings,
        volumes: volumeMounts,
      };

      await onSave(updatedConfig);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save configuration:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setConfig({
      name: container.name,
      image: container.image,
      ports: [...container.ports],
      environment: { ...container.environment },
      volumes: [...container.volumes],
      resources: { ...container.resources },
      networking: container.networking || {
        networkMode: 'bridge',
        hostname: '',
        domainname: '',
      },
      security: container.security || {
        runAsUser: 1001,
        runAsGroup: 1001,
        readOnlyRootFilesystem: false,
        allowPrivilegeEscalation: false,
        dropCapabilities: ['ALL'],
        addCapabilities: [],
        privileged: false,
      },
      scaling: container.scaling || {
        minReplicas: 1,
        maxReplicas: 1,
        currentReplicas: 1,
        autoScalingEnabled: false,
      },
      monitoring: container.monitoring || {
        metricsEnabled: true,
        loggingEnabled: true,
        logLevel: 'info',
        logRetentionDays: 30,
        metricsRetentionDays: 30,
      },
    });
    setHasChanges(false);
  };

  const addEnvironmentVariable = () => {
    if (newEnvVar.key.trim()) {
      setEnvVars([...envVars, { ...newEnvVar }]);
      setNewEnvVar({ key: '', value: '', secret: false });
      setEnvDialogOpen(false);
    }
  };

  const removeEnvironmentVariable = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const addPortMapping = () => {
    if (newPort.internal && newPort.external) {
      setPortMappings([...portMappings, { ...newPort }]);
      setNewPort({ internal: 3000, external: 3000, protocol: 'tcp' });
      setPortDialogOpen(false);
    }
  };

  const removePortMapping = (index: number) => {
    setPortMappings(portMappings.filter((_, i) => i !== index));
  };

  const addVolumeMount = () => {
    if (newVolume.hostPath.trim() && newVolume.containerPath.trim()) {
      setVolumeMounts([...volumeMounts, { ...newVolume }]);
      setNewVolume({ hostPath: '', containerPath: '', readOnly: false });
      setVolumeDialogOpen(false);
    }
  };

  const removeVolumeMount = (index: number) => {
    setVolumeMounts(volumeMounts.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Container Configuration
        </Typography>
        <Box display="flex" gap={1}>
          {hasChanges && (
            <Button
              variant="outlined"
              startIcon={<Restore />}
              onClick={handleReset}
              disabled={readOnly}
            >
              Reset
            </Button>
          )}
          <LoadingButton
            variant="contained"
            startIcon={<Save />}
            loading={saving}
            onClick={handleSave}
            disabled={readOnly || !hasChanges}
          >
            Save Changes
          </LoadingButton>
          {onCancel && (
            <Button variant="outlined" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </Box>
      </Box>

      {hasChanges && !readOnly && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have unsaved changes. Remember to save your configuration.
        </Alert>
      )}

      {/* Basic Configuration */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">Basic Configuration</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Container Name"
                value={config.name}
                onChange={(e) => setConfig({ ...config, name: e.target.value })}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Docker Image"
                value={config.image}
                onChange={(e) => setConfig({ ...config, image: e.target.value })}
                disabled={readOnly}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Port Mappings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Network color="primary" />
            <Typography variant="h6">Port Mappings</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box mb={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setPortDialogOpen(true)}
              disabled={readOnly}
            >
              Add Port
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Host Port</TableCell>
                  <TableCell>Container Port</TableCell>
                  <TableCell>Protocol</TableCell>
                  {!readOnly && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {portMappings.map((port, index) => (
                  <TableRow key={index}>
                    <TableCell>{port.external}</TableCell>
                    <TableCell>{port.internal}</TableCell>
                    <TableCell>
                      <Chip label={port.protocol.toUpperCase()} size="small" />
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removePortMapping(index)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {portMappings.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={readOnly ? 3 : 4} align="center">
                      No port mappings configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Environment Variables */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <VpnKey color="primary" />
            <Typography variant="h6">Environment Variables</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box mb={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setEnvDialogOpen(true)}
              disabled={readOnly}
            >
              Add Variable
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Variable</TableCell>
                  <TableCell>Value</TableCell>
                  <TableCell>Type</TableCell>
                  {!readOnly && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {envVars.map((env, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <code>{env.key}</code>
                    </TableCell>
                    <TableCell>
                      <code>
                        {env.secret ? '••••••••' : env.value}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={env.secret ? 'Secret' : 'Plain'} 
                        color={env.secret ? 'warning' : 'default'}
                        size="small" 
                      />
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeEnvironmentVariable(index)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {envVars.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={readOnly ? 3 : 4} align="center">
                      No environment variables configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Volume Mounts */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Storage color="primary" />
            <Typography variant="h6">Volume Mounts</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box mb={2}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setVolumeDialogOpen(true)}
              disabled={readOnly}
            >
              Add Volume
            </Button>
          </Box>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Host Path</TableCell>
                  <TableCell>Container Path</TableCell>
                  <TableCell>Mode</TableCell>
                  {!readOnly && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {volumeMounts.map((volume, index) => (
                  <TableRow key={index}>
                    <TableCell><code>{volume.hostPath}</code></TableCell>
                    <TableCell><code>{volume.containerPath}</code></TableCell>
                    <TableCell>
                      <Chip 
                        label={volume.readOnly ? 'Read-Only' : 'Read-Write'} 
                        color={volume.readOnly ? 'warning' : 'success'}
                        size="small" 
                      />
                    </TableCell>
                    {!readOnly && (
                      <TableCell>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeVolumeMount(index)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {volumeMounts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={readOnly ? 3 : 4} align="center">
                      No volume mounts configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </AccordionDetails>
      </Accordion>

      {/* Resource Limits */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Speed color="primary" />
            <Typography variant="h6">Resource Limits</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>
                CPU Limit: {config.resources.cpuLimit} cores
              </Typography>
              <Slider
                value={config.resources.cpuLimit}
                onChange={(_, value) => setConfig({
                  ...config,
                  resources: { ...config.resources, cpuLimit: value as number }
                })}
                min={0.1}
                max={8}
                step={0.1}
                marks={[
                  { value: 0.5, label: '0.5' },
                  { value: 1, label: '1' },
                  { value: 2, label: '2' },
                  { value: 4, label: '4' },
                  { value: 8, label: '8' },
                ]}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>
                Memory Limit: {formatBytes(config.resources.memoryLimit * 1024 * 1024)}
              </Typography>
              <Slider
                value={config.resources.memoryLimit}
                onChange={(_, value) => setConfig({
                  ...config,
                  resources: { ...config.resources, memoryLimit: value as number }
                })}
                min={128}
                max={8192}
                step={128}
                marks={[
                  { value: 256, label: '256MB' },
                  { value: 512, label: '512MB' },
                  { value: 1024, label: '1GB' },
                  { value: 2048, label: '2GB' },
                  { value: 4096, label: '4GB' },
                  { value: 8192, label: '8GB' },
                ]}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography gutterBottom>
                Storage Limit: {formatBytes(config.resources.storageLimit * 1024 * 1024)}
              </Typography>
              <Slider
                value={config.resources.storageLimit}
                onChange={(_, value) => setConfig({
                  ...config,
                  resources: { ...config.resources, storageLimit: value as number }
                })}
                min={512}
                max={51200}
                step={512}
                marks={[
                  { value: 1024, label: '1GB' },
                  { value: 5120, label: '5GB' },
                  { value: 10240, label: '10GB' },
                  { value: 25600, label: '25GB' },
                  { value: 51200, label: '50GB' },
                ]}
                disabled={readOnly}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Security Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Security color="primary" />
            <Typography variant="h6">Security Settings</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Run as User ID"
                value={config.security.runAsUser || ''}
                onChange={(e) => setConfig({
                  ...config,
                  security: {
                    ...config.security,
                    runAsUser: parseInt(e.target.value) || undefined
                  }
                })}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Run as Group ID"
                value={config.security.runAsGroup || ''}
                onChange={(e) => setConfig({
                  ...config,
                  security: {
                    ...config.security,
                    runAsGroup: parseInt(e.target.value) || undefined
                  }
                })}
                disabled={readOnly}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.security.readOnlyRootFilesystem}
                    onChange={(e) => setConfig({
                      ...config,
                      security: {
                        ...config.security,
                        readOnlyRootFilesystem: e.target.checked
                      }
                    })}
                    disabled={readOnly}
                  />
                }
                label="Read-only root filesystem"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={!config.security.allowPrivilegeEscalation}
                    onChange={(e) => setConfig({
                      ...config,
                      security: {
                        ...config.security,
                        allowPrivilegeEscalation: !e.target.checked
                      }
                    })}
                    disabled={readOnly}
                  />
                }
                label="Prevent privilege escalation"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.security.privileged}
                    onChange={(e) => setConfig({
                      ...config,
                      security: {
                        ...config.security,
                        privileged: e.target.checked
                      }
                    })}
                    disabled={readOnly}
                  />
                }
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    Privileged mode
                    <Tooltip title="Warning: Privileged mode grants the container almost all capabilities of the host machine">
                      <Warning color="warning" fontSize="small" />
                    </Tooltip>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Scaling Configuration */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <TrendingUp color="primary" />
            <Typography variant="h6">Scaling Configuration</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.scaling.autoScalingEnabled}
                    onChange={(e) => setConfig({
                      ...config,
                      scaling: {
                        ...config.scaling,
                        autoScalingEnabled: e.target.checked
                      }
                    })}
                    disabled={readOnly}
                  />
                }
                label="Enable auto-scaling"
              />
            </Grid>
            {config.scaling.autoScalingEnabled && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Minimum Replicas"
                    value={config.scaling.minReplicas}
                    onChange={(e) => setConfig({
                      ...config,
                      scaling: {
                        ...config.scaling,
                        minReplicas: parseInt(e.target.value) || 1
                      }
                    })}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Maximum Replicas"
                    value={config.scaling.maxReplicas}
                    onChange={(e) => setConfig({
                      ...config,
                      scaling: {
                        ...config.scaling,
                        maxReplicas: parseInt(e.target.value) || 1
                      }
                    })}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Target CPU Utilization (%)"
                    value={config.scaling.targetCpuUtilization || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      scaling: {
                        ...config.scaling,
                        targetCpuUtilization: parseInt(e.target.value) || undefined
                      }
                    })}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Target Memory Utilization (%)"
                    value={config.scaling.targetMemoryUtilization || ''}
                    onChange={(e) => setConfig({
                      ...config,
                      scaling: {
                        ...config.scaling,
                        targetMemoryUtilization: parseInt(e.target.value) || undefined
                      }
                    })}
                    disabled={readOnly}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
              </>
            )}
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Monitoring Settings */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={1}>
            <MonitorHeart color="primary" />
            <Typography variant="h6">Monitoring & Logging</Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.monitoring.metricsEnabled}
                    onChange={(e) => setConfig({
                      ...config,
                      monitoring: {
                        ...config.monitoring,
                        metricsEnabled: e.target.checked
                      }
                    })}
                    disabled={readOnly}
                  />
                }
                label="Enable metrics collection"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.monitoring.loggingEnabled}
                    onChange={(e) => setConfig({
                      ...config,
                      monitoring: {
                        ...config.monitoring,
                        loggingEnabled: e.target.checked
                      }
                    })}
                    disabled={readOnly}
                  />
                }
                label="Enable logging"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Log Level</InputLabel>
                <Select
                  value={config.monitoring.logLevel}
                  onChange={(e) => setConfig({
                    ...config,
                    monitoring: {
                      ...config.monitoring,
                      logLevel: e.target.value as any
                    }
                  })}
                  disabled={readOnly}
                >
                  <MenuItem value="debug">Debug</MenuItem>
                  <MenuItem value="info">Info</MenuItem>
                  <MenuItem value="warn">Warning</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Log Retention (days)"
                value={config.monitoring.logRetentionDays}
                onChange={(e) => setConfig({
                  ...config,
                  monitoring: {
                    ...config.monitoring,
                    logRetentionDays: parseInt(e.target.value) || 30
                  }
                })}
                disabled={readOnly}
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {/* Add Port Dialog */}
      <Dialog open={portDialogOpen} onClose={() => setPortDialogOpen(false)}>
        <DialogTitle>Add Port Mapping</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Host Port"
                value={newPort.external}
                onChange={(e) => setNewPort({ ...newPort, external: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 1, max: 65535 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                type="number"
                label="Container Port"
                value={newPort.internal}
                onChange={(e) => setNewPort({ ...newPort, internal: parseInt(e.target.value) || 0 })}
                inputProps={{ min: 1, max: 65535 }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Protocol</InputLabel>
                <Select
                  value={newPort.protocol}
                  onChange={(e) => setNewPort({ ...newPort, protocol: e.target.value as any })}
                >
                  <MenuItem value="tcp">TCP</MenuItem>
                  <MenuItem value="udp">UDP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPortDialogOpen(false)}>Cancel</Button>
          <Button onClick={addPortMapping} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add Environment Variable Dialog */}
      <Dialog open={envDialogOpen} onClose={() => setEnvDialogOpen(false)}>
        <DialogTitle>Add Environment Variable</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Variable Name"
                value={newEnvVar.key}
                onChange={(e) => setNewEnvVar({ ...newEnvVar, key: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Value"
                value={newEnvVar.value}
                onChange={(e) => setNewEnvVar({ ...newEnvVar, value: e.target.value })}
                type={newEnvVar.secret ? 'password' : 'text'}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newEnvVar.secret}
                    onChange={(e) => setNewEnvVar({ ...newEnvVar, secret: e.target.checked })}
                  />
                }
                label="Mark as secret"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEnvDialogOpen(false)}>Cancel</Button>
          <Button onClick={addEnvironmentVariable} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add Volume Dialog */}
      <Dialog open={volumeDialogOpen} onClose={() => setVolumeDialogOpen(false)}>
        <DialogTitle>Add Volume Mount</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Host Path"
                value={newVolume.hostPath}
                onChange={(e) => setNewVolume({ ...newVolume, hostPath: e.target.value })}
                placeholder="/host/path"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Container Path"
                value={newVolume.containerPath}
                onChange={(e) => setNewVolume({ ...newVolume, containerPath: e.target.value })}
                placeholder="/container/path"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={newVolume.readOnly}
                    onChange={(e) => setNewVolume({ ...newVolume, readOnly: e.target.checked })}
                  />
                }
                label="Read-only"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVolumeDialogOpen(false)}>Cancel</Button>
          <Button onClick={addVolumeMount} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};