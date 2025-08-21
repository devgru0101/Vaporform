import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Toolbar,
  Paper,
  Switch,
  FormControlLabel,
  Menu,
  Popover,
  Slider,
  Divider,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Clear,
  Download,
  FilterList,
  Refresh,
  PlayArrow,
  Pause,
  Settings,
  Fullscreen,
  FullscreenExit,
  WrapText,
  KeyboardArrowDown,
  KeyboardArrowUp,
} from '@mui/icons-material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { FixedSizeList as List } from 'react-window';
import { ContainerLog, LogLevel } from '../../types/container';

interface ContainerLogsProps {
  containerId: string;
  containerName?: string;
  height?: number;
  enableDownload?: boolean;
  enableSearch?: boolean;
  enableFiltering?: boolean;
  autoScroll?: boolean;
  refreshInterval?: number;
}

interface LogEntry extends ContainerLog {
  id: string;
  index: number;
  highlighted?: boolean;
}

interface LogFilter {
  level?: LogLevel | 'all';
  timeRange?: {
    start: Date;
    end: Date;
  };
  source?: 'stdout' | 'stderr' | 'all';
  search?: string;
}

const LOG_LEVELS: { value: LogLevel | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Levels', color: '#666' },
  { value: 'debug', label: 'Debug', color: '#9E9E9E' },
  { value: 'info', label: 'Info', color: '#2196F3' },
  { value: 'warn', label: 'Warning', color: '#FF9800' },
  { value: 'error', label: 'Error', color: '#F44336' },
  { value: 'fatal', label: 'Fatal', color: '#D32F2F' },
];

const formatTimestamp = (timestamp: Date | string): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleTimeString('en-US', { 
    hour12: false, 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    fractionalSecondDigits: 3
  });
};

const getLogLevelColor = (level: LogLevel): string => {
  const logLevel = LOG_LEVELS.find(l => l.value === level);
  return logLevel?.color || '#666';
};

const LogEntryComponent: React.FC<{
  index: number;
  style: any;
  data: {
    logs: LogEntry[];
    searchTerm: string;
    wrapText: boolean;
    showTimestamp: boolean;
    showLevel: boolean;
    showSource: boolean;
    fontSize: number;
  };
}> = ({ index, style, data }) => {
  const { logs, searchTerm, wrapText, showTimestamp, showLevel, showSource, fontSize } = data;
  const log = logs[index];

  const highlightText = (text: string, term: string): React.ReactNode => {
    if (!term) return text;
    
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <span key={i} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div
      style={{
        ...style,
        padding: '4px 8px',
        borderBottom: '1px solid #f0f0f0',
        fontSize: `${fontSize}px`,
        fontFamily: 'Monaco, "Lucida Console", monospace',
        whiteSpace: wrapText ? 'pre-wrap' : 'pre',
        overflow: 'hidden',
        backgroundColor: log.highlighted ? '#e3f2fd' : 'transparent',
      }}
    >
      <Box display="flex" alignItems="flex-start" gap={1}>
        {showTimestamp && (
          <span style={{ color: '#666', minWidth: '80px', fontSize: '0.9em' }}>
            {formatTimestamp(log.timestamp)}
          </span>
        )}
        
        {showLevel && (
          <Chip
            label={log.level.toUpperCase()}
            size="small"
            sx={{
              backgroundColor: getLogLevelColor(log.level),
              color: 'white',
              fontSize: '0.7em',
              height: '18px',
              minWidth: '50px',
            }}
          />
        )}
        
        {showSource && (
          <Chip
            label={log.stream}
            size="small"
            variant="outlined"
            sx={{
              fontSize: '0.7em',
              height: '18px',
            }}
          />
        )}
        
        <span style={{ flex: 1, overflow: 'hidden' }}>
          {highlightText(log.message, searchTerm)}
        </span>
      </Box>
    </div>
  );
};

