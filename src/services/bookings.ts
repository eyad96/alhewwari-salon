import { supabase as defaultSupabase } from '@/lib/supabase'
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

export const getAvailableSlots = async (date: string, supabase = defaultSupabase): Promise<string[]> => {
  let bookedTimes: string[] = []
  let manualTimes: string[] = []

  try {
    const [bookingsRes, manualRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('time, status')
        .eq('date', date)
        .in('status', ['pending', 'confirmed']),
      supabase
        .from('available_slots')
        .select('time')
        .eq('date', date)
    ])

    if (!bookingsRes.error && bookingsRes.data) {
      bookedTimes = bookingsRes.data.map((b) => b.time.slice(0, 5))
    } else if (bookingsRes.error) {
      console.warn("⚠️ bookings table query error:", bookingsRes.error.message)
    }

    if (!manualRes.error && manualRes.data && manualRes.data.length > 0) {
      manualTimes = manualRes.data.map((m: any) => m.time.slice(0, 5))
    } else if (manualRes.error) {
      console.warn("⚠️ available_slots table query error:", manualRes.error.message)
    }
  } catch (err: any) {
    console.warn("⚠️ Could not query bookings or available_slots table:", err.message)
  }

  // Combine default working hours slots with manually added available slots
  const defaultSlots = generateTimeSlots()
  const baseSlots = Array.from(new Set([...defaultSlots, ...manualTimes]))

  // Filter out booked slots and sort them alphabetically/chronologically
  return baseSlots
    .filter((slot) => !bookedTimes.includes(slot))
    .sort((a, b) => a.localeCompare(b))
}


// ==============================
// إدارة الأوقات (أدمن)
// ==============================

export const addAvailableSlot = async (date: string, time: string, createdBy?: string, supabase = defaultSupabase) => {
  const { data, error } = await supabase
    .from('available_slots')
    .insert({ date, time, created_by: createdBy || null })
    .select()
    .single()

  if (error) throw error
  return data
}

export const removeAvailableSlot = async (date: string, time: string, supabase = defaultSupabase) => {
  const { error } = await supabase
    .from('available_slots')
    .delete()
    .eq('date', date)
    .eq('time', time)

  if (error) throw error
}

export const getManualSlots = async (date: string, supabase = defaultSupabase) => {
  const { data, error } = await supabase.from('available_slots').select('*').eq('date', date).order('time', { ascending: true })
  if (error) throw error
  return data || []
}

// ==============================
// استعلام الحجوزات
// ==============================

export const getUserBookings = async (userId: string, supabase = defaultSupabase): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (error) throw error
  return data as Booking[]
}

export const getAllBookings = async (supabase = defaultSupabase): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, user:profiles(full_name, phone, email)')
    .order('date', { ascending: false })

  if (error) throw error

  const mapped = (data || []).map((b: any) => {
    if (b.user) {
      return {
        ...b,
        user: {
          ...b.user,
          phone: b.user.phone
        }
      }
    }
    return b
  })

  return mapped as Booking[]
}

// ==============================
// إنشاء حجز
// ==============================

export interface CreateBookingData {
  userId?: string
  user_id?: string
  service_name: string
  service_price: number
  booking_type: 'salon' | 'home'
  date: string
  time: string
  is_urgent: boolean
  notes?: string
}

