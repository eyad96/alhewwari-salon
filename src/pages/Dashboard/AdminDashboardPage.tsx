import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, Edit, Trash2, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Link, Navigate } from 'react-router-dom'
import { SERVICES } from '@/types'
import { format } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  modifyBooking,
  createBooking,
  getAvailableSlots,
  addAvailableSlot,
  removeAvailableSlot,
  getManualSlots,
  deleteBooking,
} from '@/services/bookings'
import ImageUpload from '@/components/shared/ImageUpload'
import toast from 'react-hot-toast'

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'قيد الانتظار', cls: 'bg-gray-400/10 text-gray-400 border-gray-400/20' },
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

const AdminDashboardPage: React.FC = () => {
  const { user, loading, getAuthenticatedClient } = useAuth()
  const { getToken } = useClerkAuth()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<any | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const queryClient = useQueryClient()

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

  const { data: profiles = [] } = useQuery({
    queryKey: ['profiles'],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      const { data } = await authSupabase.from('profiles').select('id, full_name, email, role, loyalty_points, phone')
      return data || []
    },
  })

  // Manual available slots management
  const [manualDate, setManualDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const { data: manualSlots = [], refetch: refetchManualSlots } = useQuery({
    queryKey: ['manual-slots', manualDate],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      return getManualSlots(manualDate, authSupabase)
    },
  })

  const addManualSlot = useMutation({
    mutationFn: async ({ date, time }: any) => {
      const authSupabase = await getAuthenticatedClient()
      return addAvailableSlot(date, time, user?.id, authSupabase)
    },
    onSuccess: () => { 
      refetchManualSlots()
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('✅ تم إضافة الوقت بنجاح')
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل إضافة الوقت')
    }
  })

  const removeManualSlot = useMutation({
    mutationFn: async ({ date, time }: any) => {
      const authSupabase = await getAuthenticatedClient()
      return removeAvailableSlot(date, time, authSupabase)
    },
    onSuccess: () => { 
      refetchManualSlots()
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('✅ تم إزالة الوقت بنجاح')
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل إزالة الوقت')
    }
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
      toast.success('✅ تم تحديث حالة الحجز بنجاح')
    }
  })

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const authSupabase = await getAuthenticatedClient()
      return cancelBooking(id, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('✅ تم إلغاء الحجز')
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const authSupabase = await getAuthenticatedClient()
      return deleteBooking(id, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('✅ تم حذف وإزالة الحجز من السجلات بنجاح')
    },
    onError: (err: any) => {
      toast.error('❌ فشل حذف الحجز: ' + err.message)
    }
  })

  const modifyMutation = useMutation({
    mutationFn: async ({ id, updates }: any) => {
      const authSupabase = await getAuthenticatedClient()
      return modifyBooking(id, updates, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('✅ تم تعديل وقت الحجز')
    }
  })

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const authSupabase = await getAuthenticatedClient()
      return createBooking(data, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('✅ تم إنشاء الحجز بنجاح')
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
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل تأكيد إتمام الحلاقة')
    }
  })

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loader w-12 h-12"></div>
    </div>
  )
  if (!user) return <Navigate to="/login" />

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-black to-neutral-900">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">مرحباً بك في لوحة الإدارة،</p>
              <h1 className="text-3xl font-black text-white mt-1">{user.full_name?.split(' ')[0]} 👋</h1>
              <span className="badge-gold text-sm mt-2 inline-block bg-yellow-400/10 text-yellow-400 px-3 py-1 rounded border border-yellow-400/20 font-bold">🔑 مسؤول النظام</span>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowCreateModal(true)} className="btn-gold px-5 py-2.5 flex items-center gap-2 font-bold"><Plus className="w-4 h-4" />حجز جديد</button>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'إجمالي الحجوزات', value: bookings.length },
            { label: 'قيد الانتظار', value: bookings.filter((b: any) => b.status === 'pending').length },
            { label: 'مؤكدة', value: bookings.filter((b: any) => b.status === 'confirmed').length },
            { label: 'مكتملة', value: bookings.filter((b: any) => b.status === 'completed').length },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-4 border border-white/5">
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Administrative Tools Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          
          {/* Manual available slots management */}
          <div className="card p-5 border border-white/5 bg-black/40">
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">📅 إدارة أوقات الحجز اليدوية</h4>
            <p className="text-gray-400 text-xs mb-4">أضف أو احذف أوقاتاً متاحة للحجز بشكل يدوي لتظهر للعملاء في صفحة الحجز لليوم المحدد.</p>
            <div className="grid grid-cols-3 gap-3 items-end mb-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">التاريخ</label>
                <input type="date" className="input-field" value={manualDate} onChange={e => setManualDate(e.target.value)} />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">الوقت (HH:MM)</label>
                <input id="manual-time" className="input-field" placeholder="13:30" />
              </div>
              <div>
                <button onClick={() => {
                  const t = (document.getElementById('manual-time') as HTMLInputElement).value
                  if (!t) return toast.error('أدخل وقتاً صالحاً')
                  addManualSlot.mutate({ date: manualDate, time: t })
                  const timeInput = document.getElementById('manual-time') as HTMLInputElement
                  if (timeInput) timeInput.value = ''
                }} className="btn-gold w-full py-2.5 font-bold">إضافة وقت</button>
              </div>
            </div>

            <div className="mt-3">
              <div className="text-gray-400 text-xs mb-2">الأوقات اليدوية المضافة ليوم {manualDate}:</div>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 bg-black/30 rounded-xl">
                {manualSlots.length === 0 && <div className="text-gray-500 text-xs p-2">لا توجد أوقات مضافة يدوياً لهذا اليوم</div>}
                {manualSlots.map((s: any) => (
                  <div key={s.id} className="px-3 py-1 rounded-full bg-white/5 flex items-center gap-2 border border-white/5">
                    <span className="text-white text-xs font-mono">{s.time}</span>
                    <button onClick={() => removeManualSlot.mutate({ date: manualDate, time: s.time })} className="text-red-400 hover:text-red-300 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Clerk role sync */}
          <div className="card p-5 border border-white/5 bg-black/40 flex flex-col justify-between">
            <div>
              <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">🔄 مزامنة أدوار المستخدمين من Clerk</h4>
              <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                اختر مستخدماً من القائمة ثم اضغط "مزامنة" لسحب دور المستخدم ومستوى الأمان الحاليين من Clerk وتحديثهما فوراً في قاعدة بيانات Supabase.
              </p>
              <div className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">المستخدم</label>
                  <select className="input-field text-sm" value={selectedProfileId} onChange={e => setSelectedProfileId(e.target.value)}>
                    <option value="">اختر مستخدماً</option>
                    {profiles.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name || p.email}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-gray-400 text-xs mb-1 block">دور Supabase الحالي</label>
                  <input className="input-field text-sm opacity-80 cursor-default bg-white/5 font-bold" value={selectedProfileId ? (profiles.find((x: any) => x.id === selectedProfileId)?.role || 'customer') : ''} readOnly />
                </div>
              </div>
            </div>
            
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
            }} className="btn-gold w-full py-2.5 font-bold mt-4">ابدأ عملية المزامنة الأمنية</button>
          </div>

        </div>

        {/* Studio Upload Action buttons */}
        <div className="mb-6 flex gap-3">
          <button onClick={() => setShowPhotoUpload(true)} className="btn-outline-gold px-5 py-2.5 flex items-center gap-2 font-bold bg-yellow-400/5 hover:bg-yellow-400/10">📸 رفع صور استوديو جديدة</button>
        </div>

        {/* Bookings Table card */}
        <div className="card border border-white/5 p-6 bg-black/30">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
            <h3 className="text-white font-black text-xl flex items-center gap-2">📅 جدول الحجوزات الشامل</h3>
            <span className="badge-gold font-mono">{bookings.length} حجوزات كلية</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-white/10">
                  {['العميل', 'رقم الهاتف', 'الخدمة', 'التاريخ', 'الوقت', 'النوع', 'السعر الإجمالي', 'حالة الحجز', 'إجراءات لوحة التحكم'].map(h => (
                    <th key={h} className="text-gray-400 text-xs font-semibold py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookingsLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16">
                      <div className="loader mx-auto mb-3 animate-spin"></div>
                      <p className="text-gray-400 text-sm">جاري تحميل جدول المواعيد...</p>
                    </td>
                  </tr>
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-16 text-gray-500 font-medium">
                      لا توجد مواعيد مسجلة في قاعدة البيانات حالياً
                    </td>
                  </tr>
                ) : (
                  appointments.map((appt: any) => {
                    const origBooking = appt
                    return (
                      <tr key={appt.id} className="border-b border-white/5 hover:bg-white/3 transition-colors duration-200">
                        <td className="py-4 px-4 text-white text-sm whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <img
                              src={appt.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                              alt={appt.customer_name}
                              className="w-9 h-9 rounded-full border border-yellow-400/20 object-cover shadow-sm shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'
                              }}
                            />
                            <div>
                              <div className="font-bold text-white leading-tight">{appt.customer_name || 'عميل مجهول'}</div>
                              <div className="flex items-center gap-2 mt-0.5">
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
                        <td className="py-4 px-4 text-gray-300 text-xs whitespace-nowrap font-mono select-all">
                          {appt.customer_phone || 'بدون هاتف'}
                        </td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{origBooking.service_name || 'خدمة صالون'}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{appt.appointment_date}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{appt.appointment_time}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{origBooking.booking_type === 'salon' ? 'صالون' : 'منزلي'}</td>
                        <td className="py-4 px-4 text-yellow-400 font-bold text-sm whitespace-nowrap">{origBooking.total_price || 0} د.أ</td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <select 
                            value={appt.status} 
                            onChange={e => updateStatusMutation.mutate({ id: appt.id, status: e.target.value })} 
                            className="bg-neutral-800 text-xs border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-yellow-400"
                          >
                            <option value="pending">قيد الانتظار</option>
                            <option value="confirmed">مؤكد</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap text-left">
                          {appt.status === 'completed' ? (
                            <span
                              className="bg-gray-500/10 text-gray-400/80 border border-gray-500/20 text-xs px-2.5 py-1.5 rounded-lg font-bold select-none inline-flex items-center gap-1 cursor-default ml-2"
                            >
                              تم إتمام الحلاقة بنجاح
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                if (window.confirm('هل تريد تأكيد حضور العميل وإتمام الحلاقة؟ سيتم إضافة 10 نقاط ولاء لحسابه.')) {
                                  confirmHaircutMutation.mutate({ bookingId: appt.id, points: 10 })
                                }
                              }}
                              disabled={confirmHaircutMutation.isPending && confirmHaircutMutation.variables?.bookingId === appt.id}
                              className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all duration-200 hover:scale-105 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ml-2"
                            >
                              {confirmHaircutMutation.isPending && confirmHaircutMutation.variables?.bookingId === appt.id ? 'جاري التأكيد...' : 'تأكيد إتمام الحلاقة'}
                            </button>
                          )}
                          <button onClick={() => setEditingBooking(origBooking)} className="text-gray-400 hover:text-white transition-colors ml-2" title="تعديل الحجز"><Edit className="w-4 h-4 inline" /></button>
                          <button onClick={() => { if (window.confirm('هل تريد حذف وإزالة هذا الحجز نهائياً من السجلات؟')) deleteMutation.mutate(appt.id) }} className="text-red-400 hover:text-red-300 transition-colors" title="حذف وإزالة الحجز نهائياً"><Trash2 className="w-4 h-4 inline" /></button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowCreateModal(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glass-dark rounded-2xl p-6 w-full max-w-lg z-10">
            <h3 className="text-white font-bold mb-4">حجز جديد نيابة عن مستخدم</h3>
            <CreateBookingForm profiles={profiles} onCreate={async (payload) => {
              try { 
                await createMutation.mutateAsync(payload)
                setShowCreateModal(false) 
              } catch (err: any) { 
                toast.error(err.message || 'فشل إنشاء الحجز') 
              }
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
              try { 
                await modifyMutation.mutateAsync({ id: editingBooking.id, updates })
                setEditingBooking(null) 
              } catch (err: any) { 
                toast.error(err.message || 'فشل تعديل الحجز') 
              }
            }} onCancel={() => setEditingBooking(null)} />
          </motion.div>
        </div>
      )}

      {/* Photo upload modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowPhotoUpload(false)} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative glass-dark rounded-2xl p-6 w-full max-w-md z-10">
            <h3 className="text-white font-bold mb-4">رفع صور الاستوديو الفاخرة</h3>
            <ImageUpload onUpload={async (result: any) => {
              try {
                const authSupabase = await getAuthenticatedClient()
                const { error } = await authSupabase.from('gallery_photos').insert({
                  image_url: result.secure_url,
                  cloudinary_public_id: result.public_id,
                  caption: '',
                })
                if (error) throw error
                toast.success('✅ تم حفظ سجل الصورة بالاستوديو بنجاح!')
                setShowPhotoUpload(false)
                // refresh photos
                await queryClient.invalidateQueries({ queryKey: ['studio-photos'] })
              } catch (err: any) {
                toast.error(err.message || 'فشل حفظ الصورة')
              }
            }} onRemove={() => { }} folder="salon-alhewwari/studio" />
            <div className="mt-4 text-right"><button onClick={() => setShowPhotoUpload(false)} className="btn-outline-gold font-bold">إغلاق النافذة</button></div>
          </motion.div>
        </div>
      )}

    </div>
  )
}

export default AdminDashboardPage
