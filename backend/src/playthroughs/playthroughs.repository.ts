import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, lt } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDb } from '../db/db.module';
import { missionAttempts, missions, playthroughs } from '../db/schema';

@Injectable()
export class PlaythroughsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async startOrResumePlaythrough(userId: string) {
    const [existing] = await this.db
      .select()
      .from(playthroughs)
      .where(and(eq(playthroughs.userId, userId), eq(playthroughs.status, 'in_progress')))
      .limit(1);

    if (existing) {
      return { playthrough: existing, resumed: true };
    }

    const [lastRun] = await this.db
      .select({ runNumber: playthroughs.runNumber })
      .from(playthroughs)
      .where(eq(playthroughs.userId, userId))
      .orderBy(desc(playthroughs.runNumber))
      .limit(1);

    const [created] = await this.db
      .insert(playthroughs)
      .values({
        userId,
        runNumber: (lastRun?.runNumber ?? 0) + 1,
        status: 'in_progress',
      })
      .returning();

    return { playthrough: created, resumed: false };
  }

  findAllPlaythroughsByUser(userId: string) {
    return this.db
      .select()
      .from(playthroughs)
      .where(eq(playthroughs.userId, userId))
      .orderBy(desc(playthroughs.startedAt));
  }

  async findPlaythroughDetailById(playthroughId: string) {
    const [playthrough] = await this.db
      .select()
      .from(playthroughs)
      .where(eq(playthroughs.id, playthroughId))
      .limit(1);

    if (!playthrough) {
      return undefined;
    }

    const attemptRows = await this.db
      .select({
        missionId: missionAttempts.missionId,
        status: missionAttempts.status,
        missionScore: missionAttempts.missionScore,
      })
      .from(missionAttempts)
      .where(eq(missionAttempts.playthroughId, playthroughId));

    return { playthrough, attemptRows };
  }

  async findComparisonData(playthroughId: string) {
    const [current] = await this.db
      .select()
      .from(playthroughs)
      .where(eq(playthroughs.id, playthroughId))
      .limit(1);

    if (!current) {
      return undefined;
    }

    const [previous] = await this.db
      .select()
      .from(playthroughs)
      .where(
        and(
          eq(playthroughs.userId, current.userId),
          eq(playthroughs.status, 'completed'),
          lt(playthroughs.runNumber, current.runNumber),
        ),
      )
      .orderBy(desc(playthroughs.runNumber))
      .limit(1);

    if (!previous) {
      return { current, previous: undefined, currentAttempts: [], previousAttempts: [] };
    }

    const currentAttempts = await this.db
      .select({
        missionId: missionAttempts.missionId,
        missionTitle: missions.title,
        missionScore: missionAttempts.missionScore,
      })
      .from(missionAttempts)
      .innerJoin(missions, eq(missions.id, missionAttempts.missionId))
      .where(eq(missionAttempts.playthroughId, current.id));

    const previousAttempts = await this.db
      .select({
        missionId: missionAttempts.missionId,
        missionScore: missionAttempts.missionScore,
      })
      .from(missionAttempts)
      .where(eq(missionAttempts.playthroughId, previous.id));

    return { current, previous, currentAttempts, previousAttempts };
  }

  async resetPlaythrough(playthroughId: string) {
    const [updated] = await this.db
      .update(playthroughs)
      .set({ status: 'abandoned' })
      .where(eq(playthroughs.id, playthroughId))
      .returning();

    return updated;
  }
}