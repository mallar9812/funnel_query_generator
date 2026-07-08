# Funnel Query Generator

A web app that generates Trino SQL for experiment funnel analysis.

## Features

- **Global parameters** — GID, CLI, experiment name/version, date range, build threshold
- **Tracking events** — define conditions for each funnel step; supports field matches, `Split()` expressions, and custom SQL
- **Auto-derived SQL** — DAU base, tracking raw, derived tables, DAU joins, and `UNION ALL` funnel query generated automatically
- **Editable output** — SQL panel is directly editable; regenerate at any time from the form
- **Persistent state** — all inputs saved to `localStorage` so your work survives page reloads

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy to Vercel

### Option A — Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option B — GitHub import

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your repo
3. Leave all settings as default and click **Deploy**

No environment variables are needed.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── FunnelGenerator.tsx # Main UI component
│   └── ConditionRow.tsx    # WHERE condition builder row
├── lib/
│   ├── types.ts            # TypeScript types
│   ├── constants.ts        # Select options
│   ├── sql.ts              # SQL generation
│   └── utils.ts            # Helpers
└── hooks/
    └── useLocalStorage.ts  # Persistent state hook
```

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript 5**
- **Tailwind CSS 3**
