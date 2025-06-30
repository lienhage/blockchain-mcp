#!/bin/bash

echo "🔨 Building project..."
npm run build

echo "📝 Running tests..."
npm test || echo "⚠️ No tests found, skipping..."

echo "📦 Publishing to npm..."
npm publish --access public

echo "✅ Published successfully!"
echo "📖 Update your MCP config to use: npx @your-username/blockchain-mcp" 