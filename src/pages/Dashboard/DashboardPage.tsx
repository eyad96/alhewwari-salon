import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Award, Clock, CheckCircle, Edit, Trash2, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Link, Navigate } from 'react-router-dom'
import { POINTS_FOR_FREE, SERVICES } from '@/types'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllBookings,
  getUserBookings,
  updateBookingStatus,
  cancelBooking,
  modifyBooking,
  createBooking,
  getAvailableSlots,
  addAvailableSlot,
  removeAvailableSlot,
  getManualSlots,
} from '@/services/bookings'
import { getStudioPhotos, uploadStudioPhoto } from '@/services/studio'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/shared/ImageUpload'
import toast from 'react-hot-toast'

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'قيد الانتظار', cls: 'bg-gray-400/10 text-gray-400  border-gray-400/20' },
    confirmed: { label: 'مؤكد', cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
    completed: { label: 'مكتمل', cls: 'bg-green-400/10 text-green-400 border-green-400/20' },
    cancelled: { label: 'ملغي', cls: 'bg-red-400/10 text-red-400 border-red-400/20' },
  }
  const s = map[status] || map.pending
  return <span className={`text-xs px-2 py-1 rounded-full border ${s.cls}`}>{s.label}</span>
}

// ------------------ Create Booking Form ------------------
const CreateBookingForm: React.FC<{ profiles: any[]; onCreate: (p: any) => void; onCancel: () => void }> = ({ profiles, onCreate, onCancel }) => {
  const [userId, setUserId] = useState<string | undefined>(profiles[0]?.id)
  const [serviceId, setServiceId] = useState(SERVICES[0].id)
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [time, setTime] = useState('12:00')
  const [bookingType, setBookingType] = useState<'salon' | 'home'>('salon')
  const [isUrgent, setIsUrgent] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    getAvailableSlots(date).then((slots) => {
      setTimeSlots(slots)
      setTime(slots[0] || '12:00')
    })
  }, [date])

  return (
    <div>
      <div className="mb-3">
        <label className="text-gray-400 text-sm">المستخدم</label>
        <select className="input-field" value={userId} onChange={(e) => setUserId(e.target.value)}>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
          ))}
        </select>
      </div>

      <div className="mb-3">
        <label className="text-gray-400 text-sm">الخدمة</label>
        <select className="input-field" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {SERVICES.map((s) => (
            <option key={s.id} value={s.id}>{s.name} — صالون {s.salonPrice} د.أ / منزلي {s.homePrice} د.أ</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-gray-400 text-sm">التاريخ</label>
          <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <label className="text-gray-400 text-sm">الوقت</label>
          <select className="input-field" value={time} onChange={(e) => setTime(e.target.value)}>
            {timeSlots.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="text-gray-400 text-sm">النوع</label>
        <select className="input-field" value={bookingType} onChange={(e) => setBookingType(e.target.value as any)}>
          <option value="salon">صالون</option>
          <option value="home">منزلي</option>
        </select>
      </div>

      <div className="mb-3 flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} />
          عاجل
        </label>
      </div>

      <div className="mb-4">
        <label className="text-gray-400 text-sm">ملاحظات (اختياري)</label>
        <input className="input-field" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button onClick={() => {
          const service = SERVICES.find(s => s.id === serviceId)!
          const price = bookingType === 'salon' ? service.salonPrice : service.homePrice
          onCreate({ userId, service_name: service.name, service_price: price, booking_type: bookingType, date, time, is_urgent: isUrgent, notes })
        }} className="btn-gold flex-1">إنشاء الحجز</button>
        <button onClick={onCancel} className="btn-outline-gold">إلغاء</button>
      </div>
    </div>
  )
}

// ------------------ Edit Booking Form ------------------
const EditBookingForm: React.FC<{ booking: any; onSave: (u: any) => void; onCancel: () => void }> = ({ booking, onSave, onCancel }) => {
  const [date, setDate] = useState(booking.date?.slice(0, 10) || new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<string[]>([])
  const [time, setTime] = useState(booking.time || '12:00')

  useEffect(() => {
    getAvailableSlots(date).then((s) => {
      setSlots(s)
      if (!s.includes(time)) setTime(s[0] || '12:00')
    })
  }, [date])

  return (
    <div>
      <div className="mb-3">
        <label className="text-gray-400 text-sm">التاريخ</label>
        <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="mb-3">
        <label className="text-gray-400 text-sm">الوقت</label>
        <select className="input-field" value={time} onChange={(e) => setTime(e.target.value)}>
          {slots.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSave({ date, time })} className="btn-gold">حفظ</button>
        <button onClick={onCancel} className="btn-outline-gold">إلغاء</button>
      </div>
    </div>
  )
}

const DashboardPage: React.FC = () => {
  const { user, loading: authLoading, getAuthenticatedClient, refetch } = useAuth()
  const { isAdmin, loading: adminLoading } = useAdmin()
  const loading = authLoading || adminLoading
  const { getToken } = useClerkAuth()
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'bookings')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<any | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!loading && isAdmin) {
      setActiveTab('admin')
    }
  }, [isAdmin, loading])

  useEffect(() => {
    if (!loading && user && activeTab === 'admin' && !isAdmin) {
      toast.error('غير مصرح لك بدخول لوحة إدارة المسؤولين')
      setActiveTab('bookings')
    }
  }, [activeTab, isAdmin, loading, user])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><div className="loader w-12 h-12"></div></div>
  )
  if (!user) return <Navigate to="/login" />

  // Data
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      const { data, error } = await authSupabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!isAdmin
  })

  // In-memory sort of bookings ascending for appointments list
  const appointments = React.useMemo(() => {
    return [...bookings].sort((a: any, b: any) => {
      const dateA = a.appointment_date || a.date || ''
      const dateB = b.appointment_date || b.date || ''
      const dateDiff = dateA.localeCompare(dateB)
      if (dateDiff !== 0) return dateDiff
      return (a.appointment_time || a.time || '').localeCompare(b.appointment_time || b.time || '')
    })
  }, [bookings])

  const appointmentsLoading = bookingsLoading

  // Customer-specific queries
  const { data: customerAppointments = [], isLoading: customerAppointmentsLoading } = useQuery({
    queryKey: ['customer-appointments', user?.id],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      const { data, error } = await authSupabase
        .from('appointments')
        .select('*')
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user && !isAdmin
  })

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      const { data } = await authSupabase.from('profiles').select('id, full_name, email, role, loyalty_points, phone')
      return data || []
    },
    enabled: !!isAdmin
  })

  // Manual (admin) available slots management
  const [manualDate, setManualDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const { data: manualSlots = [], refetch: refetchManualSlots } = useQuery({
    queryKey: ['manual-slots', manualDate],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      return getManualSlots(manualDate, authSupabase)
    },
    enabled: !!isAdmin
  })

  const addManualSlot = useMutation({
    mutationFn: async ({ date, time }: any) => {
      const authSupabase = await getAuthenticatedClient()
      return addAvailableSlot(date, time, user?.id, authSupabase)
    },
    onSuccess: () => { refetchManualSlots(); queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) }
  })

  const removeManualSlot = useMutation({
    mutationFn: async ({ date, time }: any) => {
      const authSupabase = await getAuthenticatedClient()
      return removeAvailableSlot(date, time, authSupabase)
    },
    onSuccess: () => { refetchManualSlots(); queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) }
  })
  // Clerk sync UI state
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const authSupabase = await getAuthenticatedClient()
      return updateBookingStatus(id, status, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
    }
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const authSupabase = await getAuthenticatedClient()
      return cancelBooking(id, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
    }
  })

  const modifyMutation = useMutation({
    mutationFn: async ({ id, updates }: any) => {
      const authSupabase = await getAuthenticatedClient()
      return modifyBooking(id, updates, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const authSupabase = await getAuthenticatedClient()
      return createBooking(data, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
    }
  })

  const confirmHaircutMutation = useMutation({
    mutationFn: async ({ bookingId, points = 10 }: { bookingId: string; points?: number }) => {
      const authSupabase = await getAuthenticatedClient()
      const { data, error } = await authSupabase.rpc('confirm_haircut_completed', {
        p_booking_id: bookingId,
        p_points_to_add: points,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('✅ تم تأكيد إتمام الحلاقة وإضافة نقاط الولاء للعميل!')
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['customer-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل تأكيد إتمام الحلاقة')
    }
  })


  // Phone Sync & Onboarding state
  const [phoneInput, setPhoneInput] = useState('')
  const [isSavingPhone, setIsSavingPhone] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profilePhone, setProfilePhone] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)

  // Sync profile details when user is loaded
  useEffect(() => {
    if (user) {
      setProfileName(user.full_name || '')
      setProfilePhone(user.phone === 'بدون هاتف' ? '' : (user.phone || ''))
    }
  }, [user])

  const handleCancelEdit = () => {
    if (user) {
      setProfileName(user.full_name || '')
      setProfilePhone(user.phone === 'بدون هاتف' ? '' : (user.phone || ''))
    }
    setIsEditingProfile(false)
  }

  const handlePhoneSync = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneInput) return
    setIsSavingPhone(true)
    try {
      const authSupabase = await getAuthenticatedClient()
      const { error } = await authSupabase
        .from('profiles')
        .update({ phone: phoneInput })
        .eq('id', user.id)
      if (error) throw error
      toast.success('✅ تم ربط رقم الهاتف بنجاح!')
      await refetch()
    } catch (err: any) {
      console.error('Failed to sync phone:', err)
      toast.error('فشل حفظ رقم الهاتف. يرجى المحاولة لاحقاً.')
    } finally {
      setIsSavingPhone(false)
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    // Jordanian phone format validation (10 digits starting with 07)
    const cleanPhone = profilePhone.trim()
    const jorPhoneRegex = /^07[789]\d{7}$/
    
    if (cleanPhone && !jorPhoneRegex.test(cleanPhone)) {
      toast.error('❌ يرجى إدخال رقم هاتف أردني صحيح يتكون من 10 خانات ويبدأ بـ 079 أو 078 أو 077')
      return
    }

    setIsSavingProfile(true)
    try {
      const authSupabase = await getAuthenticatedClient()
      const { error } = await authSupabase
        .from('profiles')
        .update({
          full_name: profileName,
          phone: cleanPhone || 'بدون هاتف'
        })
        .eq('id', user.id)
      if (error) throw error
      toast.success('✅ تم تحديث رقم الهاتف بنجاح!')
      setIsEditingProfile(false)
      await refetch()
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      toast.error('فشل تحديث الملف الشخصي. يرجى المحاولة لاحقاً.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const displayBookings = isAdmin
    ? bookings
    : customerAppointments.map((appt: any) => ({
        id: appt.id,
        service_name: appt.service_name || 'جلسة عناية بالصالون',
        date: appt.appointment_date,
        time: appt.appointment_time,
        booking_type: appt.booking_type || 'salon',
        status: appt.status,
        total_price: appt.total_price || appt.service_price || 15,
        customer_phone: appt.customer_phone || 'بدون هاتف',
      }))

  const upcoming = displayBookings.filter((b: any) => b.status === 'pending' || b.status === 'confirmed')
  const past = displayBookings.filter((b: any) => b.status === 'completed' || b.status === 'cancelled')
  const isBookingsLoading = isAdmin ? bookingsLoading : customerAppointmentsLoading

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">مرحباً مجدداً،</p>
              <h1 className="text-3xl font-black text-white mt-1">{user.full_name?.split(' ')[0]} 👋</h1>
              {isAdmin && <span className="badge-gold text-sm mt-2 inline-block">🔑 أدمن</span>}
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <Link to="/booking" className="btn-gold px-5 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" />حجز جديد</Link>
            </div>
          </div>
        </motion.div>

        {/* Onboarding Phone Sync banner */}
        {!isAdmin && (!user?.phone || user?.phone === '' || user?.phone === 'بدون هاتف') && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mb-8 p-6 glass border-2 border-yellow-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="text-right">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                📱 يرجى ربط رقم هاتفك لإكمال الحساب
              </h3>
              <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                تحتاج إلى ربط رقم هاتفك لنتمكن من التواصل معك لتأكيد الحجوزات وإعلامك بأي تعديلات في المواعيد.
              </p>
            </div>
            
            <form onSubmit={handlePhoneSync} className="w-full md:w-auto flex items-center gap-3 shrink-0">
              <input
                type="tel"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="07XXXXXXXX"
                className="input-field py-2.5 px-4 w-full md:w-48 text-left font-mono"
                dir="ltr"
                required
              />
              <button
                type="submit"
                disabled={isSavingPhone}
                className="btn-gold py-2.5 px-5 whitespace-nowrap"
              >
                {isSavingPhone ? (
                  <div className="loader w-5 h-5 border-2 border-black/30 border-t-black"></div>
                ) : (
                  'ربط الهاتف'
                )}
              </button>
            </form>
          </motion.div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'حجوزاتي', value: displayBookings.length },
            { label: 'قادمة', value: upcoming.length },
            { label: 'النقاط', value: (user as any)?.loyalty_points ?? 0 },
            { label: 'مكتملة', value: displayBookings.filter((b: any) => b.status === 'completed').length },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-4">
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-gray-500 text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {(() => {
            const tabs = isAdmin
              ? [
                  { id: 'admin', label: 'جميع الحجوزات' },
                  { id: 'bookings', label: 'حجوزاتي' },
                  { id: 'loyalty', label: 'النقاط' },
                  { id: 'profile', label: 'الملف الشخصي' }
                ]
              : [
                  { id: 'bookings', label: 'حجوزاتي' },
                  { id: 'loyalty', label: 'النقاط' },
                  { id: 'profile', label: 'الملف الشخصي' }
                ]
            return tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'gold-gradient text-black' : 'glass text-gray-300 hover:text-white'}`}>{tab.label}</button>
            ))
          })()}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <h3 className="text-white font-black text-xl flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  حجوزاتي الحالية والسابقة
                </h3>
              </div>

              {isBookingsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 glass rounded-2xl border border-yellow-500/10">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-t-yellow-400 animate-spin"></div>
                  </div>
                  <p className="text-gray-400 text-sm mt-4 font-medium">جاري تحميل حجزك الفاخر...</p>
                </div>
              ) : displayBookings.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-16 px-6 glass rounded-2xl border border-yellow-500/10 max-w-xl mx-auto flex flex-col items-center"
                >
                  <div className="w-16 h-16 rounded-full bg-yellow-400/5 flex items-center justify-center mb-5 border border-yellow-400/20 text-3xl">
                    📅
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2">لا يوجد لديك حجوزات حالياً</h4>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    لا يوجد لديك حجوزات حالياً. احجز موعدك الأول الآن!
                  </p>
                  <Link
                    to="/booking"
                    className="btn-gold px-8 py-3 rounded-xl flex items-center gap-2 shadow-lg hover:shadow-yellow-500/10"
                  >
                    <Plus className="w-4 h-4" />
                    احجز موعدك الأول الآن
                  </Link>
                </motion.div>
              ) : (
                <div className="space-y-8">
                  {/* Upcoming Bookings */}
                  {upcoming.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-yellow-400/90 font-bold text-sm flex items-center gap-2 tracking-wide uppercase">
                        <Clock className="w-4 h-4" />
                        المواعيد القادمة
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {upcoming.map((b: any, index: number) => (
                          <motion.div
                            key={b.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card p-5 border border-yellow-500/10 hover:border-yellow-400/30 transition-all flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h4 className="text-white font-bold text-lg leading-snug">{b.service_name}</h4>
                                <span className="text-[10px] text-gray-500 font-mono mt-1 block">رقم الحجز: {b.id.slice(0, 8)}...</span>
                              </div>
                              <StatusBadge status={b.status} />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                              <div className="text-gray-300 text-sm flex flex-col gap-1">
                                <span className="flex items-center gap-1.5">📅 {b.date}</span>
                                <span className="flex items-center gap-1.5">⏰ {b.time}</span>
                              </div>
                              <p className="text-yellow-400 font-black text-xl">{b.total_price} د.أ</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Past Bookings */}
                  {past.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-gray-400 font-bold text-sm flex items-center gap-2 tracking-wide uppercase">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        الحجوزات السابقة والملغاة
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-75">
                        {past.map((b: any, index: number) => (
                          <motion.div
                            key={b.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="card p-5 border border-white/5 bg-black/20 hover:opacity-100 transition-opacity"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <h4 className="text-white font-bold text-lg leading-snug">{b.service_name}</h4>
                              <StatusBadge status={b.status} />
                            </div>
                            <div className="flex justify-between items-center pt-4 border-t border-white/5 mt-auto">
                              <div className="text-gray-400 text-sm flex flex-col gap-1">
                                <span>📅 {b.date}</span>
                                <span>⏰ {b.time}</span>
                              </div>
                              <p className="text-gray-400 font-bold text-lg">{b.total_price} د.أ</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'loyalty' && (() => {
            const currentPoints = (user as any)?.loyalty_points ?? 0
            const percentage = Math.min(100, (currentPoints / POINTS_FOR_FREE) * 100)
            const needed = Math.max(0, POINTS_FOR_FREE - currentPoints)
            return (
              <div className="points-card">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-gray-400">نقاطك الحالية</p>
                    <div className="text-6xl font-black gold-text mt-1">{currentPoints}</div>
                  </div>
                  <Award className="w-10 h-10 text-yellow-400 opacity-40" />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">نحو حلاقة مجانية</span>
                    <span className="text-yellow-400">{currentPoints} / {POINTS_FOR_FREE}</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full gold-gradient rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  {needed > 0 ? `تحتاج ${needed} نقطة للحلاقة المجانية` : '🎉 لقد جمعت ما يكفي من النقاط للحصول على حلاقة مجانية!'}
                </p>
                <Link to="/loyalty" className="btn-gold block text-center py-3">عرض التفاصيل الكاملة</Link>
              </div>
            )
          })()}

          {activeTab === 'admin' && isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl">إدارة الحجوزات</h3>
                <div className="flex gap-2"><span className="badge-gold">{bookings.length} حجز</span></div>
              </div>

              <div className="mb-6 flex gap-3">
                <button onClick={() => setShowCreateModal(true)} className="btn-gold px-4 py-2 flex items-center gap-2"><Plus className="w-4 h-4" />حجز جديد (نيابة عن مستخدم)</button>
                <button onClick={() => setShowPhotoUpload(true)} className="btn-outline-gold px-4 py-2">رفع صور الاستوديو</button>
              </div>

              {/* Manual slots manager */}
              <div className="card p-4 mb-6">
                <h4 className="text-white font-bold mb-3">إدارة أوقات الحجز اليدوية</h4>
                <div className="grid grid-cols-3 gap-3 items-end mb-3">
                  <div>
                    <label className="text-gray-400 text-sm">التاريخ</label>
                    <input type="date" className="input-field" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">الوقت (HH:MM)</label>
                    <input id="manual-time" className="input-field" placeholder="13:30" />
                  </div>
                  <div>
                    <button onClick={() => {
                      const t = (document.getElementById('manual-time') as HTMLInputElement).value
                      if (!t) return toast.error('أدخل وقتاً صالحاً')
                      addManualSlot.mutate({ date: manualDate, time: t })
                    }} className="btn-gold w-full">إضافة وقت</button>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-gray-400 text-sm mb-2">الأوقات اليدوية ليوم {manualDate}</div>
                  <div className="flex flex-wrap gap-2">
                    {manualSlots.length === 0 && <div className="text-gray-500 text-sm">لا توجد أوقات يدوية لهذا اليوم</div>}
                    {manualSlots.map((s: any) => (
                      <div key={s.id} className="px-3 py-1 rounded-full bg-white/5 flex items-center gap-2">
                        <span className="text-white text-sm">{s.time}</span>
                        <button onClick={() => removeManualSlot.mutate({ date: manualDate, time: s.time })} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Clerk role sync */}
              <div className="card p-4 mb-6">
                <h4 className="text-white font-bold mb-3">مزامنة دور المستخدم من Clerk</h4>
                <p className="text-gray-400 text-sm mb-3">اختر مستخدماً من القائمة ثم اضغط "مزامنة" لسحب دور المستخدم من Clerk وتحديثه في قاعدة البيانات.</p>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="text-gray-400 text-sm">المستخدم</label>
                    <select className="input-field" value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}>
                      <option value="">اختر مستخدماً</option>
                      {profiles.map((p: any) => (
                        <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">دور Supabase الحالي</label>
                    <input className="input-field" value={selectedProfileId ? (profiles.find((x: any) => x.id === selectedProfileId)?.role || '') : ''} readOnly />
                  </div>
                  <div>
                    <button onClick={async () => {
                      if (!selectedProfileId) return toast.error('اختر مستخدماً أولاً')
                      try {
                        const token = await getToken()
                        if (!token) {
                          toast.error('لا يمكن الحصول على رمز المصادقة من Clerk')
                          return
                        }

                        const res = await fetch('/api/sync-clerk-role', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({ clerkUserId: selectedProfileId })
                        })
                        const json = await res.json()
                        if (!res.ok) throw new Error(json.error || JSON.stringify(json))
                        toast.success(`تمت المزامنة — دور Clerk: ${json.clerkRole || 'غير محدد'}`)
                        queryClient.invalidateQueries({ queryKey: ['profiles'] })
                      } catch (err: any) {
                        toast.error(err.message || 'فشل المزامنة')
                      }
                    }} className="btn-gold w-full">مزامنة</button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      {['العميل', 'رقم الهاتف', 'الخدمة', 'التاريخ', 'الوقت', 'النوع', 'السعر', 'الحالة', 'إجراءات'].map(h => (
                        <th key={h} className="text-gray-400 text-sm font-medium text-right py-3 px-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointmentsLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10">
                          <div className="loader mx-auto mb-2 animate-spin"></div>
                          <p className="text-gray-400 text-sm">جاري تحميل المواعيد...</p>
                        </td>
                      </tr>
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-gray-500">
                          لا توجد مواعيد حالياً
                        </td>
                      </tr>
                    ) : (
                      appointments.map((appt: any) => {
                        const origBooking = appt
                        return (
                          <tr key={appt.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                            <td className="py-4 px-4 text-white text-sm whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <img
                                  src={appt.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                                  alt={appt.customer_name}
                                  className="w-10 h-10 rounded-full border border-yellow-400/30 object-cover shadow-md shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'
                                  }}
                                />
                                <div>
                                  <div className="font-bold text-white leading-tight">{appt.customer_name}</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-yellow-400/80 font-mono select-all">{appt.customer_phone}</span>
                                    {(() => {
                                      const p = profiles.find((x: any) => x.id === appt.user_id)
                                      const points = p?.loyalty_points ?? 0
                                      return (
                                        <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-400/20 font-bold leading-none select-none">
                                          ⭐ {points} نقطة
                                        </span>
                                      )
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap font-mono select-all">
                              {appt.customer_phone || 'بدون هاتف'}
                            </td>
                            <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{origBooking.service_name || 'خدمة'}</td>
                            <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{appt.appointment_date}</td>
                            <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{appt.appointment_time}</td>
                            <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{origBooking.booking_type === 'salon' ? 'صالون' : 'منزلي'}</td>
                            <td className="py-4 px-4 text-yellow-400 font-bold text-sm whitespace-nowrap">{origBooking.total_price || 0} د.أ</td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              <select value={appt.status} onChange={e => updateStatusMutation.mutate({ id: appt.id, status: e.target.value })} className="bg-transparent text-xs border border-white/10 rounded-lg px-2 py-1 text-white">
                                <option value="pending">قيد الانتظار</option>
                                <option value="confirmed">مؤكد</option>
                                <option value="completed">مكتمل</option>
                                <option value="cancelled">ملغي</option>
                              </select>
                            </td>
                            <td className="py-4 px-4 whitespace-nowrap">
                              {appt.status === 'completed' ? (
                                <button
                                  disabled
                                  className="bg-gray-500/10 text-gray-400/80 border border-gray-500/20 text-xs px-2.5 py-1.5 rounded-lg font-bold ml-3 cursor-not-allowed select-none inline-flex items-center gap-1"
                                >
                                  تمت الحلاقة ونزلت النقاط
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    if (window.confirm('هل تريد تأكيد حضور العميل وإتمام الحلاقة؟ سيتم إضافة 10 نقاط ولاء لحسابه.')) {
                                      confirmHaircutMutation.mutate({ bookingId: appt.id, points: 10 })
                                    }
                                  }}
                                  disabled={confirmHaircutMutation.isPending && confirmHaircutMutation.variables?.bookingId === appt.id}
                                  className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs px-2.5 py-1.5 rounded-lg font-bold ml-3 transition-all duration-200 hover:scale-105 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {confirmHaircutMutation.isPending && confirmHaircutMutation.variables?.bookingId === appt.id ? 'جاري التأكيد...' : 'تأكيد إتمام الحلاقة'}
                                </button>
                              )}
                              <button onClick={() => { if (window.confirm('هل تريد إلغاء الحجز؟')) cancelMutation.mutate(appt.id) }} className="text-red-400 hover:text-red-300 transition-colors mr-3" title="إلغاء الحجز"><Trash2 className="w-4 h-4" /></button>
                              <button onClick={() => setEditingBooking(origBooking)} className="text-gray-300 hover:text-white transition-colors" title="تعديل الحجز"><Edit className="w-4 h-4" /></button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card p-6 max-w-xl mx-auto border border-yellow-500/10 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black text-xl flex items-center gap-2">
                  👤 معلومات الملف الشخصي
                </h3>
                {!isEditingProfile && (
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(true)}
                    className="btn-gold px-4 py-1.5 text-xs font-bold rounded-lg transition-transform hover:scale-105"
                  >
                    ✏️ تعديل البيانات
                  </button>
                )}
              </div>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">الاسم الكامل</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={e => setProfileName(e.target.value)}
                    className={`input-field transition-all ${!isEditingProfile ? 'opacity-70 cursor-not-allowed bg-white/5 border-white/5' : 'bg-transparent'}`}
                    required
                    disabled={!isEditingProfile}
                  />
                </div>
                
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">البريد الإلكتروني (Clerk)</label>
                  <input
                    type="email"
                    value={user.email || ''}
                    className="input-field opacity-50 cursor-not-allowed text-left bg-white/5 border-white/5"
                    dir="ltr"
                    readOnly
                    disabled
                  />
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={e => setProfilePhone(e.target.value)}
                    placeholder={!user.phone || user.phone === 'بدون هاتف' ? "لم يتم إضافة رقم هاتف بعد" : "07XXXXXXXX"}
                    className={`input-field transition-all text-left font-mono ${!isEditingProfile ? 'opacity-70 cursor-not-allowed bg-white/5 border-white/5' : 'bg-transparent'}`}
                    dir="ltr"
                    disabled={!isEditingProfile}
                    required={isEditingProfile}
                  />
                </div>

                {isEditingProfile && (
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex-1 btn-gold py-3 rounded-xl font-bold flex items-center justify-center gap-2 text-black transition-all hover:brightness-110 disabled:opacity-50"
                    >
                      {isSavingProfile ? (
                        <>
                          <div className="loader w-5 h-5 border-2 border-black/30 border-t-black animate-spin"></div>
                          <span>جاري الحفظ...</span>
                        </>
                      ) : (
                        'حفظ التعديلات'
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={isSavingProfile}
                      className="px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

        </motion.div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreateModal(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glass-dark rounded-2xl p-6 w-full max-w-lg z-10">
            <h3 className="text-white font-bold mb-4">حجز جديد نيابة عن مستخدم</h3>
            <CreateBookingForm profiles={profiles} onCreate={async (payload) => {
              try { await createMutation.mutateAsync(payload); toast.success('✅ تم إنشاء الحجز'); setShowCreateModal(false) } catch (err: any) { toast.error(err.message || 'فشل إنشاء الحجز') }
            }} onCancel={() => setShowCreateModal(false)} />
          </motion.div>
        </div>
      )}

      {/* Edit modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setEditingBooking(null)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glass-dark rounded-2xl p-6 w-full max-w-lg z-10">
            <h3 className="text-white font-bold mb-4">تعديل الحجز</h3>
            <EditBookingForm booking={editingBooking} onSave={async (updates) => {
              try { await modifyMutation.mutateAsync({ id: editingBooking.id, updates }); toast.success('✅ تم تعديل الحجز'); setEditingBooking(null) } catch (err: any) { toast.error(err.message || 'فشل تعديل الحجز') }
            }} onCancel={() => setEditingBooking(null)} />
          </motion.div>
        </div>
      )}

      {/* Photo upload modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPhotoUpload(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glass-dark rounded-2xl p-6 w-full max-w-md z-10">
            <h3 className="text-white font-bold mb-4">رفع صور الاستوديو</h3>
            <ImageUpload onUpload={async (result: any) => {
              try {
                // ImageUpload already uploaded to Cloudinary and returns the result
                const authSupabase = await getAuthenticatedClient()
                await authSupabase.from('gallery_photos').insert({
                  image_url: result.secure_url,
                  cloudinary_public_id: result.public_id,
                  caption: '',
                })
                toast.success('✅ تم حفظ سجل الصورة')
                setShowPhotoUpload(false)
                // refresh photos
                await queryClient.invalidateQueries({ queryKey: ['studio-photos'] })
              } catch (err: any) {
                toast.error(err.message || 'فشل حفظ الصورة')
              }
            }} onRemove={() => { }} folder="salon-alhewwari/studio" />
            <div className="mt-4 text-right"><button onClick={() => setShowPhotoUpload(false)} className="btn-outline-gold">إغلاق</button></div>
          </motion.div>
        </div>
      )}

    </div>
  )
}

export default DashboardPage
