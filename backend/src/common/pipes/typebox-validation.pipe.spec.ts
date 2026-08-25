import { BadRequestException } from '@nestjs/common';
import { Type } from '@sinclair/typebox';
import { TypeBoxValidationPipe } from './typebox-validation.pipe';

describe('TypeBoxValidationPipe', () => {
  const TestSchema = Type.Object({
    minHops: Type.Optional(Type.Number({ minimum: 2, maximum: 5 })),
    address: Type.String({ minLength: 5 }),
    isFlagged: Type.Optional(Type.Boolean()),
  });

  let pipe: TypeBoxValidationPipe<typeof TestSchema>;

  beforeEach(() => {
    pipe = new TypeBoxValidationPipe(TestSchema);
  });

  it('should transform and validate valid input', () => {
    const input = { minHops: 3, address: 'Wallet12345', isFlagged: true };
    const result = pipe.transform(input);
    expect(result).toEqual(input);
  });

  it('should coerce string numbers and string booleans properly', () => {
    const input = { minHops: '4', address: 'Wallet12345', isFlagged: 'true' };
    const result = pipe.transform(input) as { minHops: number; address: string; isFlagged: boolean };
    expect(result.minHops).toBe(4);
    expect(result.address).toBe('Wallet12345');
    expect(result.isFlagged).toBe(true);
  });

  it('should throw BadRequestException on schema constraint violation', () => {
    const invalidInput = { minHops: 10, address: 'W' }; // minHops > 5 and address too short
    expect(() => pipe.transform(invalidInput)).toThrow(BadRequestException);
  });

  it('should handle empty or null values when properties are optional or have defaults', () => {
    const OptionalSchema = Type.Object({
      limit: Type.Optional(Type.Number({ default: 10 })),
    });
    const optPipe = new TypeBoxValidationPipe(OptionalSchema);
    const result = optPipe.transform({});
    expect(result).toBeDefined();
  });
});
