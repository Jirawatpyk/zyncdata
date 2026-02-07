# Story {{epic_num}}.{{story_num}}: {{story_title}}

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a {{role}},
I want {{action}},
so that {{benefit}}.

## Acceptance Criteria

1. [Add acceptance criteria from epics/PRD]

## Tasks / Subtasks

<!-- P1 (Epic 4 Retro): SPLITTING THRESHOLD — If this story has 12+ tasks OR touches 4+ architectural layers (e.g., migration + API + UI + tests), it MUST be split into smaller stories before dev begins. Stories exceeding this threshold produce exponentially more defects (ref: Story 4-2 had 16 tasks → 20 issues, 5 HIGH). -->

- [ ] Task 1 (AC: #)
  - [ ] Subtask 1.1
- [ ] Task 2 (AC: #)
  - [ ] Subtask 2.1

<!-- P3 (Epic 4 Retro): INTEGRATION CONTRACT VERIFICATION — If this story spans migration files + application validation (e.g., MIME types, RLS policies, enum values), add an explicit task:
- [ ] Verify integration contracts: confirm migration constraints match app-level validation (types, enums, MIME types, RLS patterns)
-->

## Dev Notes

- Relevant architecture patterns and constraints
- Source tree components to touch
- Testing standards summary

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Detected conflicts or variances (with rationale)

### References

- Cite all technical details with source paths and sections, e.g. [Source: docs/<file>.md#Section]

## Scope Additions

<!-- P4 (Epic 3 Retro): Document unplanned changes in real-time as they happen -->

| Change | Reason | Impact |
|--------|--------|--------|
| (none) | — | — |

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

<!-- P2 (Epic 3 Retro): Verify File List matches all new/modified/deleted files. Post-commit: run `npm run story-metrics` to cross-check. -->
