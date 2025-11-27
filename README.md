# CoachTzy - Baseline Scaffold

This repository contains a minimal baseline scaffold for CoachTzy — a web tool to help MLBB coaches manage players, matches and simulate drafts.

What's included
- Supabase backend: PostgreSQL database with Row-Level Security (RLS)
- Authentication: Supabase Auth with email/password
- Static frontend: `public/*.html`, `public/styles.css`, `public/js/pages/*.js`
- Page-specific modules: Each page has its own JavaScript module for better organization

Quick start (Windows PowerShell)

1. Install dependencies

```powershell
npm install
```

2. Run migrations (creates `data/coachtzy.db`)

```powershell
npm run migrate
```

3. Start server

```powershell
npm start
```

Open http://localhost:3000 in a browser.

Notes
- This is a baseline. Improve security, add validation, authentication, and richer UI as next steps.
# coachtzy
CoachTzy is a web app that helps MLBB coaches manage player data, track match results, and simulate drafts. It stores player profiles, scrim and tournament history, and draft records in a database, offering a structured tool for performance analysis and data-driven coaching decisions.
