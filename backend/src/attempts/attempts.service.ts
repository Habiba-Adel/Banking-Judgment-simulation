import { Injectable } from '@nestjs/common';
import { AttemptsRepository } from './attempts.repository';

@Injectable()
export class AttemptsService {
  constructor(private readonly attemptsRepository: AttemptsRepository) {}

  async getCurrentStep(attemptId: string) {
    return this.attemptsRepository.getCurrentStep(attemptId);
  }

  async getAttemptReport(attemptId: string) {
    return this.attemptsRepository.getAttemptReport(attemptId);
  }


  async submitDecision(attemptId:string, decisionId:string, choiceId:string) {
return this.attemptsRepository.submitDecision(attemptId, decisionId, choiceId);  }
}
