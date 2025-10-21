# Password Reset Guide

Password reset functionality has been implemented for Klaro. Here's how it works:

## User Flow

### 1. Forgot Password
- User goes to `/login`
- Clicks "Forgot password?" link
- Enters their email address
- Receives email with reset link

### 2. Reset Password
- User clicks link in email
- Redirected to `/reset-password`
- Enters new password (twice for confirmation)
- Password updated successfully
- Automatically redirected to dashboard

## Routes

- `/login` - Login page (now has "Forgot password?" link)
- `/forgot-password` - Request password reset
- `/reset-password` - Set new password (accessed via email link)

## Email Configuration

Supabase handles sending the password reset emails automatically. The email will:
- Come from your Supabase project's email settings
- Contain a link to `/reset-password` on your domain
- Be valid for 1 hour by default

### Customizing Reset Emails (Optional)

1. Go to Supabase Dashboard → Authentication → Email Templates
2. Select "Reset Password"
3. Customize the email template
4. Available variables: `{{ .ConfirmationURL }}`, `{{ .Token }}`, etc.

## Security Features

✅ **Link expiration** - Reset links expire after 1 hour
✅ **One-time use** - Links can only be used once
✅ **Password validation** - Minimum 6 characters
✅ **Confirmation match** - Password must be entered twice
✅ **Session validation** - Checks for valid recovery session

## Testing Password Reset

1. Go to `/login`
2. Click "Forgot password?"
3. Enter your email
4. Check your email inbox (and spam folder)
5. Click the reset link
6. Enter new password
7. Confirm you can login with new password

## For Manual Account Creation

When you create accounts manually for approved waitlist users, you can:

**Option 1: Set initial password**
- Create user with a temporary password
- Send them login credentials
- They can use "Forgot password?" to set their own password

**Option 2: Use invite flow**
- In Supabase Dashboard → Authentication → Users
- Click "Invite User" instead of "Add User"
- User receives email to set their own password
- More secure (you never see their password)

## Troubleshooting

### User didn't receive reset email
- Check spam folder
- Verify email address is correct
- Check Supabase logs: Dashboard → Logs → Auth logs

### Reset link shows "Invalid or expired"
- Link may have expired (1 hour timeout)
- Link may have already been used
- Request a new reset link

### Password update fails
- Check password meets minimum requirements (6+ characters)
- Ensure passwords match in both fields
- Check browser console for detailed errors

## Email Provider Setup (Production)

For production, you'll want to use a custom email provider instead of Supabase's default:

1. Go to Supabase Dashboard → Project Settings → Auth
2. Scroll to "SMTP Settings"
3. Configure your email provider (SendGrid, AWS SES, etc.)
4. Set custom "From" email address
5. Test emails are working

Popular options:
- **SendGrid** - Free tier available
- **AWS SES** - Very cheap at scale
- **Resend** - Developer-friendly
- **Postmark** - High deliverability

---

## Summary

✅ Password reset is fully functional
✅ Users can self-service their password resets
✅ Secure implementation with expiring links
✅ Automatically sends emails via Supabase
✅ Works with manually created accounts

No additional configuration needed - it works out of the box!
