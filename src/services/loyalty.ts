import { supabase as defaultSupabase } from '@/lib/supabase'

export interface LoyaltyPoint {
  user_id: string
  points: number
  total_earned: number
  updated_at: string
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  points: number
  type: 'earned' | 'redeemed'
  description: string
  created_at: string
}

export const getUserLoyalty = async (userId: string, supabase = defaultSupabase): Promise<LoyaltyPoint | null> => {
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (error && error.code !== 'PGRST116') throw error
  return data as LoyaltyPoint | null
}

export const getUserTransactions = async (userId: string, supabase = defaultSupabase): Promise<LoyaltyTransaction[]> => {
  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as LoyaltyTransaction[]
}

export const redeemPoints = async (userId: string, pointsToRedeem: number, supabase = defaultSupabase): Promise<void> => {
  // 1. Get current points
  const { data: existing } = await supabase
    .from('loyalty_points')
    .select('points')
    .eq('user_id', userId)
    .single()
  
  if (!existing || existing.points < pointsToRedeem) {
    throw new Error('نقاط غير كافية')
  }

  // 2. Update points in legacy table
  const { error: updateError } = await supabase
    .from('loyalty_points')
    .update({
      points: existing.points - pointsToRedeem,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
  
  if (updateError) throw updateError

  // 3. Sync profiles table & 4. Log transaction in parallel
  await Promise.all([
    supabase
      .from('profiles')
      .update({
        loyalty_points: existing.points - pointsToRedeem
      })
      .eq('id', userId),
    supabase.from('loyalty_transactions').insert({
      user_id: userId,
      points: pointsToRedeem,
      type: 'redeemed',
      description: 'استبدال نقاط بحلاقة مجانية',
    })
  ])
}

export const adminAddPoints = async (userId: string, points: number, description: string, supabase = defaultSupabase): Promise<void> => {
  // 1. Get current points
  const { data: existing } = await supabase
    .from('loyalty_points')
    .select('points, total_earned')
    .eq('user_id', userId)
    .single()
  
  const newPoints = (existing?.points ?? 0) + points

  if (existing) {
    await supabase
      .from('loyalty_points')
      .update({
        points: newPoints,
        total_earned: existing.total_earned + points,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } else {
    await supabase.from('loyalty_points').insert({
      user_id: userId,
      points: points,
      total_earned: points,
    })
  }

  // Sync profiles table & 2. Log transaction in parallel
  await Promise.all([
    supabase
      .from('profiles')
      .update({
        loyalty_points: newPoints
      })
      .eq('id', userId),
    supabase.from('loyalty_transactions').insert({
      user_id: userId,
      points: points,
      type: 'earned',
      description: description || 'إضافة يدوية من المسؤول',
    })
  ])
}
