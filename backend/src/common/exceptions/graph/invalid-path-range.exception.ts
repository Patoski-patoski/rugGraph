import { HttpStatus } from '@nestjs/common';
import { RugGraphException } from '../base.exception';

export class InvalidPathRangeException extends RugGraphException {
  constructor(minHops: number, maxHops: number) {
    super(
      {
        code: 'INVALID_PATH_RANGE',
        detail: `minHops (${minHops}) cannot be greater than maxHops (${maxHops}).`,
        context: { minHops, maxHops },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
