import { Injectable, NotFoundException } from '@nestjs/common';
import { MissionsRepository } from './missions.repository';

@Injectable()
export class MissionsService {
  constructor(private readonly missionsRepository: MissionsRepository) {}

  findAllMissions() {
    return this.missionsRepository.findAllMissions();
  }

  async findMissionById(missionId: string) {
    const result = await this.missionsRepository.findMissionById(missionId);
    if (!result) {
      throw new NotFoundException(`Mission ${missionId} not found`);
    }

    const { mission, decisionRows, choiceRows, characterRows } = result;

    return {
      ...mission,
      steps: decisionRows.map((decision) => ({
        ...decision,
        choices: choiceRows
          .filter((choice) => choice.decisionId === decision.id)
          .map(({ decisionId, ...choice }) => choice),
        characters: characterRows
          .filter((character) => character.decisionId === decision.id)
          .map(({ decisionId, ...character }) => character),
      })),
    };
  }
}