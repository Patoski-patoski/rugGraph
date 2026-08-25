import { Type, Static } from '@sinclair/typebox';

export const NodeDetailsParamSchema = Type.Object({
  address: Type.String({ minLength: 3 }),
});

export type NodeDetailsParamDto = Static<typeof NodeDetailsParamSchema>;
