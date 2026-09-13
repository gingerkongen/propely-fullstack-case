# Propely fullstack case

A table of 1000 maintenance tasks across 40 properties, with property names, filtering, free-text search, pagination and PDF export. Express + SQLite API, React + Vite + Tailwind web app.

## Getting started

Requires Node 22+ (`.nvmrc` pins it if you use nvm).

```bash
npm install
npm run dev:api    # http://localhost:8080
npm run dev:web    # http://localhost:3000 (second terminal)
```

The API builds `apps/api/tasks.db` from `seed/` on first start, and rebuilds it when the schema version changes. Delete the file to reset. The web app calls the API at `VITE_API_BASE_URL` (default `http://localhost:8080`).

```bash
npm run test                            # API tests (Vitest)
npm run typecheck --workspace apps/api  # or apps/web
```

## The assignment

| Requirement                                       | Solution                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Property name instead of id                       | The API joins `properties`; the table shows the name                                    |
| Filter on status, category and property, combined | Multi-select status, category and property, plus created date, due date and cost ranges |
| Free-text search that works with the filters      | Title and property name, with or without æøå                                            |
| Pagination                                        | 50 per page, done in the API                                                            |
| Download as PDF, reflecting filters and search    | Current page or all matches, same columns as the table                                  |

## API

**`POST /api/tasks/search`**. Every field is optional:

```json
{
  "statuses": ["New", "InProgress"],
  "categories": [],
  "property_ids": ["prop-011"],
  "created_from": "2025-01-01",
  "created_to": null,
  "due_from": null,
  "due_to": null,
  "cost_min": 10000,
  "cost_max": null,
  "q": "lekkasje",
  "page": 1,
  "page_size": 50
}
```

An empty list or `null` means no filter. Values within a list are OR'ed, filters are AND'ed, and ranges are inclusive and leave out tasks without a value. `page_size` defaults to 50 (max 1000). Invalid input gives a `400`.

Returns `{ items, total, page, page_size }`, newest first. Each item is a task plus `property_name`.

**`GET /api/tasks/filter-options`** returns the statuses, categories and the properties that have tasks, in Norwegian sort order.

**`GET /api/health`** returns `{ "status": "ok" }`.

## Data

Two tables, built from `seed/`. The seed files are fixed input and never modified.

- `properties(id, name, name_search)`
- `tasks(id, title, description, category, status, property_id, created_at, due_date, cost_nok, title_search)`

`name_search` and `title_search` are generated columns with a folded copy of the text for search. The data is deliberately messy: Norwegian characters, property names of 70+ characters, long compound words, ~22% of tasks without a due date, ~12% without a cost, and a skewed status distribution.

## Structure

```
apps/api/src
  app.ts            routes and request validation (zod)
  taskQueries.ts    the search query: filters, search, paging, filter options
  db.ts             schema and seeding, registers fold()
  fold.ts           text normalization for search
apps/web/src
  App.tsx           state and debounced search requests
  TaskFilters.tsx   search box and filter dropdowns
  TaskTable.tsx     the table
  columns.ts        columns shared by the table and the PDF
  Pagination.tsx
  PdfExport.tsx     export buttons; exportPdf.ts builds the PDF
seed/               fixed input
```

## My notes

### Starting plan

Before writing code I planned one POST filter endpoint for tasks 2-4, returning a first page of 50 with no filter, and a search column that matches with and without æøå, driven by an SQL function if SQLite allowed it. It did: better-sqlite3 can register JS functions in SQLite, so nothing had to be simulated. Along the way the search columns ended up on both tables, since search covers titles and property names, and the filters grew to dates and cost.

### How I worked

- One branch and PR per requirement, merged with merge commits so each step shows in the history.
- Fixed some of the starter code before building on it.
- Tests sit where the logic is. The query tests run filter combinations against the real seed and compare the result with the same filter written in plain JS. The web app was checked in a browser against the seed data.

### Agentic coding

I used Claude Code as a coding agent. I planned the work and made the calls, it implemented them branch by branch, and I reviewed diffs and PRs. It also checked its own work: typecheck and tests after each change, SQL ideas tried in throwaway scripts against a plain JS version before they went in, the built app driven in headless Chrome to check filters, search, paging and the PDF against the seed data, and each commit replayed on its own to confirm it builds and passes. The browser checks were throwaway scripts, so they aren't in the repo.

### Decisions

- Filtering, search and paging happen in the API. Once the server paginates, filtering has to happen there too, or you only filter the 50 rows the client has.
- Search is `POST /api/tasks/search` with a JSON body, not GET with query params. This is simply due to the benifits of having a body, and not being constrained to the url
- One static SQL statement covers every filter combination.
- Search works with and without æøå. SQLite's `LIKE` and `lower()` only fold ASCII, so `åkerveien` doesn't match `Åkerveien`, and FTS5 handles å but not æ and ø. `fold()` (lowercase, æ to ae, ø to o, accents stripped) is registered as an SQL function and fills two generated columns. The search term goes through the same function. Folding on write costs about 36 KB, but searches are far more frequent than writes, and SQLite keeps the columns in sync on every insert and update.
- The PDF is built in the client. Simply because its cheaper and simpler than us generating it ourself on the server

### Compared to a previous project

At a previous employer (Postgres and .NET) I built a property filter and an address search over ~4.5M properties.

- The filter was one parameterized SQL function over a materialized view with one denormalized row per property, refreshed daily. `NULL` or an empty array meant no filter. A thin POST endpoint called it, and an options endpoint listed the valid values.
- The address search used a column holding the raw and the unaccented text, kept up to date by a trigger, with a `pg_trgm` index and similarity ranking.

For the current Propely project I took inspiration from this, and reused the static query where empty means no filter, the POST filter body, and an options endpoint that only lists values present in the data. I skipped the materialized views, since the current data model neither need them nor really allow them. I also used generated columns instead of a trigger, since the text to fold sits in the same row.

### Known gaps

- Filter state isn't in the URL, so a refresh resets it.
- The API and web keep separate copies of the types. A shared package, or types generated from the zod schema, would fix that.
- No unit tests on the web side.
