#!/bin/bash

echo "🚀 Starting News Ninja..."
echo ""

# Start Plausible
if [ -d "$HOME/plausible-ce" ]; then
    echo "📊 Starting Plausible..."
    cd $HOME/plausible-ce
    docker compose up -d
fi

# Start Ollama
echo "🤖 Starting Ollama..."
sudo systemctl start ollama

sleep 3

# Start Backend
echo "⚙️  Starting Backend..."
cd $HOME/news-ninja/backend
npm run dev > /dev/null 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Start Frontend
echo "🎨 Starting Frontend..."
cd $HOME/news-ninja/frontend
npm start > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"

sleep 5

echo ""
echo "✅ All services started!"
echo ""
echo "📡 Backend API:  http://localhost:5000"
echo "🌐 Frontend App: http://localhost:3000"
echo ""
echo "To stop services:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  cd ~/plausible-ce && docker compose down"
