import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Award, Clock, CheckCircle, Edit, Trash2, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Link, Navigate } from 'react-router-dom'
import { POINTS_FOR_FREE, SERVICES } from '@/types'
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
} from '@/services/bookings'
import { getStudioPhotos, uploadStudioPhoto } from '@/services/studio'
import { supabase } from '@/lib/supabase'
import ImageUpload from '@/components/shared/ImageUpload'
import toast from 'react-hot-toast'

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'قيد الانتظار', cls: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20' },
    confirmed: { label: 'مؤكد', cls: 'bg-blue-400/10 text-blue-400 border-blue-400/20' },
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
  const { user, isAdmin, loading } = useAuth()
  const { getToken } = useClerkAuth()
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'bookings')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<any | null>(null)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const queryClient = useQueryClient()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center"><div className="loader w-12 h-12"></div></div>
  )
  if (!user) return <Navigate to="/login" />

  // Data
  const { data: bookings = [] } = useQuery({ queryKey: ['admin-bookings'], queryFn: getAllBookings, enabled: !!isAdmin })
  const { data: profiles = [] } = useQuery({ queryKey: ['profiles'], queryFn: async () => { const { data } = await supabase.from('profiles').select('id, full_name, email, role'); return data || [] }, enabled: !!isAdmin })

  // Manual (admin) available slots management
  const [manualDate, setManualDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const { data: manualSlots = [], refetch: refetchManualSlots } = useQuery({ queryKey: ['manual-slots', manualDate], queryFn: () => getManualSlots(manualDate), enabled: !!isAdmin })
  const addManualSlot = useMutation({ mutationFn: ({ date, time }: any) => addAvailableSlot(date, time, user?.id), onSuccess: () => { refetchManualSlots(); queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) } })
  const removeManualSlot = useMutation({ mutationFn: ({ date, time }: any) => removeAvailableSlot(date, time), onSuccess: () => { refetchManualSlots(); queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) } })
  // Clerk sync UI state
  const [selectedProfileId, setSelectedProfileId] = useState<string>('')

  // Mutations
  const updateStatusMutation = useMutation({ mutationFn: ({ id, status }: any) => updateBookingStatus(id, status), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) })
  const cancelMutation = useMutation({ mutationFn: (id: string) => cancelBooking(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) })
  const modifyMutation = useMutation({ mutationFn: ({ id, updates }: any) => modifyBooking(id, updates), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) })
  const createMutation = useMutation({ mutationFn: (data: any) => createBooking(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-bookings'] }) })
  

  const upcoming = bookings.filter((b: any) => b.status === 'confirmed')
  const past = bookings.filter((b: any) => b.status === 'completed')

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'حجوزاتي', value: bookings.length },
            { label: 'قادمة', value: upcoming.length },
            { label: 'النقاط', value: 80 },
            { label: 'مكتملة', value: past.length },
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
              ? [ { id: 'admin', label: 'جميع الحجوزات' }, { id: 'bookings', label: 'حجوزاتي' }, { id: 'loyalty', label: 'النقاط' } ]
              : [ { id: 'bookings', label: 'حجوزاتي' }, { id: 'loyalty', label: 'النقاط' } ]
            return tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'gold-gradient text-black' : 'glass text-gray-300 hover:text-white'}`}>{tab.label}</button>
            ))
          })()}
        </div>

        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {upcoming.length > 0 && (
                <>
                  <h3 className="text-white font-bold flex items-center gap-2 mb-4"><Clock className="w-5 h-5 text-yellow-400" />المواعيد القادمة</h3>
                  {upcoming.map((b: any) => (
                    <div key={b.id} className="card p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-bold">{b.service_name}</h4>
                          <p className="text-gray-400 text-sm mt-1">📅 {b.date} • ⏰ {b.time} • {b.booking_type === 'salon' ? '🏪 صالون' : '🏠 منزلي'}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={b.status} />
                          <p className="text-yellow-400 font-black text-lg mt-1">{b.total_price} د.أ</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              <h3 className="text-white font-bold flex items-center gap-2 mt-6 mb-4"><CheckCircle className="w-5 h-5 text-green-400" />الحجوزات السابقة</h3>
              {past.map((b: any) => (
                <div key={b.id} className="card p-5 opacity-70">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-bold">{b.service_name}</h4>
                      <p className="text-gray-400 text-sm mt-1">📅 {b.date} • ⏰ {b.time}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={b.status} />
                      <p className="text-gray-300 font-bold text-lg mt-1">{b.total_price} د.أ</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'loyalty' && (
            <div className="points-card">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-400">نقاطك الحالية</p>
                  <div className="text-6xl font-black gold-text mt-1">80</div>
                </div>
                <Award className="w-10 h-10 text-yellow-400 opacity-40" />
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">نحو حلاقة مجانية</span>
                  <span className="text-yellow-400">80 / {POINTS_FOR_FREE}</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden"><div className="h-full gold-gradient rounded-full" style={{ width: `80%` }} /></div>
              </div>
              <p className="text-gray-400 text-sm mb-6">تحتاج {POINTS_FOR_FREE - 80} نقطة للحلاقة المجانية</p>
              <Link to="/loyalty" className="btn-gold block text-center py-3">عرض التفاصيل الكاملة</Link>
            </div>
          )}

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
                      {['العميل', 'الخدمة', 'التاريخ', 'الوقت', 'النوع', 'السعر', 'الحالة', 'إجراءات'].map(h => (
                        <th key={h} className="text-gray-400 text-sm font-medium text-right py-3 px-4 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((b: any) => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-4 px-4 text-white text-sm whitespace-nowrap">{b.user?.full_name || b.user_id}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{b.service_name}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{b.date}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{b.time}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{b.booking_type === 'salon' ? 'صالون' : 'منزلي'}</td>
                        <td className="py-4 px-4 text-yellow-400 font-bold text-sm whitespace-nowrap">{b.total_price} د.أ</td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <select value={b.status} onChange={e => updateStatusMutation.mutate({ id: b.id, status: e.target.value })} className="bg-transparent text-xs border border-white/10 rounded-lg px-2 py-1 text-white">
                            <option value="pending">قيد الانتظار</option>
                            <option value="confirmed">مؤكد</option>
                            <option value="completed">مكتمل</option>
                            <option value="cancelled">ملغي</option>
                          </select>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button onClick={() => { if (window.confirm('هل تريد إلغاء الحجز؟')) cancelMutation.mutate(b.id) }} className="text-red-400 hover:text-red-300 transition-colors mr-3"><Trash2 className="w-4 h-4" /></button>
                          <button onClick={() => setEditingBooking(b)} className="text-gray-300 hover:text-white transition-colors"><Edit className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                await supabase.from('studio_photos').insert({
                  image_url: result.secure_url,
                  cloudinary_public_id: result.public_id,
                  caption: '',
                  likes_count: 0,
                })
                toast.success('✅ تم حفظ سجل الصورة')
                setShowPhotoUpload(false)
                // refresh photos
                await queryClient.invalidateQueries({ queryKey: ['studio-photos'] })
              } catch (err: any) {
                toast.error(err.message || 'فشل حفظ الصورة')
              }
            }} onRemove={() => {}} folder="salon-alhewwari/studio" />
            <div className="mt-4 text-right"><button onClick={() => setShowPhotoUpload(false)} className="btn-outline-gold">إغلاق</button></div>
          </motion.div>
        </div>
      )}

    </div>
  )
}

export default DashboardPage
