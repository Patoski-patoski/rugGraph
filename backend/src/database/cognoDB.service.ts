import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session, QueryResult, Record as Neo4jRecord, Integer } from 'neo4j-driver';
import { ConfigService } from '../config/config.service';
import { DatabaseConnectionException } from '../common/exceptions/database/database-connection.exception';
import { QueryExecutionException } from '../common/exceptions/database/query-execution.exception';

export interface DatabaseHealth {
  status: 'healthy' | 'unhealthy' | 'disconnected';
  uri: string;
  nodeCount: number;
  relationshipCount: number;
  latencyMs: number;
  message?: string | undefined;
}

export function unwrapNeo4jValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value;
  }
  if (neo4j.isInt(value)) {
    return (value as Integer).toNumber();
  }
  if (Array.isArray(value)) {
    return value.map((item) => unwrapNeo4jValue(item));
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if ('properties' in obj && typeof obj['properties'] === 'object' && obj['properties'] !== null) {
      const props = obj['properties'] as Record<string, unknown>;
      const unwrappedProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(props)) {
        unwrappedProps[k] = unwrapNeo4jValue(v);
      }
      return {
        ...unwrappedProps,
        ...(obj['labels'] ? { labels: obj['labels'] } : {}),
        ...(obj['type'] ? { type: obj['type'] } : {}),
        ...(obj['elementId'] ? { elementId: obj['elementId'] } : {}),
      };
    }

    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = unwrapNeo4jValue(v);
    }
    return result;
  }
  return value;
}

@Injectable()
export class CognoDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CognoDbService.name);
  private driver: Driver | null = null;
  private isConnected = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.initDriver();
  }

  async onModuleDestroy(): Promise<void> {
    await this.closeDriver();
  }

  private async initDriver(): Promise<void> {
    const uri = this.config.get('COGNODB_URI');
    const user = this.config.get('COGNODB_USER');
    const password = this.config.get('COGNODB_PASSWORD');

    if (!uri || !password) {
      this.logger.warn('CognoDB URI or Password missing. Running in disconnected mode.');
      return;
    }

    try {
      this.logger.log(`Connecting to CognoDB instance at ${uri}...`);
      this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 5000,
        disableLosslessIntegers: true,
      });

      await this.driver.verifyConnectivity();
      this.isConnected = true;
      this.logger.log(`Successfully connected and verified connectivity to CognoDB at ${uri}`);
    } catch (error) {
      this.isConnected = false;
      this.logger.error(`Failed to connect to CognoDB at ${uri}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async closeDriver(): Promise<void> {
    if (this.driver) {
      this.logger.log('Closing CognoDB driver connection...');
      await this.driver.close();
      this.driver = null;
      this.isConnected = false;
    }
  }

  getDriver(): Driver {
    if (!this.driver || !this.isConnected) {
      const uri = this.config.get('COGNODB_URI');
      throw new DatabaseConnectionException(uri, 'Driver not connected');
    }
    return this.driver;
  }

  getSession(): Session {
    return this.getDriver().session();
  }

  async runQuery<T extends Record<string, unknown>>(
    cypher: string,
    params: Record<string, unknown> = {},
  ): Promise<T[]> {
    const session = this.getSession();
    const startTime = Date.now();
    try {
      const result: QueryResult = await session.run(cypher, params);
      const records = result.records.map((record: Neo4jRecord) => {
        const row: Record<string, unknown> = {};
        for (const key of record.keys) {
          const stringKey = String(key);
          row[stringKey] = unwrapNeo4jValue(record.get(key));
        }
        return row as T;
      });

      const durationMs = Date.now() - startTime;
      this.logger.debug({
        event: 'CYPHER_QUERY_EXECUTED',
        recordCount: records.length,
        durationMs,
      });

      return records;
    } catch (error) {
      this.logger.error({
        event: 'CYPHER_QUERY_FAILED',
        cypher,
        params,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new QueryExecutionException(cypher, error);
    } finally {
      await session.close();
    }
  }

  async checkHealth(): Promise<DatabaseHealth> {
    const uri = this.config.get('COGNODB_URI');
    if (!this.driver || !this.isConnected) {
      return {
        status: 'disconnected',
        uri,
        nodeCount: 0,
        relationshipCount: 0,
        latencyMs: 0,
        message: 'CognoDB driver is disconnected or uninitialized',
      };
    }

    const startTime = Date.now();
    try {
      await this.driver.verifyConnectivity();
      const nodeCountResult = await this.runQuery<{ count: number }>(
        'MATCH (n) RETURN count(n) AS count',
      );
      const relCountResult = await this.runQuery<{ count: number }>(
        'MATCH ()-[r]->() RETURN count(r) AS count',
      );

      const latencyMs = Date.now() - startTime;
      const nodeCount = nodeCountResult[0]?.count ?? 0;
      const relationshipCount = relCountResult[0]?.count ?? 0;

      return {
        status: 'healthy',
        uri,
        nodeCount,
        relationshipCount,
        latencyMs,
      };
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      return {
        status: 'unhealthy',
        uri,
        nodeCount: 0,
        relationshipCount: 0,
        latencyMs,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
