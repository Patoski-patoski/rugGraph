import { Type, Static } from '@sinclair/typebox';

export const GraphOverviewQuerySchema = Type.Object({
  limitNodes: Type.Optional(Type.Number({ minimum: 10, maximum: 500, default: 150 })),
  filterFlaggedOnly: Type.Optional(Type.Boolean({ default: false })),
  clusterId: Type.Optional(Type.String()),
});

export type GraphOverviewQueryDto = Static<typeof GraphOverviewQuerySchema>;
