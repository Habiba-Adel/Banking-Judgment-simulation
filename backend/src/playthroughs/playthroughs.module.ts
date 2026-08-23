import { Module } from '@nestjs/common';
import { PlaythroughsController } from './playthroughs.controller';
import { PlaythroughsRepository } from './playthroughs.repository';
import { PlaythroughsService } from './playthroughs.service';

@Module({
  controllers: [PlaythroughsController],
  providers: [PlaythroughsService, PlaythroughsRepository],
})
export class PlaythroughsModule {}