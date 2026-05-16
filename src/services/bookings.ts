import { supabase } from '@/lib/supabase'
import type { Booking } from '@/types'
import { addMinutes, format, parse, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns'

// ==============================
// الأوقات المتاحة
// ==============================

const START_HOUR = 12 // 12:00 PM
const END_HOUR = 26   // 2:00 AM (next day)
const SLOT_DURATION = 30 // دقيقة

export const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  let hour = START_HOUR
  let minute = 0

  while (hour < END_HOUR || (hour === END_HOUR && minute === 0)) {
    const displayHour = hour % 24
    const timeStr = `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    slots.push(timeStr)
    minute += SLOT_DURATION
    if (minute >= 60) {
      minute = 0
      hour++
    }
  }
  return slots
}

export const getAvailableSlots = async (date: string): Promise<string[]> => {
  const allSlots = generateTimeSlots()

  const { data: existingBookings } = await supabase
    .from('bookings')
    .select('time, status')
    .eq('date', date)
    .in('status', ['pending', 'confirmed'])

  const bookedTimes = existingBookings?.map((b) => b.time.slice(0, 5)) || []

  // manual slots added by admin (extra available times)
  const { data: manual } = await supabase
    .from('available_slots')
    .select('time')
    .eq('date', date)

  const manualTimes = manual?.map((m: any) => m.time.slice(0, 5)) || []

  const union = Array.from(new Set([...allSlots, ...manualTimes]))

  return union.filter((slot) => !bookedTimes.includes(slot)).sort()
}

// ==============================
// إدارة الأوقات (أدمن)
// ==============================

export const addAvailableSlot = async (date: string, time: string, createdBy?: string) => {
  const { data, error } = await supabase
    .from('available_slots')
    .insert({ date, time, created_by: createdBy || null })
    .select()
    .single()

  if (error) throw error
  return data
}

export const removeAvailableSlot = async (date: string, time: string) => {
  const { error } = await supabase
    .from('available_slots')
    .delete()
    .eq('date', date)
    .eq('time', time)

  if (error) throw error
}

export const getManualSlots = async (date: string) => {
  const { data, error } = await supabase.from('available_slots').select('*').eq('date', date).order('time', { ascending: true })
  if (error) throw error
  return data || []
}

// ==============================
// استعلام الحجوزات
// ==============================

export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw error
  return data as Booking[]
}

export const getAllBookings = async (): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, user:profiles(full_name, phone, email)')
    .order('date', { ascending: false })

  if (error) throw error
  return data as Booking[]
}

// ==============================
// إنشاء حجز
// ==============================

export interface CreateBookingData {
  userId: string
  service_name: string
  service_price: number
  booking_type: 'salon' | 'home'
  date: string
  time: string
  is_urgent: boolean
  notes?: string
}

export const createBooking = async (data: CreateBookingData): Promise<Booking> => {
  const urgent_fee = data.is_urgent ? 5 : 0
  const total_price = data.service_price + urgent_fee

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      user_id: data.userId,
      service_name: data.service_name,
      service_price: data.service_price,
      booking_type: data.booking_type,
      date: data.date,
      time: data.time,
      is_urgent: data.is_urgent,
      status: 'pending',
      total_price,
      notes: data.notes || '',
      modified_count: 0,
    })
    .select()
    .single()

  if (error) throw error

  // إضافة نقاط ولاء
  await addLoyaltyPoints(data.userId, data.service_name)

  return booking as Booking
}

// ==============================
// تحديث وإلغاء الحجوزات
// ==============================

export const updateBookingStatus = async (
  bookingId: string,
  status: Booking['status'],
): Promise<Booking> => {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) throw error
  return data as Booking
}

export const modifyBooking = async (
  bookingId: string,
  updates: { date?: string; time?: string },
): Promise<Booking> => {
  // تحقق من عدد التعديلات
  const { data: existing } = await supabase
    .from('bookings')
    .select('modified_count, created_at')
    .eq('id', bookingId)
    .single()

  if (existing?.modified_count >= 1) {
    throw new Error('لقد استنفدت التعديل المسموح به (مرة واحدة فقط)')
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({
      ...updates,
      modified_count: (existing?.modified_count ?? 0) + 1,
    })
    .eq('id', bookingId)
    .select()
    .single()

  if (error) throw error
  return data as Booking
}

export const cancelBooking = async (bookingId: string): Promise<void> => {
  // تحقق من نافذة الإلغاء (30 دقيقة)
  const { data: booking } = await supabase
    .from('bookings')
    .select('created_at, status')
    .eq('id', bookingId)
    .single()

  if (!booking) throw new Error('الحجز غير موجود')
  if (booking.status === 'cancelled') throw new Error('الحجز ملغى مسبقاً')

  const createdAt = new Date(booking.created_at)
  const now = new Date()
  const minutesDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60)

  if (minutesDiff > 30) {
    throw new Error('انتهت مدة الإلغاء (30 دقيقة من وقت الحجز)')
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (error) throw error
}

// ==============================
// نقاط الولاء (تُضاف عند الحجز)
// ==============================

const POINTS_EARNED_PER_BOOKING = 20

const addLoyaltyPoints = async (userId: string, description: string): Promise<void> => {
  try {
    // upsert نقاط المستخدم
    const { data: existing } = await supabase
      .from('loyalty_points')
      .select('points, total_earned')
      .eq('user_id', userId)
      .single()

    if (existing) {
      await supabase
        .from('loyalty_points')
        .update({
          points: existing.points + POINTS_EARNED_PER_BOOKING,
          total_earned: existing.total_earned + POINTS_EARNED_PER_BOOKING,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
    } else {
      await supabase.from('loyalty_points').insert({
        user_id: userId,
        points: POINTS_EARNED_PER_BOOKING,
        total_earned: POINTS_EARNED_PER_BOOKING,
      })
    }

    // سجل المعاملة
    await supabase.from('loyalty_transactions').insert({
      user_id: userId,
      points: POINTS_EARNED_PER_BOOKING,
      type: 'earned',
      description,
    })
  } catch (err) {
    console.error('خطأ في إضافة نقاط الولاء:', err)
  }
}
