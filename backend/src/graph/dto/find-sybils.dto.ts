import { Type, Static } from '@sinclair/typebox';

export const FindSybilsQuerySchema = Type.Object({
  minWallets: Type.Optional(Type.Number({ minimum: 2, maximum: 100, default: 3 })),
  targetSymbol: Type.Optional(Type.String()),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 50, default: 20 })),
});

export type FindSybilsQueryDto = Static<typeof FindSybilsQuerySchema>;
