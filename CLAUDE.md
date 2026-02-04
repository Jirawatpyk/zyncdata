# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**zyncdata** is a BMAD Framework (v6.0.0-Beta.5) workspace — an AI-powered multi-agent orchestration system for collaborative software development. The target application being planned/built is a **Next.js 16.x + React 19.x + TypeScript + Supabase + Vercel** health monitoring platform.

This repo contains two layers:
1. **BMAD Framework** (`_bmad/`) — agent definitions, workflows, and configs that orchestrate the development process
2. **Project Artifacts** (`_bmad-output/`) — generated planning docs, implementation artifacts, and project context

## BMAD Module Commands

### Core (anytime)
- `bmad-brainstorming` — multi-technique brainstorming facilitation
- `bmad-party-mode` — multi-agent collaborative discussion
- `bmad-help` — show next workflow steps or answer BMAD questions
- `bmad-index-docs` — create lightweight doc index for LLM scanning
- `bmad-shard-doc` — split large docs (>500 lines) into sections
- `bmad-editorial-review-prose` / `bmad-editorial-review-structure` — review documents
- `bmad-review-adversarial-general` — adversarial quality review

### BMM (Build-Manage Module) — Project Lifecycle
**Analysis phase:**
- `bmad-bmm-research` — market/domain/technical research (set `research_type`)
- `bmad-bmm-create-brief` / `bmad-bmm-validate-brief` — product brief
- `bmad-bmm-document-project` — analyze existing project for documentation
- `bmad-bmm-generate-project-context` — generate LLM-optimized `project-context.md`

**Planning phase:**
- `bmad-bmm-create-prd` / `bmad-bmm-validate-prd` — product requirements document
- `bmad-bmm-create-ux-design` — UX design facilitation

**Solutioning phase:**
- `bmad-bmm-create-architecture` / validate — technical architecture
- `bmad-bmm-create-epics-and-stories` / validate — epic/story breakdown
- `bmad-bmm-check-implementation-readiness` — alignment check before dev

**Implementation phase:**
- `bmad-bmm-sprint-planning` — generate sprint plan
- `bmad-bmm-sprint-status` — check sprint progress
- `bmad-bmm-create-story` / `bmad-bmm-dev-story` — story cycle
- `bmad-bmm-code-review` — code review
- `bmad-bmm-qa-automate` — generate automated tests
- `bmad-bmm-retrospective` — epic retrospective
- `bmad-bmm-correct-course` — navigate significant changes

**Quick Flow (lightweight alternative):**
- `bmad-bmm-quick-spec` — quick tech spec without full planning
- `bmad-bmm-quick-dev` — quick development for small tasks

**Documentation:**
- `bmad-bmm-write-document` / `bmad-bmm-validate-document` — tech writing
- `bmad-bmm-mermaid-generate` — create Mermaid diagrams
- `bmad-bmm-explain-concept` — clear technical explanations
- `bmad-bmm-create-excalidraw-dataflow` / `diagram` / `flowchart` / `wireframe` — visual docs

### BMB (Build Module Builder)
- `bmad_bmb_agent` — create/edit/validate BMAD agents
- `bmad_bmb_module` — create/edit/validate BMAD modules (brief mode available)
- `bmad_bmb_workflow` — create/edit/validate/rework BMAD workflows

### TEA (Testing & Engineering Assurance)
- `bmad_tea_framework` — initialize test framework
- `bmad_tea_ci` — configure CI/CD pipeline
- `bmad_tea_test-design` — risk-based test planning
- `bmad_tea_atdd` — generate failing tests (TDD red phase)
- `bmad_tea_automate` — expand test coverage
- `bmad_tea_test-review` — quality audit (0-100 scoring)
- `bmad_tea_nfr-assess` — non-functional requirements assessment
- `bmad_tea_trace` — coverage traceability matrix
- `bmad_tea_teach-me-testing` — 7-session testing academy

### GDS (Game Development Studio)
- `bmad-gds-*` — full game dev lifecycle (brainstorm, brief, GDD, narrative, architecture, sprint cycle, testing)

