#!/bin/bash

echo "🧪 Testing WordPress OTP Endpoint"
echo "=================================="
echo ""

# Test request-otp endpoint
echo "📱 Testing Request OTP Endpoint..."
echo "URL: https://embolo.in/wp-json/eco-swift/v1/auth/request-otp"
echo ""

curl -X POST https://embolo.in/wp-json/eco-swift/v1/auth/request-otp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"username":"test@example.com"}' \
  -v \
  -w "\n\n📊 HTTP Status: %{http_code}\n⏱️  Time Total: %{time_total}s\n" \
  2>&1

echo ""
echo "=================================="
echo "✅ Test Complete"
echo ""
echo "📝 What to check:"
echo "  - HTTP Status should be 200 or 400 (400 is OK if user doesn't exist)"
echo "  - Should NOT see 'Connection refused' or 'Could not resolve host'"
echo "  - Response should be valid JSON"
echo "  - CORS headers should be present"
