import { HttpStatus } from '@nestjs/common';
import { RugGraphException } from '../base.exception';

export class QueryExecutionException extends RugGraphException {
  constructor(query: string, originalError?: unknown) {
    super(
      {
        code: 'QUERY_EXECUTION_ERROR',
        detail: 'An error occurred while executing Cypher query against CognoDB.',
        context: {
          query,
          error: originalError instanceof Error ? originalError.message : String(originalError),
        },
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
