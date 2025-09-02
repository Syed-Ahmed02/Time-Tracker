# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

```env
# Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here

# Clerk JWT Issuer Domain (from your Clerk dashboard)
CLERK_JWT_ISSUER_DOMAIN=https://your-clerk-domain.clerk.accounts.dev

# Convex Configuration
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment-url

# Optional: Clerk Webhook Secret (for webhooks if you implement them)
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## Clerk JWT Template Setup

You need to create a JWT template in your Clerk dashboard for Convex authentication:

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **JWT Templates**
3. Click **"New template"**
4. Select **"Convex"** from the template options
5. Configure the template with:
   - **Name**: `convex`
   - **Issuer**: Your Clerk application URL
   - **Audience**: `convex`
6. Copy the **Issuer URL** and use it as `CLERK_JWT_ISSUER_DOMAIN`

## Getting Your Environment Variables

### Clerk Keys:
1. Go to your Clerk Dashboard
2. Navigate to **API Keys**
3. Copy the **Publishable key** and **Secret key**

### Convex URL:
1. Run `npx convex deploy` in your project
2. Copy the deployment URL from the output
3. Use it as `NEXT_PUBLIC_CONVEX_URL`

## Verification

After setting up the environment variables:

1. Restart your development server
2. Try logging in with Clerk
3. The authentication error should be resolved
4. You should be able to use the time tracking features
