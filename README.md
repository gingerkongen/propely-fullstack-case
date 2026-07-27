# Propely Fullstack Engineer Case: Starter repo

A deliberately plain starting point for the technical case assignment. It gives you a
local API serving 1000 property maintenance tasks and a React page that
dumps all of them into a table. Nothing more.

This repo intentionally does **not** contain filtering, search, pagination or PDF
export, and it does not resolve property names. Building that is the assignment (full
requirements at the bottom).

## Getting started

Requires **Node 22 or newer**. Any way of installing it works, and nvm is not required.
If you do use nvm, `.nvmrc` pins the version for you:

```bash
nvm use            # optional, picks up Node 22 from .nvmrc
npm install
```

Then start the two apps in **two separate terminals**:

```bash
npm run dev:api    # terminal 1
npm run dev:web    # terminal 2
```


| App                | URL                                            | Notes                                          |
| ------------------ | ---------------------------------------------- | ---------------------------------------------- |
| API (Express)      | [http://localhost:8080](http://localhost:8080) | run with `tsx`, no build step in dev           |
| Web (Vite + React) | [http://localhost:3000](http://localhost:3000) | proxies nothing; calls the API by absolute URL |


On first start the API creates `apps/api/tasks.db` from `seed/tasks.json` and
`seed/properties.json`. The db file is gitignored and rebuilt from the seed, so you can
always get back to a clean dataset: delete the file and restart the API.

`npm run test` exists and exits 0. There are no tests yet.

## API contract

Current endpoints. You are free to change or replace them (see below).

### `GET /api/health`

```json
{ "status": "ok" }
```



### `GET /api/tasks`

Takes **no query parameters** and returns **all 1000 rows** as a JSON array in a
single response. No pagination and no filtering. This is deliberate.

Note that a task row carries `property_id`, not a property name. 

```json
[
  {
    "id": "task-0001",
    "title": "Skifte lyskilder til LED i garasje",
    "description": "Midlertidig løsning på plass. Permanent utbedring gjenstår.",
    "category": "Electrical",
    "status": "InProgress",
    "property_id": "prop-004",
    "created_at": "2025-12-25",
    "due_date": "2026-03-01",
    "cost_nok": 8100
  }
]
```

CORS is wide open (all origins), which covers the Vite dev server. There is no auth.

## Data model

Two tables in a single local SQLite file (`better-sqlite3`): `tasks` and `properties`.
`tasks.property_id` is a foreign key into `properties.id`, and the task row holds no property name of its own.

### `properties`


| Column | Type | Null | Notes                                                  |
| ------ | ---- | ---- | ------------------------------------------------------ |
| `id`   | TEXT | no   | primary key, e.g. `prop-011`                           |
| `name` | TEXT | no   | Norwegian free text, 40 rows, some 70 to 90 chars long |




### `tasks`


| Column        | Type    | Null    | Notes                                                  |
| ------------- | ------- | ------- | ------------------------------------------------------ |
| `id`          | TEXT    | no      | primary key                                            |
| `title`       | TEXT    | no      | Norwegian free text                                    |
| `description` | TEXT    | no      | Norwegian free text, mostly short, some 400–800 chars  |
| `category`    | TEXT    | no      | enum, CHECK constraint                                 |
| `status`      | TEXT    | no      | enum, CHECK constraint                                 |
| `property_id` | TEXT    | no      | foreign key into `properties.id`, unevenly distributed |
| `created_at`  | TEXT    | no      | ISO 8601 date, spread across 2022–2026                 |
| `due_date`    | TEXT    | **yes** | ISO 8601 date, null in ~19 % of rows                   |
| `cost_nok`    | INTEGER | **yes** | 300 – ~470 000, null in ~12 % of rows                  |




### Seed data

`seed/tasks.json` is the single source of truth for the dataset, and is never
regenerated at runtime. The data is deliberately messy: Norwegian characters, long
property names, long compound words, some very long descriptions, nulls, a wide cost
range and a skewed status distribution (roughly 55 % Completed, 22 % InProgress,
20 % New, 3 % Rejected). Expect it to stress your table layout and formatting.

Please treat `seed/tasks.json` and `seed/properties.json` as fixed input and leave them
as they are. The data is meant to be awkward, and working with it as-is is part of the
exercise.

## Your assignment

Extend the existing task table with new features/improvements. Use no more than 1 to 3 hours.

All five of the following are **required**:

1. **Show the property name, not the id.** The table currently prints the raw
  `property_id` (`prop-011`). It should show the property name (`Åkerveien 3`).
2. **Filtering.** The user must be able to narrow the table by at least `status`,
  `category` and property. Multiple filters must work together.
3. **Search.** A free-text search across some columns (at minimum `title`, and
  ideally `property`_id). It must work together with the filters.
4. **Pagination.** The table must be paginated rather than rendering all 1000 rows at
  once. Page size is up to you.
5. **A "Download as PDF" button** that exports the task table as a PDF. The export must
  reflect what the user is currently looking at, so the active filters and search apply  to it.



### How you build it is up to you

- add any dependencies you want
- change the API however you like, including adding, changing or replacing endpoints
- change or restructure the frontend however you like



### Out of scope

- Authentication
- Design beyond plain readability
- Deployment
- Tests beyond what proves your core logic works



### Practical notes

- Everything runs locally. No cloud service or signup is needed for anything.
- We want to see **several commits along the way**, not one large commit at the end.  
Commit as you go so we can follow your reasoning.
- Share your Github repo with "Lunke" (Kristoffer Lundquist) or send a link.
- Bring your computer with the case to the meeting, so we can discuss it and improve it together.

