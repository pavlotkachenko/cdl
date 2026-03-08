#!/usr/bin/env node
/**
 * dev-proxy.js — Simple reverse proxy for Cypress Docker testing.
 *
 * Listens on 0.0.0.0:9000, forwards:
 *   /api/*  → http://localhost:3000  (Express backend)
 *   *       → http://localhost:4200  (Angular ng serve)
 *
 * Rewrites the Host header to "localhost" so Vite's host-check doesn't
 * reject the request (Vite blocks requests whose Host != the listen host).
 *
 * Usage:  node dev-proxy.js
 */

const http = require('http');

const PORT = 9000;
const NG_SERVE_PORT = 4200;
const BACKEND_PORT = 3000;

function forward(req, res, targetPort) {
  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${targetPort}`,
    },
  };

  const proxy = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxy.on('error', (err) => {
    console.error(`[proxy] Error forwarding to :${targetPort}: ${err.message}`);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxy, { end: true });
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    forward(req, res, BACKEND_PORT);
  } else {
    forward(req, res, NG_SERVE_PORT);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[dev-proxy] Listening on 0.0.0.0:${PORT}`);
  console.log(`[dev-proxy] /api/* → localhost:${BACKEND_PORT}`);
  console.log(`[dev-proxy]  *     → localhost:${NG_SERVE_PORT}`);
});
