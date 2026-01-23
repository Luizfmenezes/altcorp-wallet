#!/bin/bash
# Diagnostic Script for AltCorp Wallet
# Run this on your Linux VM to diagnose issues

echo "🔍 AltCorp Wallet - Diagnostic Report"
echo "======================================"
echo ""

# 1. Check Docker containers
echo "📦 Docker Containers Status:"
docker-compose ps
echo ""

# 2. Check environment variables
echo "🌍 Environment Variables:"
echo "ALLOWED_ORIGINS:"
cat .env | grep ALLOWED_ORIGINS
echo ""
echo "Frontend VITE_API_URL:"
cat frontend/.env 2>/dev/null || echo "File not found!"
echo ""

# 3. Check if ports are accessible
echo "🔌 Port Accessibility:"
echo "Frontend (8080):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8080
echo ""
echo "Backend (8000):"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:8000/docs
echo ""

# 4. Test backend API
echo "🔐 Backend API Test (Login):"
curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.access_token' | head -c 50
echo "..."
echo ""

# 5. Check backend logs for errors
echo "📋 Backend Logs (last 20 lines):"
docker logs altcorp-wallet-backend --tail 20 2>&1 | grep -E "ERROR|CORS|allowed"
echo ""

# 6. Check if frontend has old URLs
echo "🔎 Frontend Build Check (looking for hardcoded localhost:8000):"
HARDCODED=$(docker exec altcorp-wallet-frontend sh -c "cat /usr/share/nginx/html/assets/*.js 2>/dev/null | grep -o 'http://localhost:8000' | wc -l" 2>/dev/null)
if [ "$HARDCODED" -gt 0 ]; then
    echo "⚠️  WARNING: Found $HARDCODED references to http://localhost:8000"
    echo "   Action needed: Rebuild frontend with: docker-compose build --no-cache frontend"
else
    echo "✅ No hardcoded URLs found (or container not running)"
fi
echo ""

# 7. Recommendations
echo "📝 Recommendations:"
echo ""

# Check ALLOWED_ORIGINS
if grep -q "https://wallet.altcorphub.com" .env; then
    echo "✅ ALLOWED_ORIGINS includes https://wallet.altcorphub.com"
else
    echo "❌ ALLOWED_ORIGINS missing https://wallet.altcorphub.com"
    echo "   Fix: Add to .env → ALLOWED_ORIGINS=https://wallet.altcorphub.com,http://192.168.15.5:8080"
fi

# Check frontend .env
if [ -f "frontend/.env" ]; then
    if grep -q "^VITE_API_URL=$" frontend/.env || grep -q "^VITE_API_URL=\s*$" frontend/.env; then
        echo "✅ Frontend .env configured correctly (VITE_API_URL empty)"
    else
        echo "⚠️  Frontend .env has VITE_API_URL set (should be empty)"
        echo "   Fix: Edit frontend/.env → VITE_API_URL="
    fi
else
    echo "⚠️  frontend/.env not found"
    echo "   Create it: echo 'VITE_API_URL=' > frontend/.env"
fi

echo ""
echo "======================================"
echo "🎯 Quick Fix Commands:"
echo "======================================"
echo "1. Rebuild frontend:"
echo "   docker-compose build --no-cache frontend && docker-compose up -d"
echo ""
echo "2. Restart backend (apply CORS changes):"
echo "   docker-compose restart backend"
echo ""
echo "3. View live logs:"
echo "   docker-compose logs -f"
echo ""
echo "======================================"
