import { HttpStatus } from '@nestjs/common';
import { RugGraphException } from '../base.exception';

export class DatabaseConnectionException extends RugGraphException {
  constructor(uri: string, originalError?: unknown) {
    super(
      {
        code: 'DATABASE_CONNECTION_ERROR',
        detail: `Failed to connect to CognoDB at ${uri}. Please verify your instance status and credentials.`,
        context: {
          uri,
          error: originalError instanceof Error ? originalError.message : String(originalError),
        },
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
