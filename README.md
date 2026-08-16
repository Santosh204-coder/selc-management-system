# SELC Management System

Student management app for Santosh Education & Learning Centre — students,
fees, attendance, exams, staff, printable documents, and backups.

Data is stored in the browser (localStorage), so it stays on whichever
device/browser you use it from.

## Deploy in 5 minutes (Vercel — free)

1. **Create a GitHub repo**
   - Go to https://github.com/new
   - Name it e.g. `selc-management-system`, make it private or public, create it.
   - Click "uploading an existing file" and drag in every file/folder from
     this project (keep the `src` folder structure intact). Commit.

2. **Deploy on Vercel**
   - Go to https://vercel.com and sign up/log in with your GitHub account.
   - Click "Add New Project", select the `selc-management-system` repo.
   - Vercel auto-detects it's a Vite project — leave the defaults.
   - Click **Deploy**. In about a minute you'll get a live link like
     `https://selc-management-system.vercel.app`.
   - That's it — share that link with anyone who needs to open the app.

3. **Optional: custom domain**
   - In the Vercel project → Settings → Domains → add your own domain
     (e.g. `selc.edu.np`) if you have one, and follow the DNS instructions
     shown there.

## Alternative: Netlify Drop (no account, instant test link)

1. On your own computer (with Node.js installed), open a terminal in this
   folder and run:
   ```
   npm install
   npm run build
   ```
   This creates a `dist` folder.
2. Go to https://app.netlify.com/drop and drag the `dist` folder onto the
   page. You'll instantly get a live URL.

## Running it locally first (optional)

```
npm install
npm run dev
```
Then open the URL it prints (usually http://localhost:5173).

## Important note on data

Because this uses browser localStorage, each device/browser has its own
separate copy of the data — nothing syncs automatically between, say, a
laptop in the office and a phone at the front desk. If you need everyone
to share one live, always-up-to-date database, that requires adding a real
backend (e.g. Supabase or Firebase) — happy to help set that up if you want it.
