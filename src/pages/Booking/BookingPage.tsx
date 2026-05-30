import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Calendar from 'react-calendar'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { Clock, Home, Scissors, Zap, AlertCircle, CheckCircle, ChevronRight, User, Phone } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { createBooking, getAvailableSlots, generateTimeSlots } from '@/services/bookings'
import { SERVICES, URGENT_FEE } from '@/types'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

const bookingSchema = z.object({
  service_name: z.string().min(1, 'اختر خدمة'),
  booking_type: z.enum(['salon', 'home']),
  time: z.string().min(1, 'اختر وقتاً'),
  notes: z.string().optional(),
})

type BookingFormData = z.infer<typeof bookingSchema>

// Slots are fetched from the service (includes admin-added slots and excludes booked times)
import { useEffect } from 'react'

const ALL_SLOTS: string[] = []

const BookingPage: React.FC = () => {
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()
  const { user: profileUser, loading: authLoading, getAuthenticatedClient, refetch: refetchAuth } = useAuth()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isUrgent, setIsUrgent] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [hasActiveBooking, setHasActiveBooking] = useState(false)
  const [activeBookingLoading, setActiveBookingLoading] = useState(false)

  // Phone validation & Onboarding states for Booking Page
  const [newPhone, setNewPhone] = useState('')
  const [savingPhone, setSavingPhone] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      booking_type: 'salon',
    }
  })

  const selectedService = watch('service_name')
  const selectedTime = watch('time')
  const bookingType = watch('booking_type')

  const serviceData = SERVICES.find(s => s.name === selectedService)
  const today = startOfDay(new Date())
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
  const urgentApplies = isToday

  const basePrice = serviceData
    ? (bookingType === 'home' ? (serviceData.homePrice || serviceData.salonPrice * 2) : serviceData.salonPrice)
    : 0
  const totalPrice = basePrice + (isUrgent && urgentApplies ? URGENT_FEE : 0)

  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setSlotsLoading(true)
      try {
        const s = await getAvailableSlots(format(selectedDate, 'yyyy-MM-dd'))
        setAvailableSlots(s)
        if (!s.includes(watch('time'))) setValue('time', '')
      } catch (err) {
        setAvailableSlots([])
      } finally {
        setSlotsLoading(false)
      }
    }
    load()
  }, [selectedDate])

  useEffect(() => {
    if (isSignedIn && clerkUser) {
      const checkActiveBooking = async () => {
        setActiveBookingLoading(true)
        try {
          const authSupabase = await getAuthenticatedClient()
          const { data, error } = await authSupabase
            .from('bookings')
            .select('id')
            .eq('user_id', clerkUser.id)
            .in('status', ['pending', 'confirmed'])
            .maybeSingle()
          
          if (data) {
            setHasActiveBooking(true)
          } else {
            setHasActiveBooking(false)
          }
        } catch (err) {
          console.error("Failed to check active bookings:", err)
        } finally {
          setActiveBookingLoading(false)
        }
      }
      checkActiveBooking()
    } else {
      setHasActiveBooking(false)
    }
  }, [isSignedIn, clerkUser])

  useEffect(() => {
    const pending = localStorage.getItem('pending_booking')
    if (pending) {
      try {
        const parsed = JSON.parse(pending)
        if (parsed.service_name) setValue('service_name', parsed.service_name)
        if (parsed.booking_type) setValue('booking_type', parsed.booking_type)
        if (parsed.time) setValue('time', parsed.time)
        if (parsed.notes) setValue('notes', parsed.notes)
        if (parsed.date) setSelectedDate(new Date(parsed.date))
        if (parsed.isUrgent) setIsUrgent(parsed.isUrgent)

        localStorage.removeItem('pending_booking')
        toast.success('تم استعادة بيانات الحجز الخاصة بك!')
      } catch (err) {
        console.error('Failed to restore pending booking', err)
      }
    }
  }, [setValue])

  const onSubmit = async (data: BookingFormData) => {
    if (!isSignedIn || !clerkUser) {
      const pendingData = {
        service_name: data.service_name,
        booking_type: data.booking_type,
        time: data.time,
        notes: data.notes || '',
        date: format(selectedDate, 'yyyy-MM-dd'),
        isUrgent: isUrgent && urgentApplies,
      }
      localStorage.setItem('pending_booking', JSON.stringify(pendingData))
      toast.success('تم حفظ اختياراتك. يرجى تسجيل الدخول لإتمام الحجز!')
      navigate('/login?redirect=/booking')
      return
    }

    setIsSubmitting(true)
    console.log("🔍 Starting booking submission process...")
    console.log("ℹ️ Clerk User Details:", { id: clerkUser.id, email: clerkUser.primaryEmailAddress?.emailAddress })

    try {
      // 1. Check Clerk JWT Token
      let token: string | null = null
      try {
        token = await getToken({ template: 'supabase' })
        console.log("🔑 Clerk Supabase JWT Token successfully fetched:", token ? "Exists (Valid)" : "Null/Undefined!")
      } catch (tokenErr: any) {
        console.error("❌ Failed to fetch Clerk JWT Token:", tokenErr)
      }

      const authSupabase = await getAuthenticatedClient()

      // 2. Profile Sync & Fetch existing phone to avoid overwriting database-saved numbers
      let existingPhone = profileUser?.phone
      if (!existingPhone || existingPhone === 'بدون هاتف') {
        try {
          const { data: dbProfile } = await authSupabase
            .from('profiles')
            .select('phone')
            .eq('id', clerkUser.id)
            .maybeSingle()
          if (dbProfile?.phone) {
            existingPhone = dbProfile.phone
          }
        } catch (dbErr) {
          console.warn("⚠️ Failed to pre-fetch profile phone:", dbErr)
        }
      }

      const fullName = clerkUser.fullName || clerkUser.firstName || 'عميل الصالون'
      const finalPhone = existingPhone && existingPhone !== 'بدون هاتف'
        ? existingPhone
        : (clerkUser.primaryPhoneNumber?.phoneNumber || '')
      const avatarUrl = clerkUser.imageUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'

      const profilePayload = {
        id: clerkUser.id,
        full_name: fullName,
        phone: finalPhone || 'بدون هاتف',
        avatar_url: avatarUrl,
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
      }

      console.log("📤 Profiles Upsert Payload:", profilePayload)
      const { data: profileRes, error: profileError } = await authSupabase
        .from('profiles')
        .upsert(profilePayload, { onConflict: 'id' })
        .select()

      if (profileError) {
        console.error("❌ Profiles Upsert Error Details:", {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
      } else {
        console.log("✅ Profiles Sync Success:", profileRes)
      }

      // 3. Booking Creation
      const bookingPayload = {
        user_id: clerkUser.id,
        service_name: data.service_name,
        service_price: totalPrice,
        booking_type: data.booking_type,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: data.time,
        is_urgent: isUrgent && urgentApplies,
        notes: data.notes,
      }

      console.log("📤 Booking Insert Payload:", bookingPayload)

      const createdBooking = await createBooking(bookingPayload, authSupabase)
      console.log("✅ Success! Booking created successfully in Supabase:", createdBooking)

      setBookingSuccess(true)
      toast.success('🎉 تم الحجز بنجاح! سيتم التواصل معك قريباً')
    } catch (err: any) {
      console.error("❌ Catch Block - Booking Flow Failure:", {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code,
        stack: err.stack
      })
      toast.error(err.message || 'حدث خطأ أثناء إرسال الحجز. يرجى مراجعة لوحة تحكم المطورين')
    } finally {
      setIsSubmitting(false)
    }
  }

  const userHasPhone = !isSignedIn || !!(
    clerkUser?.primaryPhoneNumber?.phoneNumber ||
    (profileUser?.phone && profileUser.phone !== 'بدون هاتف' && profileUser.phone.trim() !== '')
  )

  const handleSavePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser) return
    const cleanPhone = newPhone.trim()
    const jorPhoneRegex = /^07[789]\d{7}$/
    
    if (!cleanPhone) {
      toast.error('الرجاء إدخال رقم الهاتف')
      return
    }
    
    if (!jorPhoneRegex.test(cleanPhone)) {
      toast.error('الرجاء إدخال رقم هاتف أردني صحيح (مثال: 0791234567)')
      return
    }
    
    setSavingPhone(true)
    try {
      const authSupabase = await getAuthenticatedClient()
      
      const { error } = await authSupabase
        .from('profiles')
        .update({ phone: cleanPhone })
        .eq('id', clerkUser.id)
        
      if (error) throw error
      
      toast.success('✅ تم حفظ رقم الهاتف بنجاح!')
      await refetchAuth()
    } catch (err: any) {
      console.error('Failed to save phone in booking:', err)
      toast.error('حدث خطأ أثناء حفظ رقم الهاتف')
    } finally {
      setSavingPhone(false)
    }
  }

  if (isSignedIn && !authLoading && !userHasPhone) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-8 text-center border border-yellow-400/20"
          >
            <div className="w-16 h-16 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto mb-6 border border-yellow-400/30">
              <Phone className="w-8 h-8 text-yellow-400" />
            </div>
            
            <h2 className="text-2xl font-black text-white mb-3">رقم الهاتف مطلوب 💈</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              لتتمكن من إتمام الحجز، يرجى إدخال رقم هاتفك المحمول للتواصل وتأكيد الحجز معك.
            </p>

            <form onSubmit={handleSavePhone} className="space-y-4">
              <div>
                <label className="text-gray-400 text-xs mb-1.5 block text-right">رقم الهاتف الأردني (مثال: 07XXXXXXXX)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newPhone}
                  onChange={e => setNewPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="07XXXXXXXX"
                  className="input-field text-center font-bold tracking-widest text-lg"
                  dir="ltr"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={savingPhone}
                className="btn-gold w-full py-3.5 flex items-center justify-center gap-2 font-bold"
              >
                {savingPhone ? (
                  <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
                ) : (
                  'حفظ وتفعيل الحجز'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    )
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-24 h-24 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-black" />
          </div>
          <h2 className="text-3xl font-black text-white mb-4">تم الحجز بنجاح! 🎉</h2>
          <div className="glass rounded-2xl p-6 mb-6 text-right">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">الخدمة:</span>
                <span className="text-white font-bold">{selectedService}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">التاريخ الميلادي:</span>
                <span className="text-white font-bold">
                  {new Intl.DateTimeFormat('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">الوقت:</span>
                <span className="text-white">{selectedTime}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-3 mt-3">
                <span className="text-gray-400">السعر الإجمالي:</span>
                <span className="text-yellow-400 font-black text-xl">{totalPrice} د.أ</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm mb-6">
            ⚠️ يمكن تعديل الموعد مرة واحدة فقط، وإلغاؤه خلال 30 دقيقة من الحجز
          </p>
          <div className="flex gap-3">
            <Link to="/dashboard" className="btn-gold flex-1 text-center py-3">
              لوحة التحكم
            </Link>
            <button onClick={() => { setBookingSuccess(false); setStep(1) }}
              className="btn-outline-gold flex-1 py-3">
              حجز جديد
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="section-subtitle mb-3">الحجز</p>
          <h1 className="section-title text-white mb-4">
            احجز <span className="gold-text">موعدك</span>
          </h1>
          <div className="gold-divider mx-auto mb-4"></div>

          {/* تنبيه قواعد الحجز */}
          <div className="inline-flex items-start gap-3 glass rounded-xl px-5 py-3 text-sm text-right max-w-md mx-auto">
            <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-gray-400">
              <span className="text-yellow-400 font-bold">قواعد الحجز: </span>
              تعديل الموعد مرة واحدة فقط • إلغاء خلال 30 دقيقة فقط
            </p>
          </div>
        </motion.div>

        {!isSignedIn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 p-6 glass rounded-2xl text-center border border-yellow-400/20"
          >
            <p className="text-gray-300 mb-4">يجب تسجيل الدخول للحجز</p>
            <div className="flex gap-3 justify-center">
              <Link to="/login" className="btn-gold px-6 py-2">دخول</Link>
              <Link to="/signup" className="btn-outline-gold px-6 py-2">تسجيل</Link>
            </div>
          </motion.div>
        )}

        {isSignedIn && hasActiveBooking && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 p-6 glass rounded-2xl border border-red-500/30 bg-red-950/20 text-right flex flex-col md:flex-row items-center gap-4"
          >
            <div className="p-3 bg-red-500/10 rounded-xl text-red-500 shrink-0">
              <AlertCircle className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <h4 className="text-white font-black text-lg mb-1">لديك حجز نشط بالفعل في النظام!</h4>
              <p className="text-gray-400 text-sm leading-relaxed">
                لحماية عدالة الحجوزات وإعطاء الفرصة لكافة عملاء الصالون، يرجى العلم بأنه لا يمكنك حجز موعد جديد حالياً. يمكنك تعديل حجزك النشط الحالي <span className="text-yellow-400 font-bold">لمرة واحدة فقط</span> إذا توافر وقت بديل، وذلك من خلال لوحة التحكم الخاصة بك.
              </p>
              <div className="mt-3 flex gap-2">
                <Link to="/dashboard" className="btn-gold px-5 py-1.5 text-xs font-bold">الانتقال إلى لوحة التحكم لتعديل الحجز</Link>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-3 gap-8">

            {/* العمود الأيمن - التقويم والوقت */}
            <div className="lg:col-span-2 space-y-8">

              {/* اختيار التاريخ */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card p-6"
              >
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full gold-gradient text-black text-xs font-black flex items-center justify-center">1</span>
                  اختر التاريخ
                </h3>
                <Calendar
                  value={selectedDate}
                  onChange={(val) => setSelectedDate(val as Date)}
                  minDate={today}
                  maxDate={addDays(today, 30)}
                  locale="ar-SA"
                />
                <div className="mt-4 text-right text-sm text-gray-300 flex flex-col gap-1 border-t border-white/5 pt-3">
                  <div>
                    <span className="font-semibold text-white">التاريخ الميلادي المحدد:</span>{' '}
                    <span className="text-yellow-400 font-bold">
                      {new Intl.DateTimeFormat('ar-JO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    موافق لـ: {format(selectedDate, 'yyyy-MM-dd')}
                  </div>
                </div>
                {isToday && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-yellow-400">
                    <Zap className="w-4 h-4" />
                    حجز اليوم متاح! يمكن إضافة خيار فوري
                  </div>
                )}
              </motion.div>

              {/* اختيار الوقت */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-6"
              >
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full gold-gradient text-black text-xs font-black flex items-center justify-center">2</span>
                  اختر الوقت
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {slotsLoading ? (
                    <div className="col-span-full text-center text-gray-400 py-4">جاري تحميل الأوقات المتاحة...</div>
                  ) : availableSlots.length === 0 ? (
                    <div className="col-span-full text-center text-red-400 py-4 font-bold">لا توجد أوقات متاحة للحجز في هذا اليوم.</div>
                  ) : (
                    availableSlots.map(slot => {
                      const isSelected = selectedTime === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={hasActiveBooking}
                          onClick={() => setValue('time', slot)}
                          className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                            isSelected
                              ? 'gold-gradient text-black font-bold'
                              : 'glass text-gray-300 hover:text-yellow-400 hover:border-yellow-400/40'
                          } ${hasActiveBooking ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          {slot}
                        </button>
                      )
                    })
                  )}
                </div>
                {errors.time && <p className="text-red-400 text-sm mt-2">{errors.time.message}</p>}
              </motion.div>

              {/* اختيار الخدمة */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card p-6"
              >
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full gold-gradient text-black text-xs font-black flex items-center justify-center">3</span>
                  اختر الخدمة
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {SERVICES.map(service => {
                    const isSelected = selectedService === service.name
                    const price = bookingType === 'home' ? (service.homePrice || service.salonPrice * 2) : service.salonPrice
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setValue('service_name', service.name)}
                        className={`p-4 rounded-xl text-right transition-all border ${isSelected
                            ? 'border-yellow-400/60 bg-yellow-400/10'
                            : 'border-white/10 hover:border-white/20 bg-white/5'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-xl font-black ${isSelected ? 'text-yellow-400' : 'text-gray-300'}`}>
                            {price} د.أ
                          </span>
                          <span className="text-xl">{service.id === '1' ? '✂️' : service.id === '2' ? '🪒' : '💈'}</span>
                        </div>
                        <p className={`font-bold mt-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                          {service.name}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">{service.duration} دقيقة</p>
                      </button>
                    )
                  })}
                </div>
                {errors.service_name && <p className="text-red-400 text-sm mt-2">{errors.service_name.message}</p>}
              </motion.div>
            </div>

            {/* العمود الأيسر - الخيارات والملخص */}
            <div className="space-y-6">

              {/* نوع الحجز */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="card p-5"
              >
                <h3 className="text-white font-bold mb-4">نوع الخدمة</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue('booking_type', 'salon')}
                    className={`p-4 rounded-xl text-center transition-all ${bookingType === 'salon'
                        ? 'gold-gradient text-black'
                        : 'glass text-gray-300 hover:text-white'
                      }`}
                  >
                    <Scissors className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-bold text-sm">في الصالون</div>
                    <div className="text-xs opacity-70">سعر عادي</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue('booking_type', 'home')}
                    className={`p-4 rounded-xl text-center transition-all ${bookingType === 'home'
                        ? 'gold-gradient text-black'
                        : 'glass text-gray-300 hover:text-white'
                      }`}
                  >
                    <Home className="w-6 h-6 mx-auto mb-2" />
                    <div className="font-bold text-sm">حجز منزلي</div>
                    <div className="text-xs opacity-70">سعر مختلف</div>
                  </button>
                </div>
              </motion.div>

              {/* حجز فوري */}
              {isToday && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        حجز فوري (نفس اليوم)
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">إضافة {URGENT_FEE} دنانير</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsUrgent(!isUrgent)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${isUrgent ? 'bg-yellow-400' : 'bg-gray-700'
                        }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isUrgent ? 'right-1' : 'left-1'
                        }`} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ملاحظات */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="card p-5"
              >
                <h3 className="text-white font-bold mb-3 text-sm">ملاحظات إضافية</h3>
                <textarea
                  {...register('notes')}
                  placeholder="أي طلبات خاصة..."
                  rows={3}
                  className="input-field resize-none text-sm"
                />
              </motion.div>

              {/* تفاصيل العميل */}
              {isSignedIn && clerkUser && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="card p-5 border border-yellow-400/20"
                >
                  <h3 className="text-white font-bold mb-3 text-sm flex items-center gap-2">
                    <User className="w-4 h-4 text-yellow-400" />
                    تفاصيل العميل (تلقائي)
                  </h3>
                  <div className="space-y-2 text-xs text-gray-400 text-right">
                    <p><span className="text-gray-500">الاسم الكامل:</span> <span className="text-white font-bold">{clerkUser.fullName || clerkUser.firstName || 'مستخدم'}</span></p>
                    <p><span className="text-gray-500">البريد الإلكتروني:</span> <span className="text-white">{clerkUser.primaryEmailAddress?.emailAddress}</span></p>
                    {(clerkUser.primaryPhoneNumber?.phoneNumber || profileUser?.phone) && (
                      <p><span className="text-gray-500">رقم الهاتف:</span> <span className="text-white">{clerkUser.primaryPhoneNumber?.phoneNumber || profileUser?.phone}</span></p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ملخص الحجز */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card p-5 sticky top-24"
              >
                <h3 className="text-white font-bold mb-4">ملخص الحجز</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">التاريخ الميلادي</span>
                    <span className="text-white font-bold">
                      {new Intl.DateTimeFormat('ar-JO', { year: 'numeric', month: 'long', day: 'numeric' }).format(selectedDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">الوقت</span>
                    <span className="text-white font-bold">{selectedTime || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">الخدمة</span>
                    <span className="text-white font-bold">{selectedService || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">النوع</span>
                    <span className="text-white font-bold">{bookingType === 'salon' ? 'في الصالون' : 'منزلي'}</span>
                  </div>
                  {isUrgent && urgentApplies && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">رسوم الحجز الفوري</span>
                      <span className="text-yellow-400">+{URGENT_FEE} د.أ</span>
                    </div>
                  )}
                  <div className="border-t border-white/10 pt-3 flex justify-between font-bold">
                    <span className="text-gray-300">الإجمالي</span>
                    <span className="text-yellow-400 text-xl">{totalPrice} د.أ</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || hasActiveBooking}
                  className="btn-gold w-full mt-5 py-3 disabled:opacity-50 flex items-center justify-center gap-2 font-bold text-sm"
                >
                  {isSubmitting ? (
                    <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
                  ) : hasActiveBooking ? (
                    <>غير مسموح بحجوزات متعددة (لديك حجز نشط)</>
                  ) : isSignedIn ? (
                    <>تأكيد الحجز وبثق الموعد <ChevronRight className="w-4 h-4 animate-pulse" /></>
                  ) : (
                    <>تسجيل الدخول لتأكيد الحجز <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>

                {!isSignedIn && (
                  <p className="text-center text-gray-500 text-xs mt-3">
                    يرجى <Link to="/login" className="text-yellow-400 hover:underline font-bold">تسجيل الدخول</Link> لإتمام الحجز وبثق الموعد.
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookingPage
