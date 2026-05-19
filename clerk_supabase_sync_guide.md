# Clerk & Supabase End-to-End Synchronization Guide

This guide describes how to complete the integration between Clerk and Supabase, ensuring that users are synced and authenticated safely.

---

## 1. Supabase Database Schema Adjustment (CRITICAL)

By default, standard Supabase schemas expect the user's `id` to be a `uuid` referencing `auth.users`. However, Clerk uses text-based IDs (like `user_2t...`).
To prevent foreign key constraint violations and type mismatches, you must run the following SQL script inside the **Supabase Dashboard → SQL Editor → New Query**:

```sql
-- 1. Drop existing foreign key constraint if it exists on profiles
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 2. Modify 'profiles.id' to accept text strings (Clerk user IDs)
ALTER TABLE public.profiles 
  ALTER COLUMN id TYPE text;

-- 3. Modify referenced columns in bookings, loyalty, reviews, etc.
ALTER TABLE IF EXISTS public.bookings 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE IF EXISTS public.loyalty_points 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE IF EXISTS public.loyalty_transactions 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE IF EXISTS public.reviews 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE IF EXISTS public.studio_likes 
  ALTER COLUMN user_id TYPE text;

-- Note: This detaches profiles from the internal auth.users table, allowing Clerk IDs to sync flawlessly.
```

---

## 2. Clerk Custom JWT Template Configuration

To allow Supabase to safely read authentication payloads and row level security (RLS) claims directly from Clerk:

1. Sign in to your [Clerk Dashboard](https://dashboard.clerk.com).
2. Go to **JWT Templates** in the left navigation sidebar.
3. Click **New Template** and select **Supabase**.
4. Set the template name to `supabase` (lowercase).
5. Customize the template content if needed. The default claims are perfect:
   ```json
   {
     "aud": "authenticated",
     "role": "authenticated",
     "sub": "{{user.id}}"
   }
   ```
6. Click **Save**.

This template enables `useAuth.tsx` to fetch a signed token (`getToken({ template: 'supabase' })`) that Supabase's RLS engine understands. Supabase's `auth.uid()` will now return the Clerk user's string ID!

---

## 3. Real-Time Clerk Webhook Sync (Automated Database Insertion)

While our frontend has a dynamic sync fallback in `useAuth.tsx` when a user signs in, setting up a Clerk Webhook ensures that users are immediately inserted and synchronized in the database the exact second their account is created in Clerk (even if they register via a direct API, social login, or mobile app).

### A. Add Webhook in Clerk
1. In your **Clerk Dashboard**, go to **Webhooks** in the sidebar.
2. Click **Add Endpoint**.
3. Set the Endpoint URL to your backend sync route, for example: `https://your-production-app.vercel.app/api/webhooks/clerk`
4. Under **Message Filtering**, subscribe to:
   - `user.created`
   - `user.updated`
5. Click **Create** and copy the **Signing Secret** (it starts with `whsec_...`). Add this secret to your backend env variables as `CLERK_WEBHOOK_SECRET`.

### B. Node.js / Express Webhook Handler Code
Below is the robust backend webhook handler. It validates the cryptographic signature using `@clerk/backend` and inserts/updates the profile in Supabase:

```javascript
import { Webhook } from 'svix';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (using Service Role Key to bypass RLS for syncing)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role key on the secure backend only!
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'Missing Clerk Webhook Secret' });
  }

  // Get headers for signature verification
  const svix_id = req.headers['svix-id'];
  const svix_timestamp = req.headers['svix-timestamp'];
  const svix_signature = req.headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Read request body as text/raw
  const payload = JSON.stringify(req.body);
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt;
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Invalid webhook signature' });
  }

  const { id, first_name, last_name, email_addresses, image_url, public_metadata } = evt.data;
  const eventType = evt.type;

  console.log(`Received Clerk Webhook [${eventType}] for User: ${id}`);

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const email = email_addresses?.[0]?.email_address || '';
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || email.split('@')[0] || 'مستخدم';
    const role = public_metadata?.role || 'customer';

    try {
      // 1. Sync User Profile
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id,
          full_name: fullName,
          email,
          role,
          avatar_url: image_url || '',
        });

      if (profileError) throw profileError;

      // 2. Initialize Loyalty Points (only on creation)
      if (eventType === 'user.created') {
        await supabaseAdmin.from('loyalty_points').insert({
          user_id: id,
          points: 0,
          total_earned: 0,
        }).onConflict('user_id').ignore();
      }

      return res.status(200).json({ success: true, message: 'User synced successfully' });
    } catch (dbError) {
      console.error('Supabase Sync Database Error:', dbError.message);
      return res.status(500).json({ error: 'Database sync error' });
    }
  }

  return res.status(200).json({ received: true });
}
```

---

## 4. Verification Check

To verify the integration:
1. Register a new user in Clerk.
2. Sign in, open the browser DevTools console, and verify there are no Supabase insertion errors.
3. Check the `profiles` and `loyalty_points` tables in Supabase. You will see a new entry with the user's Clerk ID perfectly synced!
