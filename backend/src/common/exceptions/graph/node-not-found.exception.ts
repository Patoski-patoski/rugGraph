import { HttpStatus } from '@nestjs/common';
import { RugGraphException } from '../base.exception';

export class NodeNotFoundException extends RugGraphException {
  constructor(nodeType: string, identifier: string) {
    super(
      {
        code: 'NODE_NOT_FOUND',
        detail: `The requested ${nodeType} node with identifier "${identifier}" was not found in the graph.`,
        context: { nodeType, identifier },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}
