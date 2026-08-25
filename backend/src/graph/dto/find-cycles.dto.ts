import { Type, Static } from '@sinclair/typebox';

export const FindCyclesQuerySchema = Type.Object({
  minHops: Type.Optional(Type.Number({ minimum: 2, maximum: 6, default: 2 })),
  maxHops: Type.Optional(Type.Number({ minimum: 2, maximum: 6, default: 5 })),
  minAmount: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
  tokenSymbol: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
});

export type FindCyclesQueryDto = Static<typeof FindCyclesQuerySchema>;
