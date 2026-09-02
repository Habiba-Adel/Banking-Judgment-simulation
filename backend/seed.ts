// seed.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { missions, decisions, characters, stepCharacters, choices, users } from './src/db/schema';
import { eq } from 'drizzle-orm';

dotenv.config();

const PLACEHOLDER_USER_ID = '00000000-0000-0000-0000-000000000001';

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

  // Stands in for the authenticated user until UsersModule/auth exists —
  // PlaythroughsController reads this same id as PLACEHOLDER_USER_ID.
  await db
    .insert(users)
    .values({
      id: PLACEHOLDER_USER_ID,
      email: 'placeholder@mindshift.dev',
      passwordHash: 'placeholder',
      displayName: 'Placeholder User',
    })
    .onConflictDoNothing();

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
      { name: 'Salma El-Hadidi', role: 'Compliance Officer' },
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
          { name: 'Salma El-Hadidi', message: 'The customer is still waiting. You must close the case professionally.' }
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
      { name: 'Tarek Mansour', role: 'Relationship Manager SME Banking' },
      { name: 'Customer', role: 'Customer' },
    ],
    steps: [
      {
        orderIndex: 1,
        stageLabel: 'The request',
        promptText: 'An acquaintance asks you to "just check" someone else\'s account status as a favour.',

        characters: [
          { name: 'Customer', message: 'An acquaintance asks you to "just check" someone else\'s account status as a favour.' }
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
          { name: 'Customer', message: 'We\'re friends, no one will know.' }
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
          { name: 'Customer', message: 'The person turns out to be influential and hints it could help your career.' }
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
        characters: [
          { name: 'Customer', message: 'The request is repeated, now with more insistence.' }
        ],
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
        characters: [
          { name: 'Salma El-Hadidi', message: 'You must close the interaction professionally.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Quietly provide the info this once', metricDeltas: ZERO_DELTAS },
          { labelKey: 'B', labelText: 'Refuse, document and point to the proper channel', metricDeltas: ZERO_DELTAS },
          { labelKey: 'C', labelText: 'Ask them to withdraw the request in writing', metricDeltas: ZERO_DELTAS },
          { labelKey: 'D', labelText: 'Escalate the conflict of interest', outcomeLabel: 'Excellent', explanationText: 'You closed it cleanly: correct, documented, escalated where needed.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 32, accountability: 30, reputationRisk: -18 } },
        ],
      },
    ],
  };

  const mission3 = {
    orderIndex: 3,
    title: 'The Vendor Access Request',
    category: 'Third-Party Risk',
    description: 'Fixing an issue fast vs protecting production and customer data from third-party access.',
    managerNote: 'Follow policy and approved channels. Speed matters, but never at the expense of trust or compliance.',
    managerName: 'Salma El-Hadidi',
    goalText: 'Give the vendor the least access needed, scoped, logged, and revoked.',
    cast: [
      { name: 'Tarek Mansour', role: 'Vendor Relationship Manager' },
      { name: 'Dina Adel', role: 'Team Leader — Banking Operations' },
      { name: 'Salma El-Hadidi', role: 'Compliance Officer' },
      { name: 'Customer', role: 'Customer' },
    ],
    steps: [
      {
        orderIndex: 1,
        stageLabel: 'The request',
        promptText: 'Tarek Mansour asks: "The vendor wants production access, just for a quick fix."',
        characters: [
          { name: 'Customer', message: 'The vendor wants production access, just for a quick fix.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Grant production access to speed the fix', outcomeLabel: 'Critical Breach', explanationText: 'Unscoped production access is exactly the exposure vendor-access controls exist to prevent.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -30, dataProtection: -34, accountability: -14, reputationRisk: 26, responsibleBanking: -10 } },
          { labelKey: 'B', labelText: 'Provide masked data in a test environment', outcomeLabel: 'Excellent', explanationText: 'Solves the vendor\'s need without exposing real production data — least-privilege in practice.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 22, dataProtection: 26, decisionQuality: 10, accountability: 8, reputationRisk: -8, responsibleBanking: 10 } },
          { labelKey: 'C', labelText: 'Share a database export by email', outcomeLabel: 'Critical Breach', explanationText: 'An uncontrolled export by email has zero access logging and no revocation path.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -26, dataProtection: -34, accountability: -18, reputationRisk: 30, responsibleBanking: -14 } },
          { labelKey: 'D', labelText: 'Ask IT/Security for approval first', outcomeLabel: 'Excellent', explanationText: 'Involving Security first ensures access is reviewed and properly scoped before anything is granted.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 20, accountability: 22, decisionQuality: 6, reputationRisk: -6, responsibleBanking: 6 } },
        ],
      },
      {
        orderIndex: 2,
        stageLabel: 'Time pressure',
        promptText: 'Tarek Mansour says: "The outage is costing money — the vendor is pushing for speed."',
        characters: [
          { name: 'Customer', message: 'The outage is costing money — the vendor is pushing for speed.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Give broad access to move faster', outcomeLabel: 'Critical Breach', explanationText: 'Broad access under time pressure repeats the exact exposure a scoped grant would have avoided.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -28, dataProtection: -30, accountability: -12, decisionQuality: -6, reputationRisk: 24, responsibleBanking: -8 } },
          { labelKey: 'B', labelText: 'Limit access scope and time', outcomeLabel: 'Excellent', explanationText: 'Scoped, time-boxed access solves the urgency without leaving a standing exposure.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 24, dataProtection: 20, decisionQuality: 10, accountability: 10, reputationRisk: -8, responsibleBanking: 12 } },
          { labelKey: 'C', labelText: 'Let them use a staff member\'s login', outcomeLabel: 'Critical Breach', explanationText: 'Shared credentials erase the audit trail entirely — no one can prove who did what.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -20, dataProtection: -16, accountability: -30, decisionQuality: -8, reputationRisk: 22, responsibleBanking: -12 } },
          { labelKey: 'D', labelText: 'Escalate to security for an emergency process', outcomeLabel: 'Excellent', explanationText: 'Emergency-access procedures exist precisely for this — use the controlled path, not a shortcut.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 20, accountability: 20, decisionQuality: 8, reputationRisk: -6, responsibleBanking: 6 } },
        ],
      },
      {
        orderIndex: 3,
        stageLabel: 'Complicating detail',
        promptText: 'Tarek Mansour says: "The vendor is asking to copy some records to test locally."',
        characters: [
          { name: 'Customer', message: 'The vendor is asking to copy some records to test locally.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Allow the copy to help them', outcomeLabel: 'Critical Breach', explanationText: 'Real records leaving the environment with no controls is exactly what data-protection policy exists to stop.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -24, dataProtection: -30, accountability: -14, reputationRisk: 22, responsibleBanking: -10 } },
          { labelKey: 'B', labelText: 'Refuse; use masked/synthetic test data', outcomeLabel: 'Excellent', explanationText: 'No real data ever needs to leave for local testing to work.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 22, dataProtection: 26, decisionQuality: 10, reputationRisk: -8, responsibleBanking: 12 } },
          { labelKey: 'C', labelText: 'Allow it if they promise to delete it', outcomeLabel: 'Grey Zone', explanationText: 'A verbal promise isn\'t a control — there\'s no way to verify or enforce it.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -10, dataProtection: -14, accountability: -6, decisionQuality: -2, reputationRisk: 10, responsibleBanking: -4 } },
          { labelKey: 'D', labelText: 'Document scope and require deletion proof', outcomeLabel: 'Good', explanationText: 'Real exposure, but tracked, scoped, and verified — a controlled compromise, not a blind one.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 14, dataProtection: 8, decisionQuality: 8, accountability: 16, reputationRisk: -4, responsibleBanking: 8 } },
        ],
      },
      {
        orderIndex: 4,
        stageLabel: 'Authority pressure',
        promptText: 'Dina Adel says: "Just give them what they need, we\'ll sort approvals later."',
        characters: [
          { name: 'Dina Adel', message: 'Just give them what they need, we\'ll sort approvals later.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Comply and grant access', outcomeLabel: 'Critical Breach', explanationText: 'Folding to authority pressure without any controls in place still leaves the same exposure.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -26, dataProtection: -22, accountability: -16, reputationRisk: 24, responsibleBanking: -10 } },
          { labelKey: 'B', labelText: 'Insist on approval, scope, and logging', outcomeLabel: 'Excellent', explanationText: 'You held the line on process even under direct pressure from a team lead.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 22, dataProtection: 18, decisionQuality: 10, accountability: 18, reputationRisk: -8, responsibleBanking: 12 } },
          { labelKey: 'C', labelText: 'Grant now, document afterwards', outcomeLabel: 'Grey Zone', explanationText: '"Ask forgiveness, not permission" leaves the real risk window wide open before any paperwork exists.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -12, dataProtection: -10, accountability: -4, decisionQuality: -4, reputationRisk: 12, responsibleBanking: -6 } },
          { labelKey: 'D', labelText: 'Escalate to information security', outcomeLabel: 'Excellent', explanationText: 'Taking it past an authority figure to a governing control function is the strongest move under this kind of pressure.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 28, accountability: 24, decisionQuality: 6, reputationRisk: -16, responsibleBanking: 14 } },
        ],
      },
      {
        orderIndex: 5,
        stageLabel: 'Final resolution',
        promptText: 'Salma El-Hadidi says: "You must close out the vendor access request."',
        characters: [
          { name: 'Salma El-Hadidi', message: 'You must close out the vendor access request.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Leave the access open "just in case"', outcomeLabel: 'Critical Breach', explanationText: 'Unrevoked vendor access is a lingering exposure long after the original need ended.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -22, dataProtection: -18, accountability: -20, reputationRisk: 20, responsibleBanking: -14 } },
          { labelKey: 'B', labelText: 'Grant scoped access, document, verify revocation', outcomeLabel: 'Excellent', explanationText: 'The full lifecycle done right: scoped, logged, and confirmed revoked.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 26, dataProtection: 20, decisionQuality: 12, accountability: 22, reputationRisk: -10, responsibleBanking: 16 } },
          { labelKey: 'C', labelText: 'Deny everything and let the outage continue', outcomeLabel: 'Risky', explanationText: 'Not a compliance breach, but refusing to resolve a real outage is still poor judgment, not caution.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 6, dataProtection: 4, decisionQuality: -14, accountability: -8, reputationRisk: 4, responsibleBanking: -12 } },
          { labelKey: 'D', labelText: 'Escalate and require deletion/revocation proof', outcomeLabel: 'Good', explanationText: 'A safe, verified close-out, though less direct than handling it yourself.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 18, dataProtection: 6, decisionQuality: 6, accountability: 16, reputationRisk: -6, responsibleBanking: 10 } },
        ],
      },
    ],
  };

  const mission4 = {
    orderIndex: 4,
    title: 'The Gift & Hospitality Dilemma',
    category: 'Conflict of Interest',
    description: 'Maintaining relationships vs avoiding conflicts of interest and perceived influence.',
    managerNote: 'Follow policy and approved channels. Speed matters, but never at the expense of trust or compliance.',
    managerName: 'Salma El-Hadidi',
    goalText: 'Keep your decision independent — declare, register, and avoid influence.',
    cast: [
      { name: 'Tarek Mansour', role: 'Relationship Manager — SME Banking' },
      { name: 'Hany Fathy', role: 'SME Customer' },
      { name: 'Dina Adel', role: 'Team Leader — Banking Operations' },
      { name: 'Salma El-Hadidi', role: 'Compliance Officer' },
      { name: 'Customer', role: 'Customer' },
    ],
    steps: [
      {
        orderIndex: 1,
        stageLabel: 'The offer',
        promptText: 'Hany Fathy says: "I\'d like to send you something as a thank-you while you\'re reviewing my facility."',
        characters: [
          { name: 'Customer', message: 'The offer arrives while your credit/approval decision is pending.'}
        ],
        choices: [
          { labelKey: 'A', labelText: 'Accept it — it\'s just a courtesy', outcomeLabel: 'Critical Breach', explanationText: 'Accepting anything from someone whose approval is pending is a textbook conflict of interest.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -26, accountability: -18, decisionQuality: -8, reputationRisk: 26, responsibleBanking: -14, customerTrust: 4 } },
          { labelKey: 'B', labelText: 'Politely decline given the pending decision', outcomeLabel: 'Excellent', explanationText: 'Declining while the decision is pending keeps you clearly independent.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 24, accountability: 14, decisionQuality: 10, reputationRisk: -8, responsibleBanking: 14 } },
          { labelKey: 'C', labelText: 'Accept but say it won\'t affect you', outcomeLabel: 'Grey Zone', explanationText: 'A verbal assurance doesn\'t remove the conflict of interest — that\'s exactly the trap.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -14, accountability: -10, decisionQuality: -6, reputationRisk: 14, responsibleBanking: -8 } },
          { labelKey: 'D', labelText: 'Ask your manager how to handle it', outcomeLabel: 'Excellent', explanationText: 'Raising it with your manager is, in practice, declaring it.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 20, accountability: 22, decisionQuality: 8, reputationRisk: -6, responsibleBanking: 10 } },
        ],
      },
      {
        orderIndex: 2,
        stageLabel: 'Relationship pressure',
        promptText: 'Tarek Mansour says: "Don\'t offend a good client, just take it."',
        characters: [
          { name: 'Tarek Mansour', message: 'Don\'t offend a good client, just take it.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Take it to keep the relationship', outcomeLabel: 'Critical Breach', explanationText: 'Folding to relationship pressure still leaves the same conflict of interest in place.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -24, accountability: -16, decisionQuality: -8, reputationRisk: 24, responsibleBanking: -12, customerTrust: 4 } },
          { labelKey: 'B', labelText: 'Declare the offer per policy', outcomeLabel: 'Excellent', explanationText: 'Declaring per policy is exactly what independence requires here.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 26, accountability: 20, decisionQuality: 10, reputationRisk: -10, responsibleBanking: 14 } },
          { labelKey: 'C', labelText: 'Accept a "small" one only', outcomeLabel: 'Grey Zone', explanationText: 'Size doesn\'t remove a conflict of interest — that\'s a rationalization, not a control.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -12, accountability: -8, decisionQuality: -6, reputationRisk: 12, responsibleBanking: -6 } },
          { labelKey: 'D', labelText: 'Separate the relationship from the decision', outcomeLabel: 'Good', explanationText: 'The right instinct, but it stays conceptual rather than actually declaring anything.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 16, accountability: 12, decisionQuality: 8, reputationRisk: -6, responsibleBanking: 10 } },
        ],
      },
      {
        orderIndex: 3,
        stageLabel: 'Complicating detail',
        promptText: 'Dina Adel says: "This could look like it influenced your decision — even if it didn\'t."',
        characters: [
          { name: 'Customer', message: 'You realise accepting could look like it influenced the decision.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Keep it quiet', outcomeLabel: 'Risky', explanationText: 'Hiding the perception issue undermines transparency and the audit trail.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -14, accountability: -12, decisionQuality: -6, reputationRisk: 14, responsibleBanking: -8 } },
          { labelKey: 'B', labelText: 'Record it in the gifts register', outcomeLabel: 'Excellent', explanationText: 'Registering it is exactly the disclosure this situation calls for.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 26, accountability: 22, decisionQuality: 10, reputationRisk: -10, responsibleBanking: 14 } },
          { labelKey: 'C', labelText: 'Return the gift and note it', outcomeLabel: 'Excellent', explanationText: 'Returning it removes the conflict of interest entirely, not just discloses it.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 28, accountability: 24, decisionQuality: 12, reputationRisk: -12, responsibleBanking: 16 } },
          { labelKey: 'D', labelText: 'Decide first, then accept afterward', outcomeLabel: 'Grey Zone', explanationText: 'Sequencing doesn\'t undo the fact the gift was already offered beforehand.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -12, accountability: -10, decisionQuality: -8, reputationRisk: 14, responsibleBanking: -6 } },
        ],
      },
      {
        orderIndex: 4,
        stageLabel: 'Authority pressure',
        promptText: 'Dina Adel says: "Just take it this time — I\'ll handle it if anyone asks."',
        characters: [
          { name: 'Customer', message: 'The offer is repeated, now more insistently.' }
        ],
        choices: [
          { labelKey: 'A', labelText: 'Give in to avoid awkwardness', outcomeLabel: 'Critical Breach', explanationText: 'A manager offering to "handle it" doesn\'t remove your own responsibility for the decision.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -26, accountability: -20, decisionQuality: -10, reputationRisk: 26, responsibleBanking: -14 } },
          { labelKey: 'B', labelText: 'Hold to policy and document the pressure', outcomeLabel: 'Excellent', explanationText: 'Holding the line and documenting it protects both you and the process.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 24, accountability: 20, decisionQuality: 10, reputationRisk: -8, responsibleBanking: 14 } },
          { labelKey: 'C', labelText: 'Escalate if pressure continues', outcomeLabel: 'Excellent', explanationText: 'Escalating past a superior who is actively offering to shield you is the strongest move here.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 28, accountability: 24, decisionQuality: 8, reputationRisk: -12, responsibleBanking: 16 } },
          { labelKey: 'D', labelText: 'Ignore and hope it stops', outcomeLabel: 'Grey Zone', explanationText: 'Ignoring it quietly abandons the issue instead of resolving it.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -10, accountability: -10, decisionQuality: -8, reputationRisk: 12, responsibleBanking: -6 } },
        ],
      },
      {
        orderIndex: 5,
        stageLabel: 'Final resolution',
        promptText: 'Dina Adel says: "Let\'s close this out properly — document what happened."',
        characters: [
          { name: 'Salma El-Hadidi', message: 'You close out the situation.'} 
          
        ],
        choices: [
          { labelKey: 'A', labelText: 'Quietly keep the gift', outcomeLabel: 'Risky', explanationText: 'Keeping it without any disclosure leaves the conflict of interest unresolved.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -15, accountability: -13, decisionQuality: -6, reputationRisk: 15, responsibleBanking: -8 } },
          { labelKey: 'B', labelText: 'Decline/return, declare, register, keep the decision independent', outcomeLabel: 'Excellent', explanationText: 'The full lifecycle done right: declined, declared, registered, and independence preserved.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 30, accountability: 26, decisionQuality: 12, reputationRisk: -14, responsibleBanking: 18 } },
          { labelKey: 'C', labelText: 'Accept and make the register entry vague', outcomeLabel: 'Risky', explanationText: 'A deliberately vague entry is an active falsification of the audit trail, not just silence.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: -12, accountability: -15, decisionQuality: -7, reputationRisk: 13, responsibleBanking: -7 } },
          { labelKey: 'D', labelText: 'Escalate and document for transparency', outcomeLabel: 'Good', explanationText: 'A safe, verified close-out, though less direct than resolving it yourself.', metricDeltas: { ...ZERO_DELTAS, complianceSafety: 20, accountability: 20, decisionQuality: 8, reputationRisk: -8, responsibleBanking: 12 } },
        ],
      },
    ],
  };

  await seedMission(mission1);
  await seedMission(mission2);
  await seedMission(mission3);
  await seedMission(mission4);

  console.log('✅ All missions seeded successfully.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Seed failed', err);
  process.exit(1);
});