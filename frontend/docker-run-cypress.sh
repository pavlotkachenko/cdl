#!/bin/sh
set -e

# Create a simple TCP proxy using Node.js (already in the image)
# Forward localhost:3000 -> host.docker.internal:3000
node -e "
const net = require('net');
const server = net.createServer((client) => {
  const target = net.connect(3000, 'host.docker.internal', () => {
    client.pipe(target);
    target.pipe(client);
  });
  target.on('error', () => client.destroy());
  client.on('error', () => target.destroy());
});
server.listen(3000, '0.0.0.0', () => console.log('Proxy: localhost:3000 -> host.docker.internal:3000'));
" &

sleep 1

# Run Cypress tests
exec cypress run \
  --config baseUrl=http://host.docker.internal:4200 \
  --browser electron \
  --spec "cypress/e2e/auth/**/*.cy.ts" \
  "$@"
