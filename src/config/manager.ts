import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as keytar from 'keytar';
import { Config, Provider, requiresApiKey } from '../types/provider.js';

const CONFIG_DIR = path.join(os.homedir(), '.ai-providers');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const KEYCHAIN_SERVICE = 'ai-provider-cli';

function ensureConfigDir(): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadConfig(): Config {
  ensureConfigDir();

  if (!fs.existsSync(CONFIG_FILE)) {
    const defaultConfig: Config = {
      providers: []
    };
    saveConfig(defaultConfig);
    return defaultConfig;
  }

  const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
  return JSON.parse(configData) as Config;
}

export function saveConfig(config: Config): void {
  ensureConfigDir();
  const tmpFile = CONFIG_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(config, null, 2), 'utf-8');
  fs.renameSync(tmpFile, CONFIG_FILE);
}

export async function setApiKey(providerName: string, apiKey: string): Promise<void> {
  await keytar.setPassword(KEYCHAIN_SERVICE, providerName, apiKey);
}

export async function getApiKey(providerName: string): Promise<string | null> {
  return await keytar.getPassword(KEYCHAIN_SERVICE, providerName);
}

export async function deleteApiKey(providerName: string): Promise<boolean> {
  return await keytar.deletePassword(KEYCHAIN_SERVICE, providerName);
}

export async function addProvider(provider: Provider, apiKey?: string): Promise<void> {
  const config = loadConfig();

  // Check if provider already exists
  const existingIndex = config.providers.findIndex(p => p.name === provider.name);
  if (existingIndex !== -1) {
    throw new Error(`Provider '${provider.name}' already exists`);
  }

  // Store API key in keychain if provided
  if (apiKey && requiresApiKey(provider)) {
    await setApiKey(provider.name, apiKey);
  }

  // Add provider to config
  config.providers.push(provider);

  // Set as active if it's the first provider
  if (config.providers.length === 1) {
    config.activeProvider = provider.name;
  }

  saveConfig(config);
}

export async function removeProvider(providerName: string): Promise<void> {
  const config = loadConfig();

  const providerIndex = config.providers.findIndex(p => p.name === providerName);
  if (providerIndex === -1) {
    throw new Error(`Provider '${providerName}' not found`);
  }

  const provider = config.providers[providerIndex];

  // Delete API key from keychain if it has one
  if (requiresApiKey(provider)) {
    await deleteApiKey(providerName);
  }

  // Remove from config
  config.providers.splice(providerIndex, 1);

  // Clear active provider if it was the one being removed
  if (config.activeProvider === providerName) {
    config.activeProvider = config.providers.length > 0 ? config.providers[0].name : undefined;
  }

  // Clear previous provider if it was the one being removed
  if (config.previousProvider === providerName) {
    config.previousProvider = undefined;
  }

  saveConfig(config);
}

const CLAUDE_SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');

function loadClaudeSettings(): Record<string, unknown> {
  if (!fs.existsSync(CLAUDE_SETTINGS_FILE)) {
    return {};
  }
  const raw = fs.readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8');
  // Strip trailing commas before parsing (common in hand-edited JSON)
  const cleaned = raw.replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(cleaned);
}

function saveClaudeSettings(settings: Record<string, unknown>): void {
  const dir = path.dirname(CLAUDE_SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpFile = CLAUDE_SETTINGS_FILE + '.tmp';
  fs.writeFileSync(tmpFile, JSON.stringify(settings, null, 2), 'utf-8');
  fs.renameSync(tmpFile, CLAUDE_SETTINGS_FILE);
}

function getVSCodeSettingsPath(): string | null {
  const platform = process.platform;
  if (platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Code', 'User', 'settings.json');
  } else if (platform === 'linux') {
    return path.join(os.homedir(), '.config', 'Code', 'User', 'settings.json');
  } else if (platform === 'win32') {
    const appData = process.env['APPDATA'];
    if (!appData) return null;
    return path.join(appData, 'Code', 'User', 'settings.json');
  }
  return null;
}

function applyVSCodeTarget(env: Record<string, string>, model?: string): void {
  const vscodePath = getVSCodeSettingsPath();
  if (!vscodePath || !fs.existsSync(vscodePath)) return;

  try {
    const raw = fs.readFileSync(vscodePath, 'utf-8');
    const cleaned = raw.replace(/,(\s*[}\]])/g, '$1');
    const settings = JSON.parse(cleaned) as Record<string, unknown>;

    // Build env array sorted alphabetically
    const envArray = Object.entries(env)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));

    settings['claudeCode.environmentVariables'] = envArray;

    if (model) {
      settings['claudeCode.selectedModel'] = model;
    }

    const dir = path.dirname(vscodePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmpFile = vscodePath + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(settings, null, 2), 'utf-8');
    fs.renameSync(tmpFile, vscodePath);
  } catch {
    // VSCode target is best-effort; errors are non-fatal
    process.stderr.write('Warning: Could not update VSCode settings\n');
  }
}

