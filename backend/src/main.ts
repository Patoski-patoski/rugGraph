import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  const configService = app.get(ConfigService);
  const port = parseInt(configService.get('PORT'), 10) || 4000;
  const corsOrigin = configService.get('CORS_ORIGIN');

  app.enableCors({
    origin: corsOrigin ? corsOrigin.split(',') : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalFilters(new GlobalExceptionFilter());

  await app.listen(port);
  logger.log(`🚀 RugGraph Backend API is running on: http://localhost:${port}`);
  logger.log(`🔍 Health Check: http://localhost:${port}/health`);
}

void bootstrap();