export const createBooking = async (data: CreateBookingData, supabase = defaultSupabase): Promise<Booking> => {
  const urgent_fee = data.is_urgent ? 5 : 0
  const total_price = data.service_price + urgent_fee

  const targetUserId = data.user_id || data.userId
  if (!targetUserId) {
    throw new Error("Missing user identification (user_id / userId) inside payload creation!")
  }

  // Check if this date and time is already booked by an active (pending or confirmed) booking
  const { data: existingBooking, error: checkError } = await supabase
    .from('bookings')
    .select('id')
    .eq('date', data.date)
    .eq('time', data.time)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (checkError) {
    console.error("⚠️ Error checking availability:", checkError.message)
  }

  if (existingBooking) {
    throw new Error('هذا الوقت محجوز بالفعل من قبل مستخدم آخر. يرجى اختيار وقت آخر.')
  }

  // Check if this user already has an active booking (pending or confirmed)
  const { data: userActiveBooking, error: userCheckError } = await supabase
    .from('bookings')
    .select('id')
    .eq('user_id', targetUserId)
    .in('status', ['pending', 'confirmed'])
    .maybeSingle()

  if (userCheckError) {
    console.error("⚠️ Error checking user active bookings:", userCheckError.message)
  }

  if (userActiveBooking) {
    throw new Error('لديك حجز نشط بالفعل في النظام. لا يمكنك إجراء حجز آخر؛ يمكنك تعديل حجزك الحالي مرة واحدة فقط من لوحة التحكم الخاصة بك.')
  }

  const insertPayload = {
    user_id: targetUserId,
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
  }

  console.log("📤 [Supabase Insert] Payload being sent to public.bookings:", insertPayload)

  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error("❌ [Supabase Insert Error] Details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw error
    }

    console.log("✅ [Supabase Insert Success] Created booking row:", booking)

    // Delete the slot from available_slots table so it is no longer marked as an active manual slot
    try {
      const { error: deleteSlotError } = await supabase
        .from('available_slots')
        .delete()
        .eq('date', data.date)
        .eq('time', data.time)

      if (deleteSlotError) {
        console.warn("⚠️ Failed to delete slot from available_slots:", deleteSlotError.message)
      } else {
        console.log("✅ [available_slots] Removed booked slot from available_slots table")
      }
    } catch (slotErr: any) {
      console.warn("⚠️ [available_slots] Exception while deleting slot:", slotErr.message)
    }

    // إضافة نقاط ولاء
    try {
      await addLoyaltyPoints(targetUserId, data.service_name, supabase)
      console.log("✅ [Loyalty Points] Added successfully for user:", targetUserId)
    } catch (loyaltyErr) {
      console.error("⚠️ [Loyalty Points Error] Failed to update loyalty points:", loyaltyErr)
    }

    return booking as Booking
  } catch (err: any) {
    console.error("❌ [createBooking Failure] Caught exception during execution:", {
      message: err.message,
      details: err.details,
      hint: err.hint,
      code: err.code
    })
    if (err.code === '23505' || (err.message && err.message.includes('unique_active_booking'))) {
      throw new Error('هذا الوقت محجوز بالفعل من قبل مستخدم آخر. يرجى اختيار وقت آخر.')
    }
    throw err
  }
}

// ==============================
// تحديث وإلغاء الحجوزات
// ==============================

export const updateBookingStatus = async (
  bookingId: string,
  status: Booking['status'],
  supabase = defaultSupabase,
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
  supabase = defaultSupabase,
): Promise<Booking> => {
  // تحقق من عدد التعديلات والبيانات الحالية
  const { data: existing, error: existingError } = await supabase
    .from('bookings')
    .select('modified_count, created_at, date, time')
    .eq('id', bookingId)
    .single()

  if (existingError || !existing) {
    throw new Error('الحجز غير موجود')
  }

  if (existing.modified_count >= 1) {
    throw new Error('لقد استنفدت التعديل المسموح به (مرة واحدة فقط)')
  }

  // التحقق من توافر الوقت الجديد إذا تم تعديل التاريخ أو الوقت
  const targetDate = updates.date || existing.date
  const targetTime = updates.time || existing.time

  if (updates.date || updates.time) {
    const { data: duplicateBooking, error: dupError } = await supabase
      .from('bookings')
      .select('id')
      .eq('date', targetDate)
      .eq('time', targetTime)
      .neq('id', bookingId)
      .in('status', ['pending', 'confirmed'])
      .maybeSingle()

    if (dupError) {
      console.error("⚠️ Error checking slot availability on modify:", dupError.message)
    }

    if (duplicateBooking) {
      throw new Error('هذا الوقت محجوز بالفعل من قبل مستخدم آخر. يرجى اختيار وقت آخر.')
    }
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .update({
        ...updates,
        modified_count: (existing.modified_count ?? 0) + 1,
      })
      .eq('id', bookingId)
      .select()
      .single()

    if (error) throw error

    // If date or time was updated, delete the newly selected slot from available_slots table
    if (updates.date || updates.time) {
      try {
        const { error: deleteSlotError } = await supabase
          .from('available_slots')
          .delete()
          .eq('date', targetDate)
          .eq('time', targetTime)

        if (deleteSlotError) {
          console.warn("⚠️ Failed to delete slot from available_slots on modify:", deleteSlotError.message)
        } else {
          console.log("✅ [available_slots] Removed modified booking slot from available_slots table")
        }
      } catch (slotErr: any) {
        console.warn("⚠️ [available_slots] Exception while deleting slot on modify:", slotErr.message)
      }
    }

    return data as Booking
  } catch (err: any) {
    if (err.code === '23505' || (err.message && err.message.includes('unique_active_booking'))) {
      throw new Error('هذا الوقت محجوز بالفعل من قبل مستخدم آخر. يرجى اختيار وقت آخر.')
    }
    throw err
  }
}

export const cancelBooking = async (bookingId: string, supabase = defaultSupabase): Promise<void> => {
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

const addLoyaltyPoints = async (userId: string, description: string, supabase = defaultSupabase): Promise<void> => {
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

// ==============================
// حذف الحجز نهائياً (مسؤول)
// ==============================
export const deleteBooking = async (bookingId: string, supabase = defaultSupabase): Promise<void> => {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId)

  if (error) throw error
}

