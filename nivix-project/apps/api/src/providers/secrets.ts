import { config } from '../config';

// Hosting-agnostic secrets access.
// Local now (env vars). Swap to AWS Secrets Manager later — implementation only.
export interface SecretsProvider {
  get(key: string): Promise<string | undefined>;
}

export class EnvSecretsProvider implements SecretsProvider {
  async get(key: string): Promise<string | undefined> {
    return process.env[key];
  }
}

// Future (no AWS dependency yet):
// export class AwsSecretsManagerProvider implements SecretsProvider { ... }

export function createSecretsProvider(): SecretsProvider {
  switch (config.secretsProvider) {
    case 'env':
      return new EnvSecretsProvider();
    default:
      throw new Error(
        `Secrets provider '${config.secretsProvider}' is not available locally yet`,
      );
  }
}
