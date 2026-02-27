import chalk from 'chalk';
import { listProviders, getActiveProviderName } from '../config/manager.js';

interface ListCommandOptions {
  namesOnly?: boolean;
}

export function listCommand(options: ListCommandOptions = {}): void {
  try {
    const providers = listProviders();
    const activeProviderName = getActiveProviderName();

    // --names-only: print provider names one per line (for use in completion scripts)
    if (options.namesOnly) {
      for (const provider of providers) {
        console.log(provider.name);
      }
      return;
    }

    if (providers.length === 0) {
      console.log(chalk.yellow('No providers configured yet.'));
      console.log(chalk.gray('Use "ai-provider add" to add a provider.'));
      return;
    }

    console.log(chalk.bold('\nConfigured Providers:\n'));

    providers.forEach(provider => {
      const isActive = provider.name === activeProviderName;
      const activeMarker = isActive ? chalk.green('● ') : '  ';
      const nameDisplay = isActive ? chalk.green.bold(provider.name) : provider.name;

      console.log(`${activeMarker}${nameDisplay}`);
      console.log(`  Type: ${provider.type}`);

      if (provider.type === 'claude' || provider.type === 'litellm') {
        console.log(`  Endpoint: ${provider.endpoint}`);
        console.log(`  API Key: ${chalk.gray('stored in keychain')}`);
      } else if (provider.type === 'subscription') {
        console.log(`  Tool: ${provider.tool}`);
      }

      if (provider.customEnvs && Object.keys(provider.customEnvs).length > 0) {
        console.log(`  Custom envs:`);
        for (const [key, value] of Object.entries(provider.customEnvs)) {
          console.log(`    ${chalk.cyan(key)}=${value}`);
        }
      }

      console.log('');
    });

    if (activeProviderName) {
      console.log(chalk.gray(`Active provider: ${chalk.green(activeProviderName)}`));
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
