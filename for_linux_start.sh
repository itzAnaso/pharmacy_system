#!/bin/bash

# Pharmacy Management System - Quick Start Script
# This script helps you start the application easily

echo "=========================================="
echo "  Pharmacy Management System"
echo "  Local Setup Script"
echo "=========================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Display Node.js version
NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"
echo ""

# Start the development server
echo "🚀 Starting development server..."
echo "   The app will be available at: http://localhost:8080"
echo ""
echo "   Press Ctrl+C to stop the server"
echo ""

npm run dev

