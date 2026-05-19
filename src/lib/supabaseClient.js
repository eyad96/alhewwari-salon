import { createClient } from '@supabase/supabase-js'

// Normalize URL: strip trailing /rest/v1/ or /rest/v1 if mistakenly added
const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.warn('⚠️ Supabase URL is not defined in .env')
}

if (!supabaseKey) {
  console.warn('⚠️ Supabase Anon Key is not defined in .env')
}

// Create default Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
  {
    auth: {
      persistSession: false, // Clerk handles auth
    },
    global: {
      headers: {
        'x-application-name': 'salon-alhewwari-js',
      },
    },
  }
)

/**
 * Creates an authenticated Supabase client using the Clerk JWT token.
 * This is used for operations protected by Row Level Security (RLS).
 * @param {string} clerkToken - The JWT token fetched from Clerk using getToken({ template: 'supabase' })
 */
export const createClerkSupabaseClient = (clerkToken) => {
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  })
}

// Export diagnostic info
export const supabaseInfo = {
  url: supabaseUrl,
  projectId: supabaseUrl?.match(/https:\/\/([^.]+)\./)?.[1] || 'unknown',
}
