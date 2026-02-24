# Instagram Clone — Claude Code Instructions

## Before any task
1. Read /docs/specs/features/ — find the relevant spec
2. Read /docs/progress.md — understand current state
3. List all files you will create or modify
4. Wait for confirmation before proceeding

## After every task
1. Run: pnpm typecheck && pnpm test --passWithNoTests
2. Update checkboxes in /docs/progress.md
3. Write 3 bullet points: what was done, what was not done, what is needed next

## Stack
Bun, Fastify, tRPC, Drizzle ORM, PostgreSQL, Next.js 15, Expo, Tamagui, pnpm, Turborepo

## Never
- Use `any`
- Write raw SQL — Drizzle query builder only
- Touch packages/db/schema.ts without explicit instruction
