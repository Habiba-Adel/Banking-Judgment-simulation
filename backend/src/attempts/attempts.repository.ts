import { Inject, Injectable, NotFoundException,BadRequestException, ConflictException } from '@nestjs/common';
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
  missions
} from '../db/schema';

@Injectable()
export class AttemptsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

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
        metricDeltas: decisionResponses.snapshotMetricDeltas, 
      })
      .from(decisionResponses)
      .where(eq(decisionResponses.attemptId, attemptId));

    const answeredDecisionIds = pastResponses.map((r) => r.decisionId);

    // // 3. نحسب الـ Running Metrics بجمع كل الديلتاس من الإجابات السابقة
    // const runningMetrics = {
    //   customerTrust: 0,
    //   complianceSafety: 0,
    //   dataProtection: 0,
    //   decisionQuality: 0,
    //   accountability: 0,
    //   reputationRisk: 0,
    //   responsibleBanking: 0,
    // };

    // for (const res of pastResponses) {
    //   const deltas = (res.metricDeltas as Record<string, number>) || {};
    //   for (const key in runningMetrics) {
    //     runningMetrics[key as keyof typeof runningMetrics] += deltas[key] || 0;
    //   }
    // }

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
      //runningMetrics,
      isComplete: false,
    };
  
  }


  //this is for getting the full report that will appear in the end of the mission in the front

  async getAttemptReport(attemptId: string) {
    //first catch the attempt object
    const [attempt] = await this.db
      .select({
        id: missionAttempts.id,
        missionId: missionAttempts.missionId,
        status: missionAttempts.status,
        missionScore: missionAttempts.missionScore,
        finalMetrics: missionAttempts.finalMetrics,
        //this to can get the coach message that appearing in the start of teh page 
        missionTitle: missions.title,
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
        metricDeltas: choices.metricDeltas, 
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

    // and get the avg score to appear it in the start of the page 
    const metricKeys = Object.keys(calculatedMetrics);
    const totalScore = metricKeys.reduce(
      (sum, key) => sum + calculatedMetrics[key as keyof typeof calculatedMetrics], 
      0
    );
    const missionScore = Math.round(totalScore / metricKeys.length);


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
      missionTitle: attempt.missionTitle, 
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
      .select({ decisionId: decisionResponses.decisionId })
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

    await this.db.insert(decisionResponses).values({
      attemptId,
      decisionId,
      choiceId,
      snapshotMetricDeltas: currentChoice.metricDeltas,
    });

    answeredIds.push(decisionId);
    const isMissionComplete = missionDecisions.every((d) => answeredIds.includes(d.id));

    let nextStepId: string | null = null;
    if (!isMissionComplete) {
      const nextDecision = missionDecisions.find((d) => !answeredIds.includes(d.id));
      nextStepId = nextDecision ? nextDecision.id : null;
    }

    if (isMissionComplete) {
      const allAppliedDeltas = await this.db
        .select({ metricDeltas: decisionResponses.snapshotMetricDeltas })
        .from(decisionResponses)
        .where(eq(decisionResponses.attemptId, attemptId));

      const calculatedMetrics = {
        customerTrust: 0, complianceSafety: 0, dataProtection: 0, 
        decisionQuality: 0, accountability: 0, reputationRisk: 0, responsibleBanking: 0,
      };

      for (const row of allAppliedDeltas) {
        const d = (row.metricDeltas as Record<string, number>) || {};
        for (const key in calculatedMetrics) {
          calculatedMetrics[key as keyof typeof calculatedMetrics] += d[key] || 0;
        }
      }

      const metricKeys = Object.keys(calculatedMetrics);
      const totalScore = metricKeys.reduce((sum, key) => sum + calculatedMetrics[key as keyof typeof calculatedMetrics], 0);
      const missionScore = Math.round(totalScore / metricKeys.length);

      await this.db
        .update(missionAttempts)
        .set({
          status: 'completed',
          finalMetrics: calculatedMetrics,
          missionScore,
          completedAt: new Date(),
        })
        .where(eq(missionAttempts.id, attemptId));
    }

    return {
      isMissionComplete,//to make the front know if the mission done so he can call the api that will give him the mission report 
      nextStepId,//and this to can use it for the getting next decision 
    };
  }




}