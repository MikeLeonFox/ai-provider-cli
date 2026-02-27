#!/bin/bash

# Test script for ai-provider CLI
CLI="/Users/mike.fox/.nvm/versions/node/v25.1.0/bin/ai-provider"

echo "=== Testing AI Provider CLI ==="
echo ""

echo "1. Testing list (should be empty):"
$CLI list
echo ""

echo "2. Testing current (should show no provider):"
$CLI current
echo ""

echo "3. Adding a subscription provider:"
echo -e "test-subscription\nsubscription\nclaude-code\n" | $CLI add
echo ""

echo "4. Testing list (should show 1 provider):"
$CLI list
echo ""

echo "5. Testing current (should show subscription provider):"
$CLI current
echo ""

echo "6. Testing current --json:"
$CLI current --json
echo ""

echo "7. Testing current --env:"
$CLI current --env
echo ""

echo "8. Adding a Claude API provider (non-interactive):"
# Note: For real testing with prompts, we'd need to use expect or similar
# For now, we'll just show that the command exists
$CLI add --help
echo ""

echo "9. Switching to subscription provider:"
$CLI switch test-subscription
echo ""

echo "10. Testing remove (with confirmation 'n'):"
echo "n" | $CLI remove test-subscription
echo ""

echo "11. Final list:"
$CLI list
echo ""

echo "=== Test Complete ==="
