#!/bin/bash

echo "═══════════════════════════════════════════════════════"
echo "🥷 NEWS NINJA - SYSTEM STATUS CHECK"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "📊 Plausible Analytics:"
if [ -d "$HOME/plausible-ce" ]; then
    cd $HOME/plausible-ce
    docker compose ps | grep -E "(plausible|Up)" && echo "   ✅ Running" || echo "   ❌ Not running"
else
    echo "   ⚠️  Not installed"
fi
echo ""

echo "🤖 Ollama AI:"
systemctl is-active --quiet ollama && echo "   ✅ Running" || echo "   ❌ Not running"
ollama list | grep "mistral-nemo" && echo "   ✅ Mistral-Nemo loaded" || echo "   ⚠️  Model not found"
echo ""

echo "⚙️  Backend API:"
curl -s http://localhost:5000/api/health > /dev/null && echo "   ✅ Running" || echo "   ❌ Not running"
echo ""

echo "🎨 Frontend App:"
curl -s http://localhost:3000 > /dev/null && echo "   ✅ Running" || echo "   ❌ Not running"
echo ""

echo "═══════════════════════════════════════════════════════"
