import chalk from 'chalk';
import { listProviders, getActiveProviderName, getApiKey } from '../config/manager.js';
import { requiresApiKey } from '../types/provider.js';

interface ShowCommandOptions {
  reveal?: boolean;
}

function maskApiKey(key: string): string {
  if (key.length <= 8) return '***';
  return key.substring(0, 8) + '***';
}

export async function showCommand(name: string | undefined, options: ShowCommandOptions): Promise<void> {
  try {
    const providers = listProviders();
    const activeProviderName = getActiveProviderName();

    const providerName = name || activeProviderName;

    if (!providerName) {
      console.error(chalk.red('Error: No active provider. Specify a provider name or switch to one first.'));
      process.exit(1);
    }

    const provider = providers.find(p => p.name === providerName);
    if (!provider) {
      console.error(chalk.red(`Error: Provider '${providerName}' not found`));
      process.exit(1);
    }

    const isActive = provider.name === activeProviderName;

    console.log(chalk.bold(`\nProvider: ${chalk.cyan(provider.name)}${isActive ? chalk.green(' (active)') : ''}\n`));
    console.log(`  Type:    ${provider.type}`);

    if (requiresApiKey(provider)) {
      const apiKey = await getApiKey(provider.name);
      if (apiKey) {
        const displayKey = options.reveal ? apiKey : maskApiKey(apiKey);
        console.log(`  API Key: ${displayKey}`);
      } else {
        console.log(`  API Key: ${chalk.yellow('not found in keychain')}`);
      }
      console.log(`  Endpoint: ${provider.endpoint}`);
    } else if (provider.type === 'subscription') {
      console.log(`  Tool:    ${provider.tool}`);
    }

    if (provider.model) {
      console.log(`  Model:   ${provider.model}`);
    }
    if (provider.smallModel) {
      console.log(`  Small model: ${provider.smallModel}`);
    }

    if (provider.options && Object.keys(provider.options).length > 0) {
      console.log(`  Options:`);
      if (provider.options.alwaysThinking !== undefined) {
        console.log(`    Always thinking: ${provider.options.alwaysThinking}`);
      }
      if (provider.options.disableTelemetry) {
        console.log(`    Disable telemetry: true`);
      }
      if (provider.options.disableBetas) {
        console.log(`    Disable betas: true`);
      }
    }

    if (provider.headers && Object.keys(provider.headers).length > 0) {
      console.log(`  Headers:`);
      for (const [key, value] of Object.entries(provider.headers)) {
        console.log(`    ${chalk.cyan(key)}: ${value}`);
      }
    }

    if (provider.customEnvs && Object.keys(provider.customEnvs).length > 0) {
      console.log(`  Custom envs:`);
      for (const [key, value] of Object.entries(provider.customEnvs)) {
        console.log(`    ${chalk.cyan(key)}=${value}`);
      }
    }

    console.log('');

    if (!options.reveal && requiresApiKey(provider)) {
      console.log(chalk.gray('  Use --reveal to show the full API key'));
    }

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unexpected error occurred'));
    }
    process.exit(1);
  }
}
