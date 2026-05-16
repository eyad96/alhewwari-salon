import { supabase } from '@/lib/supabase'
import type { LoyaltyPoints } from '@/types'

// ==============================
// استعلام النقاط
// ==============================

export const getUserLoyaltyPoints = async (userId: string): Promise<LoyaltyPoints | null> => {
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data as LoyaltyPoints | null
}

export const getLoyaltyTransactions = async (userId: string) => {
  const { data, error } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) throw error
  return data
}

export const getAllUsersLoyalty = async () => {
  const { data, error } = await supabase
    .from('loyalty_points')
    .select('*, user:profiles(full_name, email)')
    .order('total_earned', { ascending: false })

  if (error) throw error
  return data
}

// ==============================
// استبدال النقاط
// ==============================

export const redeemPoints = async (
  userId: string,
  pointsToRedeem: number,
  description: string = 'حلاقة مجانية',
): Promise<void> => {
  const { data: existing } = await supabase
    .from('loyalty_points')
    .select('points')
    .eq('user_id', userId)
    .single()

  if (!existing || existing.points < pointsToRedeem) {
    throw new Error('نقاط غير كافية')
  }

  // خصم النقاط
  const { error: updateError } = await supabase
    .from('loyalty_points')
    .update({
      points: existing.points - pointsToRedeem,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  if (updateError) throw updateError

  // تسجيل المعاملة
  await supabase.from('loyalty_transactions').insert({
    user_id: userId,
    points: -pointsToRedeem,
    type: 'redeemed',
    description,
  })
}

// ==============================
// إدارة النقاط (أدمن)
// ==============================

export const adminAddPoints = async (
  userId: string,
  points: number,
  description: string = 'هدية من الأدمن',
): Promise<void> => {
  const { data: existing } = await supabase
    .from('loyalty_points')
    .select('points, total_earned')
    .eq('user_id', userId)
    .single()

  if (existing) {
    await supabase
      .from('loyalty_points')
      .update({
        points: existing.points + points,
        total_earned: existing.total_earned + points,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
  } else {
    await supabase.from('loyalty_points').insert({
      user_id: userId,
      points,
      total_earned: points,
    })
  }

  await supabase.from('loyalty_transactions').insert({
    user_id: userId,
    points,
    type: 'earned',
    description,
  })
}
