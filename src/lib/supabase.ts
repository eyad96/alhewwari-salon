import { createClient } from '@supabase/supabase-js'

// Normalize URL: strip trailing /rest/v1/ or /rest/v1 if mistakenly added
const rawUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl.includes('your-project') || supabaseUrl.includes('placeholder')) {
  console.warn('⚠️ Supabase URL غير محدد في .env')
}

if (!supabaseKey || supabaseKey.includes('your-supabase') || supabaseKey.includes('placeholder')) {
  console.warn('⚠️ Supabase Anon Key غير محدد في .env')
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
  {
    auth: {
      persistSession: false, // Clerk handles auth
    },
    global: {
      headers: {
        'x-application-name': 'salon-alhewwari',
      },
    },
  }
)

/**
 * وظيفة للحصول على نسخة من Supabase مع توكن Clerk
 * تستخدم للعمليات التي تتطلب RLS (مثل الإضافة أو التعديل)
 */
export const createClerkSupabaseClient = (clerkToken: string) => {
  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      global: {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      },
    }
  )
}

// تصدير معلومات الاتصال للتشخيص
export const supabaseInfo = {
  url: supabaseUrl,
  projectId: supabaseUrl?.match(/https:\/\/([^.]+)\./)?.[1] || 'unknown',
}
