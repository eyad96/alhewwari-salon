import { supabase as defaultSupabase } from '@/lib/supabase'

export interface Review {
  id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  user?: { full_name: string; avatar_url: string }
}

// ==============================
// استعلام التقييمات
// ==============================

export const getReviews = async (supabase = defaultSupabase): Promise<Review[]> => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, user:profiles(full_name, avatar_url)')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Review[]
}

export const getUserReview = async (userId: string, supabase = defaultSupabase): Promise<Review | null> => {
  const { data } = await supabase
    .from('reviews')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data as Review | null
}

// ==============================
// إضافة / تعديل تقييم
// ==============================

export const upsertReview = async (
  userId: string,
  rating: number,
  comment: string,
  supabase = defaultSupabase
): Promise<Review> => {
  const { data, error } = await supabase
    .from('reviews')
    .upsert(
      { user_id: userId, rating, comment },
      { onConflict: 'user_id' },
    )
    .select('*, user:profiles(full_name, avatar_url)')
    .single()

  if (error) throw error
  return data as Review
}

export const deleteReview = async (reviewId: string, supabase = defaultSupabase): Promise<void> => {
  const { error } = await supabase.from('reviews').delete().eq('id', reviewId)
  if (error) throw error
}

