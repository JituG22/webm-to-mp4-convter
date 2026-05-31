#!/bin/bash

# WebM to MP4 Converter - Quick Start Script

echo "🎬 WebM to MP4 Converter - Starting Services"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg is not installed. Please install FFmpeg first."
    echo "   On macOS: brew install ffmpeg"
    echo "   On Ubuntu: sudo apt-get install ffmpeg"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo "✅ FFmpeg found: $(ffmpeg -version | head -1)"
echo ""

# Save project root
PROJECT_ROOT="$(dirname "$0")"

# Start backend server
echo "📡 Starting Backend Server (http://localhost:5000)"
(cd "$PROJECT_ROOT/server" && npm start) &
BACKEND_PID=$!

sleep 2

# Start frontend development server
echo "🌐 Starting Frontend Server (http://localhost:3000)"
(cd "$PROJECT_ROOT/client" && npm run dev) &
FRONTEND_PID=$!

echo ""
echo "✅ Services started!"
echo "📱 Open your browser: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