### CIS (Creative Innovation Studio)
- `bmad-cis-innovation-strategy` / `problem-solving` / `design-thinking` / `brainstorming` / `storytelling`

## Architecture

### Directory Structure
```
_bmad/                      # BMAD Framework
├── _config/agents/         # Agent customization YAML files (27 agents)
├── _memory/                # Shared agent memory (tech-writer, storyteller sidecars)
├── bmb/                    # Build Module Builder (agent/module/workflow creation)
├── bmm/                    # Build-Manage Module (full project lifecycle)
├── core/                   # Core workflows (brainstorming, party-mode, reviews)
├── gds/                    # Game Development Studio
├── tea/                    # Testing & Engineering Assurance
└── cis/                    # Creative Innovation Studio

_bmad-output/               # Generated artifacts
├── planning-artifacts/     # Briefs, PRDs, architecture, diagrams, wireframes
├── implementation-artifacts/ # Sprint plans, stories, reviews, retrospectives
└── project-context.md      # LLM-optimized implementation rules (147 rules)

docs/                       # Project knowledge base (PDFs, agent memory)
```

### Agent Activation Pattern
Every BMAD agent follows this mandatory sequence:
1. Load persona from agent definition file
2. Load `config.yaml` (MUST complete before proceeding)
3. Store config variables (`user_name`, `communication_language`, `output_folder`)
4. Display greeting + menu
5. Wait for user input (never auto-execute)

### Workflow Step-File Architecture
- Workflows use numbered step files (`step-01-*.md`, `step-02-*.md`)
- Each step is self-contained — load only when executing, never pre-load future steps
- Always read the entire step/workflow file before execution
- Save state/outputs after each step

### Menu Handler Types
- **exec** — execute workflow/instruction file
- **workflow** — load BMAD workflow YAML and follow core workflow OS
- **data** — load data file (JSON/YAML/CSV/XML)
- **action** — custom prompt-based handler

## Target Application Tech Stack (from project-context.md)

The zyncdata application being developed uses:
- **Next.js 16.x** (App Router only) + **React 19.x** + **TypeScript 5.x** (strict)
- **Supabase** (PostgreSQL + Auth + Realtime) with 3 client patterns (server/browser/middleware)
- **Vercel** deployment, **Tailwind CSS 3.x**, **shadcn/ui** (New York style)
- **Vitest** + **Playwright** for testing; **Zod** for validation
- **React Query** restricted to `/admin/` routes only
- No global state libraries — RSC + useState + React Query (admin only)

### Critical Rules for Application Code
- `params`/`searchParams`/`cookies()`/`headers()` are async in Next.js 16 — always `await`
- Database snake_case transforms to camelCase in data access layer only (`src/lib/{domain}/`)
- All API responses use `{ data, error }` wrapper via `ApiResponse<T>`
- Supabase clients: only 3 factory files (`server.ts`, `client.ts`, `middleware.ts`)
- `'use client'` only when component needs hooks/events/browser APIs
- Server Actions in separate `src/lib/actions/*.ts` files, never inline in client components
- No barrel files — import directly from source
- `cn()` for conditional Tailwind classes, never string concatenation
- Conventional Commits: `type(scope): description`

### Application Dev Commands
```bash
npm run dev          # Next.js dev server
npm run dev:db       # Supabase local
npm run test         # Vitest (unit + integration)
npm run test:e2e     # Playwright
npm run test:coverage # Vitest with coverage
npm run test:a11y    # Playwright accessibility
npm run db:types     # Regenerate Supabase types
npm run type-check   # TypeScript check
npm run lint         # ESLint
```

### Pre-commit (Husky)
`npm run type-check && npm run lint && npm run test` — blocks commit on failure.

## Configuration
- **User:** Jiraw
- **Communication:** English
- **BMAD Version:** 6.0.0-Beta.5
- **Module configs:** `_bmad/{module}/config.yaml`
- **Agent customization:** `_bmad/_config/agents/*.customize.yaml`
- **Output folder:** `_bmad-output/`
