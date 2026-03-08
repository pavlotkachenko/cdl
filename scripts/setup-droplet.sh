#!/usr/bin/env bash
# Run once on a fresh Ubuntu 24.04 DigitalOcean Droplet
# Usage: ssh root@YOUR_IP 'bash -s' < scripts/setup-droplet.sh

set -euo pipefail

echo "=== CDL Ticket Management — Droplet Setup ==="

# Install Docker
curl -fsSL https://get.docker.com | sh

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin

# Firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create app directory
mkdir -p /opt/cdl-ticket-management
cd /opt/cdl-ticket-management

# Create Caddyfile
cat > Caddyfile << 'CADDY'
:80 {
    reverse_proxy app:3000

    @websocket {
        header Connection *Upgrade*
        header Upgrade websocket
    }
    reverse_proxy @websocket app:3000
}
CADDY

# Create docker-compose.yml
cat > docker-compose.yml << 'COMPOSE'
services:
  app:
    image: ghcr.io/OWNER/cdl-ticket-management:latest
    env_file: .env.production
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
    networks:
      - web

  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - app
    restart: unless-stopped
    networks:
      - web

volumes:
  caddy_data:
  caddy_config:

networks:
  web:
COMPOSE

# Create env template
cat > .env.production.example << 'ENV'
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://YOUR_DROPLET_IP

SUPABASE_URL=https://ahecrufmxtriyivaaeng.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=generate-a-strong-secret-min-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=generate-another-strong-secret
JWT_REFRESH_EXPIRES_IN=30d

SENDGRID_API_KEY=SG.your-key
FROM_EMAIL=noreply@cdltickets.com

STRIPE_SECRET_KEY=sk_live_your-key

PRODUCTION_URL=http://YOUR_DROPLET_IP
ENV

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "1. cp .env.production.example .env.production"
echo "2. Edit .env.production with real credentials"
echo "3. Update OWNER in docker-compose.yml with your GitHub username"
echo "4. docker compose pull && docker compose up -d"
