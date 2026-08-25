import { Controller, Get } from '@nestjs/common';
import { CognoDbService, type DatabaseHealth } from './database/cognoDB.service';

export interface AppHealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  database: DatabaseHealth;
}

@Controller()
export class AppController {
  private readonly startTime = Date.now();

  constructor(private readonly db: CognoDbService) {}

  @Get('health')
  async getHealth(): Promise<AppHealthResponse> {
    const dbHealth = await this.db.checkHealth();
    return {
      status: dbHealth.status === 'healthy' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      database: dbHealth,
    };
  }

  @Get()
  getRoot() {
    return {
      name: 'RugGraph Graph Intelligence API',
      version: '1.0.0',
      database: 'CognoDB (openCypher)',
      endpoints: {
        health: '/health',
        overview: '/graph/overview',
        cycles: '/graph/cycles',
        sybils: '/graph/sybils',
        peelingChains: '/graph/peeling-chains',
        nodeDetails: '/graph/node/:address',
        stats: '/graph/stats',
        seedPopulate: 'POST /seed/populate',
        seedReset: 'POST /seed/reset',
      },
    };
  }
}
