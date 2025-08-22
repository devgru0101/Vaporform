#!/usr/bin/env node

const http = require('http');
const httpProxy = require('http-proxy');

// Create a proxy server
const proxy = httpProxy.createProxyServer({
  target: 'http://127.0.0.1:9400',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying
  xfwd: true // Add X-Forwarded-* headers
});

// Create HTTP server
const server = http.createServer((req, res) => {
  // Add CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`Proxying ${req.method} ${req.url} to Encore dashboard`);
  
  // Proxy the request
  proxy.web(req, res, {}, (err) => {
    if (err) {
      console.error('Proxy error:', err.message);
      res.writeHead(502, { 'Content-Type': 'text/plain' });
      res.end('Bad Gateway: Unable to connect to Encore dashboard');
    }
  });
});

// Handle WebSocket upgrades
server.on('upgrade', (req, socket, head) => {
  console.log('Proxying WebSocket connection');
  proxy.ws(req, socket, head, {}, (err) => {
    if (err) {
      console.error('WebSocket proxy error:', err.message);
      socket.destroy();
    }
  });
});

// Handle proxy errors
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (res && !res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Bad Gateway: Unable to connect to Encore dashboard');
  }
});

// Start the proxy server
const PORT = 9401;
const HOST = '0.0.0.0'; // Listen on all interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 Encore Dashboard Proxy running on http://192.168.1.235:${PORT}`);
  console.log(`📡 Proxying to Encore dashboard at http://127.0.0.1:9400`);
  console.log(`🌐 Dashboard accessible at: http://192.168.1.235:${PORT}/uvfk4`);
  console.log('');
  console.log('Make sure the Encore development server is running on port 9400');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy server...');
  server.close(() => {
    console.log('✅ Proxy server stopped');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down proxy server...');
  server.close(() => {
    console.log('✅ Proxy server stopped');
    process.exit(0);
  });
});