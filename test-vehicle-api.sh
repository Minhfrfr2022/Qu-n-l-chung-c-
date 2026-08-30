#!/bin/bash

echo "🧪 Testing Vehicle Registration API..."
echo ""

# Test 1: Health check
echo "1️⃣ Testing health endpoint..."
HEALTH=$(curl -s http://localhost:3001/api/health)
echo "Response: $HEALTH"
echo ""

# Test 2: Insert request
echo "2️⃣ Testing insert request..."
RESPONSE=$(curl -s -X POST http://localhost:3001/api/vehicles/insert-request \
  -H "Content-Type: application/json" \
  -d '{
    "apt_id": "A101",
    "number": "TEST-'$(date +%s)'",
    "type": "car",
    "color": "Red",
    "owner": "Test User"
  }')
echo "Response: $RESPONSE"
echo ""

# Test 3: Check if backend is running
if [ -z "$RESPONSE" ]; then
    echo "❌ No response from backend!"
    echo "Checking if backend is running on port 3001..."
    lsof -i:3001
else
    echo "✅ Backend responded!"
fi
