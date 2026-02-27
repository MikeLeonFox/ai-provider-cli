# AI Provider CLI

A command-line tool to manage multiple AI providers (Claude API, LiteLLM, Claude Code CLI subscription) with secure API key storage.

## Features

- **Secure Storage**: API keys are encrypted and stored in your OS keychain (not in plain text)
- **Multiple Providers**: Support for Claude API, LiteLLM, and subscription services
- **Easy Switching**: Quickly switch between different AI providers
- **Export Options**: Get provider configuration as JSON or environment variables

## Installation

```bash
npm install
npm run build
npm link
```

After linking, the `ai-provider` command will be available globally.

## Usage

### Add a Provider

Add a new AI provider interactively:

```bash
ai-provider add
```

Or specify options directly:

```bash
ai-provider add --name my-claude --type claude
```

**Provider Types:**
- `claude`: Claude API (requires API key and endpoint)
- `litellm`: LiteLLM proxy (requires API key and endpoint)
- `subscription`: Claude Code CLI subscription (no API key needed)

### List Providers

View all configured providers:

```bash
ai-provider list
```

The active provider is marked with a green ●.

### Switch Providers

Switch to a different provider:

```bash
ai-provider switch <name>
```

### View Current Provider

Show the currently active provider:

```bash
ai-provider current
```

Get output as JSON (useful for scripts):

```bash
ai-provider current --json
```

Get output as environment variables:

```bash
ai-provider current --env
```

Example usage with scripts:

```bash
# Load environment variables
eval $(ai-provider current --env)

# Use in scripts
PROVIDER_INFO=$(ai-provider current --json)
```

### Remove a Provider

Remove a provider (with confirmation):

```bash
ai-provider remove <name>
```

This will also delete the API key from your OS keychain.

## Security

- API keys are **never** stored in plain text
- Keys are stored in your operating system's secure keychain:
  - macOS: Keychain
  - Linux: libsecret
  - Windows: Credential Vault
- Configuration file (`~/.ai-providers/config.json`) only stores metadata
- Use `ai-provider current` (without flags) to see a masked version of your API key

## Configuration

Configuration is stored in `~/.ai-providers/config.json` and contains:
- List of providers (names, types, endpoints)
- Active provider name
- **No API keys** (those are in the OS keychain)

## Examples

### Example 1: Claude API Setup

```bash
ai-provider add --name production-claude --type claude
# Enter endpoint: https://api.anthropic.com
# Enter API key: sk-ant-...

ai-provider switch production-claude
```

### Example 2: LiteLLM Proxy

```bash
ai-provider add --name local-litellm --type litellm
# Enter endpoint: http://localhost:4000/v1
# Enter API key: your-key

ai-provider switch local-litellm
```

### Example 3: Subscription Service

```bash
ai-provider add --name subscription --type subscription
# Enter tool name: claude-code

ai-provider switch subscription
```

### Example 4: Script Integration

```bash
#!/bin/bash
# Use the active provider in a script

# Get configuration as JSON
PROVIDER=$(ai-provider current --json)
PROVIDER_TYPE=$(echo $PROVIDER | jq -r '.type')

if [ "$PROVIDER_TYPE" == "claude" ]; then
    # Load environment variables
    eval $(ai-provider current --env)

    # Use ANTHROPIC_API_KEY and ANTHROPIC_API_URL in your script
    echo "Using Claude API at $ANTHROPIC_API_URL"
fi
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in dev mode
npm run dev -- <command>
```

## License

MIT
