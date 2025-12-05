#!/bin/bash

# Start Docker Compose services
echo "🚀 Starting PNS Backend services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ Services started!"
echo ""
echo "📚 Useful commands:"
echo "  View logs:        docker-compose logs -f backend"
echo "  Stop services:    docker-compose down"
echo "  Restart backend:  docker-compose restart backend"
echo "  Check health:     curl http://localhost:3000/health"
echo ""
echo "🔗 Service URLs:"
echo "  API:        http://localhost:3000"
echo "  Health:     http://localhost:3000/health"
echo "  PostgreSQL: postgresql://postgres:postgres@localhost:5432/pns"
echo "  Redis:      redis://localhost:6379"
