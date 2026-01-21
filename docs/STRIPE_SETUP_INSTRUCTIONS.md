# Stripe Subscription Setup Instructions

## ✅ Implementation Complete!

All Stripe subscription code has been implemented. Follow these steps to activate it:

## Step 1: Run Database Migration

The Prisma schema has been updated with subscription fields. Run:

```bash
npx prisma migrate dev --name add_subscription_fields
npx prisma generate
```

This will add the following fields to the User model:
- `stripeCustomerId` - Stripe customer ID
- `stripeSubscriptionId` - Stripe subscription ID
- `subscriptionStatus` - Subscription status (active, canceled, past_due, etc.)
- `subscriptionTier` - User's subscription tier (free, starter, professional, business, enterprise)
- `subscriptionStartDate` - When subscription started
- `subscriptionEndDate` - When subscription ends/renews

## Step 2: Get Stripe API Keys

1. **Sign up for Stripe:**
   - Go to [stripe.com](https://stripe.com)
   - Create a free account
   - Start with **Test Mode** (toggle in top right)

2. **Get API Keys:**
   - Dashboard → Developers → API keys
   - Copy:
     - **Publishable key** (starts with `pk_test_...`)
     - **Secret key** (starts with `sk_test_...`)

3. **Create Webhook Endpoint:**
   - Dashboard → Developers → Webhooks
   - Click "Add endpoint"
   - Endpoint URL: `https://your-app.vercel.app/api/subscriptions/webhook`
   - Select events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Click "Add endpoint"
   - Copy the **Signing secret** (starts with `whsec_...`)

## Step 3: Add Environment Variables

Add to Vercel Environment Variables:

```
STRIPE_SECRET_KEY=sk_test_... (your secret key)
STRIPE_PUBLISHABLE_KEY=pk_test_... (your publishable key)
STRIPE_WEBHOOK_SECRET=whsec_... (your webhook signing secret)
```

**Important:** 
- Use `sk_test_...` and `pk_test_...` for testing
- Use `sk_live_...` and `pk_live_...` for production
- Never commit these keys to Git

## Step 4: Update Webhook URL in Stripe

After deploying to Vercel:
1. Go to Stripe Dashboard → Webhooks
2. Edit your webhook endpoint
3. Update URL to: `https://your-actual-vercel-url.vercel.app/api/subscriptions/webhook`
4. Save

## Step 5: Test the Flow

1. **Test Card Numbers (Stripe Test Mode):**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date (e.g., 12/25)
   - Any CVC (e.g., 123)
   - Any ZIP code (e.g., 12345)

2. **Test Scenarios:**
   - Go to `/settings/subscription`
   - Click "Subscribe" on any plan
   - Complete checkout with test card
   - Verify subscription status updates
   - Test cancel subscription flow

## Step 6: Switch to Live Mode (Production)

**Only after thorough testing:**

1. **Get Live Keys:**
   - Toggle to "Live mode" in Stripe Dashboard
   - Copy live API keys

2. **Update Environment Variables:**
   - Update `STRIPE_SECRET_KEY` with `sk_live_...`
   - Update `STRIPE_PUBLISHABLE_KEY` with `pk_live_...`
   - Update webhook URL to production URL
   - Get new webhook signing secret for live mode

3. **Test Again:**
   - Test with real card (use small amount first)
   - Verify webhooks are received
   - Monitor Stripe Dashboard for events

## Files Created

1. **`app/api/subscriptions/create/route.ts`** - Creates Stripe checkout session
2. **`app/api/subscriptions/webhook/route.ts`** - Handles Stripe webhook events
3. **`app/api/subscriptions/status/route.ts`** - Gets user subscription status
4. **`app/api/subscriptions/cancel/route.ts`** - Cancels subscription
5. **`app/settings/subscription/page.tsx`** - Subscription management UI

## How It Works

1. **User clicks "Subscribe":**
   - Frontend calls `/api/subscriptions/create`
   - Creates Stripe checkout session
   - Redirects to Stripe checkout page

2. **User completes payment:**
   - Stripe processes payment
   - Redirects back to app with success/cancel

3. **Webhook receives event:**
   - Stripe sends webhook to `/api/subscriptions/webhook`
   - Updates user subscription in database
   - User tier is updated automatically

4. **User sees updated subscription:**
   - `/settings/subscription` page shows current plan
   - Features are unlocked based on tier

## Troubleshooting

### Webhook not receiving events:
- Check webhook URL is correct in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check Vercel function logs for errors
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/subscriptions/webhook`

### Subscription not updating:
- Check webhook events in Stripe Dashboard
- Verify database migration ran successfully
- Check user has `stripeCustomerId` set
- Review server logs for errors

### Payment fails:
- Verify Stripe keys are correct
- Check card is valid (use test cards in test mode)
- Review Stripe Dashboard → Payments for details

## Next Steps

After setup:
1. Link subscription page from landing page pricing section
2. Add tier checks to feature gates
3. Set up email notifications for subscription events
4. Add billing history page
5. Add payment method management

## Support

- Stripe Documentation: https://stripe.com/docs
- Stripe Dashboard: https://dashboard.stripe.com
- Test Mode Guide: https://stripe.com/docs/testing
