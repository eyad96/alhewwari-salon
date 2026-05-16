import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || supabaseUrl.includes('your-project')) {
  console.warn('⚠️ Supabase URL غير محدد في .env')
}

if (!supabaseKey || supabaseKey.includes('your-supabase')) {
  console.warn('⚠️ Supabase Anon Key غير محدد في .env')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'x-application-name': 'salon-alhewwari',
      },
    },
  },
)

// تصدير معلومات الاتصال للتشخيص
export const supabaseInfo = {
  url: supabaseUrl,
  projectId: supabaseUrl?.match(/https:\/\/([^.]+)\./)?.[1] || 'unknown',
}
