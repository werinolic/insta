# Project: Instagram Clone
Monorepo using Turborepo + pnpm. Stack: Bun + Fastify + tRPC + Drizzle ORM + Next.js 15 + Expo + Tamagui.

## Rules (always apply)
- TypeScript strict mode, never use `any`
- Zod validation on all API inputs
- Drizzle queries only inside apps/api/services/ or tRPC routers
- Named exports everywhere
- Before implementing, read the relevant /docs/specs/features/*.spec.md

## Monorepo structure
- packages/db/ — Drizzle schema and migrations
- packages/shared/ — Zod schemas, shared types
- packages/ui/ — Tamagui components
- apps/api/ — Bun + Fastify + tRPC backend
- apps/web/ — Next.js 15
- apps/mobile/ — Expo

## After every task
1. Run pnpm typecheck
2. Update /docs/progress.md
