#!/bin/bash

# PNS (Polygon Name Service) Production Setup Script
# This script sets up the entire PNS project for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="PNS (Polygon Name Service)"
REQUIRED_NODE_VERSION="18"
REQUIRED_FORGE_VERSION="0.2.0"

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Banner
print_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                     PNS (Polygon Name Service)                              ║"
    echo "║                        Production Setup Script                              ║"
    echo "║                                                                              ║"
    echo "║  Architecture: Frontend ↔ Smart Contracts (Direct)                          ║"
    echo "║                Backend → Event Indexing Only                                ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check Node.js
    if ! command_exists node; then
        error "Node.js is not installed. Please install Node.js $REQUIRED_NODE_VERSION or later."
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt "$REQUIRED_NODE_VERSION" ]; then
        error "Node.js version $REQUIRED_NODE_VERSION or later is required. Current version: $(node -v)"
    fi
    
    # Check npm
    if ! command_exists npm; then
        error "npm is not installed."
    fi
    
    # Check pnpm (preferred)
    if ! command_exists pnpm; then
        warn "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi
    
    # Check Forge/Foundry
    if ! command_exists forge; then
        error "Foundry (forge) is not installed. Please install from https://getfoundry.sh"
    fi
    
    # Check git
    if ! command_exists git; then
        error "Git is not installed."
    fi
    
    log "System requirements satisfied ✓"
}

# Setup environment files
setup_environment() {
    log "Setting up environment configuration..."
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        log "Creating backend environment file..."
        cat > backend/.env << EOF
# Backend Environment Configuration
NODE_ENV=development
PORT=3001

# Database (for production, use PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/pns_db

# Blockchain Configuration
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Contract Addresses (update after deployment)
REGISTRY_CONTRACT=
REGISTRAR_CONTRACT=
CONTROLLER_CONTRACT=
RESOLVER_CONTRACT=
PRICE_ORACLE_CONTRACT=
DOMAIN_NFT_CONTRACT=

# Indexer Configuration
INDEXER_SCAN_INTERVAL_MS=30000
INDEXER_BATCH_SIZE=1000
DEPLOYMENT_BLOCK=0

# Security
JWT_SECRET=your-super-secret-jwt-key-change-in-production
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info
LOG_DIR=./logs
EOF
    fi
    
    # Frontend environment
    if [ ! -f "client/.env.local" ]; then
        log "Creating frontend environment file..."
        cat > client/.env.local << EOF
# Frontend Environment Configuration

# Blockchain RPC URLs
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# WalletConnect Project ID (get from https://cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your-walletconnect-project-id

# Backend API URL
VITE_API_BASE_URL=http://localhost:3001/api

# Contract Addresses (update after deployment)
VITE_REGISTRY_ADDRESS=
VITE_REGISTRAR_ADDRESS=
VITE_CONTROLLER_ADDRESS=
VITE_RESOLVER_ADDRESS=
VITE_PRICE_ORACLE_ADDRESS=
VITE_DOMAIN_NFT_ADDRESS=

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=
EOF
    fi
    
    # Contracts environment
    if [ ! -f "contracts/.env" ]; then
        log "Creating contracts environment file..."
        cat > contracts/.env << EOF
# Smart Contracts Environment Configuration

# Private keys (DO NOT COMMIT TO VERSION CONTROL)
PRIVATE_KEY=your-deployer-private-key-here
DEPLOYER_ADDRESS=

# RPC URLs
POLYGON_RPC_URL=https://polygon-rpc.com
AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# Block explorers
POLYGON_EXPLORER=https://polygonscan.com
AMOY_EXPLORER=https://amoy.polygonscan.com

# Deployment Configuration
INITIAL_ADMIN=
BASE_PRICE_PER_YEAR=0.1
MINIMUM_REGISTRATION_DURATION=31536000
GRACE_PERIOD=2592000

# Verification
POLYGONSCAN_API_KEY=your-polygonscan-api-key
EOF
    fi
    
    log "Environment files created ✓"
    warn "Please update the .env files with your actual configuration values!"
}

# Install dependencies
install_dependencies() {
    log "Installing project dependencies..."
    
    # Install contract dependencies
    log "Installing Foundry/Forge dependencies..."
    cd contracts
    forge install
    cd ..
    
    # Install backend dependencies
    log "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    # Install frontend dependencies
    log "Installing frontend dependencies..."
    cd client
    pnpm install
    cd ..
    
    log "Dependencies installed ✓"
}

