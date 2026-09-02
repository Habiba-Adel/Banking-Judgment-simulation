import { Module } from '@nestjs/common';
import { AttemptsController } from './attempts.controller';
import { AttemptsService } from './attempts.service';
import { AttemptsRepository } from './attempts.repository';

@Module({
  controllers: [AttemptsController],
  providers: [AttemptsService, AttemptsRepository],
  exports: [AttemptsService, AttemptsRepository], 
})
export class AttemptsModule {}