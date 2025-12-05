#!/bin/bash

echo "📊 PNS Backend Logs"
echo "=================="
echo ""
echo "Press Ctrl+C to exit"
echo ""

docker-compose logs -f backend
