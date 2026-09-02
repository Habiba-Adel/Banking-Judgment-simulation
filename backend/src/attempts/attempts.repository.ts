import { Inject, Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { asc, eq, and } from 'drizzle-orm';
import { DRIZZLE } from '../db/db.module';
import type { DrizzleDb } from '../db/db.module';
import {
  characters,
  choices,
  decisions,
  missionAttempts,
  decisionResponses,
  stepCharacters ,
  missions,
  playthroughs
} from '../db/schema';

// Weighted combination of the 7 running metrics used to derive situation pressure.
// reputationRisk is weighted double — it's the one metric where a higher delta is
// genuinely worse; the rest are "good" metrics where a low/negative delta means the
// player is handling the mission poorly. Tune these here if the balance feels off.
const PRESSURE_METRIC_WEIGHTS: Record<string, number> = {
  customerTrust: -1,
  complianceSafety: -1,
  dataProtection: -1,
  decisionQuality: -0.5,
  accountability: -0.5,
  responsibleBanking: -1,
  reputationRisk: 2,
};

function levelTier(avgWeightedScore: number): 'Low' | 'Moderate' | 'Medium-High' | 'High' | 'Critical' {
  if (avgWeightedScore <= 0) return 'Low';
  if (avgWeightedScore <= 10) return 'Moderate';
  if (avgWeightedScore <= 25) return 'Medium-High';
  if (avgWeightedScore <= 50) return 'High';
  return 'Critical';
}

function threeTier(avg: number): 'Low' | 'Medium' | 'High' {
  if (avg <= 0) return 'Low';
  if (avg <= 8) return 'Medium';
  return 'High';
}

// Time-based scoring adjustment (user's explicit design, 2026-09-01): a fast,
// wise answer should score higher than a slow one, and the penalty for being
// slow should scale with how much pressure the player is under — stalling
// under Critical pressure costs far more than stalling under Low. Rates below
// are an invented starting point, not calibrated against real playtesting —
// tune PRESSURE_TIME_PENALTY_RATE here if the balance feels off.
const TIME_BUCKET_SECONDS = 3; // every 3s taken to answer is one "slow" step
const MAX_TIME_BUCKETS = 5; // caps the penalty at 15s worth of buckets — stepping away mid-decision shouldn't compound forever
const BONUS_FLOOR_FRACTION = 0.4; // a good choice's reward never shrinks below 40% of its original value, however slow

// Separate from the 3s buckets above: every 7s a decision sits unanswered,
// the pressure TIER used for that decision's scoring escalates by one step —
// this is scoring-only, the live pressure shown on screen while the decision
// is still open does not change (user's explicit call, 2026-09-01).
const PRESSURE_ESCALATION_SECONDS = 7;
const PRESSURE_LEVEL_ORDER = ['Low', 'Moderate', 'Medium-High', 'High', 'Critical'] as const;

function escalatePressureLevel(level: string, timeTakenSeconds: number): string {
  const bumps = Math.floor(Math.max(0, timeTakenSeconds) / PRESSURE_ESCALATION_SECONDS);
  const startIndex = Math.max(0, PRESSURE_LEVEL_ORDER.indexOf(level as typeof PRESSURE_LEVEL_ORDER[number]));
  const escalatedIndex = Math.min(PRESSURE_LEVEL_ORDER.length - 1, startIndex + bumps);
  return PRESSURE_LEVEL_ORDER[escalatedIndex];
}

const PRESSURE_TIME_PENALTY_RATE: Record<string, number> = {
  Low: 0.05,
  Moderate: 0.08,
  'Medium-High': 0.12,
  High: 0.18,
  Critical: 0.25,
};

// Extra pressure trigger, separate from the time-based one above (user's
// explicit design, 2026-09-01): picking the objectively BEST choice on a
// decision raises pressure a tier for the NEXT one — doing the right thing
// should feel harder, not easier, so the player has to prove they can keep
// making good calls once the stakes visibly rise. Unlike the 7s escalation,
// this DOES affect the live/displayed pressure (getCurrentStep), not just
// scoring — the whole point is the player feels it before answering, and it
// also feeds the scoring-time pressure so a hesitant follow-up genuinely
// costs more, not just looks scarier.
function escalatePressureForOptimalChoice(level: string): string {
  const startIndex = Math.max(0, PRESSURE_LEVEL_ORDER.indexOf(level as typeof PRESSURE_LEVEL_ORDER[number]));
  return PRESSURE_LEVEL_ORDER[Math.min(PRESSURE_LEVEL_ORDER.length - 1, startIndex + 1)];
}

// Pure comparison — true if chosenRawDeltas' conceptual total ties or beats
// every other option for that decision (raw, unadjusted deltas: optimality
// is about the choice itself, not how fast it was answered).
function wasChoiceOptimal(
  decisionChoicesRawDeltas: Record<string, number>[],
  chosenRawDeltas: Record<string, number>,
): boolean {
  if (decisionChoicesRawDeltas.length === 0) return false;
  const best = Math.max(...decisionChoicesRawDeltas.map((d) => conceptualTotal(d)));
  return conceptualTotal(chosenRawDeltas) >= best;
}

// Each decision is worth a fixed slice of the 100-point mission score, split
// into a flat FIXED part (just for answering — the floor a "messed up" run
// can't fall below) and a METRICS part (how good the choice actually was) —
// user's explicit call, 2026-09-01. DECISION_WEIGHT = FIXED + METRICS.
const DECISION_FIXED_WEIGHT = 5;
const DECISION_METRICS_WEIGHT = 15;
const DECISION_WEIGHT = DECISION_FIXED_WEIGHT + DECISION_METRICS_WEIGHT;

/**
 * Applies the time/pressure scoring adjustment to one choice's raw metric
 * deltas: negative (bad-outcome) deltas get scaled up (worse), positive
 * (good-outcome) deltas get scaled down toward BONUS_FLOOR_FRACTION (smaller
 * reward), both scaled by how many 3-second buckets the player took and how
 * much pressure they were under when they answered. Zero deltas are untouched.
 */
function applyTimeAdjustment(
  rawDeltas: Record<string, number>,
  timeTakenSeconds: number,
  pressureLevel: string,
): Record<string, number> {
  const buckets = Math.min(MAX_TIME_BUCKETS, Math.max(0, Math.floor(timeTakenSeconds / TIME_BUCKET_SECONDS)));
  const rate = PRESSURE_TIME_PENALTY_RATE[pressureLevel] ?? PRESSURE_TIME_PENALTY_RATE.Low;

  const adjusted: Record<string, number> = {};
  for (const [key, raw] of Object.entries(rawDeltas)) {
    // reputationRisk is inverted (higher = worse) — see PRESSURE_METRIC_WEIGHTS
    // above. Normalize to "conceptual value" where positive always means good
    // and negative always means bad, so the same amplify/shrink logic applies
    // uniformly, then flip back before storing.
    const inverted = (PRESSURE_METRIC_WEIGHTS[key] ?? -1) > 0;
    const conceptual = inverted ? -raw : raw;

    let adjustedConceptual: number;
    if (conceptual < 0) {
      adjustedConceptual = conceptual * (1 + buckets * rate);
    } else if (conceptual > 0) {
      const shrink = Math.max(BONUS_FLOOR_FRACTION, 1 - buckets * rate);
      adjustedConceptual = conceptual * shrink;
    } else {
      adjustedConceptual = 0;
    }

    adjusted[key] = Math.round(inverted ? -adjustedConceptual : adjustedConceptual);
  }
  return adjusted;
}

/**
 * Sums a set of metric deltas into one "higher is always better" number —
 * reputationRisk is flipped (see PRESSURE_METRIC_WEIGHTS), everything else
 * summed as-is. Used both to rank choices by how good they are and to score
 * an attempt's actual outcome on the same scale.
 */
function conceptualTotal(deltas: Record<string, number>): number {
  return Object.entries(deltas).reduce((sum, [key, val]) => {
    const inverted = (PRESSURE_METRIC_WEIGHTS[key] ?? -1) > 0;
    return sum + (inverted ? -(val || 0) : (val || 0));
  }, 0);
}

/**
 * Derives situation pressure from this attempt's running metrics — never stored,
 * always recomputed on read (see backend/CLAUDE.md's "Situation pressure is derived,
 * not stored" rule).
 *
 * - level: overall pressure, from a weighted average of all 7 metrics per decision
 *   answered so far (averaged, not summed, so it doesn't just grow with mission length).
 * - expectation: tracks reputationRisk specifically — stakeholder scrutiny rises with it.
 * - time: ramps with how many decisions have been answered — later steps in a mission
 *   feel more time-pressured regardless of how well the player is doing.
 */
function calculatePressure(runningMetrics: Record<string, number>, answeredCount: number) {
  const safeCount = Math.max(answeredCount, 1);

  const weightedTotal = Object.entries(PRESSURE_METRIC_WEIGHTS).reduce(
    (sum, [key, weight]) => sum + weight * (runningMetrics[key] ?? 0),
    0,
  );
  const avgWeightedScore = weightedTotal / safeCount;
  const avgReputationRisk = (runningMetrics.reputationRisk ?? 0) / safeCount;

  return {
    level: levelTier(avgWeightedScore),
    expectation: threeTier(avgReputationRisk),
    time: answeredCount <= 1 ? 'Low' : answeredCount <= 3 ? 'Medium' : 'High',
  } as const;
}

@Injectable()
export class AttemptsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  /**
   * missionScore: each decision is worth DECISION_WEIGHT points, split into
   * a flat DECISION_FIXED_WEIGHT (awarded just for answering — the floor a
   * badly-played decision can't fall below) and DECISION_METRICS_WEIGHT
   * (how good the choice actually was). The metrics part is
   * sqrt(relative position between that decision's worst and best option),
   * both computed with the exact same time/pressure adjustment the player
   * actually got. User's explicit call, 2026-09-01 — a pure relative-only
   * score let a merely-mediocre choice read as a near-total loss for that
   * decision; the fixed floor + sqrt curve keeps a "messed up" run in a
   * roughly 40-60 range instead of near 0, while a well-played run still
   * approaches 100.
   */
  private async computeMissionScoreAndMetrics(
    attemptId: string,
    missionId: string,
    startedAt: Date | string,
  ) {
    const responses = await this.db
      .select({
        decisionId: decisionResponses.decisionId,
        choiceId: decisionResponses.choiceId,
        answeredAt: decisionResponses.answeredAt,
        metricDeltas: decisionResponses.snapshotMetricDeltas,
      })
      .from(decisionResponses)
      .where(eq(decisionResponses.attemptId, attemptId))
      .orderBy(asc(decisionResponses.answeredAt));

    const missionChoices = await this.db
      .select({
        id: choices.id,
        decisionId: choices.decisionId,
        metricDeltas: choices.metricDeltas,
      })
      .from(choices)
      .innerJoin(decisions, eq(choices.decisionId, decisions.id))
      .where(eq(decisions.missionId, missionId));

    const choicesByDecision = new Map<string, Record<string, number>[]>();
    const rawDeltasByChoiceId = new Map<string, Record<string, number>>();
    for (const c of missionChoices) {
      const deltas = (c.metricDeltas as Record<string, number>) || {};
      const list = choicesByDecision.get(c.decisionId) ?? [];
      list.push(deltas);
      choicesByDecision.set(c.decisionId, list);
      rawDeltasByChoiceId.set(c.id, deltas);
    }

    const calculatedMetrics = {
      customerTrust: 0, complianceSafety: 0, dataProtection: 0,
      decisionQuality: 0, accountability: 0, reputationRisk: 0, responsibleBanking: 0,
    };
    const runningMetricsSoFar = { ...calculatedMetrics };

    let previousAnsweredAt = new Date(startedAt);
    let sumPoints = 0;
    let sumWeight = 0;

    for (let i = 0; i < responses.length; i++) {
      const r = responses[i];
      const chosenDeltas = (r.metricDeltas as Record<string, number>) || {};

      const timeTakenSeconds = (new Date(r.answeredAt).getTime() - previousAnsweredAt.getTime()) / 1000;
      let pressureBefore = calculatePressure(runningMetricsSoFar, i);

      // The previous decision (if it was answered optimally) escalates pressure
      // for this one — see escalatePressureForOptimalChoice.
      if (i > 0) {
        const prev = responses[i - 1];
        const prevDecisionChoices = choicesByDecision.get(prev.decisionId) ?? [];
        const prevChosenRaw = rawDeltasByChoiceId.get(prev.choiceId) ?? {};
        if (wasChoiceOptimal(prevDecisionChoices, prevChosenRaw)) {
          pressureBefore = { ...pressureBefore, level: escalatePressureForOptimalChoice(pressureBefore.level) as typeof pressureBefore.level };
        }
      }

      const scoringPressureLevel = escalatePressureLevel(pressureBefore.level, timeTakenSeconds);

      const decisionChoices = choicesByDecision.get(r.decisionId) ?? [];
      let best = -Infinity;
      let worst = Infinity;
      for (const rawDeltas of decisionChoices) {
        const total = conceptualTotal(applyTimeAdjustment(rawDeltas, timeTakenSeconds, scoringPressureLevel));
        if (total > best) best = total;
        if (total < worst) worst = total;
      }

      const chosenTotal = conceptualTotal(chosenDeltas);
      const percentage = decisionChoices.length === 0
        ? 0
        : best === worst
        ? 1
        : Math.max(0, Math.min(1, (chosenTotal - worst) / (best - worst)));

      // Metrics part uses sqrt(percentage) instead of percentage directly —
      // this "raises" mid-to-low relative scores (10% -> ~32%, 50% -> ~71%)
      // while leaving the extremes (0%, 100%) untouched, so a moderately bad
      // choice isn't scored as harshly as a literal worst-possible pick.
      const decisionPoints = DECISION_FIXED_WEIGHT + DECISION_METRICS_WEIGHT * Math.sqrt(percentage);

      sumPoints += decisionPoints;
      sumWeight += DECISION_WEIGHT;

      for (const key in calculatedMetrics) {
        calculatedMetrics[key as keyof typeof calculatedMetrics] += chosenDeltas[key] || 0;
        runningMetricsSoFar[key as keyof typeof runningMetricsSoFar] += chosenDeltas[key] || 0;
      }
      previousAnsweredAt = new Date(r.answeredAt);
    }

    const missionScore = sumWeight > 0
      ? Math.max(0, Math.min(100, Math.round((sumPoints / sumWeight) * 100)))
      : 0;

    return { missionScore, calculatedMetrics };
  }

  /**
   * True if choiceId was the objectively best option for decisionId (raw,
   * unadjusted deltas). Used by getCurrentStep and submitDecision to decide
   * whether the pressure escalates for the next decision — see
   * escalatePressureForOptimalChoice.
   */
  private async wasDecisionAnsweredOptimally(decisionId: string, chosenChoiceId: string): Promise<boolean> {
    const decisionChoices = await this.db
      .select({ id: choices.id, metricDeltas: choices.metricDeltas })
      .from(choices)
      .where(eq(choices.decisionId, decisionId));

    const chosen = decisionChoices.find((c) => c.id === chosenChoiceId);
    if (!chosen) return false;

    return wasChoiceOptimal(
      decisionChoices.map((c) => (c.metricDeltas as Record<string, number>) || {}),
      (chosen.metricDeltas as Record<string, number>) || {},
    );
  }

  /**
   * Recomputes playthroughs.finalMetrics — the 7-metric totals across every
   * mission in this playthrough — live from source, never incrementally (same
   * "Live recompute, never incremental" rule as running/final metrics
   * elsewhere). Only the latest completed attempt per mission counts, ordered
   * by startedAt (a mission can be replayed within one playthrough, so
   * without this ordering an earlier replay could be picked over the real
   * latest one — the same class of bug just fixed in getPlaythroughProgress).
   * Called whenever a mission attempt completes, so this column is never
   * stale/null the way it silently was before this existed.
   */
  private async recomputePlaythroughFinalMetrics(playthroughId: string) {
    const rows = await this.db
      .select({
        missionId: missionAttempts.missionId,
        status: missionAttempts.status,
        finalMetrics: missionAttempts.finalMetrics,
        startedAt: missionAttempts.startedAt,
      })
      .from(missionAttempts)
      .where(eq(missionAttempts.playthroughId, playthroughId))
      .orderBy(asc(missionAttempts.startedAt));

    const latestByMission = new Map<string, Record<string, number>>();
    for (const row of rows) {
      if (row.status === 'completed') {
        latestByMission.set(row.missionId, (row.finalMetrics as Record<string, number>) || {});
      }
    }

    const totals = {
      customerTrust: 0, complianceSafety: 0, dataProtection: 0,
      decisionQuality: 0, accountability: 0, reputationRisk: 0, responsibleBanking: 0,
    };
    for (const deltas of latestByMission.values()) {
      for (const key in totals) {
        totals[key as keyof typeof totals] += deltas[key] || 0;
      }
    }

    await this.db
      .update(playthroughs)
      .set({ finalMetrics: totals })
      .where(eq(playthroughs.id, playthroughId));
  }

  //okay now for this it is related to get the current step cause if the user not complete one mission so when
  //he enter again to get back to the one step he stop on it 
  async getCurrentStep(attemptId: string) {

   //first we need to get the current attempt using the id that coming in the request 

    const [attempt] = await this.db
      .select()
      .from(missionAttempts)
      .where(eq(missionAttempts.id, attemptId))
      .limit(1);

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    //so now i get the attempt object but i want to get the responsed and choices the user choose them 
    //to can know the current step that not answered yet
    const pastResponses = await this.db
      .select({
        decisionId: decisionResponses.decisionId,
        choiceId: decisionResponses.choiceId,
        answeredAt: decisionResponses.answeredAt,
        metricDeltas: decisionResponses.snapshotMetricDeltas,
      })
      .from(decisionResponses)
      .where(eq(decisionResponses.attemptId, attemptId));

    const answeredDecisionIds = pastResponses.map((r) => r.decisionId);

    // // 3. نحسب الـ Running Metrics بجمع كل الديلتاس من الإجابات السابقة
   const runningMetrics = {
      customerTrust: 0,
      complianceSafety: 0,
      dataProtection: 0,
      decisionQuality: 0,
      accountability: 0,
      reputationRisk: 0,
      responsibleBanking: 0,
    };

    for (const res of pastResponses) {
      const deltas = (res.metricDeltas as Record<string, number>) || {};
      for (const key in runningMetrics) {
        runningMetrics[key as keyof typeof runningMetrics] += deltas[key] || 0;
      }
    }

    let pressure: ReturnType<typeof calculatePressure> = calculatePressure(runningMetrics, answeredDecisionIds.length);

    // Answering the previous decision optimally raises pressure for this one —
    // the player should feel the stakes rise right when they're playing well.
    // See escalatePressureForOptimalChoice.
    if (pastResponses.length > 0) {
      const lastResponse = pastResponses.reduce((latest, r) =>
        new Date(r.answeredAt) > new Date(latest.answeredAt) ? r : latest, pastResponses[0]);
      const wasOptimal = await this.wasDecisionAnsweredOptimally(lastResponse.decisionId, lastResponse.choiceId);
      if (wasOptimal) {
        pressure = { ...pressure, level: escalatePressureForOptimalChoice(pressure.level) as typeof pressure.level };
      }
    }

    //and then get all the steps and get the first one didnot answered yet
    const allSteps = await this.db
      .select()
      .from(decisions)
      .where(eq(decisions.missionId, attempt.missionId))
      .orderBy(asc(decisions.orderIndex));

    const currentStep = allSteps.find((step) => !answeredDecisionIds.includes(step.id));

    // لو مفيش خطوة باقية، يبقى المهمة خلصت
    if (!currentStep) {
      return { step: null, isComplete: true };
    }

    //and after getting the current step we will continue from it we will get its choices 
    const stepChoices = await this.db
      .select({
        id: choices.id,
        labelKey: choices.labelKey,
        labelText: choices.labelText,
      })
      .from(choices)
      .where(eq(choices.decisionId, currentStep.id));

    const stepChars = await this.db
      .select({
        name: characters.name,
        role: characters.role,
        message: stepCharacters.message,
        orderIndex: stepCharacters.orderIndex,
      })
      .from(stepCharacters)
      .innerJoin(characters, eq(stepCharacters.characterId, characters.id))
      .where(eq(stepCharacters.decisionId, currentStep.id))
      .orderBy(asc(stepCharacters.orderIndex));

    return {
      step: {
        ...currentStep,
        characters: stepChars,
        choices: stepChoices,
      },
      runningMetrics,
      pressure,
      isComplete: false,
    };

  }


  //this is for getting the full report that will appear in the end of the mission in the front

  async getAttemptReport(attemptId: string) {
    //first catch the attempt object
    const [attempt] = await this.db
      .select({
        id: missionAttempts.id,
        playthroughId: missionAttempts.playthroughId,
        missionId: missionAttempts.missionId,
        status: missionAttempts.status,
        missionScore: missionAttempts.missionScore,
        finalMetrics: missionAttempts.finalMetrics,
        startedAt: missionAttempts.startedAt,
        completedAt: missionAttempts.completedAt,
        //this to can get the coach message that appearing in the start of teh page
        missionTitle: missions.title,
        missionCategory: missions.category,
        missionDescription: missions.description,
        coachName: missions.managerName,
        coachFeedback: missions.managerNote,
      })
      .from(missionAttempts)
      .innerJoin(missions, eq(missionAttempts.missionId, missions.id))
      .where(eq(missionAttempts.id, attemptId))
      .limit(1);

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

   
    //here we making joins between the tables to get the data from the choices to get the text and labels and all needed from that
    //and also we need the scores thr user make which existed in teh decision responses 
    const breakdownRows = await this.db
      .select({
        decisionId: decisions.id,
        orderIndex: decisions.orderIndex,
        stageLabel: decisions.stageLabel,
        promptText: decisions.promptText,
        choiceId: choices.id,
        choiceLabel: choices.labelText,
        outcomeLabel: choices.outcomeLabel,
        explanationText: choices.explanationText,
        // The actually-applied (time/pressure-adjusted) deltas for this
        // attempt, not the static choice template — these must match what
        // was summed into finalMetrics/missionScore at completion time.
        metricDeltas: decisionResponses.snapshotMetricDeltas,
      })
      .from(decisionResponses)
      .innerJoin(decisions, eq(decisionResponses.decisionId, decisions.id))
      .innerJoin(choices, eq(decisionResponses.choiceId, choices.id))
      .where(eq(decisionResponses.attemptId, attemptId))
      .orderBy(asc(decisions.orderIndex));

    const calculatedMetrics = {
      customerTrust: 0,
      complianceSafety: 0,
      dataProtection: 0,
      decisionQuality: 0,
      accountability: 0,
      reputationRisk: 0,
      responsibleBanking: 0,
    };

    const perDecisionBreakdown = breakdownRows.map((row) => {
      const deltas = (row.metricDeltas as Record<string, number>) || {};
      
      
      for (const key in calculatedMetrics) {
        calculatedMetrics[key as keyof typeof calculatedMetrics] += deltas[key] || 0;
      }

      return {
        decisionId: row.decisionId,
        orderIndex: row.orderIndex,
        stageLabel: row.stageLabel,
        promptText: row.promptText,
        choiceId: row.choiceId,
        choiceLabel: row.choiceLabel,
        outcomeLabel: row.outcomeLabel,
        explanationText: row.explanationText,
        metricDeltas: deltas,
      };
    });

    // Score normalized against this mission's own best/worst range per
    // decision — see computeMissionScoreAndMetrics.
    const { missionScore } = await this.computeMissionScoreAndMetrics(
      attemptId,
      attempt.missionId,
      attempt.startedAt,
    );


    // now we want to get the last thing that appearing in the end of the page which is the characters that appearing
    //in this mission 
    const rawCharacters = await this.db
      .select({
        id: characters.id,
        name: characters.name,
        role: characters.role,
      })
      .from(stepCharacters)
      .innerJoin(characters, eq(stepCharacters.characterId, characters.id))
      .innerJoin(decisions, eq(stepCharacters.decisionId, decisions.id))
      .where(eq(decisions.missionId, attempt.missionId));

      //and cause the same character may appearing more than once in the same mission
      // so we will need to deleting the duplication
    const missionCharacters = Array.from(
      new Map(rawCharacters.map((c) => [c.id, c])).values()
    );

    return {
      status: attempt.status,
      playthroughId: attempt.playthroughId,
      missionId: attempt.missionId,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      missionTitle: attempt.missionTitle,
      missionCategory: attempt.missionCategory,
      missionDescription: attempt.missionDescription,
      coachName: attempt.coachName,
      coachFeedback: attempt.coachFeedback,
      missionScore: attempt.missionScore ?? missionScore,
      finalMetrics: attempt.finalMetrics ?? calculatedMetrics,
      perDecisionBreakdown,
      missionCharacters,
    };
  }


  //now lets implement the function of the post deciison after the user choose specific choice 
  //so we will need to call this api after each decision the user choose 


  async submitDecision(attemptId: string, decisionId: string, choiceId: string) {

    //now in this function we need to ensure that the attempt is existed 

    const [attempt] = await this.db
      .select()
      .from(missionAttempts)
      .where(eq(missionAttempts.id, attemptId))
      .limit(1);

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status === 'completed') throw new BadRequestException('Attempt is already completed');


    const missionDecisions = await this.db
      .select()
      .from(decisions)
      .where(eq(decisions.missionId, attempt.missionId))
      .orderBy(asc(decisions.orderIndex));

    const pastResponses = await this.db
      .select({
        decisionId: decisionResponses.decisionId,
        choiceId: decisionResponses.choiceId,
        answeredAt: decisionResponses.answeredAt,
        metricDeltas: decisionResponses.snapshotMetricDeltas,
      })
      .from(decisionResponses)
      .where(eq(decisionResponses.attemptId, attemptId));

    const answeredIds = pastResponses.map((r) => r.decisionId);

    // 4. الحماية (Sequence Validation - 409 Conflict)
    if (answeredIds.includes(decisionId)) {
      throw new ConflictException('Decision already answered (Duplicate)');
    }

    const expectedNextDecision = missionDecisions.find((d) => !answeredIds.includes(d.id));
    if (!expectedNextDecision || expectedNextDecision.id !== decisionId) {
      throw new ConflictException('Out of order decision. Please answer the correct next step.');
    }

    const [currentChoice] = await this.db
      .select()
      .from(choices)
      .where(and(eq(choices.id, choiceId), eq(choices.decisionId, decisionId)))
      .limit(1);

    if (!currentChoice) throw new BadRequestException('Invalid choice for this decision');

    // Time/pressure scoring adjustment: how long the player took to answer,
    // measured from when this step actually became "current" (the previous
    // decision's answeredAt, or the attempt's own start for decision 1), and
    // the pressure they were under at that moment (from metrics accumulated
    // BEFORE this decision — what they actually saw on screen).
    const previousAnsweredAt = pastResponses.length > 0
      ? pastResponses.reduce(
          (latest, r) => (r.answeredAt > latest ? r.answeredAt : latest),
          pastResponses[0].answeredAt,
        )
      : attempt.startedAt;
    const timeTakenSeconds = (Date.now() - new Date(previousAnsweredAt).getTime()) / 1000;

    const runningMetricsSoFar = {
      customerTrust: 0,
      complianceSafety: 0,
      dataProtection: 0,
      decisionQuality: 0,
      accountability: 0,
      reputationRisk: 0,
      responsibleBanking: 0,
    };
    for (const r of pastResponses) {
      const d = (r.metricDeltas as Record<string, number>) || {};
      for (const key in runningMetricsSoFar) {
        runningMetricsSoFar[key as keyof typeof runningMetricsSoFar] += d[key] || 0;
      }
    }
    let pressureBeforeThisDecision: ReturnType<typeof calculatePressure> = calculatePressure(runningMetricsSoFar, answeredIds.length);

    // Same escalation as getCurrentStep — if the previous decision was
    // answered optimally, this one's pressure (and therefore its time-penalty
    // rate) is a tier higher. See escalatePressureForOptimalChoice.
    if (pastResponses.length > 0) {
      const lastResponse = pastResponses.reduce((latest, r) =>
        (r.answeredAt > latest.answeredAt ? r : latest), pastResponses[0]);
      const wasOptimal = await this.wasDecisionAnsweredOptimally(lastResponse.decisionId, lastResponse.choiceId);
      if (wasOptimal) {
        pressureBeforeThisDecision = {
          ...pressureBeforeThisDecision,
          level: escalatePressureForOptimalChoice(pressureBeforeThisDecision.level) as typeof pressureBeforeThisDecision.level,
        };
      }
    }

    const scoringPressureLevel = escalatePressureLevel(pressureBeforeThisDecision.level, timeTakenSeconds);

    const adjustedDeltas = applyTimeAdjustment(
      (currentChoice.metricDeltas as Record<string, number>) || {},
      timeTakenSeconds,
      scoringPressureLevel,
    );

    await this.db.insert(decisionResponses).values({
      attemptId,
      decisionId,
      choiceId,
      snapshotMetricDeltas: adjustedDeltas,
    });

    answeredIds.push(decisionId);
    const isMissionComplete = missionDecisions.every((d) => answeredIds.includes(d.id));

    let nextStepId: string | null = null;
    if (!isMissionComplete) {
      const nextDecision = missionDecisions.find((d) => !answeredIds.includes(d.id));
      nextStepId = nextDecision ? nextDecision.id : null;
    }

    if (isMissionComplete) {
      // Same normalization as getAttemptReport — see computeMissionScoreAndMetrics.
      const { missionScore, calculatedMetrics } = await this.computeMissionScoreAndMetrics(
        attemptId,
        attempt.missionId,
        attempt.startedAt,
      );

      await this.db
        .update(missionAttempts)
        .set({
          status: 'completed',
          finalMetrics: calculatedMetrics,
          missionScore,
          completedAt: new Date(),
        })
        .where(eq(missionAttempts.id, attemptId));

      await this.recomputePlaythroughFinalMetrics(attempt.playthroughId);
    }

    return {
      isMissionComplete,//to make the front know if the mission done so he can call the api that will give him the mission report 
      nextStepId,//and this to can use it for the getting next decision 
    };
  }
  
}