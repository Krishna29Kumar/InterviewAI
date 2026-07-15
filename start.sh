#!/bin/bash
# ============================================================
#  InterviewAI — One-Click Start Script (Mac)
#  Express Server + Python Backend + Ollama + Ngrok
#  Frontend is deployed on Vercel (no local React needed)
# ============================================================

# ── CONFIG ───────────────────────────────────────────────────
NGROK_DOMAIN="unrated-graves-vacant.ngrok-free.dev"   # NO https:// prefix!
PROJECT_ROOT="$HOME/Desktop/interviewAi/InterviewAI"

# ── Derived Paths ────────────────────────────────────────────
SERVER_DIR="$PROJECT_ROOT/server"
BACKEND_DIR="$PROJECT_ROOT/backend"

# ── Colors ───────────────────────────────────────────────────
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo "=============================================="
echo "   🚀  InterviewAI — Starting All Services"
echo "=============================================="
echo ""

# ── Step 0: Kill existing processes ──────────────────────────
echo -e "${YELLOW}[0/4] Cleaning up old processes...${NC}"
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
pkill -f ngrok 2>/dev/null
sleep 2
echo -e "${GREEN}   ✅ Cleanup done${NC}"

# ── Step 1: Start Ollama ─────────────────────────────────────
echo ""
echo -e "${YELLOW}[1/4] Starting Ollama (llama3.1:8b)...${NC}"
osascript -e 'tell application "Terminal"
  do script "ollama serve"
  set custom title of front window to "🤖 Ollama"
end tell'
sleep 3
echo -e "${GREEN}   ✅ Ollama started on port 11434${NC}"

# ── Step 2: Start Python FastAPI Backend ─────────────────────
echo ""
echo -e "${YELLOW}[2/4] Starting Python FastAPI Backend...${NC}"
osascript -e "tell application \"Terminal\"
  do script \"cd '$BACKEND_DIR' && source venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload\"
  set custom title of front window to \"🐍 Python Backend (8000)\"
end tell"
sleep 4
echo -e "${GREEN}   ✅ Python Backend started on port 8000${NC}"

# ── Step 3: Start Express Server ─────────────────────────────
echo ""
echo -e "${YELLOW}[3/4] Starting Express Server...${NC}"
osascript -e "tell application \"Terminal\"
  do script \"cd '$SERVER_DIR' && npm run dev\"
  set custom title of front window to \"🟢 Express Server (5001)\"
end tell"
sleep 3
echo -e "${GREEN}   ✅ Express Server started on port 5001${NC}"

# ── Step 4: Start Ngrok Tunnel (Express only) ────────────────
echo ""
echo -e "${YELLOW}[4/4] Starting Ngrok Tunnel → Express...${NC}"
osascript -e "tell application \"Terminal\"
  do script \"ngrok http 5001 --domain=$NGROK_DOMAIN\"
  set custom title of front window to \"🌐 Ngrok Tunnel\"
end tell"
sleep 3
echo -e "${GREEN}   ✅ Ngrok tunnel started${NC}"

# ── Done ─────────────────────────────────────────────────────
echo ""
echo "=============================================="
echo -e "${CYAN}   🎉 InterviewAI Backend is LIVE!${NC}"
echo "=============================================="
echo ""
echo -e "   ${GREEN}Local URLs:${NC}"
echo "   🟢 Express Server:   http://localhost:5001"
echo "   🐍 Python Backend:   http://localhost:8000"
echo "   🤖 Ollama:           http://localhost:11434"
echo ""
echo -e "   ${CYAN}Public URL (Vercel se yeh use karo):${NC}"
echo "   🌐 Ngrok:  https://$NGROK_DOMAIN"
echo ""
echo -e "   ${YELLOW}Vercel Frontend se VITE_API_URL set karo:${NC}"
echo "   VITE_API_URL=https://$NGROK_DOMAIN"
echo ""
echo "=============================================="
echo ""

# Keep script running
read -r -p "Press ENTER to stop all services..."
echo ""
echo "Stopping all services..."
lsof -ti:5001 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null
pkill -f ngrok 2>/dev/null
pkill -f ollama 2>/dev/null
echo -e "${GREEN}All services stopped. Goodbye! 👋${NC}"
