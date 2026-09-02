import { Inject, Injectable } from '@nestjs/common';
import { and, asc, desc, eq, lt } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDb } from '../db/db.module';
import { missionAttempts, missions, playthroughs } from '../db/schema';
import { BadRequestException } from '@nestjs/common';

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
        id: missionAttempts.id,
        missionId: missionAttempts.missionId,
        status: missionAttempts.status,
        missionScore: missionAttempts.missionScore,
        finalMetrics: missionAttempts.finalMetrics,
        startedAt: missionAttempts.startedAt,
        completedAt: missionAttempts.completedAt,
      })
      .from(missionAttempts)
      .where(eq(missionAttempts.playthroughId, playthroughId))
      .orderBy(asc(missionAttempts.startedAt));

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

  async getPlaythroughProgress(playthroughId: string) {
    
    //now based on this playthrough id we need to get all the missions in this one and mark the ones are completed 
    const allMissions = await this.db
      .select({
        missionId: missions.id,
        orderIndex: missions.orderIndex,
        title: missions.title,
      })
      .from(missions)
      .orderBy(asc(missions.orderIndex));

    
      //and also get all attempts to know which missions is done
    // Ordered newest-first so .find() below picks the actual most recent
    // attempt per mission — a mission can be replayed many times, and without
    // this ordering "lastAttemptId" was picking an arbitrary DB-scan-order
    // attempt instead of the last one (real bug, found 2026-09-01: a stale
    // attempt from hours earlier was returned instead of the just-completed
    // one, showing an old score on the report).
    const attempts = await this.db
      .select({
        id: missionAttempts.id,
        missionId: missionAttempts.missionId,
        status: missionAttempts.status,
      })
      .from(missionAttempts)
      .where(eq(missionAttempts.playthroughId, playthroughId))
      .orderBy(desc(missionAttempts.startedAt));

    const progress = allMissions.map((mission) => {
      //if there is aatleast one attempt for this mission that means it is done
      const attempt = attempts.find((a) => a.missionId === mission.missionId);

      return {
        missionId: mission.missionId,
        orderIndex: mission.orderIndex,
        title: mission.title,
        //this is to just check if the attempt is in continue or done 
        completed: attempt?.status === 'completed', 
        lastAttemptId: attempt?.id || null, 
      };
    });

    return progress;
  }


  async startOrResumeAttempt(playthroughId: string, missionId: string) {
  const [existingAttempt] = await this.db
    .select()
    .from(missionAttempts)
    .where(
      and(
        eq(missionAttempts.playthroughId, playthroughId),
        eq(missionAttempts.missionId, missionId),
        eq(missionAttempts.status, 'in_progress')
      )
    )
    .limit(1);

  if (existingAttempt) {
    return {
      attemptId: existingAttempt.id,
      status: existingAttempt.status,
      resumed: true,
    };
  }

  const [lastAttempt] = await this.db
    .select()
    .from(missionAttempts)
    .where(
      and(
        eq(missionAttempts.playthroughId, playthroughId),
        eq(missionAttempts.missionId, missionId)
      )
    )
    .orderBy(desc(missionAttempts.startedAt))
    .limit(1);

  if (lastAttempt && lastAttempt.status === 'in_progress') {
    return {
      attemptId: lastAttempt.id,
      status: lastAttempt.status,
      resumed: true,
    };
  }

  const [newAttempt] = await this.db
    .insert(missionAttempts)
    .values({
      playthroughId,
      missionId,
      status: 'in_progress',
    })
    .returning({
      id: missionAttempts.id,
      status: missionAttempts.status,
    });

  return {
    attemptId: newAttempt.id,
    status: newAttempt.status,
    resumed: false,
  };
}




}