const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL;

// Proxy API and WebSocket requests to backend service
// pathRewrite restores the prefix that Express strips when mounting on a sub-path
if (BACKEND_URL) {
  app.use('/api', createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true, pathRewrite: (p) => '/api' + p }));
  app.use('/socket.io', createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true, ws: true, pathRewrite: (p) => '/socket.io' + p }));
}

// Serve static files with caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.includes('ngsw')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// SPA fallback — all unmatched routes serve index.html
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend serving on port ${PORT}`);
  if (BACKEND_URL) console.log(`API proxy → ${BACKEND_URL}`);
});
