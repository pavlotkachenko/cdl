const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL;

// Proxy API and WebSocket requests to backend service
// Mounted at root level so Express does NOT strip the path prefix
if (BACKEND_URL) {
  const proxy = createProxyMiddleware({ target: BACKEND_URL, changeOrigin: true, ws: true });
  app.use((req, res, next) => {
    if (req.url.startsWith('/api/') || req.url.startsWith('/api?') ||
        req.url.startsWith('/socket.io/') || req.url.startsWith('/socket.io?')) {
      return proxy(req, res, next);
    }
    next();
  });
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
