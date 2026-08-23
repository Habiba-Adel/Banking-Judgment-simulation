# Banking Judgment in Action : Simulation Engine

## Summary

An interactive banking ethics & compliance behavioral simulation. Employees play as a bank
employee facing realistic workplace dilemmas across 12 missions. Each mission unfolds as one
continuous incident with 5 sequential decision points ( not a quiz ) where colleagues, managers,
and customers apply pressure through in-story messages. Choices affect seven behavioral metrics
(Customer Trust, Compliance Safety, Data Protection, Decision Quality, Accountability,
Reputation Risk, Responsible Banking), and the story path is fixed regardless of what the user
picks only the consequences and scoring vary. After each mission, the user receives a
reflective debrief explaining what their choices revealed, and across missions the system
builds a behavioral profile from repeated patterns rather than a single score.

This repo is the backend engine (NestJS) serving mission content, tracking attempts/decisions,
and computing scoring. It is designed to plug into a larger platform that owns user
authentication this service does not implement its own login/register.

## Status

MVP in active development. Target: proving the core loop : enter mission, answer 5 decisions, receive report — end to end.

## Tech stack

- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL 
- **Frontend:** Next.js + React + TypeScript 

## Core concepts

- **Mission** : one scenario (e.g. "The Screenshot Shortcut"), containing 5 fixed Steps
- **Step** : one moment in the unfolding incident; presents context + character messages + choices
- **Choice** : one of ~4 options at a Step; carries base metric deltas + outcome label +
  explanation text (never exposed to the client before an answer is submitted)
- **Playthrough** : one full run through all 12 missions for a user; supports multiple runs
  over time and run-to-run comparison to enable for the user get feedback and compare his level
- **Attempt** : one attempt at a single mission, within a Playthrough; replaying a mission
  creates a new Attempt rather than overwriting the old one
- **Decision** : the record of which Choice a user picked, at which Step, within which Attempt;
  stores the *applied* metric deltas (may differ from the Choice's base deltas if recovery-bonus
  logic applies)

See `/docs/api-design-final.md` for the full endpoint contract and `/docs/db-schema.md` (once
finalized) for the entity reference.

## Getting started

