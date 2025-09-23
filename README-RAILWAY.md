# BE-Kwitansi – Railway Deployment Guide

This kit includes files and settings to deploy your Express + Sequelize (MySQL) app to Railway.

## What’s included
- `package.json` — adds `"start"` and `"dev"` scripts and Node engine
- `.env.example` — uses the `MYSQL*` variables that your code expects
- `Dockerfile` — optional, but recommended for consistent builds
- `railway.toml` — service definition and healthcheck

---

## 1) Fix environment variables (IMPORTANT)
Your code (`config/config.js` and `db/connection.js`) expects **MYSQLHOST / MYSQLUSER / MYSQLPASSWORD / MYSQLDATABASE / MYSQLPORT**.
The sample `.env` you had earlier used `USERNAME_SQL / PASSWORD_SQL` etc. — that **won’t work** on Railway without changes.

Use `.env.example` in this kit as the basis for your Railway variables.

On Railway, when you add the **MySQL** plugin to your project, Railway will automatically inject the following variables into your service:
- MYSQLHOST
- MYSQLPORT
- MYSQLUSER
- MYSQLPASSWORD
- MYSQLDATABASE

Also set:
- `KEY_JWT` — your JWT secret (required by your auth code)
- (Optional) `USER_MAILER` and `PASS_MAILER` for email features

## 2) File uploads (persistence)
Your app writes files to `/uploads`. Railway’s default filesystem is ephemeral.
If you need files to persist across deploys/restarts, add a **Volume** on Railway and mount it to `/app/uploads`.
Then make sure the folder exists at runtime.

## 3) Deployment options

### Option A: Without Docker (simpler)
1. Push your repo to GitHub.
2. On Railway: New Project → Deploy from GitHub → select your repo.
3. Set `KEY_JWT` (and mailer vars if needed).
4. Add the **MySQL** plugin to the project (Railway will inject the MYSQL* env vars).
5. Ensure the service detects Node and uses `npm start`. If needed, add `railway.toml` in the repo root.
6. Deploy.

### Option B: With Dockerfile (more controlled)
1. Keep the provided `Dockerfile` in your repo root.
2. On Railway: New Project → Deploy from GitHub.
3. Railway will build using the Dockerfile and run `node index.js`.
4. Same env setup as above (MySQL plugin + KEY_JWT).

## 4) Sequelize initialization
If you need to initialize the schema:
- Temporarily uncomment `db.sequelize.sync({ alter: true })` inside `index.js`, deploy once to create/update tables, then comment it again.
  **or**
- Use migrations if you have them (not included here).

## 5) Healthcheck
Railway checks `GET /`. Your `index.js` already serves a simple text response there.
The `railway.toml` sets `healthcheckPath="/"` for clarity.

## 6) Ports and binding
Your code already uses `process.env.PORT || 3000` and binds to `0.0.0.0`, which is correct for Railway.

---

## Quick checklist
- [ ] Commit this kit’s files to your repo root
- [ ] Add MySQL plugin on Railway (envs auto-injected)
- [ ] Set KEY_JWT (and mailer vars)
- [ ] (Optional) Add a Volume → mount to `/app/uploads`
- [ ] Deploy

If you want me to produce a PR-style patch against your current repo, tell me your preferred branch name and I’ll generate a patch file.
