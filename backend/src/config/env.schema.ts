import { Type, Static } from '@sinclair/typebox';

export const EnvSchema = Type.Object({
  NODE_ENV: Type.Union([
    Type.Literal('development'),
    Type.Literal('production'),
    Type.Literal('test'),
  ]),
  PORT: Type.String({ default: '4000' }),
  COGNODB_URI: Type.String({ minLength: 5 }),
  COGNODB_USER: Type.String({ default: 'cognodb' }),
  COGNODB_PASSWORD: Type.String({ minLength: 1 }),
  CORS_ORIGIN: Type.Optional(Type.String()),
});

export type Env = Static<typeof EnvSchema>;
