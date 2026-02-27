import chalk from 'chalk';
import prompts from 'prompts';
import { removeProvider, getActiveProviderName } from '../config/manager.js';

export async function removeCommand(providerName: string): Promise<void> {
  try {
    if (!providerName) {
      console.error(chalk.red('Error: Provider name is required'));
      console.log(chalk.gray('Usage: ai-provider remove <name>'));
      process.exit(1);
    }

    const activeProviderName = getActiveProviderName();
    const isActive = providerName === activeProviderName;

    // Warn if removing active provider
    if (isActive) {
      console.log(chalk.yellow(`Warning: '${providerName}' is currently the active provider.`));
      console.log(chalk.yellow('If you remove it, another provider will be set as active.'));
    }

    // Confirm removal
    const response = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: `Are you sure you want to remove provider '${providerName}'?`,
      initial: false
    });

    if (!response.confirm) {
      console.log(chalk.yellow('Operation cancelled'));
      return;
    }

    await removeProvider(providerName);

    console.log(chalk.green(`✓ Provider '${providerName}' removed successfully`));

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unexpected error occurred'));
    }
    process.exit(1);
  }
}
