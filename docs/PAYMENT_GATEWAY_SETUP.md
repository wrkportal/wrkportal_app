# Payment Gateway Integration Setup Guide

This guide explains how to set up payment gateway integration (Stripe) for invoice payments in the Sales module.

## Overview

The system supports payment gateway integration for online invoice payments. Currently, Stripe is implemented as a foundation, but requires configuration to be fully functional.

## Current Implementation Status

✅ **Completed:**
- API endpoints for Stripe payment session creation
- Webhook handler for payment processing
- Integration points in the invoices UI
- Payment gateway architecture

⏳ **Requires Configuration:**
- Stripe SDK installation
- API key configuration
- Webhook endpoint setup

## Setup Instructions

### 1. Install Stripe SDK

```bash
npm install stripe
```

### 2. Get Stripe API Keys

1. Sign up for a Stripe account at https://stripe.com
2. Go to Developers → API keys in Stripe Dashboard
3. Copy your **Publishable key** and **Secret key**

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # Your Stripe secret key
STRIPE_PUBLISHABLE_KEY=pk_test_...  # Your Stripe publishable key (for frontend)
STRIPE_WEBHOOK_SECRET=whsec_...  # Webhook signing secret (from Stripe Dashboard)
```

**Important:** 
- Use test keys (`sk_test_...` and `pk_test_...`) for development
- Use live keys (`sk_live_...` and `pk_live_...`) for production
- Never commit API keys to version control

### 4. Enable Stripe Code

Edit the following files and uncomment the Stripe code:

#### `/app/api/sales/payments/stripe/create-session/route.ts`

Uncomment the Stripe initialization and checkout session creation code.

#### `/app/api/sales/payments/stripe/webhook/route.ts`

Uncomment the webhook verification and event handling code.

### 5. Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Set endpoint URL: `https://yourdomain.com/api/sales/payments/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
5. Copy the "Signing secret" and add to `.env` as `STRIPE_WEBHOOK_SECRET`

### 6. Restart Server

After configuration, restart your development/production server:

```bash
npm run dev  # For development
# or
npm run build && npm start  # For production
```

## Usage

### For Users

1. Go to Sales → Invoices
2. Click on an invoice to view details
3. Click "Pay Online" button
4. You'll be redirected to Stripe Checkout
5. Complete payment with credit card
6. You'll be redirected back to invoices page
7. Payment is automatically recorded

### For Developers

#### Creating Payment Session

```typescript
const response = await fetch('/api/sales/payments/stripe/create-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    invoiceId: 'invoice-id',
    amount: 100.00,
    currency: 'USD',
  }),
})

const { sessionId, url } = await response.json()
// Redirect user to url
```

#### Handling Webhooks

The webhook endpoint automatically:
- Verifies the webhook signature
- Records payments in the database
- Updates invoice status (Paid/Partially Paid)

## Payment Methods Supported

Currently implemented:
- ✅ Credit Card (via Stripe)

Planned for future:
- PayPal
- ACH Direct Debit
- Bank Transfer

## Security Considerations

1. **Never expose secret keys** in client-side code
2. **Always verify webhook signatures** to ensure requests are from Stripe
3. **Use HTTPS** in production for webhook endpoints
4. **Store API keys securely** using environment variables
5. **Test with test keys** before going live

## Testing

### Test Cards (Stripe Test Mode)

Use these test card numbers in Stripe test mode:

- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Requires Authentication:** 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Troubleshooting

### Payment Session Creation Fails

- Check that `STRIPE_SECRET_KEY` is set in `.env`
- Verify the key is correct (starts with `sk_test_` or `sk_live_`)
- Ensure Stripe SDK is installed: `npm install stripe`
- Check server logs for detailed error messages

### Webhook Not Receiving Events

- Verify webhook URL is correct in Stripe Dashboard
- Check that `STRIPE_WEBHOOK_SECRET` matches the signing secret
- Ensure endpoint is accessible (not behind firewall)
- Check server logs for webhook delivery attempts

### Payments Not Being Recorded

- Verify webhook is properly configured
- Check webhook event types are selected correctly
- Ensure database connection is working
- Review server logs for errors

## Future Enhancements

- [ ] PayPal integration
- [ ] Multiple payment methods selection
- [ ] Recurring payment support
- [ ] Payment plans/installments
- [ ] Refund processing
- [ ] Payment history with gateway transaction IDs
- [ ] Email notifications on payment completion

## Support

For issues related to:
- **Stripe API:** Contact Stripe Support or check Stripe Documentation
- **Integration:** Check server logs and verify configuration
- **Feature Requests:** Submit to the development team

