# Manual Testing Guide

## Prerequisites

The CLI has been built and linked. To use it:

```bash
# Full path (always works)
/Users/mike.fox/.nvm/versions/node/v25.1.0/bin/ai-provider

# Or add to your shell's PATH by adding this to ~/.zshrc:
export PATH="$PATH:/Users/mike.fox/.nvm/versions/node/v25.1.0/bin"
```

## Test Scenarios

### 1. Test List (Empty State)

```bash
ai-provider list
```

Expected output:
```
No providers configured yet.
Use "ai-provider add" to add a provider.
```

### 2. Test Current (No Active Provider)

```bash
ai-provider current
```

Expected output:
```
No active provider configured.
Use "ai-provider add" to add a provider.
```

### 3. Add a Subscription Provider

```bash
ai-provider add
```

Follow the prompts:
- Name: `test-subscription`
- Type: Select "Subscription (Claude Code CLI)"
- Tool: `claude-code` (default)

Expected output:
```
✓ Provider 'test-subscription' added successfully
```

### 4. List Providers (After Adding One)

```bash
ai-provider list
```

Expected output:
```
Configured Providers:

● test-subscription
  Type: subscription
  Tool: claude-code

Active provider: test-subscription
```

### 5. View Current Provider

```bash
ai-provider current
```

Expected output:
```
Active Provider:

Name: test-subscription
Type: subscription
Tool: claude-code
```

### 6. View Current as JSON

```bash
ai-provider current --json
```

Expected output:
```json
{
  "name": "test-subscription",
  "type": "subscription",
  "tool": "claude-code"
}
```

### 7. View Current as Environment Variables

```bash
ai-provider current --env
```

Expected output:
```bash
export AI_PROVIDER_TYPE="subscription"
export AI_PROVIDER_TOOL="claude-code"
```

### 8. Add a Claude API Provider

```bash
ai-provider add --name my-claude --type claude
```

Follow the prompts:
- Endpoint: `https://api.anthropic.com` (default)
- API Key: Enter your API key (will be hidden)

**Note**: The API key will be stored securely in your OS keychain, NOT in the config file.

### 9. Switch Providers

```bash
ai-provider switch my-claude
```

Expected output:
```
✓ Switched to provider 'my-claude'
```

### 10. View Current Provider (With API Key)

```bash
ai-provider current
```

Expected output:
```
Active Provider:

Name: my-claude
Type: claude
Endpoint: https://api.anthropic.com
API Key: sk-ant-a...xyz (masked)
```

### 11. Add a LiteLLM Provider

```bash
ai-provider add --name local-litellm --type litellm
```

Follow the prompts:
- Endpoint: `http://localhost:4000/v1` (default)
- API Key: Enter your API key

### 12. Remove a Provider

```bash
ai-provider remove test-subscription
```

Confirm removal when prompted.

Expected output:
```
✓ Provider 'test-subscription' removed successfully
```

### 13. Verify Configuration File

```bash
cat ~/.ai-providers/config.json
```

Should show your providers (without API keys).

### 14. Verify API Keys in Keychain (macOS)

```bash
security find-generic-password -s "ai-provider-cli" -a "my-claude"
```

This confirms the API key is stored in macOS Keychain.

## Integration Testing

Test using the CLI output in a script:

```bash
#!/bin/bash

# Get current provider as JSON
PROVIDER=$(ai-provider current --json)
PROVIDER_NAME=$(echo $PROVIDER | jq -r '.name')

echo "Current provider: $PROVIDER_NAME"

# Load environment variables
eval $(ai-provider current --env)

# Check if variables are set
if [ -n "$ANTHROPIC_API_KEY" ]; then
    echo "API key is available"
fi
```

## Cleanup

To remove all providers and reset:

```bash
rm -rf ~/.ai-providers
```

To unlink the CLI:

```bash
cd /Users/mike.fox/ai-provider-cli
npm unlink
```
