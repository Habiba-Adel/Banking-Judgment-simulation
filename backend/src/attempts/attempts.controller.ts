import { Controller, Get, Param , Body , Post } from '@nestjs/common';
import { AttemptsService } from './attempts.service';

@Controller('attempts')
export class AttemptsController {
  constructor(private readonly attemptsService: AttemptsService) {}

  @Get(':attemptId/current-step')
  async getCurrentStep(@Param('attemptId') attemptId: string) {
    return this.attemptsService.getCurrentStep(attemptId);
  }

  @Get(':attemptId/report')
  async getAttemptReport(@Param('attemptId') attemptId: string) {
    return this.attemptsService.getAttemptReport(attemptId);
  }

  @Post(':attemptId/decisions')
  async submitDecision(
    @Param('attemptId') attemptId: string,
    @Body('decisionId') decisionId: string,
    @Body('choiceId') choiceId: string,
  ) {
    return this.attemptsService.submitDecision(attemptId, decisionId, choiceId);
  }
}