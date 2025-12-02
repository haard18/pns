#!/bin/bash

# Simple backend startup for Anvil testing
# This starts the backend with the right environment configuration

# Load environment
export $(cat .env.anvil | xargs)

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Start the backend
npm start