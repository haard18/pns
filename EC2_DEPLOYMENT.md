# EC2 Deployment Guide - PNS Backend (Dockerized)

## Prerequisites

- **EC2 Instance**: Ubuntu 22.04 LTS (t3.medium or larger recommended)
- **Security Groups**: Allow inbound traffic on ports 22 (SSH), 3000 (Backend), 5432 (Optional), 6379 (Optional)
- **Storage**: Minimum 20GB root volume (larger if keeping historical blockchain data)

---

## Step 1: Launch EC2 Instance

### AWS Console:
1. Go to **EC2 Dashboard** → **Launch Instance**
2. **AMI**: Ubuntu 22.04 LTS
3. **Instance Type**: `t3.medium` (4GB RAM, 2 vCPU) or `t3.large` for production
4. **Storage**: 20GB GP3 volume
5. **Security Group**: Allow:
   - Port 22 (SSH) - your IP only
   - Port 3000 (Backend)
   - Port 5432 (PostgreSQL) - if external access needed
   - Port 6379 (Redis) - if external access needed
6. **Key Pair**: Create and download `.pem` file
7. **Launch**

### Or via CLI:
```bash
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-groups default \
  --block-device-mappings "DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3}"
```

---

## Step 2: Connect to EC2 Instance

```bash
# Change permissions on key pair (one time)
chmod 400 your-key-pair.pem

# Connect via SSH
ssh -i your-key-pair.pem ubuntu@your-ec2-public-ip
```

---

## Step 3: Install Docker & Docker Compose

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
exit
ssh -i your-key-pair.pem ubuntu@your-ec2-public-ip
```

---

## Step 4: Clone Repository & Setup

```bash
# Create app directory
mkdir -p ~/pns
cd ~/pns

# Clone your repository (using HTTPS or SSH)
git clone https://github.com/haard18/pns.git .

# Navigate to backend
cd backend
```

---

## Step 5: Configure Environment Variables

Create `.env` file with your production values:

```bash
cat > .env << 'EOF'
# Server
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Polygon (Mainnet or Testnet)
POLYGON_RPC_URL=https://polygon-rpc.com  # or your RPC endpoint
POLYGON_CHAIN_ID=137  # 137 for mainnet, 80001 for mumbai
POLYGON_REGISTRY_ADDRESS=0x...
POLYGON_REGISTRAR_ADDRESS=0x...
POLYGON_CONTROLLER_ADDRESS=0x...
POLYGON_RESOLVER_ADDRESS=0x...
POLYGON_PRICE_ORACLE_ADDRESS=0x...
POLYGON_NFT_ADDRESS=0x...

# Database (Docker internal)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/pns
REDIS_URL=redis://redis:6379

# Solana (if applicable)
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_PROGRAM_ID=your_program_id
SOLANA_PAYER_KEYPAIR=your_keypair_json

# Indexer Configuration
DEPLOYMENT_BLOCK=79790269  # Update to your contract deployment block
INDEXER_SCAN_INTERVAL_MS=30000
INDEXER_BATCH_SIZE=500
INDEXER_LOG_CHUNK_SIZE=2000
INDEXER_MAX_RETRIES=3
INDEXER_ENABLED=true

# Optional: IPFS/Pinata
PINATA_API_KEY=
PINATA_SECRET_KEY=
IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs/

# Optional: Admin
ADMIN_PRIVATE_KEY=your_admin_key
EOF
```

**⚠️ Security Note**: For sensitive keys, consider using AWS Secrets Manager or environment variable injection instead of `.env` file.

---

## Step 6: Start Docker Services

```bash
# Pull and start containers (builds if needed)
docker-compose up -d

# Verify all services are running
docker-compose ps

# Expected output:
# NAME               STATUS
# pns-postgres       Up (healthy)
# pns-redis          Up (healthy)
# pns-backend        Up (healthy)
```

---

## Step 7: Verify Backend is Running

```bash
# Check logs
docker-compose logs -f backend

# Test API endpoint (from EC2)
curl http://localhost:3000/health

# From your local machine
curl http://your-ec2-public-ip:3000/health
```

---

## Step 8: Setup Auto-Start on Reboot

Create a systemd service to auto-start Docker containers:

```bash
# Create service file
sudo tee /etc/systemd/system/pns-docker.service > /dev/null << EOF
[Unit]
Description=PNS Backend Docker Compose
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/home/ubuntu/pns/backend
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl enable pns-docker.service
sudo systemctl start pns-docker.service

# Verify status
sudo systemctl status pns-docker.service
```

---

## Step 9: Setup Monitoring & Logging

### View Real-Time Logs:
```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Save Logs to File:
```bash
# Redirect logs to persistent file
docker-compose logs -f > /home/ubuntu/pns/logs/docker.log 2>&1 &
```

### Monitor Disk Space:
```bash
# Check disk usage
df -h

# Monitor PostgreSQL data growth
du -sh /var/lib/docker/volumes/backend_postgres_data/_data
```

---

## Step 10: Backup Strategy

