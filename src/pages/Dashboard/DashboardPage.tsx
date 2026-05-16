import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Award, ShoppingBag, Settings, Users, LayoutDashboard, Clock, CheckCircle, XCircle, Edit, Trash2, Plus } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Link, Navigate } from 'react-router-dom'
import { POINTS_FOR_FREE } from '@/types'
import { format } from 'date-fns'

// بيانات وهمية للعرض
const DEMO_BOOKINGS = [
  { id: '1', service_name: 'قص الشعر', date: '2024-02-15', time: '14:00', status: 'confirmed', total_price: 3, booking_type: 'salon', modified_count: 0 },
  { id: '2', service_name: 'قص + ذقن', date: '2024-01-28', time: '16:00', status: 'completed', total_price: 4, booking_type: 'salon', modified_count: 0 },
  { id: '3', service_name: 'كيراتين', date: '2024-01-10', time: '13:00', status: 'completed', total_price: 10, booking_type: 'home', modified_count: 1 },
]

const ALL_BOOKINGS = [
  { id: '1', user: 'أحمد الخطيب', service: 'قص الشعر', date: '2024-02-20', time: '15:00', status: 'pending', price: 3, type: 'salon' },
  { id: '2', user: 'محمد العمري', service: 'قص + ذقن', date: '2024-02-19', time: '13:00', status: 'confirmed', price: 4, type: 'home' },
  { id: '3', user: 'يوسف الحواري', service: 'كيراتين', date: '2024-02-18', time: '11:00', status: 'completed', price: 10, type: 'salon' },
  { id: '4', user: 'عمر النجار', service: 'حلاقة ذقن', date: '2024-02-17', time: '17:00', status: 'cancelled', price: 2, type: 'salon' },
]

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

