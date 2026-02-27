import chalk from 'chalk';
import { setActiveProvider } from '../config/manager.js';

export async function switchCommand(providerName: string): Promise<void> {
  try {
    if (!providerName) {
      console.error(chalk.red('Error: Provider name is required'));
      console.log(chalk.gray('Usage: ai-provider switch <name>'));
      process.exit(1);
    }

    await setActiveProvider(providerName);

    console.log(chalk.green(`✓ Switched to provider '${providerName}'`));
    console.log(chalk.gray('~/.claude/settings.json updated'));

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unexpected error occurred'));
    }
    process.exit(1);
  }
}
