# Student accounts and saved progress

Students can create an account with just a **username and password**. While signed in, their progress
(lessons studied, quiz rounds and scores, and the review pile) is saved to a database, so it follows them to any computer.

The site is static (GitHub Pages), so the database is a hosted [Supabase](https://supabase.com) project.
Until it is connected, the site works exactly as before and saves progress in the browser only.

## What is stored

| Table      | What                                                                 |
|------------|----------------------------------------------------------------------|
| `profiles` | username, sign-up date                                               |
| `progress` | one JSON document per student: review boxes, lessons studied, quizzes |

No real names or email addresses are collected. Supabase Auth requires an email field, so the app turns a
username like `quizkid` into `quizkid@students.quizbowl.local` behind the scenes. No email is ever sent, and students never see it.
Row-level security means each student can only read and change their own rows. Students can delete their
account (and all of its data) from the **My progress** page.

## One-time setup (about 10 minutes)

1. **Create a project.** Sign in at <https://supabase.com/dashboard> and click **New project** (the free plan is enough).
   Pick any name and a database password, and wait for it to finish.
2. **Create the tables.** Open **SQL Editor → New query**, paste all of [`supabase/schema.sql`](../supabase/schema.sql), and click **Run**.
3. **Turn off email confirmation.** Open **Authentication → Sign In / Providers → Email** and turn **Confirm email** off,
   then save. (Students have no real email to confirm.) Leave the Email provider itself enabled.
4. **Copy the keys.** Open **Project Settings → API** (or the **Connect** button) and copy the **Project URL** and the
   **anon / publishable key**. The anon key is designed to be public; do **not** use the `service_role` / secret key.
5. **Give them to the site.** In GitHub, open the repository's **Settings → Secrets and variables → Actions → Variables**
   and add two repository variables:
   - `SUPABASE_URL` = the Project URL
   - `SUPABASE_ANON_KEY` = the anon key
6. **Redeploy.** Re-run the latest **Deploy to GitHub Pages** workflow on `main` (Actions tab → the workflow → **Run workflow**),
   or merge any change. A **Sign in** link appears in the header when it worked.

### If sign-up says the email domain was rejected

Supabase may refuse made-up email domains. Set a third repository variable, `ACCOUNT_EMAIL_DOMAIN`, to a domain
you own (for example `students.yourdomain.com`; it needs no mail setup), and redeploy. Change it only before students
sign up, because existing accounts sign in with the domain they were created with.

## Running locally with accounts

Copy `.env.example` to `.env.local`, fill in the two values, and run `npm run dev`.

## Forgotten passwords

There is no email on the account, so students can't reset their own password. The site owner can set a new one
in the Supabase **SQL Editor**:

```sql
update auth.users set encrypted_password = extensions.crypt('new-password-here', extensions.gen_salt('bf'))
where email = 'username@students.quizbowl.local';
```

## Things to know

- Free Supabase projects pause after a week with no activity. Open the dashboard and click **Restore** if sign-in stops working
  after a long break.
- Progress made before signing in is added to the account at sign-in, and then cleared from that browser, so the next
  student on a shared computer starts fresh. Signing out leaves no progress on the computer for the next student to see.
