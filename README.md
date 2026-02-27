# aic — AI Config CLI

A command-line tool to manage multiple AI providers (Claude API, LiteLLM, Claude Code subscription) with secure API key storage and seamless Claude Code integration.

## Features

- **Secure Storage** — API keys are encrypted and stored in your OS keychain, never in plain text
- **Multiple Provider Types** — Claude API, LiteLLM proxy, and Claude Code subscription
- **Instant Switching** — Interactive picker or `aic switch <name>`; use `aic switch -` to jump back to the previous provider
- **VSCode Sync** — Automatically updates `claudeCode.environmentVariables` in VSCode settings on switch
- **Model Configuration** — Set primary and small models per provider
- **Provider Options** — Per-provider `alwaysThinking`, `disableTelemetry`, `disableBetas` flags
- **Discover** — Import existing settings from `~/.claude/settings.json` as a provider
- **Shell Completions** — Built-in bash, zsh, and fish completion scripts

## Installation

### Homebrew (recommended)

```bash
brew tap mikeleonfox/ai-provider-cli https://github.com/MikeLeonFox/ai-provider-cli
brew install aic
```

### From source

```bash
git clone https://github.com/MikeLeonFox/ai-provider-cli.git
cd ai-provider-cli
npm install
npm run build
npm link
```

## Commands

### `aic add`

Add a new provider interactively. Prompts for type, endpoint, API key, model, and options:

```bash
aic add
aic add --name my-claude --type claude
```

**Provider types:**
- `claude` — Direct Claude API (endpoint + API key)
- `litellm` — LiteLLM proxy (endpoint + API key)
- `subscription` — Claude Code subscription (no API key)

**Optional fields prompted during add:**
- Primary model (e.g. `claude-opus-4-6`) → sets `ANTHROPIC_MODEL`
- Small/haiku model → sets `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- Always-thinking mode → sets `alwaysThinkingEnabled` in `~/.claude/settings.json`
- Disable telemetry → sets `DISABLE_TELEMETRY=1`
- Disable experimental betas → sets `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1`

---

### `aic switch [name]`

Switch to a provider. Omit the name for an interactive arrow-key picker:

```bash
aic switch              # interactive picker
aic switch production   # switch directly
aic switch -            # switch back to previous provider
```

On switch, `~/.claude/settings.json` is updated and VSCode settings are synced if detected.

---

### `aic list`

List all configured providers. The active provider is marked with a green ●:

```bash
aic list
aic list --names-only   # one name per line (for scripts)
```

---

### `aic show [name]`

Show full details for a provider. Defaults to the active provider:

```bash
aic show
aic show production
aic show production --reveal   # show full API key
```

---

### `aic current`

Show the currently active provider:

```bash
aic current
aic current --json   # JSON output
aic current --env    # export statements for ANTHROPIC_AUTH_TOKEN etc.
```

---

### `aic remove <name>`

Remove a provider and delete its API key from the keychain:

```bash
aic remove old-provider
```

---

### `aic env <name>`

Manage custom environment variables for a provider:

```bash
aic env my-provider
```

---

### `aic discover`

Import the current `~/.claude/settings.json` settings as a named provider. Reverse-maps all known env vars and saves the API key to your keychain:

```bash
aic discover
aic discover --name imported
```

---

### `aic completion <shell>`

Print a shell completion script:

```bash
# bash
aic completion bash >> ~/.bashrc

# zsh
aic completion zsh > ~/.zsh/completions/_aic

# fish
aic completion fish > ~/.config/fish/completions/aic.fish
```

---

## How It Works

When you switch providers, `aic` writes the following to `~/.claude/settings.json`:

| Provider field | Env var written |
|---|---|
| API key | `ANTHROPIC_AUTH_TOKEN` |
| Endpoint | `ANTHROPIC_BASE_URL` |
| `model` | `ANTHROPIC_MODEL` |
| `smallModel` | `ANTHROPIC_DEFAULT_HAIKU_MODEL` |
| `options.disableTelemetry` | `DISABLE_TELEMETRY=1` |
| `options.disableBetas` | `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1` |
| `options.alwaysThinking` | `alwaysThinkingEnabled` (top-level key) |

If VSCode is installed, `claudeCode.environmentVariables` in your VSCode `settings.json` is also updated (best-effort, non-fatal).

All writes are atomic (write to `.tmp`, then rename) to prevent corruption.

---

## Security

- API keys are **never** stored in plain text
- Keys live in your OS keychain:
  - **macOS** — Keychain
  - **Linux** — libsecret
  - **Windows** — Credential Vault
- `~/.ai-providers/config.json` stores only metadata (names, types, endpoints)
- `aic show` masks the API key by default; use `--reveal` to see it in full

---

## Examples

### Switch between work and personal providers

```bash
aic add --name work --type claude
aic add --name personal --type claude

aic switch work
# ... do work stuff ...
aic switch personal
# ... do personal stuff ...
aic switch -     # back to work
```

### Import existing Claude Code settings

```bash
aic discover --name before-aic
```

### Set up shell completions (zsh)

```bash
mkdir -p ~/.zsh/completions
aic completion zsh > ~/.zsh/completions/_aic
echo 'fpath=(~/.zsh/completions $fpath)' >> ~/.zshrc
echo 'autoload -U compinit && compinit' >> ~/.zshrc
```

---

## Development

```bash
npm install
npm run build
npm run dev -- <command>   # run without building
```

---

## License

MIT
