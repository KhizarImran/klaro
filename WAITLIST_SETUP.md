# Waitlist Setup Guide

This guide explains how to set up and manage the waitlist feature for Klaro.

## 1. Database Setup

### Run the Migration in Supabase

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Open the file `supabase-migration-waitlist.sql` from the project root
4. Copy and paste the entire SQL script into the editor
5. Click **Run** to execute the migration

This will create:
- A `waitlist` table with fields: email, name, trading_experience, status, created_at, notes
- Indexes for performance
- Row Level Security policies (anyone can insert, only admins can view)

## 2. Viewing Waitlist Submissions

### Option A: Supabase Dashboard (Recommended for now)

1. Go to your Supabase project
2. Navigate to **Table Editor**
3. Select the `waitlist` table
4. You'll see all submissions with:
   - Email address
   - Name (optional)
   - Trading experience description (optional)
   - Status (pending/approved/rejected)
   - Timestamp
   - Notes field (for your internal notes)

### Option B: SQL Query

Run this query in the SQL Editor:
```sql
SELECT
  id,
  email,
  name,
  trading_experience,
  status,
  created_at
FROM waitlist
ORDER BY created_at DESC;
```

## 3. Creating User Accounts Manually

When you want to approve someone from the waitlist:

### Step 1: Create the account in Supabase Auth

1. Go to **Authentication** > **Users** in Supabase dashboard
2. Click **Add User**
3. Enter the applicant's email
4. Generate a secure password
5. Click **Create User**

### Step 2: Send credentials to the user

Email the user with:
- Their login credentials
- A welcome message
- Link to the login page: `https://your-domain.com/login`

Example email template:
```
Subject: Welcome to Klaro - Your Account is Ready!

Hi [Name],

Great news! Your application for Klaro has been approved. Here are your login credentials:

Email: [their-email]
Password: [generated-password]

Login here: https://your-app-url.com/login

We recommend changing your password after your first login.

Welcome to Klaro!

Best,
The Klaro Team
```

### Step 3: Update waitlist status

In the `waitlist` table, update the status:
```sql
UPDATE waitlist
SET status = 'approved',
    notes = 'Account created on [date]'
WHERE email = 'user@example.com';
```

## 4. Batch Processing Waitlist

### SQL to get all pending applications:
```sql
SELECT * FROM waitlist
WHERE status = 'pending'
ORDER BY created_at ASC
LIMIT 10;
```

### Mark as approved:
```sql
UPDATE waitlist
SET status = 'approved'
WHERE email = 'user@example.com';
```

### Mark as rejected (if needed):
```sql
UPDATE waitlist
SET status = 'rejected',
    notes = 'Reason for rejection'
WHERE email = 'user@example.com';
```

## 5. Email Notifications (Optional Future Enhancement)

Currently, users don't receive automatic emails. You can:

1. **Manual approach**: Email users directly when approved
2. **Automated approach** (future): Set up Supabase Edge Functions or integrate with services like:
   - SendGrid
   - Resend
   - AWS SES
   - Postmark

## 6. Analytics

### Count waitlist submissions:
```sql
SELECT COUNT(*) as total_signups FROM waitlist;
```

### Breakdown by status:
```sql
SELECT
  status,
  COUNT(*) as count
FROM waitlist
GROUP BY status;
```

### Recent signups (last 7 days):
```sql
SELECT COUNT(*) as signups_last_week
FROM waitlist
WHERE created_at > NOW() - INTERVAL '7 days';
```

### Most common trading experiences:
```sql
SELECT
  trading_experience,
  COUNT(*) as count
FROM waitlist
WHERE trading_experience IS NOT NULL
GROUP BY trading_experience
ORDER BY count DESC
LIMIT 10;
```

## 7. Security Notes

- The current RLS policy allows **anyone** to insert to waitlist (so people can sign up)
- The RLS policy prevents **unauthenticated users** from viewing the waitlist
- You can view the waitlist via the Supabase dashboard (you're logged in as admin)
- In the future, you may want to create an admin role with proper RLS policies

## 8. Testing the Waitlist

1. Go to `/waitlist` on your app
2. Fill out the form with test data
3. Submit
4. Check the Supabase dashboard to confirm the entry appears
5. Try submitting with the same email again (should show "already on waitlist" error)

## Troubleshooting

### "Insert failed" error
- Check that the migration was run successfully
- Verify RLS policies are configured correctly
- Check browser console for detailed error messages

### Duplicate email error not showing
- This is handled in the component with error code `23505`
- Make sure the unique constraint exists on the email column

### Can't see waitlist entries
- Log into Supabase dashboard
- Go directly to Table Editor
- Select `waitlist` table
- Entries should be visible there even if RLS blocks API access

---

## Future Enhancements

Ideas for scaling the waitlist:
1. Admin dashboard to approve/reject from the app itself
2. Automated email notifications on approval
3. Waitlist position indicator ("You're #47 on the waitlist")
4. Referral system (get priority access by referring friends)
5. Bulk user creation script
6. Integration with email marketing tools
