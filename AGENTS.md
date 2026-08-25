# AGENT.MD — RugGraph

This file defines the rules, conventions, and architectural decisions for the RugGraph full-stack application (NestJS backend + React frontend + CognoDB graph database). Read this entire file before writing, editing, or reviewing any code in this project.

---

## Project Overview

RugGraph is a full-stack graph intelligence application that analyzes transaction flows to detect cyclic wash-trading rings, sybil funding clusters, and laundering peeling chains.

- **Database:** CognoDB (managed openCypher graph database via official `neo4j-driver`)
- **Backend Framework:** NestJS (TypeScript, strict mode)
- **Runtime:** Bun
- **Frontend:** React + Vite + Tailwind CSS + `react-force-graph-2d` + Google Material Symbols / Icons
- **Validation:** TypeBox (no class-validator, no zod)
- **Language:** TypeScript (strict mode, no `any`)

---

## TypeScript Rules

### No `any` — ever

`any` is strictly banned without exception.

```typescript
// ❌ Never do this
function processGraphNode(node: any) {}

// ✅ Do this instead
function processGraphNode(node: WalletNode) {}
```

If the shape of incoming data is unknown (e.g. raw Neo4j record fields), use `unknown` and narrow it with explicit type guards:

```typescript
function isNeo4jInteger(value: unknown): value is { low: number; high: number; toNumber: () => number } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'toNumber' in value &&
    typeof (value as Record<string, unknown>)['toNumber'] === 'function'
  );
}
```

### Strict TypeScript config

`tsconfig.json` must include:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## Validation — TypeBox Only

All incoming DTOs, query parameters, and configuration environments must be validated using **TypeBox**.

### Example Schema & Type

```typescript
// src/graph/dto/find-cycles.dto.ts
import { Type, Static } from '@sinclair/typebox';

export const FindCyclesQuerySchema = Type.Object({
  minHops: Type.Optional(Type.Number({ minimum: 2, maximum: 10, default: 2 })),
  maxHops: Type.Optional(Type.Number({ minimum: 2, maximum: 10, default: 5 })),
  minAmount: Type.Optional(Type.Number({ minimum: 0, default: 0 })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 100, default: 20 })),
});

export type FindCyclesQueryDto = Static<typeof FindCyclesQuerySchema>;
```

### TypeBox Validation Pipe

Controllers must use the `TypeBoxValidationPipe`:

```typescript
// src/common/pipes/typebox-validation.pipe.ts
import { PipeTransform, BadRequestException } from '@nestjs/common';
import { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

export class TypeBoxValidationPipe<T extends TSchema> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown) {
    const errors = [...Value.Errors(this.schema, value)];
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
    return Value.Cast(this.schema, value);
  }
}
```

---

## Graph Database & Cypher Conventions

All database queries must go through a dedicated `CognoDbService` (or `Neo4jService`).

1. **Parameterize all queries:** NEVER concatenate variables into Cypher strings.

   ```typescript
   // ❌ BAD
   const query = `MATCH (w:Wallet {address: '${address}'}) RETURN w`;

   // ✅ GOOD
   const query = `MATCH (w:Wallet {address: $address}) RETURN w`;
   await session.run(query, { address });
   ```

2. **Manage Sessions & Transactions Properly:** Always use `try / finally` to close sessions, or use transaction functions (`session.executeRead`, `session.executeWrite`).
3. **Handle Connection Outages Gracefully:** Wrap driver calls and catch `Neo4jError` or connectivity exceptions to provide clear diagnostic messages if CognoDB is temporarily unreachable.

---

## Custom Exception Hierarchy

```markdown
src/common/exceptions/
├── base.exception.ts
├── database/
│   ├── database-connection.exception.ts
│   └── query-execution.exception.ts
└── graph/
    ├── node-not-found.exception.ts
    └── invalid-path-range.exception.ts
```

```typescript
// src/common/exceptions/base.exception.ts
import { HttpException, HttpStatus } from '@nestjs/common';

export interface ExceptionMeta {
  code: string;
  detail?: string;
  context?: Record<string, unknown>;
}

export class RugGraphException extends HttpException {
  public readonly code: string;
  public readonly context: Record<string, unknown>;

  constructor(meta: ExceptionMeta, status: HttpStatus) {
    super({ message: meta.detail ?? meta.code, code: meta.code }, status);
    this.code = meta.code;
    this.context = meta.context ?? {};
  }
}
```

---

## Logging

Always use NestJS `Logger`. Never use `console.log`.

```typescript
private readonly logger = new Logger(GraphService.name);
this.logger.log({ event: 'CYCLES_DETECTED', count: cycles.length, durationMs });
```

---

## Project Structure

```markdown
rugGraph/
├── backend/
│   ├── src/
│   │   ├── common/         — filters, pipes, exceptions
│   │   ├── config/         — env schema & config service
│   │   ├── database/       — CognoDB (Neo4j) driver wrapper & health check
│   │   ├── graph/          — graph analytics, cypher queries, controllers & services
│   │   ├── seed/           — deterministic synthetic seed generator
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/               — E2E tests
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/     — GraphCanvas, NodeDrawer, StorySelector, FilterPanel, StatsBar
│   │   ├── hooks/          — useGraphData, useGraphDimensions
│   │   ├── types/          — graph visualization & node types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── vite.config.ts
│   └── tailwind.config.js
└── README.md
```

---

## Testing & Quality

- **Unit tests:** for all graph parsing, anomaly detection query builders, and seed generators.
- **E2E tests:** for health checks, graph query endpoints, and seed trigger.
- **Coverage target:** 80%+ on backend business logic.
