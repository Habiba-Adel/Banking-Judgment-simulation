import { Controller, Get, Param, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { PlaythroughsService } from './playthroughs.service';

// Stand-in for the authenticated user until real auth (JWT) lands.
// Swap this for a @CurrentUser() decorator reading the validated token — every
// call site below stays the same shape, only this constant goes away.
const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000001';

@Controller('playthroughs')
export class PlaythroughsController {
  constructor(private readonly playthroughsService: PlaythroughsService) {}

  @Post()
  async startOrResumePlaythrough(@Res({ passthrough: true }) res: Response) {
    const { playthrough, resumed } = await this.playthroughsService.startOrResumePlaythrough(
      PLACEHOLDER_USER_ID,
    );
    res.status(resumed ? 200 : 201);
    return playthrough;
  }

  @Get()
  findAllPlaythroughs() {
    return this.playthroughsService.findAllPlaythroughs(PLACEHOLDER_USER_ID);
  }

  @Get(':playthroughId')
  findPlaythroughDetail(@Param('playthroughId', ParseUUIDPipe) playthroughId: string) {
    return this.playthroughsService.findPlaythroughDetail(playthroughId);
  }

  @Get(':playthroughId/comparison')
  getComparison(@Param('playthroughId', ParseUUIDPipe) playthroughId: string) {
    return this.playthroughsService.getComparison(playthroughId);
  }

  @Post(':playthroughId/reset')
  resetPlaythrough(@Param('playthroughId', ParseUUIDPipe) playthroughId: string) {
    return this.playthroughsService.resetPlaythrough(playthroughId);
  }
}