import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Edit, Trash2, Plus, Menu, X, Briefcase, Users, Image, LogOut, Check, ChevronRight, Award } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Link, Navigate } from 'react-router-dom'
import { Service, SERVICES, BARBERS } from '@/types'
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
  getServices,
  addService,
  convertTo12Hour,
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
const CreateBookingForm: React.FC<{ profiles: any[]; services: Service[]; onCreate: (p: any) => void; onCancel: () => void }> = ({ profiles, services, onCreate, onCancel }) => {
  const [userId, setUserId] = useState<string | undefined>(profiles[0]?.id)
  const [serviceId, setServiceId] = useState(services[0]?.id || '')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [timeSlots, setTimeSlots] = useState<string[]>([])
  const [time, setTime] = useState('12:00')
  const [bookingType, setBookingType] = useState<'salon' | 'home'>('salon')
  const [isUrgent, setIsUrgent] = useState(false)
  const [notes, setNotes] = useState('')
  const [barberName, setBarberName] = useState(BARBERS[0])

  useEffect(() => {
    getAvailableSlots(date).then((slots) => {
      setTimeSlots(slots)
      setTime(slots[0] || '12:00')
    })
  }, [date])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-gray-400 text-xs mb-1 block text-right font-medium">المستخدم</label>
        <select className="input-field text-right" value={userId} onChange={(e) => setUserId(e.target.value)}>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>{p.full_name || p.email} ({p.phone || 'بدون هاتف'})</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-gray-400 text-xs mb-1 block text-right font-medium">الخدمة</label>
        <select className="input-field text-right" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — صالون: {s.salonPrice !== null ? `${s.salonPrice} د.أ` : 'N/A'} | منزلي: {s.homePrice !== null ? `${s.homePrice} د.أ` : 'N/A'}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-gray-400 text-xs mb-1 block text-right font-medium">الوقت</label>
          <select className="input-field text-right" value={time} onChange={(e) => setTime(e.target.value)}>
            {timeSlots.map((t) => <option key={t} value={t}>{convertTo12Hour(t)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block text-right font-medium">التاريخ</label>
          <input className="input-field text-right" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs mb-1 block text-right font-medium">الحلاق المفضل</label>
        <select className="input-field text-right" value={barberName} onChange={(e) => setBarberName(e.target.value)}>
          {BARBERS.map((barber) => (
            <option key={barber} value={barber}>{barber}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center justify-end gap-2 pt-6">
          <label className="text-white text-sm font-medium cursor-pointer" htmlFor="urgent-booking">
            حجز عاجل (+5 دنانير)
          </label>
          <input
            id="urgent-booking"
            type="checkbox"
            className="w-4 h-4 accent-yellow-400 rounded"
            checked={isUrgent}
            onChange={(e) => setIsUrgent(e.target.checked)}
          />
        </div>
        <div>
          <label className="text-gray-400 text-xs mb-1 block text-right font-medium">مكان تقديم الخدمة</label>
          <select className="input-field text-right" value={bookingType} onChange={(e) => setBookingType(e.target.value as any)}>
            <option value="salon">في الصالون</option>
            <option value="home">حجز منزلي</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-gray-400 text-xs mb-1 block text-right font-medium">ملاحظات (اختياري)</label>
        <textarea
          className="input-field text-right resize-none text-sm"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="أي تفاصيل أو طلبات خاصة للموعد..."
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => {
            const service = services.find(s => s.id === serviceId)
            if (!service) return toast.error('الرجاء اختيار خدمة')
            const price = bookingType === 'salon' ? service.salonPrice : service.homePrice
            if (price === null) {
              toast.error('عذراً، هذه الخدمة غير متاحة للموقع المحدد.')
              return
            }
            onCreate({
              user_id: userId,
              service_name: service.name,
              service_price: price,
              booking_type: bookingType,
              date,
              time,
              is_urgent: isUrgent,
              notes,
              selected_services: [service],
              barber_name: barberName
            })
          }}
          className="btn-gold flex-1 font-bold py-2.5 text-sm"
        >
          إنشاء الحجز
        </button>
        <button onClick={onCancel} className="btn-outline-gold px-5 text-sm font-bold">إلغاء</button>
      </div>
    </div>
  )
}

// ------------------ Edit Booking Form ------------------
const EditBookingForm: React.FC<{ booking: any; onSave: (u: any) => void; onCancel: () => void }> = ({ booking, onSave, onCancel }) => {
  const [date, setDate] = useState(booking.date?.slice(0, 10) || new Date().toISOString().slice(0, 10))
  const [slots, setSlots] = useState<string[]>([])
  const [time, setTime] = useState(booking.time || '12:00')
  const [barberName, setBarberName] = useState(booking.barber_name || BARBERS[0])

  useEffect(() => {
    getAvailableSlots(date).then((s) => {
      setSlots(s)
      if (!s.includes(time)) setTime(s[0] || '12:00')
    })
  }, [date])

  return (
    <div className="space-y-4">
      <div>
        <label className="text-gray-400 text-xs mb-1 block text-right font-medium">التاريخ</label>
        <input className="input-field text-right" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <label className="text-gray-400 text-xs mb-1 block text-right font-medium">الوقت الجديد</label>
        <select className="input-field text-right" value={time} onChange={(e) => setTime(e.target.value)}>
          {slots.map(s => <option key={s} value={s}>{convertTo12Hour(s)}</option>)}
        </select>
      </div>
      <div>
        <label className="text-gray-400 text-xs mb-1 block text-right font-medium">الحلاق</label>
        <select className="input-field text-right" value={barberName} onChange={(e) => setBarberName(e.target.value)}>
          {BARBERS.map((barber) => (
            <option key={barber} value={barber}>{barber}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={() => onSave({ date, time, barber_name: barberName })} className="btn-gold flex-1 font-bold py-2.5 text-sm">حفظ التغييرات</button>
        <button onClick={onCancel} className="btn-outline-gold px-5 text-sm font-bold">إلغاء</button>
      </div>
    </div>
  )
}

const PRESET_24H_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00', '23:30',
  '00:00', '00:30', '01:00', '01:30', '02:00'
]

const AdminDashboardPage: React.FC = () => {
  const { user, loading, getAuthenticatedClient } = useAuth()
  const { getToken } = useClerkAuth()

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<any | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const queryClient = useQueryClient()

  // Tabs navigation state
  const [activeTab, setActiveTab] = useState<'bookings' | 'times' | 'services' | 'clerk' | 'gallery'>('bookings')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPresetSlot, setSelectedPresetSlot] = useState<string>('')

  // Service creation states
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceIcon, setNewServiceIcon] = useState('✂️')
  const [newServiceSalonPrice, setNewServiceSalonPrice] = useState<string>('')
  const [newServiceHomePrice, setNewServiceHomePrice] = useState<string>('')
  const [newServiceDuration, setNewServiceDuration] = useState(30)
  const [newServiceDesc, setNewServiceDesc] = useState('')

  // Data
  const { data: bookings = [], isLoading: bookingsLoading } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      const { data, error } = await authSupabase
        .from('bookings')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      return data || []
    },
  })

  // Dynamic services fetching
  const { data: dbServices = [], isLoading: dbServicesLoading, refetch: refetchServices } = useQuery({
    queryKey: ['admin-services'],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      return getServices(authSupabase)
    }
  })

  const appointments = React.useMemo(() => {
    return [...bookings].sort((a: any, b: any) => {
      const dateA = a.date || ''
      const dateB = b.date || ''
      const dateDiff = dateB.localeCompare(dateA) // newest date first
      if (dateDiff !== 0) return dateDiff
      return (b.time || '').localeCompare(a.time || '')
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

  // Admin sync profile ID
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')

  // Mutations
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

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: any) => {
      const authSupabase = await getAuthenticatedClient()
      return updateBookingStatus(id, status, authSupabase)
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      if (variables.status === 'completed') {
        queryClient.invalidateQueries({ queryKey: ['profiles'] })
        toast.success('تمت الحلاقة بنجاح وتم إضافة 20 نقطة ولاء للزبون!')
      } else {
        toast.success('✅ تم تحديث حالة الحجز بنجاح')
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const authSupabase = await getAuthenticatedClient()
      return deleteBooking(id, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      toast.success('✅ تم حذف الحجز وإلغاؤه من السجلات')
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
    mutationFn: async ({ bookingId, points = 20 }: { bookingId: string; points?: number }) => {
      const authSupabase = await getAuthenticatedClient()
      const { data, error } = await authSupabase.rpc('confirm_haircut_completed', {
        p_booking_id: bookingId,
        p_points_to_add: points,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('تمت الحلاقة بنجاح وتم إضافة 20 نقطة ولاء للزبون!')
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] })
      queryClient.invalidateQueries({ queryKey: ['profiles'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'فشل تأكيد إتمام الحلاقة')
    }
  })

  // Dynamic Service Creation Mutation
  const addServiceMutation = useMutation({
    mutationFn: async (serviceData: Omit<Service, 'id'>) => {
      const authSupabase = await getAuthenticatedClient()
      return addService(serviceData, authSupabase)
    },
    onSuccess: () => {
      refetchServices()
      toast.success('✅ تم حفظ الخدمة المضافة مباشرة في قاعدة البيانات!')
      setNewServiceName('')
      setNewServiceSalonPrice('')
      setNewServiceHomePrice('')
      setNewServiceDesc('')
    },
    onError: (err: any) => {
      toast.error('❌ فشل إضافة الخدمة: ' + err.message)
    }
  })

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newServiceName.trim()) return toast.error('الرجاء إدخال اسم الخدمة')

    const salonPrice = newServiceSalonPrice.trim() !== '' ? Number(newServiceSalonPrice) : null
    const homePrice = newServiceHomePrice.trim() !== '' ? Number(newServiceHomePrice) : null

    if (salonPrice === null && homePrice === null) {
      return toast.error('الرجاء إدخال سعر واحد على الأقل (صالون أو منزلي)')
    }

    addServiceMutation.mutate({
      name: newServiceName.trim(),
      icon: newServiceIcon,
      salonPrice,
      homePrice,
      duration: newServiceDuration,
      description: newServiceDesc,
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="loader w-12 h-12 border-4 border-yellow-400/20 border-t-yellow-400"></div>
    </div>
  )
  if (!user) return <Navigate to="/login" />

  const tabsConfig = [
    { id: 'bookings', name: 'جدول الحجوزات', icon: Calendar },
    { id: 'times', name: 'إدارة الأوقات المتاحة', icon: Clock },
    { id: 'services', name: 'إدارة خدمات الصالون', icon: Briefcase },
    { id: 'clerk', name: 'مزامنة أدوار Clerk', icon: Users },
    { id: 'gallery', name: 'الاستوديو والرفع', icon: Image },
  ] as const

  return (
    <div className="min-h-screen bg-black text-right flex flex-col md:flex-row-reverse" dir="rtl">
      
      {/* Mobile Top Navbar (Hamburger) */}
      <div className="md:hidden flex items-center justify-between p-4 bg-neutral-900 border-b border-white/5 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse"></span>
          <h1 className="text-white font-black text-sm">لوحة الإدارة</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-gray-400 hover:text-white rounded-lg glass"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 right-0 z-35 w-64 bg-neutral-900/95 md:bg-neutral-900/60 border-l border-white/5 p-6 flex flex-col justify-between transition-transform duration-300 transform md:translate-x-0 md:static ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="space-y-6 mt-16 md:mt-0">
          <div className="pb-6 border-b border-white/5">
            <p className="text-gray-400 text-xs">مرحباً بك،</p>
            <h2 className="text-xl font-black text-white mt-1 select-none">{user.full_name?.split(' ')[0]} 👋</h2>
            <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-2 py-0.5 mt-2 inline-block rounded border border-yellow-400/20 font-bold">🔒 مسؤول النظام</span>
          </div>

          <nav className="space-y-1">
            {tabsConfig.map((tab) => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id)
                    setSidebarOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                    isActive
                      ? 'gold-gradient text-black font-bold'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon className="w-4 h-4 shrink-0" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/5">
          <Link
            to="/booking"
            className="btn-outline-gold w-full text-center py-2.5 text-xs font-bold flex items-center justify-center gap-1 bg-yellow-400/5 hover:bg-yellow-400/10"
          >
            صفحة الحجز زبون <ChevronRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </aside>

      {/* Backdrop for mobile menu */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}

      {/* Main Content Pane */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto space-y-8">
        
        {/* Active Tab rendering */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            
            {/* 1. BOOKINGS TAB */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-white">جدول المواعيد الشامل 💈</h2>
                    <p className="text-gray-400 text-xs mt-1">تتبع مواعيد الزبائن، حالات الحجز، ونقاط الولاء.</p>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-gold px-5 py-2.5 flex items-center gap-2 font-bold text-sm"
                  >
                    <Plus className="w-4 h-4" /> حجز جديد (يدوي)
                  </button>
                </div>

                {/* Quick Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'إجمالي الحجوزات', value: bookings.length },
                    { label: 'قيد الانتظار', value: bookings.filter((b: any) => b.status === 'pending').length },
                    { label: 'مؤكدة', value: bookings.filter((b: any) => b.status === 'confirmed').length },
                    { label: 'مكتملة', value: bookings.filter((b: any) => b.status === 'completed').length },
                  ].map((stat) => (
                    <div key={stat.label} className="card p-4 border border-white/5">
                      <div className="text-2xl font-black text-white">{stat.value}</div>
                      <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Bookings View Container */}
                <div className="card p-5 border border-white/5 bg-black/40">
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                    <h3 className="text-white font-black text-lg">سجلات الحجز</h3>
                    <span className="badge-gold font-mono text-xs">{appointments.length} حجز</span>
                  </div>

                  {bookingsLoading ? (
                    <div className="text-center py-16">
                      <div className="loader mx-auto mb-3 animate-spin border-4 border-yellow-400/20 border-t-yellow-400 w-10 h-10 rounded-full"></div>
                      <p className="text-gray-400 text-sm">جاري تحميل المواعيد...</p>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 text-sm font-medium">
                      لا توجد مواعيد مسجلة في قاعدة البيانات حالياً.
                    </div>
                  ) : (
                    <>
                      {/* Responsive Mobile Layout (Card list) */}
                      <div className="block lg:hidden space-y-4">
                        {appointments.map((appt: any) => {
                          const clientProfile = profiles.find((x: any) => x.id === appt.user_id)
                          const points = clientProfile?.loyalty_points ?? 0
                          const formattedDate = appt.date
                          return (
                            <div key={appt.id} className="card p-4 border border-white/5 bg-neutral-900/50 space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={clientProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                                    alt="Client"
                                    className="w-10 h-10 rounded-full border border-yellow-400/10 object-cover shadow"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'
                                    }}
                                  />
                                  <div>
                                    <h4 className="font-bold text-white text-sm">{clientProfile?.full_name || 'عميل الصالون'}</h4>
                                    <div className="text-xs text-gray-400">{clientProfile?.phone || 'بدون هاتف'}</div>
                                  </div>
                                </div>
                                <StatusBadge status={appt.status} />
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs border-t border-b border-white/5 py-2.5">
                                <div>
                                  <span className="text-gray-500">الخدمة: </span>
                                  <span className="text-white font-medium">{appt.service_name}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">المكان: </span>
                                  <span className="text-white font-medium">{appt.booking_type === 'salon' ? 'في الصالون' : 'منزلي'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">الحلاق: </span>
                                  <span className="text-white font-medium">{appt.barber_name || 'غير محدد'}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">التاريخ: </span>
                                  <span className="text-white font-medium">{formattedDate}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">الوقت: </span>
                                  <span className="text-white font-medium">{convertTo12Hour(appt.time)}</span>
                                </div>
                                <div>
                                  <span className="text-gray-500">السعر: </span>
                                  <span className="text-yellow-400 font-bold">{appt.total_price || 0} د.أ</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-gray-500">النقاط: </span>
                                  <span className="text-yellow-400 font-bold">⭐ {points} نقطة</span>
                                </div>
                              </div>

                              {appt.notes && (
                                <p className="text-xs text-gray-400 bg-black/20 p-2 rounded-lg text-right">
                                  <span className="text-gray-500 font-bold">ملاحظات:</span> {appt.notes}
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-2 pt-1.5 justify-between">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => setEditingBooking(appt)}
                                    className="p-2 text-gray-400 hover:text-white rounded-lg glass border border-white/5"
                                    title="تعديل وقت الحجز"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => { if (window.confirm('هل تريد حذف وإزالة هذا الحجز نهائياً من السجلات؟')) deleteMutation.mutate(appt.id) }}
                                    className="p-2 text-red-400 hover:text-red-300 rounded-lg glass border border-red-500/10"
                                    title="حذف الحجز نهائياً"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="flex items-center gap-2">
                                  <select 
                                    value={appt.status} 
                                    onChange={e => {
                                      const nextStatus = e.target.value
                                      if (nextStatus === 'completed') {
                                        if (window.confirm('هل تريد تأكيد حضور العميل وإتمام الحلاقة؟ سيتم إضافة 20 نقطة ولاء لحسابه.')) {
                                          updateStatusMutation.mutate({ id: appt.id, status: nextStatus })
                                        }
                                      } else {
                                        updateStatusMutation.mutate({ id: appt.id, status: nextStatus })
                                      }
                                    }}
                                    className="bg-neutral-800 text-xs border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:border-yellow-400"
                                  >
                                    <option value="pending">قيد الانتظار</option>
                                    <option value="confirmed">مؤكد</option>
                                    <option value="completed">مكتمل</option>
                                    <option value="cancelled">ملغي</option>
                                  </select>

                                  {appt.status !== 'completed' && (
                                    <button
                                      onClick={() => {
                                        if (window.confirm('هل تريد تأكيد حضور العميل وإتمام الحلاقة؟ سيتم إضافة 20 نقطة ولاء لحسابه.')) {
                                          confirmHaircutMutation.mutate({ bookingId: appt.id, points: 20 })
                                        }
                                      }}
                                      disabled={confirmHaircutMutation.isPending && confirmHaircutMutation.variables?.bookingId === appt.id}
                                      className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition-all"
                                    >
                                      إتمام الحلاقة
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Desktop Table view (Larger screens) */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                          <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-xs font-semibold">
                              <th className="py-3 px-4">الزبون</th>
                              <th className="py-3 px-4">رقم الهاتف</th>
                              <th className="py-3 px-4">الخدمات المطلوبة</th>
                              <th className="py-3 px-4">الحلاق</th>
                              <th className="py-3 px-4">التاريخ والوقت</th>
                              <th className="py-3 px-4">المكان</th>
                              <th className="py-3 px-4">السعر الكلي</th>
                              <th className="py-3 px-4">حالة الحجز</th>
                              <th className="py-3 px-4 text-left">خيارات التحكم</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appointments.map((appt: any) => {
                              const clientProfile = profiles.find((x: any) => x.id === appt.user_id)
                              const points = clientProfile?.loyalty_points ?? 0
                              return (
                                <tr key={appt.id} className="border-b border-white/5 hover:bg-white/3 transition-colors duration-200 text-sm">
                                  <td className="py-4 px-4 text-white">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={clientProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'}
                                        alt="Client"
                                        className="w-9 h-9 rounded-full border border-yellow-400/20 object-cover shrink-0"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'
                                        }}
                                      />
                                      <div>
                                        <div className="font-bold text-white leading-tight">{clientProfile?.full_name || 'عميل الصالون'}</div>
                                        <span className="text-[10px] bg-yellow-400/10 text-yellow-400 px-1.5 py-0.5 mt-1 inline-block rounded border border-yellow-400/20 font-bold leading-none select-none">
                                          ⭐ {points} نقطة
                                        </span>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-4 text-gray-300 font-mono text-xs select-all">
                                    {clientProfile?.phone || 'بدون هاتف'}
                                  </td>
                                  <td className="py-4 px-4 text-gray-300 font-medium">
                                    {appt.service_name}
                                  </td>
                                  <td className="py-4 px-4 text-gray-300 font-medium">
                                    {appt.barber_name || <span className="text-gray-500">غير محدد</span>}
                                  </td>
                                  <td className="py-4 px-4 text-gray-300">
                                    <div className="font-medium text-white">{appt.date}</div>
                                    <div className="text-gray-500 text-xs mt-0.5">{convertTo12Hour(appt.time)}</div>
                                  </td>
                                  <td className="py-4 px-4 text-gray-300">
                                    {appt.booking_type === 'salon' ? 'في الصالون' : 'حجز منزلي'}
                                  </td>
                                  <td className="py-4 px-4 text-yellow-400 font-bold">
                                    {appt.total_price || 0} د.أ
                                  </td>
                                  <td className="py-4 px-4">
                                    <select 
                                      value={appt.status} 
                                      onChange={e => {
                                        const nextStatus = e.target.value
                                        if (nextStatus === 'completed') {
                                          if (window.confirm('هل تريد تأكيد حضور العميل وإتمام الحلاقة؟ سيتم إضافة 20 نقطة ولاء لحسابه.')) {
                                            updateStatusMutation.mutate({ id: appt.id, status: nextStatus })
                                          }
                                        } else {
                                          updateStatusMutation.mutate({ id: appt.id, status: nextStatus })
                                        }
                                      }}
                                      className="bg-neutral-800 text-xs border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-yellow-400"
                                    >
                                      <option value="pending">قيد الانتظار</option>
                                      <option value="confirmed">مؤكد</option>
                                      <option value="completed">مكتمل</option>
                                      <option value="cancelled">ملغي</option>
                                    </select>
                                  </td>
                                  <td className="py-4 px-4 text-left whitespace-nowrap">
                                    {appt.status === 'completed' ? (
                                      <span
                                        className="bg-gray-500/10 text-gray-400/80 border border-gray-500/20 text-xs px-2.5 py-1.5 rounded-lg font-bold select-none inline-flex items-center gap-1 cursor-default ml-2"
                                      >
                                        تم الحلاقة وإضافة النقاط
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => {
                                          if (window.confirm('هل تريد تأكيد حضور العميل وإتمام الحلاقة؟ سيتم إضافة 20 نقطة ولاء لحسابه.')) {
                                            confirmHaircutMutation.mutate({ bookingId: appt.id, points: 20 })
                                          }
                                        }}
                                        disabled={confirmHaircutMutation.isPending && confirmHaircutMutation.variables?.bookingId === appt.id}
                                        className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-xs px-2.5 py-1.5 rounded-lg font-bold transition-all duration-200 hover:scale-105 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed ml-2 font-bold"
                                      >
                                        {confirmHaircutMutation.isPending && confirmHaircutMutation.variables?.bookingId === appt.id ? 'جاري التأكيد...' : 'تأكيد إتمام الحلاقة'}
                                      </button>
                                    )}
                                    <button onClick={() => setEditingBooking(appt)} className="text-gray-400 hover:text-white transition-colors ml-2" title="تعديل الحجز"><Edit className="w-4.5 h-4.5 inline" /></button>
                                    <button onClick={() => { if (window.confirm('هل تريد حذف وإزالة هذا الحجز نهائياً من السجلات؟')) deleteMutation.mutate(appt.id) }} className="text-red-400 hover:text-red-300 transition-colors" title="حذف وإزالة الحجز نهائياً"><Trash2 className="w-4.5 h-4.5 inline" /></button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 2. TIMES MANAGEMENT TAB */}
            {activeTab === 'times' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">إدارة الأوقات المتاحة 📅</h2>
                  <p className="text-gray-400 text-xs mt-1">تحديد أوقات إضافية متاحة للحجز بشكل يدوي للتاريخ المطلوب.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Form Card (Operational slots selection list) */}
                  <div className="card p-5 border border-white/5 bg-black/40 h-fit space-y-4">
                    <h3 className="text-white font-bold text-base">إضافة موعد متاح جديد</h3>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">اختر التاريخ</label>
                      <input type="date" className="input-field text-right" value={manualDate} onChange={e => setManualDate(e.target.value)} />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-gray-400 text-xs mb-1 block text-right font-medium">الأوقات التشغيلية الجاهزة:</label>
                      <div className="grid grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-2 bg-neutral-950/60 rounded-xl">
                        {PRESET_24H_SLOTS.map(t => {
                          const isSelected = selectedPresetSlot === t
                          // Check if this time slot is already added/active
                          const isAlreadyAdded = manualSlots.some((s: any) => s.time.slice(0, 5) === t)
                          
                          return (
                            <button
                              key={t}
                              type="button"
                              disabled={isAlreadyAdded}
                              onClick={() => setSelectedPresetSlot(t)}
                              className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold transition-all ${
                                isSelected
                                  ? 'gold-gradient text-black font-black'
                                  : isAlreadyAdded
                                  ? 'bg-neutral-800/30 text-gray-600 border border-neutral-800/40 cursor-not-allowed opacity-30'
                                  : 'glass text-gray-300 hover:text-yellow-400'
                              }`}
                            >
                              {convertTo12Hour(t)}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <button 
                      type="button"
                      onClick={() => {
                        if (!selectedPresetSlot) return toast.error('الرجاء اختيار وقت من القائمة التشغيلية أولاً')
                        addManualSlot.mutate({ date: manualDate, time: selectedPresetSlot })
                        setSelectedPresetSlot('')
                      }}
                      disabled={!selectedPresetSlot || addManualSlot.isPending}
                      className="btn-gold w-full py-2.5 font-bold text-sm disabled:opacity-50"
                    >
                      {addManualSlot.isPending ? 'جاري الإضافة...' : 'إضافة الموعد المحدد (إضافة وقت)'}
                    </button>
                  </div>

                  {/* Listings Card */}
                  <div className="card p-5 border border-white/5 bg-black/40 lg:col-span-2 space-y-4">
                    <h3 className="text-white font-bold text-base flex justify-between">
                      <span>الأوقات النشطة والمتاحة حالياً</span>
                      <span className="text-xs text-yellow-400">ليوم: {manualDate}</span>
                    </h3>
                    <div className="flex flex-wrap gap-2.5 p-3 bg-neutral-950/60 rounded-xl min-h-48 content-start">
                      {manualSlots.length === 0 ? (
                        <div className="text-gray-500 text-sm p-4 text-center w-full my-auto font-medium">
                          لا توجد أوقات مضافة يدوياً لهذا اليوم.
                        </div>
                      ) : (
                        manualSlots.map((s: any) => (
                          <div key={s.id} className="px-3 py-1.5 rounded-full bg-white/5 flex items-center gap-2 border border-white/5">
                            <span className="text-white text-xs font-mono font-bold">{convertTo12Hour(s.time)}</span>
                            <button 
                              onClick={() => removeManualSlot.mutate({ date: manualDate, time: s.time })}
                              className="text-red-400 hover:text-red-300 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* 3. DYNAMIC SERVICES MANAGEMENT TAB */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">إدارة خدمات الصالون 💼</h2>
                  <p className="text-gray-400 text-xs mt-1">إضافة خدمات جديدة أو استعراض الخدمات المعروضة للزبائن.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Service Creation Form */}
                  <div className="card p-5 border border-white/5 bg-black/40 h-fit space-y-4">
                    <h3 className="text-white font-bold text-base border-b border-white/5 pb-2 mb-3">أضف خدمة جديدة</h3>
                    
                    <form onSubmit={handleAddService} className="space-y-4">
                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">اسم الخدمة باللغة العربية</label>
                        <input
                          type="text"
                          className="input-field text-right"
                          placeholder="مثال: تنظيف بشرة VIP"
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-400 text-xs mb-1 block">المدة (بالدقائق)</label>
                          <input
                            type="number"
                            className="input-field text-center font-bold"
                            value={newServiceDuration}
                            onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                            min={5}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-xs mb-1 block">الأيقونة (رمز تعبيري)</label>
                          <select
                            className="input-field text-center text-lg"
                            value={newServiceIcon}
                            onChange={(e) => setNewServiceIcon(e.target.value)}
                          >
                            <option value="✂️">✂️ قص</option>
                            <option value="🪒">🪒 ذقن</option>
                            <option value="💈">💈 صالون</option>
                            <option value="🌿">🌿 طبيعي</option>
                            <option value="✨">✨ بريق</option>
                            <option value="💨">💨 مجفف</option>
                            <option value="🕯️">🕯️ شمع</option>
                            <option value="🌀">🌀 كيرلي</option>
                            <option value="👑">👑 عريس</option>
                            <option value="🎨">🎨 صبغة</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-gray-400 text-xs mb-1 block">سعر التوصيل للمنزل (اختياري)</label>
                          <input
                            type="number"
                            step="0.5"
                            className="input-field text-center font-bold"
                            placeholder="N/A"
                            value={newServiceHomePrice}
                            onChange={(e) => setNewServiceHomePrice(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-gray-400 text-xs mb-1 block">السعر داخل الصالون (اختياري)</label>
                          <input
                            type="number"
                            step="0.5"
                            className="input-field text-center font-bold"
                            placeholder="N/A"
                            value={newServiceSalonPrice}
                            onChange={(e) => setNewServiceSalonPrice(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-gray-400 text-xs mb-1 block">تفاصيل أو وصف الخدمة (اختياري)</label>
                        <textarea
                          rows={2}
                          className="input-field text-right text-xs"
                          placeholder="وصف مختصر للخدمة والمواد المستخدمة..."
                          value={newServiceDesc}
                          onChange={(e) => setNewServiceDesc(e.target.value)}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={addServiceMutation.isPending}
                        className="btn-gold w-full py-2.5 font-bold text-sm"
                      >
                        {addServiceMutation.isPending ? 'جاري الحفظ والرفع...' : 'حفظ ونشر الخدمة'}
                      </button>
                    </form>
                  </div>

                  {/* Services List display */}
                  <div className="card p-5 border border-white/5 bg-black/40 lg:col-span-2 space-y-4">
                    <h3 className="text-white font-bold text-base border-b border-white/5 pb-2">الخدمات المفعلة حالياً في النظام</h3>
                    
                    {dbServicesLoading ? (
                      <div className="text-center py-12 text-gray-400">جاري تحميل قائمة الخدمات...</div>
                    ) : dbServices.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">لا توجد خدمات متاحة حالياً.</div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto p-1">
                        {dbServices.map((service) => (
                          <div
                            key={service.id}
                            className="p-4 rounded-xl bg-neutral-900/60 border border-white/5 flex items-start gap-3 justify-between"
                          >
                            <div className="text-2xl p-2.5 bg-black/40 rounded-lg border border-white/5 shrink-0">
                              {service.icon}
                            </div>
                            <div className="flex-1 text-right space-y-1">
                              <h4 className="font-bold text-white text-sm">{service.name}</h4>
                              <p className="text-[10px] text-gray-500">{service.duration} دقيقة • {service.description || 'لا يوجد وصف للخدمة'}</p>
                              
                              <div className="flex items-center gap-3 pt-1 text-xs font-mono">
                                <span className="text-gray-400">صالون: <strong className="text-yellow-400">{service.salonPrice !== null ? `${service.salonPrice} د.أ` : 'N/A'}</strong></span>
                                <span className="text-gray-400">منزلي: <strong className="text-yellow-400">{service.homePrice !== null ? `${service.homePrice} د.أ` : 'N/A'}</strong></span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* 4. CLERK SYNC TAB */}
            {activeTab === 'clerk' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">مزامنة مستخدمي Clerk 🔄</h2>
                  <p className="text-gray-400 text-xs mt-1">تزامن وتعديل صلاحيات المستخدمين مع Clerk و Supabase.</p>
                </div>

                <div className="card p-6 border border-white/5 bg-black/40 max-w-2xl space-y-6">
                  <p className="text-gray-300 text-sm leading-relaxed">
                    حدد المستخدم من القائمة أدناه للتحقق من دوره في نظام Clerk وجلبه لقاعدة بيانات Supabase الأمنية.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="text-gray-400 text-xs mb-1.5 block">الدور الحالي المسجل بقاعدة البيانات</label>
                      <input
                        className="input-field text-center font-bold opacity-80 cursor-default bg-neutral-900 border-white/5"
                        value={selectedProfileId ? (profiles.find((x: any) => x.id === selectedProfileId)?.role || 'customer') : ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1.5 block">الزبون / المستخدم</label>
                      <select
                        className="input-field text-right"
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                      >
                        <option value="">اختر مستخدماً من السجل...</option>
                        {profiles.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.full_name || p.email} ({p.email})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      if (!selectedProfileId) return toast.error('اختر مستخدماً أولاً')
                      try {
                        const token = await getToken()
                        if (!token) throw new Error('فشل تأمين رمز clerk')

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
                        toast.success(`تمت المزامنة — دور Clerk المكتشف: ${json.clerkRole || 'غير محدد'}`)
                        queryClient.invalidateQueries({ queryKey: ['profiles'] })
                      } catch (err: any) {
                        toast.error(err.message || 'فشل مزامنة دور Clerk')
                      }
                    }}
                    className="btn-gold w-full py-3 font-bold text-sm"
                  >
                    بدء عملية المزامنة وتأكيد الأمان
                  </button>
                </div>
              </div>
            )}

            {/* 5. STUDIO GALLERY TAB */}
            {activeTab === 'gallery' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-white">الاستوديو والرفع 📸</h2>
                  <p className="text-gray-400 text-xs mt-1">أضف صور حلاقة فاخرة أو تفاصيل أعمال الصالون للاستوديو.</p>
                </div>

                <div className="card p-6 border border-white/5 bg-black/40 max-w-xl text-center space-y-4">
                  <h3 className="text-white font-bold text-base">رفع صور استوديو فاخرة</h3>
                  <p className="text-gray-400 text-xs">ارفع صور لزبائن حقيقيين أو قصات حديثة لتظهر فوراً في معرض الصور على الصفحة الرئيسية.</p>
                  
                  <button
                    onClick={() => setShowPhotoUpload(true)}
                    className="btn-gold px-8 py-3 font-bold text-sm mx-auto flex items-center justify-center gap-2"
                  >
                    <Image className="w-4 h-4" /> فتح أداة رفع الصور السحابية Cloudinary
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>

      {/* CREATE BOOKING MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative glass-dark rounded-2xl p-6 w-full max-w-lg z-10 border border-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-black text-lg">حجز جديد بالنيابة عن مستخدم</h3>
            </div>
            <CreateBookingForm
              profiles={profiles}
              services={dbServices.length > 0 ? dbServices : SERVICES}
              onCreate={async (payload) => {
                try { 
                  await createMutation.mutateAsync(payload)
                  setShowCreateModal(false) 
                } catch (err: any) { 
                  toast.error(err.message || 'فشل إنشاء الحجز') 
                }
              }}
              onCancel={() => setShowCreateModal(false)}
            />
          </motion.div>
        </div>
      )}

      {/* EDIT BOOKING MODAL */}
      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setEditingBooking(null)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative glass-dark rounded-2xl p-6 w-full max-w-md z-10 border border-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <button onClick={() => setEditingBooking(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-black text-lg">تعديل وقت الموعد</h3>
            </div>
            <EditBookingForm
              booking={editingBooking}
              onSave={async (updates) => {
                try { 
                  await modifyMutation.mutateAsync({ id: editingBooking.id, updates })
                  setEditingBooking(null) 
                } catch (err: any) { 
                  toast.error(err.message || 'فشل تعديل الحجز') 
                }
              }}
              onCancel={() => setEditingBooking(null)}
            />
          </motion.div>
        </div>
      )}

      {/* Cloudinary Image upload modal */}
      {showPhotoUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setShowPhotoUpload(false)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative glass-dark rounded-2xl p-6 w-full max-w-md z-10 border border-white/10"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <button onClick={() => setShowPhotoUpload(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
              <h3 className="text-white font-black text-lg">رفع صور الاستوديو الفاخرة</h3>
            </div>
            
            <ImageUpload
              onUpload={async (result: any) => {
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
                  await queryClient.invalidateQueries({ queryKey: ['studio-photos'] })
                } catch (err: any) {
                  toast.error(err.message || 'فشل حفظ الصورة')
                }
              }}
              onRemove={() => { }}
              folder="salon-alhewwari/studio"
            />
            
            <div className="mt-4 text-left">
              <button onClick={() => setShowPhotoUpload(false)} className="btn-outline-gold font-bold px-4 py-2 text-xs">
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
}

export default AdminDashboardPage
