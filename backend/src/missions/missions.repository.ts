import { Inject, Injectable } from '@nestjs/common';
import { asc, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDb } from '../db/db.module';
import { characters, choices, decisions, missions , stepCharacters } from '../db/schema';

@Injectable()
export class MissionsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  findAllMissions() {
    return this.db
      .select({
        id: missions.id,
        orderIndex: missions.orderIndex,
        title: missions.title,
        category: missions.category,
        description: missions.description,
      })
      .from(missions)
      .orderBy(asc(missions.orderIndex));
  }

  async findMissionById(missionId: string) {
    const [mission] = await this.db
      .select()
      .from(missions)
      .where(eq(missions.id, missionId))
      .limit(1);

    if (!mission) {
      return undefined;
    }

    const decisionRows = await this.db
      .select({
        id: decisions.id,
        orderIndex: decisions.orderIndex,
        stageLabel: decisions.stageLabel,
        promptText: decisions.promptText,
        contextText: decisions.contextText,
      })
      .from(decisions)
      .where(eq(decisions.missionId, missionId))
      .orderBy(asc(decisions.orderIndex));

    const decisionIds = decisionRows.map((decision) => decision.id);

    // metricDeltas is deliberately excluded here — never sent before a choice is answered.
    const choiceRows =
      decisionIds.length === 0
        ? []
        : await this.db
            .select({
              id: choices.id,
              decisionId: choices.decisionId,
              labelKey: choices.labelKey,
              labelText: choices.labelText,
            })
            .from(choices)
            .where(inArray(choices.decisionId, decisionIds));

    const characterRows =
      decisionIds.length === 0
        ? []
        : await this.db
            .select({
              id: characters.id,
              decisionId: stepCharacters.decisionId,
              name: characters.name,
              role: characters.role,
              message: stepCharacters.message,
             orderIndex: stepCharacters.orderIndex,
            })
            .from(characters)
            .innerJoin(characters, eq(stepCharacters.characterId, characters.id))
          .where(inArray(stepCharacters.decisionId, decisionIds))
            .orderBy(asc(stepCharacters.orderIndex));

    return { mission, decisionRows, choiceRows, characterRows };
  }
}