### Database Backups:
```bash
# Create backup directory
mkdir -p ~/backups

# Manual backup (one-time)
docker-compose exec -T postgres pg_dump -U postgres pns > ~/backups/pns_backup_$(date +%Y%m%d_%H%M%S).sql

# Automated daily backups (add to crontab)
crontab -e

# Add this line for daily 2 AM backups:
0 2 * * * cd ~/pns/backend && docker-compose exec -T postgres pg_dump -U postgres pns > ~/backups/pns_backup_$(date +\%Y\%m\%d).sql
```

### Restore from Backup:
```bash
docker-compose exec -T postgres psql -U postgres pns < ~/backups/pns_backup_YYYYMMDD.sql
```

---

## Step 11: SSL/HTTPS with Nginx Reverse Proxy (Recommended)

### Install Nginx:
```bash
sudo apt install -y nginx

# Create reverse proxy config
sudo tee /etc/nginx/sites-available/pns > /dev/null << EOF
upstream backend {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -s /etc/nginx/sites-available/pns /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate (requires domain)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com
```

---

## Step 12: Troubleshooting Commands

```bash
# Check container status
docker-compose ps

# Rebuild and restart specific service
docker-compose up -d --build backend

# View all container logs
docker-compose logs

# Check database connectivity
docker-compose exec backend node -e "
  const pg = require('pg');
  const client = new pg.Client(process.env.DATABASE_URL);
  client.connect().then(() => {
    console.log('✓ Database connected');
    process.exit(0);
  }).catch(e => {
    console.error('✗ Database error:', e.message);
    process.exit(1);
  });
"

# Stop all services
docker-compose down

# Remove all data (⚠️ WARNING: loses database)
docker-compose down -v

# Restart services (graceful)
docker-compose restart
```

---

## Step 13: Domain & DNS Setup

1. **Register domain** (GoDaddy, Route53, Cloudflare, etc.)
2. **Point to EC2**:
   - Get Elastic IP for your EC2 instance
   - Create A record pointing to Elastic IP
   - Wait for DNS propagation (5-30 minutes)

3. **Verify DNS**:
```bash
nslookup your-domain.com
dig your-domain.com
```

---

## Step 14: Monitoring & Health Checks

### CloudWatch Monitoring (AWS):
```bash
# Install CloudWatch agent for metrics
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### Custom Health Check Script:
```bash
cat > ~/pns/health-check.sh << 'EOF'
#!/bin/bash

ENDPOINT="http://localhost:3000/health"
LOG_FILE="/home/ubuntu/pns/logs/health-check.log"

if curl -s "$ENDPOINT" > /dev/null; then
    echo "[$(date)] ✓ Backend healthy" >> $LOG_FILE
else
    echo "[$(date)] ✗ Backend unhealthy - restarting..." >> $LOG_FILE
    cd /home/ubuntu/pns/backend
    docker-compose restart backend
fi
EOF

chmod +x ~/pns/health-check.sh

# Run every 5 minutes
crontab -e
# Add: */5 * * * * /home/ubuntu/pns/health-check.sh
```

---

## Step 15: Performance Optimization

### Increase Resource Limits:
```bash
# Edit docker-compose.yml to add resource limits
# Under backend service, add:
#   deploy:
#     resources:
#       limits:
#         cpus: '1'
#         memory: 2G
#       reservations:
#         cpus: '0.5'
#         memory: 1G
```

### Enable PostgreSQL Connection Pooling:
```bash
# Edit docker-compose.yml postgresql service
# Change command to:
#   command: 
#     - "-c"
#     - "max_connections=200"
```

---

## Quick Reference - Common Commands

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@your-public-ip

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f backend

# Restart a service
docker-compose restart backend

# Execute command in running container
docker-compose exec backend npm run migration:latest

# Update code and redeploy
cd ~/pns
git pull origin main
cd backend
docker-compose up -d --build
```

---

## Security Best Practices

✅ **Do:**
- Use AWS Secrets Manager for sensitive variables
- Restrict security group to necessary IPs only
- Enable EC2 instance monitoring
- Keep Docker images updated
- Use Elastic IP for consistent address
- Enable backups
- Use HTTPS with valid SSL certificate

❌ **Don't:**
- Expose database ports publicly
- Store private keys in `.env` file
- Use weak database passwords
- Skip security group configuration
- Expose Redis publicly (cache layer)
- Disable firewall rules
- Use root user for Docker

---

## Next Steps

1. **Monitor initial deployment** - Check logs for 24 hours
2. **Load test** - Verify performance under expected traffic
3. **Setup alerting** - Configure CloudWatch alarms for errors/downtime
4. **Document your setup** - Record all contract addresses and RPC endpoints
5. **Plan scaling** - Consider auto-scaling group if traffic grows

---

## Support & Debugging

If deployment fails:

```bash
# 1. Check all services
docker-compose ps

# 2. View detailed logs
docker-compose logs --tail=200 backend postgres redis

# 3. Verify environment variables loaded
docker-compose exec backend env | grep POLYGON

# 4. Test RPC connectivity
docker-compose exec backend node -e "
  const axios = require('axios');
  axios.post(process.env.POLYGON_RPC_URL, {
    jsonrpc: '2.0',
    method: 'eth_chainId',
    id: 1
  }).then(r => console.log('✓ RPC working:', r.data))
    .catch(e => console.error('✗ RPC error:', e.message));
"

# 5. Check disk/memory
df -h
free -h
docker stats
```
