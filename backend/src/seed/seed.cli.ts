import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function bootstrap() {
  const logger = new Logger('SeedCLI');
  logger.log('Starting RugGraph standalone database seeder...');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const seedService = app.get(SeedService);
    const result = await seedService.seedAll();
    logger.log(`\n========================================`);
    logger.log(`🎉 Seeding complete in ${result.durationMs}ms`);
    logger.log(`📊 Nodes created: ${result.nodesCreated}`);
    logger.log(`🔗 Relationships created: ${result.relationshipsCreated}`);
    logger.log(`Scenarios:`);
    result.scenarios.forEach((s, idx) => logger.log(`  ${idx + 1}. ${s}`));
    logger.log(`========================================\n`);
  } catch (error) {
    logger.error(`Seeding failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  } finally {
    await app.close();
  }
}

void bootstrap();
