import { supabase } from '@/lib/supabase'
import type { User, SignUpForm } from '@/types'

// تسجيل الدخول
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// إنشاء حساب
export const signUp = async (formData: SignUpForm) => {
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: {
        full_name: formData.full_name,
        phone: formData.phone || '',
      }
    }
  })
  if (error) throw error

  // إنشاء سجل في جدول profiles
  if (data.user) {
    await supabase.from('profiles').upsert({
      id: data.user.id,
      full_name: formData.full_name,
      phone: formData.phone || '',
      role: 'customer',
    })
    
    // إنشاء سجل نقاط الولاء
    await supabase.from('loyalty_points').insert({
      user_id: data.user.id,
      points: 0,
      total_earned: 0,
    })
  }

  return data
}

// تسجيل الدخول بـ Google
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    }
  })
  if (error) throw error
  return data
}

// تسجيل الدخول بـ Facebook
export const signInWithFacebook = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'facebook',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    }
  })
  if (error) throw error
  return data
}

// إعادة تعيين كلمة المرور
export const resetPassword = async (email: string) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
  return data
}

// تسجيل الخروج
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// الحصول على المستخدم الحالي
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile) {
    return {
      ...profile,
      phone: profile.phone_number || profile.phone
    } as User
  }
  return null
}

// الاستماع لتغييرات المصادقة
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
      if (profile) {
        callback({
          ...profile,
          phone: profile.phone_number || profile.phone
        } as User)
      } else {
        callback(null)
      }
    } else {
      callback(null)
    }
  })
}
