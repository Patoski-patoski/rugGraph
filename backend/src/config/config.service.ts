import { Injectable, Logger } from '@nestjs/common';
import { Value } from '@sinclair/typebox/value';
import { Env, EnvSchema } from './env.schema';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);
  private readonly env: Env;

  constructor() {
    const rawEnv = {
      NODE_ENV: process.env['NODE_ENV'] ?? 'development',
      PORT: process.env['PORT'] ?? '4000',
      COGNODB_URI: process.env['COGNODB_URI'] ?? process.env['NEO4J_URI'] ?? '',
      COGNODB_USER: process.env['COGNODB_USER'] ?? process.env['NEO4J_USER'] ?? 'cognodb',
      COGNODB_PASSWORD: process.env['COGNODB_PASSWORD'] ?? process.env['NEO4J_PASSWORD'] ?? '',
      ...(process.env['CORS_ORIGIN'] ? { CORS_ORIGIN: process.env['CORS_ORIGIN'] } : {}),
    };

    const errors = [...Value.Errors(EnvSchema, rawEnv)];
    if (errors.length > 0) {
      const errorMsg = errors
        .map((e) => `[Config Error] ${e.path}: ${e.message} (got ${String(e.value)})`)
        .join('\n');
      this.logger.error(`Environment validation failed:\n${errorMsg}`);
      throw new Error(`Invalid environment configuration:\n${errorMsg}`);
    }

    this.env = Value.Cast(EnvSchema, rawEnv);
    this.logger.log(`Environment configuration loaded successfully (NODE_ENV: ${this.env.NODE_ENV})`);
  }

  get<K extends keyof Env>(key: K): Env[K] {
    return this.env[key];
  }

  getAll(): Readonly<Env> {
    return this.env;
  }
}
