import chalk from 'chalk';
import prompts from 'prompts';
import { setActiveProvider, listProviders, getActiveProviderName, getPreviousProviderName } from '../config/manager.js';

export async function switchCommand(providerName?: string): Promise<void> {
  try {
    // Handle '-' to switch to previous provider
    if (providerName === '-') {
      const previous = getPreviousProviderName();
      if (!previous) {
        console.error(chalk.red('Error: No previous provider to switch back to'));
        process.exit(1);
      }
      providerName = previous;
    }

    // Interactive picker when no argument given
    if (!providerName) {
      const providers = listProviders();
      if (providers.length === 0) {
        console.error(chalk.red('Error: No providers configured'));
        console.log(chalk.gray('Use "ai-provider add" to add a provider.'));
        process.exit(1);
      }

      const activeProviderName = getActiveProviderName();

      const response = await prompts({
        type: 'select',
        name: 'provider',
        message: 'Select a provider:',
        choices: providers.map(p => ({
          title: p.name === activeProviderName ? `${p.name} ${chalk.green('(active)')}` : p.name,
          value: p.name
        }))
      });

      if (!response.provider) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      providerName = response.provider as string;
    }

    const updatedTargets = await setActiveProvider(providerName);

    console.log(chalk.green(`✓ Switched to '${providerName}'`));
    for (const target of updatedTargets) {
      console.log(chalk.gray(`  Updated: ${target}`));
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
