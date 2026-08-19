# BMMU Attendance Archive

A simple, private web app for Bilal Muslim Mission Uganda to replace the paper
attendance file: staff photograph or scan the physical attendance sheet,
answer a few questions about the programme, and it's saved to a searchable
archive with an automatic backup copy in Google Drive.

**Only the administrator can create accounts** — there is no public sign-up.

---

## What you get

- Admin-controlled staff accounts, with optional centre restrictions
- Camera capture or file upload for the physical sheet
- A short form for programme details (name, centre, activity type, date,
  sheikh, attendee count, notes)
- Automatic backup of every image to your Google Drive, organised into
  `Centre / Year` folders
- A full activity log: who did what, from which device/browser, and when
- Dark and light themes with the BMMU crest and a quiet minaret motif
- Works well on phones (the "Scan" tab is one tap away)

## How it's hosted (important)

**Neon is a database only — it does not host the website itself.** This app
is built with Next.js, so the natural free pairing is:

- **Neon** → stores your data (Postgres)
- **Vercel** → runs the actual website, free tier, deploys straight from GitHub
- **Google Drive** → stores the actual scanned images

All three have generous free tiers and this app comfortably fits within them
for an organisation of BMMU's size.

---

## 1. Create your Neon database

1. Go to [neon.tech](https://neon.tech) and sign up (free).
2. Create a new project, e.g. "bmmu-attendance".
3. On the project dashboard, click **Connection Details** and copy the
   **pooled connection string** (it looks like
   `postgresql://user:password@ep-xxxx-pooler.region.aws.neon.tech/dbname?sslmode=require`).
4. Save it — you'll paste it into `DATABASE_URL` in step 4.

## 2. Google Drive setup

We use your own Google account so uploads count against your normal free
15 GB, not a separate quota.

1. Go to the [Google Cloud Console](https://console.cloud.google.com/), create
   a new project (any name, e.g. "BMMU Attendance").
2. **APIs & Services → Library** → search "Google Drive API" → Enable.
3. **APIs & Services → OAuth consent screen**:
   - User type: External (this is fine even for personal use)
   - Fill in the app name ("BMMU Attendance Archive") and your email
   - Add yourself as a **Test user** (this avoids Google's app-review process
     since only your own account will ever sign in)
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Desktop app**
   - Copy the generated **Client ID** and **Client secret**
5. In Google Drive, create a folder called e.g. "BMMU Attendance Archive".
   Open it and copy the ID from the URL:
   `https://drive.google.com/drive/folders/`**`THIS_PART_IS_THE_ID`**
6. On your own computer (not the server), with Node.js installed, run:
   ```bash
   npm install googleapis
   node scripts/get-google-refresh-token.mjs <CLIENT_ID> <CLIENT_SECRET>
   ```
   Open the link it prints, approve access with the Google account you want
   scans saved to, paste the code back into the terminal. It prints a
   `GOOGLE_REFRESH_TOKEN` value — save it for step 4.

## 3. Get the code onto GitHub

1. Create a new empty repository on GitHub (e.g. `bmmu-attendance`).
2. Upload this project's files into it (drag-and-drop on github.com works,
   or `git init && git add . && git commit -m "Initial commit" && git push`).

## 4. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com), sign up with GitHub (free).
2. **Add New → Project**, choose your `bmmu-attendance` repository.
3. Before clicking Deploy, open **Environment Variables** and add every
   value from `.env.example`:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | your Neon pooled connection string |
   | `AUTH_SECRET` | run `openssl rand -base64 32` locally, paste the result |
   | `GOOGLE_CLIENT_ID` | from step 2 |
   | `GOOGLE_CLIENT_SECRET` | from step 2 |
   | `GOOGLE_REFRESH_TOKEN` | from step 2 |
   | `GOOGLE_DRIVE_FOLDER_ID` | from step 2 |
   | `SEED_ADMIN_USERNAME` | your preferred admin username |
   | `SEED_ADMIN_PASSWORD` | a temporary strong password — change it after first login |
   | `SEED_ADMIN_NAME` | your name |

4. Click **Deploy**. Vercel builds and gives you a live URL
   (e.g. `bmmu-attendance.vercel.app`).

## 5. Create the database tables and your admin account

With the project cloned locally (or using Vercel's built-in terminal /
GitHub Codespaces), run once:

```bash
npm install
npx prisma db push      # creates the tables in Neon
npm run seed             # creates your first admin account
```

`npm run seed` prints the admin username/password it created — sign in at
your Vercel URL with it, then immediately go to **Staff Accounts** and create
your real, personal admin account (and deactivate the seed one if you like).

---

## Everyday use

- **You (admin)**: sign in → **Staff Accounts** → create an account per staff
  member, optionally restricted to their centre. Give them the username and
  temporary password directly (in person or by phone, not email/SMS, since
  it's a password).
- **Staff**: sign in on a phone or computer → **Scan** → camera or upload →
  fill in the programme details → **Save**. That's it — the image is archived
  and backed up automatically.
- **Everyone**: **Records** to browse and search past entries.
- **You (admin)**: **Activity Log** to see every action taken, by whom, from
  what device, and when — useful for the TMF/donor audit trail you already
  keep for sheikh attendance verification.

## Local development

```bash
npm install
cp .env.example .env    # fill in the values as above
npx prisma db push
npm run seed
npm run dev              # http://localhost:3000
```

## Notes on the free tiers

- **Neon free tier**: generous storage for this kind of record-keeping data
  (the images themselves live in Drive, not the database, so the database
  stays small).
- **Vercel free tier**: fine for an internal tool used by office staff.
- **Google Drive**: uses your normal free 15 GB, shared with anything else in
  your account — keep an eye on it if you're already close to the limit.

If BMMU ever outgrows the free tiers, each of the three services has a
paid tier you can upgrade to without changing the app itself.
