import chalk from 'chalk';
import { getActiveProvider } from '../config/manager.js';

interface CurrentCommandOptions {
  json?: boolean;
  env?: boolean;
}

export async function currentCommand(options: CurrentCommandOptions): Promise<void> {
  try {
    const result = await getActiveProvider();

    if (!result) {
      if (options.json) {
        console.log(JSON.stringify({ error: 'No active provider configured' }, null, 2));
      } else {
        console.log(chalk.yellow('No active provider configured.'));
        console.log(chalk.gray('Use "ai-provider add" to add a provider.'));
      }
      return;
    }

    const { provider, apiKey } = result;

    // JSON output
    if (options.json) {
      const output: any = {
        name: provider.name,
        type: provider.type
      };

      if (provider.type === 'claude' || provider.type === 'litellm') {
        output.endpoint = provider.endpoint;
        if (apiKey) {
          output.apiKey = apiKey;
        }
      } else if (provider.type === 'subscription') {
        output.tool = provider.tool;
      }

      console.log(JSON.stringify(output, null, 2));
      return;
    }

    // Environment variables output
    if (options.env) {
      if (provider.type === 'claude' || provider.type === 'litellm') {
        if (apiKey) {
          console.log(`export ANTHROPIC_API_KEY="${apiKey}"`);
        }
        if (provider.type === 'claude') {
          console.log(`export ANTHROPIC_BASE_URL="${provider.endpoint}"`);
        } else {
          console.log(`export LITELLM_ENDPOINT="${provider.endpoint}"`);
        }
      } else if (provider.type === 'subscription') {
        console.log(`export AI_PROVIDER_TYPE="subscription"`);
        console.log(`export AI_PROVIDER_TOOL="${provider.tool}"`);
      }
      return;
    }

    // Human-readable output
    console.log(chalk.bold('\nActive Provider:\n'));
    console.log(`Name: ${chalk.green(provider.name)}`);
    console.log(`Type: ${provider.type}`);

    if (provider.type === 'claude' || provider.type === 'litellm') {
      console.log(`Endpoint: ${provider.endpoint}`);
      if (apiKey) {
        const maskedKey = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
        console.log(`API Key: ${maskedKey} ${chalk.gray('(masked)')}`);
      } else {
        console.log(`API Key: ${chalk.red('not found in keychain')}`);
      }
    } else if (provider.type === 'subscription') {
      console.log(`Tool: ${provider.tool}`);
    }

    console.log('');

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unexpected error occurred'));
    }
    process.exit(1);
  }
}
