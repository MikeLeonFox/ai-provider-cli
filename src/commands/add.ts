import prompts from 'prompts';
import chalk from 'chalk';
import { addProvider } from '../config/manager.js';
import { Provider, ProviderOptions, isValidProviderType, validateProviderName } from '../types/provider.js';

interface AddCommandOptions {
  name?: string;
  type?: string;
}

export async function addCommand(options: AddCommandOptions): Promise<void> {
  try {
    // Prompt for provider name if not provided
    let providerName = options.name;
    if (!providerName) {
      const nameResponse = await prompts({
        type: 'text',
        name: 'name',
        message: 'Provider name:',
        validate: (value: string) => validateProviderName(value) || 'Invalid name. Use only letters, numbers, hyphens, and underscores.'
      });

      if (!nameResponse.name) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      providerName = nameResponse.name;
    }

    // Type assertion: providerName is now guaranteed to be a string
    if (!validateProviderName(providerName!)) {
      console.error(chalk.red('Invalid provider name. Use only letters, numbers, hyphens, and underscores.'));
      process.exit(1);
    }

    // Prompt for provider type if not provided
    let providerType = options.type;
    if (!providerType) {
      const typeResponse = await prompts({
        type: 'select',
        name: 'type',
        message: 'Provider type:',
        choices: [
          { title: 'Claude API', value: 'claude' },
          { title: 'LiteLLM', value: 'litellm' },
          { title: 'Subscription (Claude Code CLI)', value: 'subscription' }
        ]
      });

      if (!typeResponse.type) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      providerType = typeResponse.type;
    }

    // Type assertion: providerType is now guaranteed to be a string
    if (!isValidProviderType(providerType!)) {
      console.error(chalk.red(`Invalid provider type: ${providerType}. Must be one of: claude, litellm, subscription`));
      process.exit(1);
    }

    let provider: Provider;
    let apiKey: string | undefined;

    // Type-specific configuration
    if (providerType === 'claude') {
      const response = await prompts([
        {
          type: 'text',
          name: 'endpoint',
          message: 'API endpoint:',
          initial: 'https://api.anthropic.com'
        },
        {
          type: 'password',
          name: 'apiKey',
          message: 'API key:'
        }
      ]);

      if (!response.endpoint || !response.apiKey) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      provider = {
        name: providerName!,
        type: 'claude',
        endpoint: response.endpoint,
        hasApiKey: true
      };
      apiKey = response.apiKey;

    } else if (providerType === 'litellm') {
      const response = await prompts([
        {
          type: 'text',
          name: 'endpoint',
          message: 'LiteLLM endpoint:',
          initial: 'http://localhost:4000/v1'
        },
        {
          type: 'password',
          name: 'apiKey',
          message: 'API key:'
        }
      ]);

      if (!response.endpoint || !response.apiKey) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      provider = {
        name: providerName!,
        type: 'litellm',
        endpoint: response.endpoint,
        hasApiKey: true
      };
      apiKey = response.apiKey;

    } else {
      // subscription type
      const response = await prompts({
        type: 'text',
        name: 'tool',
        message: 'Tool name:',
        initial: 'claude-code'
      });

      if (!response.tool) {
        console.log(chalk.yellow('Operation cancelled'));
        return;
      }

      provider = {
        name: providerName!,
        type: 'subscription',
        tool: response.tool
      };
    }

    // Model configuration
    const modelResponse = await prompts([
      {
        type: 'text',
        name: 'model',
        message: 'Primary model (e.g. claude-opus-4-6), blank to skip:'
      },
      {
        type: 'text',
        name: 'smallModel',
        message: 'Small/haiku model, blank to skip:'
      }
    ]);

    if (modelResponse.model) {
      provider.model = modelResponse.model;
    }
    if (modelResponse.smallModel) {
      provider.smallModel = modelResponse.smallModel;
    }

    // Options configuration
    const optionsResponse = await prompts([
      {
        type: 'confirm',
        name: 'alwaysThinking',
        message: 'Enable always-thinking mode?',
        initial: false
      },
      {
        type: 'confirm',
        name: 'disableTelemetry',
        message: 'Disable telemetry?',
        initial: false
      },
      {
        type: 'confirm',
        name: 'disableBetas',
        message: 'Disable experimental betas?',
        initial: false
      }
    ]);

    const providerOptions: ProviderOptions = {};
    if (optionsResponse.alwaysThinking) providerOptions.alwaysThinking = true;
    if (optionsResponse.disableTelemetry) providerOptions.disableTelemetry = true;
    if (optionsResponse.disableBetas) providerOptions.disableBetas = true;

    if (Object.keys(providerOptions).length > 0) {
      provider.options = providerOptions;
    }

    // Optionally collect custom environment variables
    const customEnvsResponse = await prompts({
      type: 'confirm',
      name: 'addEnvs',
      message: 'Add custom environment variables?',
      initial: false
    });

    if (customEnvsResponse.addEnvs) {
      const customEnvs: Record<string, string> = {};
      console.log(chalk.gray('Enter KEY=VALUE pairs, one per line. Leave blank to finish.'));

      while (true) {
        const envResponse = await prompts({
          type: 'text',
          name: 'entry',
          message: 'KEY=VALUE (blank to finish):'
        });

        if (!envResponse.entry) break;

        const eqIdx = (envResponse.entry as string).indexOf('=');
        if (eqIdx <= 0) {
          console.log(chalk.yellow('Invalid format. Use KEY=VALUE.'));
          continue;
        }

        const key = (envResponse.entry as string).substring(0, eqIdx).trim();
        const value = (envResponse.entry as string).substring(eqIdx + 1);
        customEnvs[key] = value;
        console.log(chalk.gray(`  Set ${key}`));
      }

      if (Object.keys(customEnvs).length > 0) {
        provider.customEnvs = customEnvs;
      }
    }

    // Add provider
    await addProvider(provider, apiKey);

    console.log(chalk.green(`✓ Provider '${providerName}' added successfully`));

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red('An unexpected error occurred'));
    }
    process.exit(1);
  }
}
