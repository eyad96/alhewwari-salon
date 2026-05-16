import React, { useState } from 'react'
import { motion } from 'framer-motion'
import Calendar from 'react-calendar'
import { format, addDays, isBefore, startOfDay } from 'date-fns'
import { Clock, Home, Scissors, Zap, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isUrgent, setIsUrgent] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingSuccess, setBookingSuccess] = useState(false)

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

  const onSubmit = async (data: BookingFormData) => {
    if (!user) {
      toast.error('يجب تسجيل الدخول أولاً')
      navigate('/login')
      return
    }

    setIsSubmitting(true)
    try {
      await createBooking({
        userId: user.id,
        service_name: data.service_name,
        service_price: totalPrice,
        booking_type: data.booking_type,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: data.time,
        is_urgent: isUrgent && urgentApplies,
        notes: data.notes,
      })
      setBookingSuccess(true)
      toast.success('🎉 تم الحجز بنجاح! سيتم التواصل معك قريباً')
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ. يرجى المحاولة مرة أخرى')
    } finally {
      setIsSubmitting(false)
    }
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
                <span className="text-gray-400">التاريخ:</span>
                <span className="text-white">{format(selectedDate, 'yyyy/MM/dd')}</span>
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

        {!user && (
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
                <div className="mt-4 text-right text-sm text-gray-300">
                  <span className="font-semibold text-white">التاريخ الميلادي:</span>{' '}
                  {format(selectedDate, 'yyyy-MM-dd')}
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
                  {generateTimeSlots().map(slot => {
                    const isAvailable = availableSlots.includes(slot)
                    const isSelected = selectedTime === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!isAvailable || slotsLoading}
                        onClick={() => isAvailable && setValue('time', slot)}
                        className={`py-2 px-2 rounded-lg text-sm font-medium transition-all ${
                          !isAvailable
                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed line-through'
                            : isSelected
                            ? 'gold-gradient text-black font-bold'
                            : 'glass text-gray-300 hover:text-yellow-400 hover:border-yellow-400/40'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
                {errors.time && <p className="text-red-400 text-sm mt-2">{errors.time.message}</p>}
                <p className="text-gray-500 text-xs mt-3">⬜ متاح  |  ▪️ محجوز</p>
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
                        className={`p-4 rounded-xl text-right transition-all border ${
                          isSelected
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
                    className={`p-4 rounded-xl text-center transition-all ${
                      bookingType === 'salon'
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
                    className={`p-4 rounded-xl text-center transition-all ${
                      bookingType === 'home'
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
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isUrgent ? 'bg-yellow-400' : 'bg-gray-700'
                      }`}
                    >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        isUrgent ? 'right-1' : 'left-1'
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
                    <span className="text-gray-400">التاريخ</span>
                    <span className="text-white">{format(selectedDate, 'yyyy/MM/dd')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">الوقت</span>
                    <span className="text-white">{selectedTime || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">الخدمة</span>
                    <span className="text-white">{selectedService || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">النوع</span>
                    <span className="text-white">{bookingType === 'salon' ? 'في الصالون' : 'منزلي'}</span>
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
                  disabled={isSubmitting || !user}
                  className="btn-gold w-full mt-5 py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
                  ) : (
                    <>تأكيد الحجز <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>

                {!user && (
                  <p className="text-center text-gray-500 text-xs mt-3">
                    <Link to="/login" className="text-yellow-400 hover:underline">سجّل دخولك</Link> للحجز
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
