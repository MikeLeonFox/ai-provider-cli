#!/usr/bin/env node
import { Command } from 'commander';
import { addCommand } from './commands/add.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { switchCommand } from './commands/switch.js';
import { currentCommand } from './commands/current.js';
import { envCommand } from './commands/env.js';

const program = new Command();

program
  .name('ai-provider')
  .description('CLI tool to manage multiple AI providers')
  .version('1.0.0');

program
  .command('add')
  .description('Add a new AI provider')
  .option('-n, --name <name>', 'Provider name')
  .option('-t, --type <type>', 'Provider type (claude, litellm, subscription)')
  .action(addCommand);

program
  .command('list')
  .description('List all configured providers')
  .action(listCommand);

program
  .command('remove <name>')
  .description('Remove a provider')
  .action(removeCommand);

program
  .command('switch <name>')
  .description('Switch to a different provider')
  .action(switchCommand);

program
  .command('current')
  .description('Show the current active provider')
  .option('--json', 'Output as JSON')
  .option('--env', 'Output as environment variables')
  .action(currentCommand);

program
  .command('env <name>')
  .description('Manage custom environment variables for a provider')
  .action(envCommand);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

program.parse(process.argv);