# Build smart contracts
build_contracts() {
    log "Building smart contracts..."
    
    cd contracts
    
    # Clean previous builds
    forge clean
    
    # Build contracts
    forge build
    
    if [ $? -ne 0 ]; then
        error "Contract compilation failed"
    fi
    
    # Run tests
    log "Running contract tests..."
    forge test
    
    if [ $? -ne 0 ]; then
        error "Contract tests failed"
    fi
    
    cd ..
    log "Smart contracts built and tested ✓"
}

# Deploy smart contracts
deploy_contracts() {
    log "Deploying smart contracts..."
    
    read -p "Deploy to which network? (amoy/polygon): " NETWORK
    
    case $NETWORK in
        amoy|polygon)
            log "Deploying to $NETWORK..."
            cd contracts
            ./deploy-$NETWORK.sh
            cd ..
            ;;
        *)
            warn "Skipping contract deployment. Use './deploy-amoy.sh' or './deploy-polygon.sh' manually."
            ;;
    esac
}

# Build frontend
build_frontend() {
    log "Building frontend application..."
    
    cd client
    
    # Build for production
    pnpm run build
    
    if [ $? -ne 0 ]; then
        error "Frontend build failed"
    fi
    
    cd ..
    log "Frontend built ✓"
}

# Build backend
build_backend() {
    log "Building backend application..."
    
    cd backend
    
    # Compile TypeScript
    npm run build
    
    if [ $? -ne 0 ]; then
        error "Backend build failed"
    fi
    
    cd ..
    log "Backend built ✓"
}

# Setup database
setup_database() {
    log "Setting up database..."
    
    read -p "Setup database? (y/n): " SETUP_DB
    
    if [ "$SETUP_DB" = "y" ] || [ "$SETUP_DB" = "Y" ]; then
        # Check if PostgreSQL is installed
        if command_exists psql; then
            log "PostgreSQL detected. Creating database..."
            
            read -p "Database name [pns_db]: " DB_NAME
            DB_NAME=${DB_NAME:-pns_db}
            
            read -p "Database user [postgres]: " DB_USER
            DB_USER=${DB_USER:-postgres}
            
            # Create database (this might require manual setup)
            log "Please ensure PostgreSQL is running and create database '$DB_NAME' manually"
            log "Then update the DATABASE_URL in backend/.env"
        else
            warn "PostgreSQL not found. For production, please install PostgreSQL."
            log "For development, the backend will use in-memory storage."
        fi
    else
        log "Skipping database setup. Using in-memory storage for development."
    fi
    
    log "Database setup completed ✓"
}

# Create production scripts
create_production_scripts() {
    log "Creating production scripts..."
    
    # Start script
    cat > start-production.sh << 'EOF'
#!/bin/bash

# Start all PNS services for production

log() {
    echo "[$(date)] $1"
}

log "Starting PNS Production Services..."

# Start backend
log "Starting backend service..."
cd backend
pm2 start ecosystem.config.js
cd ..

log "Backend started with PM2"

# Frontend is served by nginx or static file server
log "Frontend should be served by nginx or your preferred web server"
log "Built files are in client/dist/"

log "All services started ✓"
log "Backend API: http://localhost:3001"
log "Monitor with: pm2 status"
EOF

    chmod +x start-production.sh
    
    # Stop script
    cat > stop-production.sh << 'EOF'
#!/bin/bash

log() {
    echo "[$(date)] $1"
}

log "Stopping PNS Production Services..."

# Stop backend
pm2 stop all
pm2 delete all

log "All services stopped ✓"
EOF

    chmod +x stop-production.sh
    
    # PM2 ecosystem config
    cat > backend/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'pns-backend',
    script: 'dist/index.js',
    cwd: './backend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
EOF
    
    log "Production scripts created ✓"
}

