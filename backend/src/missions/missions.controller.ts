import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { MissionsService } from './missions.service';

@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @Get()
  findAllMissions() {
    return this.missionsService.findAllMissions();
  }

  @Get(':missionId')
  findMissionById(@Param('missionId', ParseUUIDPipe) missionId: string) {
    return this.missionsService.findMissionById(missionId);
  }
}