import { Controller, Post } from '@nestjs/common';
import { SeedService, type SeedResult } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post('populate')
  async populate(): Promise<SeedResult> {
    return this.seedService.seedAll();
  }

  @Post('reset')
  async reset(): Promise<{ success: boolean; message: string }> {
    await this.seedService.clearDatabase();
    return {
      success: true,
      message: 'CognoDB graph has been completely wiped.',
    };
  }
}
