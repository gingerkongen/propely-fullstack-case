# CLAUDE.md

Take-home case for Propely: a task table with property names, filtering, search, pagination and PDF export. npm workspaces: `apps/api` (Express + better-sqlite3) and `apps/web` (React + Vite + Tailwind).

Read `README.md` first:

- "The assignment" maps each requirement to how it's solved.
- "API" and "Structure" describe the endpoints and where the code lives.
- "My notes" explains the approach, the decisions and their trade-offs, and what would change with a production DB (in my examples Postgres).

The git history has one PR per requirement, and each commit message explains its step.

## Commands

- `npm install`, then `npm run dev:api` and `npm run dev:web` in two terminals
- `npm run test` runs the API tests (Vitest + supertest)
- `npm run typecheck --workspace apps/api` (or `apps/web`)

## Things to know

- `seed/` is fixed input and must not be edited. The database is derived from it and rebuilt when `SCHEMA_VERSION` in `apps/api/src/db.ts` changes.
- `fold()` is registered as an SQL function on every connection in `openDatabase()`. Inserts need it to fill the generated `*_search` columns.
- The table and the PDF export both render from `apps/web/src/columns.ts`.
