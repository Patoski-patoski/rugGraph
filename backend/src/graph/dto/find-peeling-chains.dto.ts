import { Type, Static } from '@sinclair/typebox';

export const FindPeelingChainsQuerySchema = Type.Object({
  minHops: Type.Optional(Type.Number({ minimum: 3, maximum: 8, default: 3 })),
  minStartAmount: Type.Optional(Type.Number({ minimum: 0, default: 100 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 10 })),
});

export type FindPeelingChainsQueryDto = Static<typeof FindPeelingChainsQuerySchema>;