# Create development scripts
create_development_scripts() {
    log "Creating development scripts..."
    
    # Development start script
    cat > start-dev.sh << 'EOF'
#!/bin/bash

# Start all PNS services for development

log() {
    echo "[$(date)] $1"
}

log "Starting PNS Development Services..."

# Create logs directory
mkdir -p backend/logs

# Function to run services in background
run_service() {
    local name=$1
    local command=$2
    local dir=$3
    
    log "Starting $name..."
    cd "$dir"
    $command &
    local pid=$!
    cd - > /dev/null
    echo $pid > ".${name}.pid"
    log "$name started with PID $pid"
}

# Start backend
run_service "backend" "npm run dev" "backend"

# Start frontend
run_service "frontend" "pnpm run dev" "client"

log "All development services started ✓"
log "Frontend: http://localhost:3000"
log "Backend API: http://localhost:3001"
log "Stop with: ./stop-dev.sh"
EOF

    chmod +x start-dev.sh
    
    # Development stop script
    cat > stop-dev.sh << 'EOF'
#!/bin/bash

log() {
    echo "[$(date)] $1"
}

log "Stopping PNS Development Services..."

# Function to stop service by PID file
stop_service() {
    local name=$1
    local pidfile=".${name}.pid"
    
    if [ -f "$pidfile" ]; then
        local pid=$(cat "$pidfile")
        if kill -0 "$pid" 2>/dev/null; then
            log "Stopping $name (PID: $pid)..."
            kill "$pid"
            rm "$pidfile"
        else
            log "$name is not running"
            rm "$pidfile"
        fi
    else
        log "No PID file found for $name"
    fi
}

stop_service "backend"
stop_service "frontend"

# Also kill any remaining node processes on our ports
pkill -f "vite.*3000" 2>/dev/null || true
pkill -f "ts-node.*3001" 2>/dev/null || true

log "All development services stopped ✓"
EOF

    chmod +x stop-dev.sh
    
    log "Development scripts created ✓"
}

# Create nginx configuration
create_nginx_config() {
    log "Creating nginx configuration..."
    
    mkdir -p config/nginx
    
    cat > config/nginx/pns.conf << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Frontend static files
    location / {
        root /path/to/pns/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Backend API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Health check
    location /health {
        proxy_pass http://localhost:3001/api/health;
        access_log off;
    }
}
EOF
    
    log "Nginx configuration created ✓"
    warn "Update config/nginx/pns.conf with your domain and SSL certificate paths"
}

# Create Docker configuration
create_docker_config() {
    log "Creating Docker configuration..."
    
    # Frontend Dockerfile
    cat > client/Dockerfile << 'EOF'
# Frontend Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

    # Frontend nginx config
    cat > client/nginx.conf << 'EOF'
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

    # Backend Dockerfile
    cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
EOF

    # Docker Compose
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  database:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: pns_db
      POSTGRES_USER: pns_user
      POSTGRES_PASSWORD: pns_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/sql/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    restart: unless-stopped

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://pns_user:pns_password@database:5432/pns_db
    depends_on:
      - database
    ports:
      - "3001:3001"
    restart: unless-stopped
    volumes:
      - ./backend/logs:/app/logs

  frontend:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
EOF

    log "Docker configuration created ✓"
}

