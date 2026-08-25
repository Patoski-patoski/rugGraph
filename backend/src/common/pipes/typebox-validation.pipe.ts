import { PipeTransform, BadRequestException, Injectable } from '@nestjs/common';
import { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

@Injectable()
export class TypeBoxValidationPipe<T extends TSchema> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): unknown {
    if (value === undefined || value === null) {
      value = {};
    }

    // Convert strings to numbers/booleans where schema expects them (especially useful for query params)
    let converted: unknown;
    try {
      converted = Value.Convert(this.schema, value);
    } catch {
      converted = value;
    }

    const errors = [...Value.Errors(this.schema, converted)];
    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errors.map((e) => ({
          path: e.path,
          message: e.message,
          value: e.value,
        })),
      });
    }

    return Value.Cast(this.schema, converted);
  }
}