export const ContainerLogs: React.FC<ContainerLogsProps> = ({
  containerId,
  containerName,
  height = 600,
  enableDownload = true,
  enableSearch = true,
  enableFiltering = true,
  autoScroll = true,
  refreshInterval = 5000,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LogFilter>({
    level: 'all',
    source: 'all',
    search: '',
  });
  const [isFollowing, setIsFollowing] = useState(autoScroll);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [settingsAnchor, setSettingsAnchor] = useState<HTMLElement | null>(null);
  const [filterAnchor, setFilterAnchor] = useState<HTMLElement | null>(null);
  
  // Display settings
  const [wrapText, setWrapText] = useState(false);
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [showLevel, setShowLevel] = useState(true);
  const [showSource, setShowSource] = useState(true);
  const [fontSize, setFontSize] = useState(12);
  const [maxLines, setMaxLines] = useState(1000);

  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Mock function to fetch logs (replace with actual API call)
  const fetchLogs = useCallback(async (append = false) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock logs
      const newLogs: LogEntry[] = [];
      const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'fatal'];
      const sources = ['stdout', 'stderr'];
      
      for (let i = 0; i < (append ? 10 : 100); i++) {
        const timestamp = new Date(Date.now() - (append ? i * 1000 : (100 - i) * 10000));
        const level = levels[Math.floor(Math.random() * levels.length)];
        const source = sources[Math.floor(Math.random() * sources.length)] as 'stdout' | 'stderr';
        
        newLogs.push({
          id: `${containerId}-${timestamp.getTime()}-${i}`,
          index: append ? logs.length + i : i,
          timestamp,
          level,
          message: `[${timestamp.toISOString()}] Sample log message ${i + 1} from container ${containerName || containerId}`,
          source: 'container',
          containerId,
          stream: source,
        });
      }
      
      if (append) {
        setLogs(prev => [...prev, ...newLogs].slice(-maxLines));
      } else {
        setLogs(newLogs);
      }
    } catch (err) {
      setError('Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [containerId, containerName, logs.length, maxLines]);

  // Auto-refresh logs
  useEffect(() => {
    if (isFollowing && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchLogs(true);
      }, refreshInterval);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isFollowing, refreshInterval, fetchLogs]);

  // Initial load
  useEffect(() => {
    fetchLogs(false);
  }, [containerId]);

  // Filter logs
  useEffect(() => {
    let filtered = [...logs];

    // Filter by level
    if (filter.level && filter.level !== 'all') {
      filtered = filtered.filter(log => log.level === filter.level);
    }

    // Filter by source
    if (filter.source && filter.source !== 'all') {
      filtered = filtered.filter(log => log.stream === filter.source);
    }

    // Filter by time range
    if (filter.timeRange) {
      filtered = filtered.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= filter.timeRange!.start && logTime <= filter.timeRange!.end;
      });
    }

    // Filter by search term
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filtered = filtered.filter(log => 
        log.message.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, filter]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isFollowing && listRef.current) {
      listRef.current.scrollToItem(filteredLogs.length - 1, 'end');
    }
  }, [filteredLogs, isFollowing]);

  const handleDownload = () => {
    const content = filteredLogs.map(log => 
      `${formatTimestamp(log.timestamp)} [${log.level.toUpperCase()}] ${log.message}`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${containerName || containerId}-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const scrollToTop = () => {
    listRef.current?.scrollToItem(0, 'start');
  };

  const scrollToBottom = () => {
    listRef.current?.scrollToItem(filteredLogs.length - 1, 'end');
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Card ref={containerRef} sx={{ height: isFullscreen ? '100vh' : height }}>
        <CardContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
          <Toolbar variant="dense" sx={{ borderBottom: 1, borderColor: 'divider', minHeight: '48px !important' }}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              {containerName ? `${containerName} Logs` : 'Container Logs'}
              {filteredLogs.length !== logs.length && (
                <Chip 
                  label={`${filteredLogs.length} / ${logs.length}`} 
                  size="small" 
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>

            {enableSearch && (
              <TextField
                size="small"
                placeholder="Search logs..."
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  endAdornment: filter.search && (
                    <IconButton
                      size="small"
                      onClick={() => setFilter({ ...filter, search: '' })}
                    >
                      <Clear />
                    </IconButton>
                  ),
                }}
                sx={{ mx: 1, width: 250 }}
              />
            )}

            {enableFiltering && (
              <IconButton
                onClick={(e) => setFilterAnchor(e.currentTarget)}
                color={Object.values(filter).some(v => v && v !== 'all') ? 'primary' : 'default'}
              >
                <FilterList />
              </IconButton>
            )}

            <IconButton
              onClick={() => setIsFollowing(!isFollowing)}
              color={isFollowing ? 'primary' : 'default'}
              title={isFollowing ? 'Pause auto-refresh' : 'Resume auto-refresh'}
            >
              {isFollowing ? <Pause /> : <PlayArrow />}
            </IconButton>

            <IconButton onClick={() => fetchLogs(false)} disabled={isLoading}>
              <Refresh />
            </IconButton>

            {enableDownload && (
              <IconButton onClick={handleDownload} disabled={filteredLogs.length === 0}>
                <Download />
              </IconButton>
            )}

            <IconButton onClick={(e) => setSettingsAnchor(e.currentTarget)}>
              <Settings />
            </IconButton>

            <IconButton onClick={toggleFullscreen}>
              {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
            </IconButton>
          </Toolbar>

          {error && (
            <Alert severity="error" sx={{ m: 1 }}>
              {error}
            </Alert>
          )}

          {/* Log Content */}
          <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
            {isLoading && logs.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : filteredLogs.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%" flexDirection="column">
                <Typography color="text.secondary" gutterBottom>
                  No logs to display
                </Typography>
                {logs.length > 0 && (
                  <Button onClick={() => setFilter({ level: 'all', source: 'all', search: '' })}>
                    Clear Filters
                  </Button>
                )}
              </Box>
            ) : (
              <>
                <List
                  ref={listRef}
                  height={height - 120} // Subtract toolbar and margin
                  itemCount={filteredLogs.length}
                  itemSize={wrapText ? 60 : 25}
                  itemData={{
                    logs: filteredLogs,
                    searchTerm: filter.search || '',
                    wrapText,
                    showTimestamp,
                    showLevel,
                    showSource,
                    fontSize,
                  }}
                >
                  {LogEntryComponent}
                </List>

                {/* Scroll Controls */}
                <Box
                  sx={{
                    position: 'absolute',
                    right: 8,
                    bottom: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                  }}
                >
                  <Tooltip title="Scroll to top">
                    <IconButton size="small" onClick={scrollToTop}>
                      <KeyboardArrowUp />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Scroll to bottom">
                    <IconButton size="small" onClick={scrollToBottom}>
                      <KeyboardArrowDown />
                    </IconButton>
                  </Tooltip>
                </Box>
              </>
            )}
          </Box>
        </CardContent>

        {/* Filter Menu */}
        <Menu
          anchorEl={filterAnchor}
          open={Boolean(filterAnchor)}
          onClose={() => setFilterAnchor(null)}
          PaperProps={{ sx: { width: 300, p: 2 } }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Log Level
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={filter.level || 'all'}
              onChange={(e) => setFilter({ ...filter, level: e.target.value as any })}
            >
              {LOG_LEVELS.map(level => (
                <MenuItem key={level.value} value={level.value}>
                  <Chip
                    label={level.label}
                    size="small"
                    sx={{
                      backgroundColor: level.color,
                      color: 'white',
                      mr: 1,
                    }}
                  />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>
            Source
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <Select
              value={filter.source || 'all'}
              onChange={(e) => setFilter({ ...filter, source: e.target.value as any })}
            >
              <MenuItem value="all">All Sources</MenuItem>
              <MenuItem value="stdout">STDOUT</MenuItem>
              <MenuItem value="stderr">STDERR</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle2" gutterBottom>
            Time Range
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <DateTimePicker
              label="Start Time"
              value={filter.timeRange?.start || null}
              onChange={(date) => setFilter({
                ...filter,
                timeRange: {
                  start: date || new Date(Date.now() - 24 * 60 * 60 * 1000),
                  end: filter.timeRange?.end || new Date(),
                }
              })}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DateTimePicker
              label="End Time"
              value={filter.timeRange?.end || null}
              onChange={(date) => setFilter({
                ...filter,
                timeRange: {
                  start: filter.timeRange?.start || new Date(Date.now() - 24 * 60 * 60 * 1000),
                  end: date || new Date(),
                }
              })}
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => setFilter({ level: 'all', source: 'all', search: '' })}
              fullWidth
            >
              Clear Filters
            </Button>
            <Button onClick={handleClearLogs} variant="outlined" size="small" color="error">
              Clear Logs
            </Button>
          </Box>
        </Menu>

        {/* Settings Menu */}
        <Popover
          anchorEl={settingsAnchor}
          open={Boolean(settingsAnchor)}
          onClose={() => setSettingsAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          PaperProps={{ sx: { width: 300, p: 2 } }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Display Options
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={wrapText}
                onChange={(e) => setWrapText(e.target.checked)}
              />
            }
            label="Wrap text"
          />

          <FormControlLabel
            control={
              <Switch
                checked={showTimestamp}
                onChange={(e) => setShowTimestamp(e.target.checked)}
              />
            }
            label="Show timestamp"
          />

          <FormControlLabel
            control={
              <Switch
                checked={showLevel}
                onChange={(e) => setShowLevel(e.target.checked)}
              />
            }
            label="Show log level"
          />

          <FormControlLabel
            control={
              <Switch
                checked={showSource}
                onChange={(e) => setShowSource(e.target.checked)}
              />
            }
            label="Show source"
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" gutterBottom>
            Font Size: {fontSize}px
          </Typography>
          <Slider
            value={fontSize}
            onChange={(_, value) => setFontSize(value as number)}
            min={10}
            max={18}
            step={1}
            marks={[
              { value: 10, label: '10px' },
              { value: 14, label: '14px' },
              { value: 18, label: '18px' },
            ]}
          />

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            Max Lines: {maxLines}
          </Typography>
          <Slider
            value={maxLines}
            onChange={(_, value) => setMaxLines(value as number)}
            min={100}
            max={10000}
            step={100}
            marks={[
              { value: 100, label: '100' },
              { value: 1000, label: '1K' },
              { value: 10000, label: '10K' },
            ]}
          />
        </Popover>
      </Card>
    </LocalizationProvider>
  );
};