const DashboardPage: React.FC = () => {
  const { user, isAdmin, loading } = useAuth()
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'bookings')
  const [adminBookings, setAdminBookings] = useState(ALL_BOOKINGS)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loader w-12 h-12"></div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" />

  const userPoints = 80
  const progress = Math.min((userPoints / POINTS_FOR_FREE) * 100, 100)

  const upcoming = DEMO_BOOKINGS.filter(b => b.status === 'confirmed')
  const past = DEMO_BOOKINGS.filter(b => b.status === 'completed')

  const handleUpdateStatus = (id: string, status: string) => {
    setAdminBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b))
  }

  const handleDeleteBooking = (id: string) => {
    setAdminBookings(prev => prev.filter(b => b.id !== id))
  }

  const tabs = isAdmin
    ? [
        { id: 'admin', label: 'جميع الحجوزات', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'bookings', label: 'حجوزاتي', icon: <Calendar className="w-4 h-4" /> },
        { id: 'loyalty', label: 'النقاط', icon: <Award className="w-4 h-4" /> },
      ]
    : [
        { id: 'bookings', label: 'حجوزاتي', icon: <Calendar className="w-4 h-4" /> },
        { id: 'loyalty', label: 'النقاط', icon: <Award className="w-4 h-4" /> },
      ]

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">مرحباً مجدداً،</p>
              <h1 className="text-3xl font-black text-white mt-1">
                {user.full_name?.split(' ')[0]} 👋
              </h1>
              {isAdmin && <span className="badge-gold text-sm mt-2 inline-block">🔑 أدمن</span>}
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <Link to="/booking" className="btn-gold px-5 py-2.5 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                حجز جديد
              </Link>
            </div>
          </div>
        </motion.div>

        {/* بطاقات إحصائية */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'حجوزاتي', value: DEMO_BOOKINGS.length, icon: <Calendar className="w-5 h-5" />, color: 'text-blue-400' },
            { label: 'قادمة', value: upcoming.length, icon: <Clock className="w-5 h-5" />, color: 'text-yellow-400' },
            { label: 'النقاط', value: userPoints, icon: <Award className="w-5 h-5" />, color: 'text-purple-400' },
            { label: 'مكتملة', value: past.length, icon: <CheckCircle className="w-5 h-5" />, color: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card p-4"
            >
              <div className={`${stat.color} mb-2`}>{stat.icon}</div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-gray-500 text-xs">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* تبويبات */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'gold-gradient text-black'
                  : 'glass text-gray-300 hover:text-white'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* محتوى التبويبات */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          
          {/* حجوزات المستخدم */}
          {activeTab === 'bookings' && (
            <div className="space-y-4">
              {upcoming.length > 0 && (
                <>
                  <h3 className="text-white font-bold flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    المواعيد القادمة
                  </h3>
                  {upcoming.map(b => (
                    <div key={b.id} className="card p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-white font-bold">{b.service_name}</h4>
                          <p className="text-gray-400 text-sm mt-1">
                            📅 {b.date} • ⏰ {b.time} • {b.booking_type === 'salon' ? '🏪 صالون' : '🏠 منزلي'}
                          </p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={b.status} />
                          <p className="text-yellow-400 font-black text-lg mt-1">{b.total_price} د.أ</p>
                        </div>
                      </div>
                      {b.modified_count === 0 && (
                        <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
                          <button className="btn-outline-gold text-xs py-1.5 px-3 flex items-center gap-1">
                            <Edit className="w-3 h-3" />
                            تعديل (مرة واحدة)
                          </button>
                          <button className="text-xs py-1.5 px-3 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            إلغاء (خلال 30 دقيقة)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}

              <h3 className="text-white font-bold flex items-center gap-2 mt-6 mb-4">
                <CheckCircle className="w-5 h-5 text-green-400" />
                الحجوزات السابقة
              </h3>
              {past.map(b => (
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

          {/* النقاط */}
          {activeTab === 'loyalty' && (
            <div className="points-card">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-400">نقاطك الحالية</p>
                  <div className="text-6xl font-black gold-text mt-1">{userPoints}</div>
                </div>
                <Award className="w-10 h-10 text-yellow-400 opacity-40" />
              </div>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">نحو حلاقة مجانية</span>
                  <span className="text-yellow-400">{userPoints} / {POINTS_FOR_FREE}</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full gold-gradient rounded-full" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <p className="text-gray-400 text-sm mb-6">تحتاج {POINTS_FOR_FREE - userPoints} نقطة للحلاقة المجانية</p>
              <Link to="/loyalty" className="btn-gold block text-center py-3">
                عرض التفاصيل الكاملة
              </Link>
            </div>
          )}

          {/* لوحة الأدمن */}
          {activeTab === 'admin' && isAdmin && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl">إدارة الحجوزات</h3>
                <div className="flex gap-2">
                  <span className="badge-gold">{adminBookings.length} حجز</span>
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
                    {adminBookings.map(b => (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                        <td className="py-4 px-4 text-white text-sm whitespace-nowrap">{b.user}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{b.service}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{b.date}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{b.time}</td>
                        <td className="py-4 px-4 text-gray-300 text-sm whitespace-nowrap">{b.type === 'salon' ? 'صالون' : 'منزلي'}</td>
                        <td className="py-4 px-4 text-yellow-400 font-bold text-sm whitespace-nowrap">{b.price} د.أ</td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <select
                            value={b.status}
                            onChange={e => handleUpdateStatus(b.id, e.target.value)}
                            className="bg-transparent text-xs border border-white/10 rounded-lg px-2 py-1 text-white"
                          >
                            <option value="pending" className="bg-gray-900">قيد الانتظار</option>
                            <option value="confirmed" className="bg-gray-900">مؤكد</option>
                            <option value="completed" className="bg-gray-900">مكتمل</option>
                            <option value="cancelled" className="bg-gray-900">ملغي</option>
                          </select>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteBooking(b.id)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </div>
  )
}

export default DashboardPage
