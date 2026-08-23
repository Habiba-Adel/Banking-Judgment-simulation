import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  json,
  char,
  unique,
} from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', ['in_progress', 'completed', 'abandoned']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email').notNull().unique(),
  passwordHash: varchar('password_hash').notNull(),
  displayName: varchar('display_name'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const missions = pgTable('missions', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderIndex: integer('order_index').notNull(),
  title: varchar('title').notNull(),
  category: varchar('category').notNull(),
  description: text('description').notNull(),
  managerNote: text('manager_note').notNull(),
  managerName: varchar('manager_name').notNull(),
  goalText: text('goal_text').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const decisions = pgTable('decisions', {
  id: uuid('id').primaryKey().defaultRandom(),
  missionId: uuid('mission_id')
    .notNull()
    .references(() => missions.id),
  orderIndex: integer('order_index').notNull(),
  stageLabel: varchar('stage_label').notNull(),
  promptText: text('prompt_text').notNull(),
  contextText: text('context_text').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// export const characters = pgTable('characters', {
//   id: uuid('id').primaryKey().defaultRandom(),
//   decisionId: uuid('decision_id')
//     .notNull()
//     .references(() => decisions.id),
//   name: varchar('name').notNull(),
//   role: varchar('role').notNull(),
//   message: text('message').notNull(),
//   orderIndex: integer('order_index').notNull(),
//   createdAt: timestamp('created_at').notNull().defaultNow(),
// });


//the previous one if the same character appearing more than once in the same mission it will stored as duplication 
//rather than that we will split the fixed data about the characters and the message that will change in each step 

export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name').notNull(),
  role: varchar('role').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});


export const stepCharacters = pgTable('step_characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  decisionId: uuid('decision_id')
    .notNull()
    .references(() => decisions.id),
  characterId: uuid('character_id')
    .notNull()
    .references(() => characters.id),
  message: text('message').notNull(),
  orderIndex: integer('order_index').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});





export const choices = pgTable('choices', {
  id: uuid('id').primaryKey().defaultRandom(),
  decisionId: uuid('decision_id')
    .notNull()
    .references(() => decisions.id),
  labelKey: char('label_key', { length: 1 }).notNull(),
  labelText: varchar('label_text').notNull(),
  metricDeltas: json('metric_deltas').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  //this will not appeaing immediately after the user choose a choice but we need to save them cause in the mission report they appeared 
  outcomeLabel: varchar('outcome_label'),
explanationText: text('explanation_text'),
});

export const playthroughs = pgTable('playthroughs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  runNumber: integer('run_number').notNull(),
  status: statusEnum('status').notNull(),
  finalMetrics: json('final_metrics'),
  profileResult: varchar('profile_result'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const missionAttempts = pgTable('mission_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  playthroughId: uuid('playthrough_id')
    .notNull()
    .references(() => playthroughs.id),
  missionId: uuid('mission_id')
    .notNull()
    .references(() => missions.id),
  status: statusEnum('status').notNull(),
  finalMetrics: json('final_metrics'),
  missionScore: integer('mission_score'),
  startedAt: timestamp('started_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const decisionResponses = pgTable(
  'decision_responses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => missionAttempts.id),
    decisionId: uuid('decision_id')
      .notNull()
      .references(() => decisions.id),
    choiceId: uuid('choice_id')
      .notNull()
      .references(() => choices.id),
    answeredAt: timestamp('answered_at').notNull().defaultNow(),
  },
  (table) => [unique().on(table.attemptId, table.decisionId)],
);