export async function setActiveProvider(providerName: string): Promise<string[]> {
  const config = loadConfig();

  const provider = config.providers.find(p => p.name === providerName);
  if (!provider) {
    throw new Error(`Provider '${providerName}' not found`);
  }

  // Track previous provider
  config.previousProvider = config.activeProvider;
  config.activeProvider = providerName;

  // Apply provider settings to ~/.claude/settings.json
  const claudeSettings = loadClaudeSettings();
  const env: Record<string, string> = (claudeSettings['env'] as Record<string, string>) || {};

  // Remove all env keys that were written by the previous provider
  if (config.lastAppliedEnvKeys) {
    for (const key of config.lastAppliedEnvKeys) {
      delete env[key];
    }
  }

  const appliedKeys: string[] = [];
  const updatedTargets: string[] = ['~/.claude/settings.json'];

  if (provider.type === 'claude' || provider.type === 'litellm') {
    const apiKey = await getApiKey(providerName);
    if (apiKey) {
      env['ANTHROPIC_AUTH_TOKEN'] = apiKey;
      appliedKeys.push('ANTHROPIC_AUTH_TOKEN');
    }
    env['ANTHROPIC_BASE_URL'] = provider.endpoint;
    appliedKeys.push('ANTHROPIC_BASE_URL');
  } else if (provider.type === 'subscription') {
    // Explicitly clear API auth vars to avoid conflict with claude.ai session
    delete env['ANTHROPIC_AUTH_TOKEN'];
    delete env['ANTHROPIC_API_KEY'];
    delete env['ANTHROPIC_BASE_URL'];
  }

  // Apply model fields
  if (provider.model) {
    env['ANTHROPIC_MODEL'] = provider.model;
    appliedKeys.push('ANTHROPIC_MODEL');
  }
  if (provider.smallModel) {
    env['ANTHROPIC_DEFAULT_HAIKU_MODEL'] = provider.smallModel;
    appliedKeys.push('ANTHROPIC_DEFAULT_HAIKU_MODEL');
  }

  // Apply options
  if (provider.options?.disableTelemetry) {
    env['DISABLE_TELEMETRY'] = '1';
    appliedKeys.push('DISABLE_TELEMETRY');
  }
  if (provider.options?.disableBetas) {
    env['CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS'] = '1';
    appliedKeys.push('CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS');
  }

  // alwaysThinkingEnabled is a top-level key in settings.json
  if (provider.options?.alwaysThinking !== undefined) {
    claudeSettings['alwaysThinkingEnabled'] = provider.options.alwaysThinking;
  }

  // Apply custom envs
  if (provider.customEnvs) {
    for (const [key, value] of Object.entries(provider.customEnvs)) {
      env[key] = value;
      appliedKeys.push(key);
    }
  }

  claudeSettings['env'] = env;
  saveClaudeSettings(claudeSettings);

  // Apply VSCode target (best-effort)
  const vscodePath = getVSCodeSettingsPath();
  if (vscodePath && fs.existsSync(vscodePath)) {
    applyVSCodeTarget(env, provider.model);
    updatedTargets.push('VSCode settings.json');
  }

  config.lastAppliedEnvKeys = appliedKeys;
  saveConfig(config);

  return updatedTargets;
}

export async function getActiveProvider(): Promise<{ provider: Provider; apiKey?: string } | null> {
  const config = loadConfig();

  if (!config.activeProvider) {
    return null;
  }

  const provider = config.providers.find(p => p.name === config.activeProvider);
  if (!provider) {
    return null;
  }

  let apiKey: string | undefined;
  if (requiresApiKey(provider)) {
    const key = await getApiKey(provider.name);
    apiKey = key || undefined;
  }

  return { provider, apiKey };
}

export function setProviderEnv(providerName: string, key: string, value: string): void {
  const config = loadConfig();
  const provider = config.providers.find(p => p.name === providerName);
  if (!provider) {
    throw new Error(`Provider '${providerName}' not found`);
  }
  if (!provider.customEnvs) provider.customEnvs = {};
  provider.customEnvs[key] = value;
  saveConfig(config);
}

export function deleteProviderEnv(providerName: string, key: string): boolean {
  const config = loadConfig();
  const provider = config.providers.find(p => p.name === providerName);
  if (!provider) {
    throw new Error(`Provider '${providerName}' not found`);
  }
  if (!provider.customEnvs || !(key in provider.customEnvs)) {
    return false;
  }
  delete provider.customEnvs[key];
  saveConfig(config);
  return true;
}

export function listProviders(): Provider[] {
  const config = loadConfig();
  return config.providers;
}

export function getActiveProviderName(): string | undefined {
  const config = loadConfig();
  return config.activeProvider;
}

export function getPreviousProviderName(): string | undefined {
  const config = loadConfig();
  return config.previousProvider;
}