# Create backup scripts
create_backup_scripts() {
    log "Creating backup scripts..."
    
    mkdir -p scripts/backup
    
    cat > scripts/backup/backup-db.sh << 'EOF'
#!/bin/bash

# Database backup script

BACKUP_DIR="/path/to/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DATABASE="pns_db"
USER="pns_user"

mkdir -p "$BACKUP_DIR"

# Create backup
pg_dump -h localhost -U "$USER" -d "$DATABASE" | gzip > "$BACKUP_DIR/pns_db_$DATE.sql.gz"

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "pns_db_*.sql.gz" -mtime +30 -delete

echo "Database backup completed: pns_db_$DATE.sql.gz"
EOF

    chmod +x scripts/backup/backup-db.sh
    
    cat > scripts/backup/restore-db.sh << 'EOF'
#!/bin/bash

# Database restore script

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"
DATABASE="pns_db"
USER="pns_user"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Restoring database from $BACKUP_FILE..."

# Drop and recreate database
dropdb -h localhost -U "$USER" "$DATABASE"
createdb -h localhost -U "$USER" "$DATABASE"

# Restore from backup
if [[ "$BACKUP_FILE" == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | psql -h localhost -U "$USER" -d "$DATABASE"
else
    psql -h localhost -U "$USER" -d "$DATABASE" < "$BACKUP_FILE"
fi

echo "Database restore completed"
EOF

    chmod +x scripts/backup/restore-db.sh
    
    log "Backup scripts created ✓"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring scripts..."
    
    mkdir -p scripts/monitoring
    
    cat > scripts/monitoring/health-check.sh << 'EOF'
#!/bin/bash

# Health check script for monitoring

check_service() {
    local service_name=$1
    local url=$2
    
    echo -n "Checking $service_name... "
    
    if curl -f -s "$url" > /dev/null; then
        echo "✓ OK"
        return 0
    else
        echo "✗ FAILED"
        return 1
    fi
}

echo "=== PNS Health Check ==="
echo "$(date)"
echo ""

# Check backend
check_service "Backend API" "http://localhost:3001/api/health"

# Check if frontend is accessible
check_service "Frontend" "http://localhost:3000"

echo ""
echo "Health check completed"
EOF

    chmod +x scripts/monitoring/health-check.sh
    
    # System stats script
    cat > scripts/monitoring/system-stats.sh << 'EOF'
#!/bin/bash

# System statistics script

echo "=== PNS System Statistics ==="
echo "$(date)"
echo ""

# System info
echo "--- System Information ---"
echo "Uptime: $(uptime)"
echo "Memory: $(free -h | grep Mem | awk '{print $3 "/" $2}')"
echo "Disk: $(df -h / | tail -1 | awk '{print $3 "/" $2 " (" $5 " used)"}')"
echo ""

# Process info
echo "--- Process Information ---"
if command -v pm2 >/dev/null 2>&1; then
    echo "PM2 Status:"
    pm2 status
else
    echo "PM2 not found, checking node processes:"
    ps aux | grep node | grep -v grep
fi
echo ""

# Network info
echo "--- Network Information ---"
echo "Listening ports:"
netstat -tlnp | grep :300 2>/dev/null || ss -tlnp | grep :300
echo ""

# Log info
echo "--- Recent Log Entries ---"
if [ -f "backend/logs/combined.log" ]; then
    echo "Backend logs (last 5 lines):"
    tail -5 backend/logs/combined.log
fi
EOF

    chmod +x scripts/monitoring/system-stats.sh
    
    log "Monitoring scripts created ✓"
}

# Print final instructions
print_final_instructions() {
    log "Setup completed successfully! 🎉"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           Next Steps                                        ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "1. 📝 Configure Environment Files:"
    echo "   - Update backend/.env with your configuration"
    echo "   - Update client/.env.local with your RPC URLs and contract addresses"
    echo "   - Update contracts/.env with your private keys and API keys"
    echo ""
    echo "2. 🚀 Deploy Smart Contracts:"
    echo "   cd contracts"
    echo "   ./deploy-amoy.sh     # For testnet"
    echo "   ./deploy-polygon.sh  # For mainnet"
    echo ""
    echo "3. 🏗️ Start Development:"
    echo "   ./start-dev.sh       # Start all services"
    echo "   ./stop-dev.sh        # Stop all services"
    echo ""
    echo "4. 🌐 Production Deployment:"
    echo "   - Build: npm run build (in each directory)"
    echo "   - Deploy frontend: Copy client/dist to web server"
    echo "   - Deploy backend: Use PM2 or Docker"
    echo "   - Setup database: PostgreSQL for production"
    echo ""
    echo "5. 📊 Monitoring:"
    echo "   ./scripts/monitoring/health-check.sh    # Check service health"
    echo "   ./scripts/monitoring/system-stats.sh    # View system statistics"
    echo ""
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                           URLs                                               ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Frontend:     http://localhost:3000"
    echo "Backend API:  http://localhost:3001"
    echo "Health Check: http://localhost:3001/api/health"
    echo "API Docs:     http://localhost:3001/"
    echo ""
    warn "Remember to:"
    warn "- Update all .env files with real values"
    warn "- Keep private keys secure and never commit them"
    warn "- Setup SSL certificates for production"
    warn "- Configure proper database in production"
    warn "- Setup proper monitoring and logging"
    echo ""
}

# Main execution
main() {
    print_banner
    
    check_requirements
    setup_environment
    install_dependencies
    build_contracts
    
    read -p "Deploy contracts now? (y/n): " DEPLOY_NOW
    if [ "$DEPLOY_NOW" = "y" ] || [ "$DEPLOY_NOW" = "Y" ]; then
        deploy_contracts
    fi
    
    build_frontend
    build_backend
    setup_database
    create_production_scripts
    create_development_scripts
    create_nginx_config
    create_docker_config
    create_backup_scripts
    setup_monitoring
    
    print_final_instructions
}

# Run if script is executed directly
if [ "${BASH_SOURCE[0]}" == "${0}" ]; then
    main "$@"
fi