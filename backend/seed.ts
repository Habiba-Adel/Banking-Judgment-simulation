// seed.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { missions, decisions, characters, stepCharacters, choices } from './src/db/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const ZERO_DELTAS = {
  customerTrust: 0,
  complianceSafety: 0,
  dataProtection: 0,
  decisionQuality: 0,
  accountability: 0,
  reputationRisk: 0,
  responsibleBanking: 0,
};

async function main() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });
  const db = drizzle(pool);

  const characterCache = new Map<string, string>(); // name -> id

  async function getOrCreateCharacter(name: string, role: string): Promise<string> {
    if (characterCache.has(name)) return characterCache.get(name)!;

    const existing = await db.select({ id: characters.id }).from(characters).where(eq(characters.name, name));
    if (existing.length > 0) {
      characterCache.set(name, existing[0].id);
      return existing[0].id;
    }

    const [created] = await db.insert(characters).values({ name, role }).returning();
    characterCache.set(name, created.id);
    return created.id;
  }

  async function clearMission(title: string) {
    const existing = await db.select({ id: missions.id }).from(missions).where(eq(missions.title, title));
    if (existing.length === 0) return;

    const missionId = existing[0].id;
    const missionSteps = await db.select({ id: decisions.id }).from(decisions).where(eq(decisions.missionId, missionId));
    for (const step of missionSteps) {
      await db.delete(choices).where(eq(choices.decisionId, step.id));
      await db.delete(stepCharacters).where(eq(stepCharacters.decisionId, step.id));
    }
    await db.delete(decisions).where(eq(decisions.missionId, missionId));
    await db.delete(missions).where(eq(missions.id, missionId));
  }

  async function seedMission(missionDef: any) {
    console.log(`Seeding: ${missionDef.title}...`);
    await clearMission(missionDef.title);

    const [mission] = await db
      .insert(missions)
      .values({
        orderIndex: missionDef.orderIndex,
        title: missionDef.title,
        category: missionDef.category,
        description: missionDef.description,
        managerNote: missionDef.managerNote,
        managerName: missionDef.managerName,
        goalText: missionDef.goalText,
      })
      .returning();

    // 1. Register characters globally for this mission
    const charMap = new Map<string, string>();
    for (const cast of missionDef.cast) {
      const id = await getOrCreateCharacter(cast.name, cast.role);
      charMap.set(cast.name, id);
    }

    // 2. Insert Steps and link characters with their specific messages
    for (const stepDef of missionDef.steps) {
      const [step] = await db
        .insert(decisions)
        .values({
          missionId: mission.id,
          orderIndex: stepDef.orderIndex,
          stageLabel: stepDef.stageLabel,
          promptText: stepDef.promptText,
          contextText: missionDef.description,
        })
        .returning();

      // Insert step-specific character messages
      for (let i = 0; i < stepDef.characters.length; i++) {
        const stepChar = stepDef.characters[i];
        const characterId = charMap.get(stepChar.name)!;

        await db.insert(stepCharacters).values({
          decisionId: step.id,
          characterId: characterId,
          message: stepChar.message,
          orderIndex: i + 1,
        });
      }

      // Insert choices
      for (const choiceDef of stepDef.choices) {
        await db.insert(choices).values({
          decisionId: step.id,
          labelKey: choiceDef.labelKey,
          labelText: choiceDef.labelText,
          outcomeLabel: choiceDef.outcomeLabel,
          explanationText: choiceDef.explanationText,
          metricDeltas: choiceDef.metricDeltas,
        });
      }
    }
    console.log(`✅ ${missionDef.title} seeded.`);
  }

  // =========================================================================
  // MISSION 1: The Screenshot Shortcut
  // =========================================================================
  const mission1 = {
    orderIndex: 1,
    title: 'The Screenshot Shortcut',
    category: 'Ethics & Data',
    description: 'A customer has a problem with account activation, mobile banking access, card activation, or a blocked digital service. A colleague asks you to send a screenshot of the customer profile, account status, KYC screen, or system record through an informal channel to solve the issue quickly.',
    managerNote: 'Follow policy and approved channels. Speed matters, but never at the expense of trust or compliance.',
    managerName: 'Salma El-Hadidi',
    goalText: 'Resolve the request while protecting customer data and using approved channels.',
    // Cast is now just identities
    cast: [
      { name: 'Farah Nabil', role: 'Digital Banking Operations Specialist' },
      { name: 'Omar Shaker', role: 'Customer Experience Officer' },
      { name: 'Dina Adel', role: 'Team Leader — Banking Operations' },
    ],
    steps: [
      {
        orderIndex: 1,
        stageLabel: 'The request',
        promptText: 'Farah asks: "Can you send me a screenshot of the customer profile? I will check it faster."',
        // Messages are now step-specific!
        characters: [
          { name: 'Farah Nabil', message: 'Can you send me a screenshot of the customer profile? I will check it faster.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Send the screenshot immediately', outcomeLabel: 'Critical Breach', explanationText: 'Fast, but confidential data left the system.', metricDeltas: { ...ZERO_DELTAS, customerTrust: 4, complianceSafety: -22, dataProtection: -30, reputationRisk: 22 } },
          { labelKey: 'B', labelText: 'Blur some data and send it', outcomeLabel: 'Risky', explanationText: 'Partial compliance — sensitive data still shows.', metricDeltas: { ...ZERO_DELTAS, customerTrust: 3, complianceSafety: -12, dataProtection: -16, reputationRisk: 10 } },
          { labelKey: 'C', labelText: 'Refuse and ask her to access the case through the approved system', outcomeLabel: 'Excellent', explanationText: 'Slower, but a proper audit trail exists.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 22, dataProtection: 24, decisionQuality: 8 } },
          // Removed null properties to fix TS error
          { labelKey: 'D', labelText: 'Ask the customer to resend ID/personal data through chat or WhatsApp', metricDeltas: ZERO_DELTAS },
        ],
      },
      {
        orderIndex: 2,
        stageLabel: 'Customer pressure',
        promptText: 'Omar says: "The customer is angry. If we delay, they will escalate."',
        characters: [
          { name: 'Omar Shaker', message: 'The customer is angry. If we delay, they will escalate.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Send the data because the customer is angry', outcomeLabel: 'Risky', explanationText: 'Emotion overrode the control.', metricDeltas: { ...ZERO_DELTAS, customerTrust: 4, complianceSafety: -20, dataProtection: -20, reputationRisk: 15 } },
          { labelKey: 'B', labelText: 'Open a case/ticket through the approved workflow', outcomeLabel: 'Excellent', explanationText: 'The issue is now tracked and owned.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 18, decisionQuality: 8, accountability: 26, reputationRisk: -6 } },
          { labelKey: 'C', labelText: 'Ask the manager for guidance through an official channel', outcomeLabel: 'Excellent', explanationText: 'Good escalation — visible and documented.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 24, accountability: 18, reputationRisk: -6 } },
          { labelKey: 'D', labelText: 'Ignore until the customer calms down', outcomeLabel: 'Risky', explanationText: 'You avoided the moment and abandoned ownership.', metricDeltas: { ...ZERO_DELTAS, customerTrust: -22, accountability: -16, reputationRisk: 10 } },
        ],
      },
      {
        orderIndex: 3,
        stageLabel: 'The workaround',
        promptText: 'Farah suggests: "Just hide the account number and send the screenshot. Everyone does it."',
        characters: [
          { name: 'Farah Nabil', message: 'Just hide the account number and send the screenshot. Everyone does it.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Send a partially hidden screenshot', outcomeLabel: 'Risky', explanationText: '"Partly hidden" is still a data breach.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -14, dataProtection: -18, reputationRisk: 10 } },
          { labelKey: 'B', labelText: 'Share only the case reference number and ask her to use the system', outcomeLabel: 'Excellent', explanationText: 'Enough to collaborate, nothing confidential leaks.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 18, dataProtection: 18, decisionQuality: 6, reputationRisk: -6 } },
          { labelKey: 'C', labelText: 'Provide a non-confidential verbal description', outcomeLabel: 'Good', explanationText: 'Helpful without exposing identifiers.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 10, dataProtection: 10, decisionQuality: 6, reputationRisk: -6 } },
          { labelKey: 'D', labelText: 'Escalate repeated pressure as a data handling risk', metricDeltas: ZERO_DELTAS },
        ],
      },
      {
        orderIndex: 4,
        stageLabel: 'Authority pressure',
        promptText: 'Dina says: "We need to close this today. Find a practical solution."',
        characters: [
          { name: 'Dina Adel', message: 'We need to close this today. Find a practical solution.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Make an exception and share data', outcomeLabel: 'Critical Breach', explanationText: 'You folded under hierarchy pressure.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -24, dataProtection: -20, accountability: -12 } },
          { labelKey: 'B', labelText: 'Ask for written approval before sharing', outcomeLabel: 'Grey Zone', explanationText: 'A written order does not make it compliant.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -12, accountability: 6, reputationRisk: 8 } },
          { labelKey: 'C', labelText: 'Explain that data cannot be shared outside approved channels', metricDeltas: ZERO_DELTAS },
          { labelKey: 'D', labelText: 'Escalate to Compliance/Information Security if pressure continues', outcomeLabel: 'Excellent', explanationText: 'Best move — take it out of the pressure zone.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 34, accountability: 20, reputationRisk: -18 } },
        ],
      },
      {
        orderIndex: 5,
        stageLabel: 'Final resolution',
        promptText: 'The customer is still waiting. You must close the case professionally.',
        characters: [
          { name: 'Dina Adel', message: 'The customer is waiting. Close this case now.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Close the complaint and say it is solved', outcomeLabel: 'Risky', explanationText: 'Closing without resolving is a false close.', metricDeltas: { ...ZERO_DELTAS, customerTrust: -10, complianceSafety: -15, accountability: -15, reputationRisk: 12 } },
          { labelKey: 'B', labelText: 'Inform the customer it is handled through the approved process, document and follow up', metricDeltas: ZERO_DELTAS },
          { labelKey: 'C', labelText: 'Ask another colleague to handle it informally', metricDeltas: ZERO_DELTAS },
          { labelKey: 'D', labelText: 'Escalate and document, and provide the official next step', metricDeltas: ZERO_DELTAS },
        ],
      },
    ],
  };


  // =========================================================================
  // MISSION 2: The VIP Friend Request
  // =========================================================================
  const mission2 = {
    orderIndex: 2,
    title: 'The VIP Friend Request',
    category: 'Privacy & Access',
    description: 'A friend, relative, or influential person asks you to check whether a transfer arrived, whether an account is active, or why a transaction is delayed. The person is not the account holder or an authorised representative.',
    managerNote: 'Follow policy and approved channels. Speed matters, but never at the expense of trust or compliance.',
    managerName: 'Salma El-Hadidi',
    goalText: 'Refuse unauthorised access while staying professional and helpful.',
    cast: [
      { name: 'Dina Adel', role: 'Team Leader — Banking Operations' },
      { name: 'Omar Shaker', role: 'Customer Experience Officer' },
      { name: 'Salma El-Hadidi', role: 'Compliance Officer' },
    ],
    steps: [
      {
        orderIndex: 1,
        stageLabel: 'The request',
        promptText: 'An acquaintance asks you to "just check" someone else\'s account status as a favour.',
      
        characters: [
          { name: 'Dina Adel', message: 'May unintentionally create authority pressure and speed bias.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Look it up quickly to help', metricDeltas: ZERO_DELTAS },
          { labelKey: 'B', labelText: 'Politely refuse and explain confidentiality', outcomeLabel: 'Excellent', explanationText: 'You held confidentiality without damaging the relationship.', metricDeltas: { ...ZERO_DELTAS, dataProtection: 22, complianceSafety: 20, decisionQuality: 8 } },
          { labelKey: 'C', labelText: 'Ask a colleague to check instead', metricDeltas: ZERO_DELTAS },
          { labelKey: 'D', labelText: 'Say you will check later to avoid conflict', metricDeltas: ZERO_DELTAS },
        ],
      },
      {
        orderIndex: 2,
        stageLabel: 'Relationship pressure',
        promptText: 'They insist: "We\'re friends, no one will know."',
        characters: [
          { name: 'Omar Shaker', message: 'May overpromise or bypass process to calm customers.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Access it because they are a friend', metricDeltas: ZERO_DELTAS },
          { labelKey: 'B', labelText: 'Explain authorization is required regardless', metricDeltas: ZERO_DELTAS },
          { labelKey: 'C', labelText: 'Share only "general" info', outcomeLabel: 'Risky', explanationText: 'Partial hiding is still sharing what shouldn\'t leave.', metricDeltas: { ...ZERO_DELTAS, dataProtection: -14, complianceSafety: -10 } },
          { labelKey: 'D', labelText: 'Redirect them to the official customer channel', metricDeltas: ZERO_DELTAS },
        ],
      },
      {
        orderIndex: 3,
        stageLabel: 'Complicating detail',
        promptText: 'The person turns out to be influential and hints it could help your career.',
        characters: [
          { name: 'Salma El-Hadidi', message: 'May be seen as slowing the process if involved late.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Use personal relationships to help', metricDeltas: ZERO_DELTAS },
          { labelKey: 'B', labelText: 'Never mix personal influence with access', metricDeltas: ZERO_DELTAS },
          { labelKey: 'C', labelText: 'Do it once and keep it quiet', metricDeltas: ZERO_DELTAS },
          { labelKey: 'D', labelText: 'Consult compliance on the conflict', outcomeLabel: 'Excellent', explanationText: 'You asked the right control function before acting.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 32, accountability: 16, reputationRisk: -6 } },
        ],
      },
      {
        orderIndex: 4,
        stageLabel: 'Authority pressure',
        promptText: 'The request is repeated, now with more insistence.',
        characters: [],
        choices: [
          { labelKey: 'A', labelText: 'Give in to end the pressure', metricDeltas: ZERO_DELTAS },
          { labelKey: 'B', labelText: 'Document the repeated pressure', metricDeltas: ZERO_DELTAS },
          { labelKey: 'C', labelText: 'Ignore and hope it stops', outcomeLabel: 'Grey Zone', explanationText: 'Stalling or ignoring quietly abandons the issue.', metricDeltas: { ...ZERO_DELTAS, accountability: -8, decisionQuality: -6 } },
          { labelKey: 'D', labelText: 'Escalate if a senior or influencer insists', metricDeltas: ZERO_DELTAS },
        ],
      },
      {
        orderIndex: 5,
        stageLabel: 'Final resolution',
        promptText: 'You must close the interaction professionally.',
        characters: [], 
        choices: [
          { labelKey: 'A', labelText: 'Quietly provide the info this once', metricDeltas: ZERO_DELTAS },
          { labelKey: 'B', labelText: 'Refuse, document and point to the proper channel', metricDeltas: ZERO_DELTAS },
          { labelKey: 'C', labelText: 'Ask them to withdraw the request in writing', metricDeltas: ZERO_DELTAS },
          { labelKey: 'D', labelText: 'Escalate the conflict of interest', outcomeLabel: 'Excellent', explanationText: 'You closed it cleanly: correct, documented, escalated where needed.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 32, accountability: 30, reputationRisk: -18 } },
        ],
      },
    ],
  };

  await seedMission(mission1);
  await seedMission(mission2);

  console.log('✅ All missions seeded successfully.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seed failed', err);
  process.exit(1);
});