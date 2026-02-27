import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import chalk from 'chalk';
import prompts from 'prompts';
import { addProvider, setApiKey, setActiveProvider } from '../config/manager.js';
import { Provider, ProviderOptions, validateProviderName } from '../types/provider.js';

const CLAUDE_SETTINGS_FILE = path.join(os.homedir(), '.claude', 'settings.json');

interface DiscoverCommandOptions {
  name?: string;
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '***';
  return key.substring(0, 8) + '***';
}

export async function discoverCommand(options: DiscoverCommandOptions): Promise<void> {
  try {
    if (!fs.existsSync(CLAUDE_SETTINGS_FILE)) {
      console.error(chalk.red('Error: ~/.claude/settings.json not found'));
      console.log(chalk.gray('No existing Claude settings to discover.'));
      process.exit(1);
    }

    const raw = fs.readFileSync(CLAUDE_SETTINGS_FILE, 'utf-8');
    const cleaned = raw.replace(/,(\s*[}\]])/g, '$1');
    const settings = JSON.parse(cleaned) as Record<string, unknown>;

    const env = (settings['env'] as Record<string, string>) || {};

    // Reverse-map env vars to provider fields
    const apiKey = env['ANTHROPIC_AUTH_TOKEN'] || env['ANTHROPIC_API_KEY'];
    const endpoint = env['ANTHROPIC_BASE_URL'] || 'https://api.anthropic.com';
    const model = env['ANTHROPIC_MODEL'];
    const smallModel = env['ANTHROPIC_DEFAULT_HAIKU_MODEL'];
    const alwaysThinking = settings['alwaysThinkingEnabled'] as boolean | undefined;
    const disableTelemetry = env['DISABLE_TELEMETRY'] === '1';
    const disableBetas = env['CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS'] === '1';

    // Show preview of discovered settings
    console.log(chalk.bold('\nDiscovered settings from ~/.claude/settings.json:\n'));
    console.log(`  API Key:  ${apiKey ? maskApiKey(apiKey) : chalk.yellow('none')}`);
    console.log(`  Endpoint: ${endpoint}`);
    if (model) console.log(`  Model:    ${model}`);
    if (smallModel) console.log(`  Small model: ${smallModel}`);
    if (alwaysThinking !== undefined) console.log(`  Always thinking: ${alwaysThinking}`);
    if (disableTelemetry) console.log(`  Disable telemetry: true`);
    if (disableBetas) console.log(`  Disable betas: true`);

    // Collect extra envs that aren't recognized fields
    const knownKeys = new Set([
      'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL',
      'ANTHROPIC_MODEL', 'ANTHROPIC_DEFAULT_HAIKU_MODEL',
      'DISABLE_TELEMETRY', 'CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS'
    ]);
    const customEnvs: Record<string, string> = {};
    for (const [key, value] of Object.entries(env)) {
      if (!knownKeys.has(key)) {
        customEnvs[key] = value;
      }
    }
    if (Object.keys(customEnvs).length > 0) {
      console.log(`  Custom envs:`);
      for (const [key, value] of Object.entries(customEnvs)) {
        console.log(`    ${chalk.cyan(key)}=${value}`);
      }
    }
    console.log('');

    // Prompt for provider name
    let providerName = options.name;
    if (!providerName) {
      const nameResponse = await prompts({
        type: 'text',
        name: 'name',
        message: 'Save as provider name:',
        initial: 'discovered',
        validate: (value: string) => validateProviderName(value) || 'Invalid name. Use only letters, numbers, hyphens, and underscores.'
      });

      if (!nameResponse.name) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      providerName = nameResponse.name;
    }

    // Confirm import
    const confirmResponse = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Import as provider '${providerName}' and set as active?`,
      initial: true
    });

    if (!confirmResponse.confirm) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }

    // Build provider object
    const providerOptions: ProviderOptions = {};
    if (alwaysThinking !== undefined) providerOptions.alwaysThinking = alwaysThinking;
    if (disableTelemetry) providerOptions.disableTelemetry = true;
    if (disableBetas) providerOptions.disableBetas = true;

    let provider: Provider;
    if (apiKey) {
      provider = {
        name: providerName!,
        type: 'claude',
        endpoint,
        hasApiKey: true,
        ...(model && { model }),
        ...(smallModel && { smallModel }),
        ...(Object.keys(providerOptions).length > 0 && { options: providerOptions }),
        ...(Object.keys(customEnvs).length > 0 && { customEnvs })
      };
    } else {
      provider = {
        name: providerName!,
        type: 'subscription',
        tool: 'claude-code',
        ...(model && { model }),
        ...(smallModel && { smallModel }),
        ...(Object.keys(providerOptions).length > 0 && { options: providerOptions }),
        ...(Object.keys(customEnvs).length > 0 && { customEnvs })
      };
    }

    // Save provider (API key to keychain)
    await addProvider(provider, apiKey);

    if (apiKey && provider.type === 'claude') {
      await setApiKey(providerName!, apiKey);
    }

    // Set as active
    await setActiveProvider(providerName!);

    console.log(chalk.green(`\n✓ Provider '${providerName}' imported and set as active`));

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unexpected error occurred'));
    }
    process.exit(1);
  }
}
