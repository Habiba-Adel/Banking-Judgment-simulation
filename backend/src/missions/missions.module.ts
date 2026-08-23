import { Module } from '@nestjs/common';
import { MissionsController } from './missions.controller';
import { MissionsRepository } from './missions.repository';
import { MissionsService } from './missions.service';

@Module({
  controllers: [MissionsController],
  providers: [MissionsService, MissionsRepository],
})
export class MissionsModule {}
