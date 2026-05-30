import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Award, Clock, CheckCircle, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Link, Navigate } from 'react-router-dom'
import { POINTS_FOR_FREE } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { getUserBookings } from '@/services/bookings'
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

const UserDashboardPage: React.FC = () => {
  const { user, loading, getAuthenticatedClient, refetch } = useAuth()

  const [activeTab, setActiveTab] = useState('bookings')
  
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

  // Customer-specific queries
  const { data: customerAppointments = [], isLoading: customerAppointmentsLoading } = useQuery({
    queryKey: ['customer-appointments', user?.id],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      const { data, error } = await authSupabase
        .from('appointments')
        .select('*')
        .eq('user_id', user?.id)
        .order('appointment_date', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!user,
  })

  const displayBookings = customerAppointments.map((appt: any) => ({
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

  const handlePhoneSync = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneInput) return

    // Jordanian phone format validation (10 digits starting with 07)
    const cleanPhone = phoneInput.trim()
    const jorPhoneRegex = /^07[789]\d{7}$/
    if (!jorPhoneRegex.test(cleanPhone)) {
      toast.error('❌ يرجى إدخال رقم هاتف أردني صحيح يتكون من 10 خانات ويبدأ بـ 079 أو 078 أو 077')
      return
    }

    setIsSavingPhone(true)
    try {
      const authSupabase = await getAuthenticatedClient()
      const { error } = await authSupabase
        .from('profiles')
        .update({ phone: cleanPhone })
        .eq('id', user?.id)
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
        .eq('id', user?.id)
      if (error) throw error
      toast.success('✅ تم تحديث الملف الشخصي بنجاح!')
      setIsEditingProfile(false)
      await refetch()
    } catch (err: any) {
      console.error('Failed to update profile:', err)
      toast.error('فشل تحديث الملف الشخصي. يرجى المحاولة لاحقاً.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="loader w-12 h-12"></div>
    </div>
  )
  if (!user) return <Navigate to="/login" />

  return (
    <div className="min-h-screen py-12 px-4 bg-gradient-to-b from-black to-neutral-900">
      <div className="max-w-6xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">مرحباً بك في لوحتك الخاصة،</p>
              <h1 className="text-3xl font-black text-white mt-1">{user.full_name?.split(' ')[0]} 👋</h1>
              <span className="badge-gold text-xs mt-2 inline-block bg-yellow-400/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-400/20">عميل مميز</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/booking" className="btn-gold px-5 py-2.5 flex items-center gap-2"><Plus className="w-4 h-4" />حجز جديد</Link>
            </div>
          </div>
        </motion.div>

        {/* Onboarding Phone Sync banner */}
        {(!user?.phone || user?.phone === '' || user?.phone === 'بدون هاتف') && (
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
            { label: 'حجوزاتي الكلية', value: displayBookings.length },
            { label: 'حجوزات قادمة', value: upcoming.length },
            { label: 'النقاط المتوفرة', value: (user as any)?.loyalty_points ?? 0 },
            { label: 'مكتملة', value: displayBookings.filter((b: any) => b.status === 'completed').length },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card p-4">
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-gray-500 text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {[
            { id: 'bookings', label: 'حجوزاتي' },
            { id: 'loyalty', label: 'النقاط والجوائز' },
            { id: 'profile', label: 'الملف الشخصي' }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id 
                  ? 'gold-gradient text-black font-bold' 
                  : 'glass text-gray-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
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

              {customerAppointmentsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 glass rounded-2xl border border-yellow-500/10">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-yellow-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-t-yellow-400 animate-spin"></div>
                  </div>
                  <p className="text-gray-400 text-sm mt-4 font-medium">جاري تحميل حجوزاتك الفاخرة...</p>
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
                    لم تحجز أي موعد بعد في صالون الحوّاري. احجز موعدك الأول لتجربة أناقة لا مثيل لها.
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
              <div className="points-card max-w-2xl mx-auto">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-gray-400">رصيد نقاطك الحالي</p>
                    <div className="text-6xl font-black gold-text mt-1">{currentPoints}</div>
                  </div>
                  <Award className="w-10 h-10 text-yellow-400 opacity-40" />
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">التقدم نحو المكافأة القادمة</span>
                    <span className="text-yellow-400">{currentPoints} / {POINTS_FOR_FREE}</span>
                  </div>
                  <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full gold-gradient rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  {needed > 0 
                    ? `تحتاج إلى ${needed} نقاط إضافية للحصول على جلسة حلاقة مجانية بالكامل. كل موعد حلاقة تقوم به يضيف إلى رصيدك!` 
                    : '🎉 رائع! لقد حصلت على ما يكفي من النقاط للحصول على حلاقة مجانية بالكامل! أخبر الموظف في زيارتك القادمة لاستبدال نقاطك.'}
                </p>
                <Link to="/loyalty" className="btn-gold block text-center py-3 font-bold">عرض تفاصيل برنامج الولاء</Link>
              </div>
            )
          })()}

          {activeTab === 'profile' && (
            <div className="card p-6 max-w-xl mx-auto border border-yellow-500/10 animate-fade-in">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-white font-black text-xl flex items-center gap-2">
                  👤 معلومات الحساب الشخصي
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
                  <label className="text-gray-400 text-sm mb-1.5 block">البريد الإلكتروني (الموثق)</label>
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
    </div>
  )
}

export default UserDashboardPage
