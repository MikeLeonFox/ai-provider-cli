import prompts from 'prompts';
import chalk from 'chalk';
import { setProviderEnv, deleteProviderEnv, listProviders } from '../config/manager.js';

export async function envCommand(providerName: string): Promise<void> {
  try {
    const providers = listProviders();
    const provider = providers.find(p => p.name === providerName);

    if (!provider) {
      console.error(chalk.red(`Provider '${providerName}' not found`));
      process.exit(1);
    }

    let running = true;

    while (running) {
      const customEnvs = provider.customEnvs || {};
      const envKeys = Object.keys(customEnvs);

      console.log(chalk.bold(`\nCustom envs for '${providerName}':`));
      if (envKeys.length === 0) {
        console.log(chalk.gray('  (none)'));
      } else {
        for (const [key, value] of Object.entries(customEnvs)) {
          console.log(`  ${chalk.cyan(key)}=${value}`);
        }
      }
      console.log('');

      const actionResponse = await prompts({
        type: 'select',
        name: 'action',
        message: 'Action:',
        choices: [
          { title: 'Add / update a variable', value: 'add' },
          { title: 'Remove a variable', value: 'remove' },
          { title: 'Done', value: 'done' }
        ]
      });

      if (!actionResponse.action || actionResponse.action === 'done') {
        running = false;
        break;
      }

      if (actionResponse.action === 'add') {
        const entryResponse = await prompts({
          type: 'text',
          name: 'entry',
          message: 'KEY=VALUE:'
        });

        if (!entryResponse.entry) continue;

        const eqIdx = (entryResponse.entry as string).indexOf('=');
        if (eqIdx <= 0) {
          console.log(chalk.yellow('Invalid format. Use KEY=VALUE.'));
          continue;
        }

        const key = (entryResponse.entry as string).substring(0, eqIdx).trim();
        const value = (entryResponse.entry as string).substring(eqIdx + 1);

        setProviderEnv(providerName, key, value);
        if (!provider.customEnvs) provider.customEnvs = {};
        provider.customEnvs[key] = value;
        console.log(chalk.green(`✓ Set ${key}`));

      } else if (actionResponse.action === 'remove') {
        if (envKeys.length === 0) {
          console.log(chalk.yellow('No custom envs to remove.'));
          continue;
        }

        const removeResponse = await prompts({
          type: 'select',
          name: 'key',
          message: 'Select variable to remove:',
          choices: envKeys.map(k => ({ title: k, value: k }))
        });

        if (!removeResponse.key) continue;

        deleteProviderEnv(providerName, removeResponse.key);
        delete provider.customEnvs![removeResponse.key];
        console.log(chalk.green(`✓ Removed ${removeResponse.key}`));
      }
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
