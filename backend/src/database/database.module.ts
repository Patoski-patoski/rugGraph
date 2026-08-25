import { Global, Module } from '@nestjs/common';
import { CognoDbService } from './cognoDB.service';

@Global()
@Module({
  providers: [CognoDbService],
  exports: [CognoDbService],
})
export class DatabaseModule {}
