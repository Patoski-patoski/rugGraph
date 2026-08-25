import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { GraphModule } from './graph/graph.module';
import { SeedModule } from './seed/seed.module';
import { AppController } from './app.controller';

@Module({
  imports: [ConfigModule, DatabaseModule, GraphModule, SeedModule],
  controllers: [AppController],
})
export class AppModule {}
