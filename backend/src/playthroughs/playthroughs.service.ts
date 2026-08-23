import { Injectable, NotFoundException } from '@nestjs/common';
import { PlaythroughsRepository } from './playthroughs.repository';

type MetricsMap = Record<string, number>;

@Injectable()
export class PlaythroughsService {
  constructor(private readonly playthroughsRepository: PlaythroughsRepository) {}

  startOrResumePlaythrough(userId: string) {
    return this.playthroughsRepository.startOrResumePlaythrough(userId);
  }

  findAllPlaythroughs(userId: string) {
    return this.playthroughsRepository.findAllPlaythroughsByUser(userId);
  }

  async findPlaythroughDetail(playthroughId: string) {
    const result = await this.playthroughsRepository.findPlaythroughDetailById(playthroughId);
    if (!result) {
      throw new NotFoundException(`Playthrough ${playthroughId} not found`);
    }

    const { playthrough, attemptRows } = result;
    return { ...playthrough, missionAttempts: attemptRows };
  }

  async getComparison(playthroughId: string) {
    const result = await this.playthroughsRepository.findComparisonData(playthroughId);
    if (!result) {
      throw new NotFoundException(`Playthrough ${playthroughId} not found`);
    }

    const { current, previous, currentAttempts, previousAttempts } = result;

    if (!previous) {
      return {
        previousRunNumber: null,
        currentRunNumber: current.runNumber,
        metricDeltas: null,
        profileChanged: null,
        previousProfile: null,
        currentProfile: current.profileResult,
        perMissionDeltas: [],
      };
    }

    const previousScoreByMission = new Map(
      previousAttempts.map((attempt) => [attempt.missionId, attempt.missionScore]),
    );

    return {
      previousRunNumber: previous.runNumber,
      currentRunNumber: current.runNumber,
      metricDeltas: diffMetrics(
        previous.finalMetrics as MetricsMap | null,
        current.finalMetrics as MetricsMap | null,
      ),
      profileChanged: previous.profileResult !== current.profileResult,
      previousProfile: previous.profileResult,
      currentProfile: current.profileResult,
      perMissionDeltas: currentAttempts.map((attempt) => {
        const previousScore = previousScoreByMission.get(attempt.missionId) ?? null;
        const currentScore = attempt.missionScore;
        return {
          missionId: attempt.missionId,
          missionTitle: attempt.missionTitle,
          previousScore,
          currentScore,
          scoreDelta:
            previousScore !== null && currentScore !== null ? currentScore - previousScore : null,
        };
      }),
    };
  }

  async resetPlaythrough(playthroughId: string) {
    const updated = await this.playthroughsRepository.resetPlaythrough(playthroughId);
    if (!updated) {
      throw new NotFoundException(`Playthrough ${playthroughId} not found`);
    }
    return updated;
  }
}

function diffMetrics(previous: MetricsMap | null, current: MetricsMap | null): MetricsMap {
  if (!previous || !current) {
    return {};
  }
  const deltas: MetricsMap = {};
  for (const key of Object.keys(current)) {
    deltas[key] = current[key] - (previous[key] ?? 0);
  }
  return deltas;
}