# Polar to Stripe Migration Guide

This guide will help you complete the migration from Polar to Stripe for Klaro's payment system.

## What's Been Done ✅

1. **Database Migration**: Updated `subscriptions` table columns from `polar_*` to `stripe_*`
2. **Frontend Code**: Updated all subscription utilities and components
3. **Edge Functions**: Created two new Stripe Edge Functions
4. **Documentation**: Updated CLAUDE.md and .env.example

## What You Need to Do

### 1. Set Up Stripe Account

1. Go to [stripe.com](https://stripe.com) and create an account
2. Complete your business verification (required for financial services companies)
3. Navigate to **Developers** → **API Keys**
4. Copy your **Publishable key** and **Secret key** (use test keys for development)

### 2. Create a Stripe Product & Price

1. In Stripe Dashboard, go to **Products** → **Add product**
2. Create a product named "Klaro Pro"
3. Set the price to **$4.99/month** (or your preferred amount)
4. Set billing to **Recurring** with **Monthly** interval
5. Copy the **Price ID** (starts with `price_`)

### 3. Configure Stripe Customer Portal

1. In Stripe Dashboard, go to **Settings** → **Customer Portal**
2. Enable the customer portal
3. Configure what customers can do:
   - ✅ Cancel subscription
   - ✅ Update payment method
   - ✅ View invoices
4. Save settings and copy the portal URL

### 4. Update Environment Variables

#### Frontend (.env)
```bash
# Stripe Configuration (Frontend - Public)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY
VITE_STRIPE_PRICE_ID=price_YOUR_PRICE_ID
VITE_STRIPE_PORTAL_URL=https://billing.stripe.com/p/login/test_YOUR_PORTAL_LINK
```

#### Supabase Edge Function Secrets
Set these in Supabase Dashboard → Edge Functions → Secrets:

```bash
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

To set secrets:
```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 5. Configure Stripe Webhooks

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set the endpoint URL to:
   ```
   https://YOUR_PROJECT_ID.supabase.co/functions/v1/stripe-webhook
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
   - ✅ `invoice.payment_succeeded`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add this secret to Supabase Edge Function secrets as `STRIPE_WEBHOOK_SECRET`

### 6. Test the Integration

#### Test Checkout Flow
1. Start your development server: `npm run dev`
2. Login to your app
3. Go to the Pricing page
4. Click "Upgrade to Pro"
5. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any ZIP code
6. Complete checkout
7. Verify subscription is active in your dashboard

#### Test Webhook
1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click on your webhook endpoint
3. Click **Send test webhook**
4. Select `checkout.session.completed`
5. Check Supabase Edge Function logs to verify it was received

### 7. Update RLS Policies (if needed)

The existing RLS policies should work with the renamed columns, but verify by running:

```sql
-- Check if policies reference old column names
SELECT * FROM pg_policies WHERE tablename = 'subscriptions';
```

If any policies reference `polar_subscription_id` or `polar_customer_id`, update them to use `stripe_subscription_id` and `stripe_customer_id`.

### 8. Switch to Production

When ready to go live:

1. **Get Stripe Production Keys**:
   - In Stripe Dashboard, toggle from Test to Live mode
   - Copy new production keys (start with `pk_live_` and `sk_live_`)

2. **Update Environment Variables**:
   ```bash
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
   STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_KEY
   ```

3. **Create Production Webhook**:
   - Add a new webhook endpoint in Live mode
   - Use the same events as test mode
   - Update `STRIPE_WEBHOOK_SECRET` with the new signing secret

4. **Test thoroughly** in live mode before announcing

## Migration Checklist

- [ ] Created Stripe account
- [ ] Verified business (if required for your region)
- [ ] Created Klaro Pro product and price
- [ ] Configured Stripe Customer Portal
- [ ] Updated frontend .env file
- [ ] Set Supabase Edge Function secrets
- [ ] Configured Stripe webhook
- [ ] Tested checkout flow with test card
- [ ] Verified webhook receives events
- [ ] Checked RLS policies work correctly
- [ ] Tested subscription cancellation
- [ ] Tested payment failure scenario
- [ ] Ready to switch to production keys

## Troubleshooting

### Checkout fails with "Failed to create checkout session"
- Check Supabase Edge Function logs for errors
- Verify `STRIPE_SECRET_KEY` is set correctly
- Ensure `VITE_STRIPE_PRICE_ID` matches your Stripe price ID

### Webhook not receiving events
- Verify webhook URL is correct (check for typos)
- Ensure `STRIPE_WEBHOOK_SECRET` is set in Edge Function secrets
- Check Stripe Dashboard → Webhooks for delivery status and errors
- Review Supabase Edge Function logs for webhook processing errors

### Subscription not activating
- Check webhook events are being sent (Stripe Dashboard → Webhooks)
- Verify the webhook handler is updating the database correctly
- Check Supabase logs for errors

### Customer Portal not working
- Ensure `VITE_STRIPE_PORTAL_URL` is set correctly
- Verify Customer Portal is enabled in Stripe settings
- For production, you may need to create a proper billing portal link

## Cost Comparison

**Polar**: ~2.9% + 30¢ per transaction
**Stripe**: 2.9% + 30¢ per transaction (similar pricing)

For a $4.99/month subscription:
- Transaction fee: $0.44
- You receive: $4.55 per month per subscriber

## Support

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe API Reference**: https://stripe.com/docs/api
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

## Notes

- The old `polar-webhook` Edge Function is still deployed but no longer used
- You can delete it once you've confirmed Stripe is working correctly
- All database migrations have been applied automatically
- No manual data migration needed (no existing Polar subscriptions to migrate)
