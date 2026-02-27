export interface ProviderOptions {
  alwaysThinking?: boolean;
  disableTelemetry?: boolean;
  disableBetas?: boolean;
}

export interface BaseProvider {
  name: string;
  customEnvs?: Record<string, string>;
  model?: string;
  smallModel?: string;
  headers?: Record<string, string>;
  options?: ProviderOptions;
}

export interface ClaudeProvider extends BaseProvider {
  type: 'claude';
  endpoint: string;
  hasApiKey: true;
}

export interface LiteLLMProvider extends BaseProvider {
  type: 'litellm';
  endpoint: string;
  hasApiKey: true;
}

export interface SubscriptionProvider extends BaseProvider {
  type: 'subscription';
  tool: string;
  hasApiKey?: false;
}

export type Provider = ClaudeProvider | LiteLLMProvider | SubscriptionProvider;

export interface Config {
  activeProvider?: string;
  previousProvider?: string;
  providers: Provider[];
  lastAppliedEnvKeys?: string[];
}

export function isValidProviderType(type: string): type is Provider['type'] {
  return type === 'claude' || type === 'litellm' || type === 'subscription';
}

export function requiresApiKey(provider: Provider): provider is ClaudeProvider | LiteLLMProvider {
  return provider.type === 'claude' || provider.type === 'litellm';
}

export function validateProviderName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}
