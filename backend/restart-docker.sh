#!/bin/bash

echo "🔄 Restarting PNS Backend services..."
docker-compose restart

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 3

# Check health
echo ""
echo "🏥 Health Check:"
curl -s http://localhost:3000/health | jq '.'

echo ""
echo "✅ Services restarted!"
