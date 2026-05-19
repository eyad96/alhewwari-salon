import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Gift, TrendingUp, Clock, Plus, Users } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Link } from 'react-router-dom'
import { POINTS_PER_HAIRCUT, POINTS_FOR_FREE } from '@/types'
import toast from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getUserLoyalty, getUserTransactions, redeemPoints, adminAddPoints } from '@/services/loyalty'

const LoyaltyPage: React.FC = () => {
  const { user, isAdmin, getAuthenticatedClient } = useAuth()
  const queryClient = useQueryClient()
  const [addingPointsId, setAddingPointsId] = useState<string | null>(null)
  const [pointsToAdd, setPointsToAdd] = useState(20)

  // 1. استعلام نقاط المستخدم الحالي
  const { data: loyaltyData } = useQuery({
    queryKey: ['user-loyalty', user?.id],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      return getUserLoyalty(user!.id, authSupabase)
    },
    enabled: !!user,
  })

  // 2. استعلام معاملات المستخدم الحالي
  const { data: transactions = [] } = useQuery({
    queryKey: ['user-transactions', user?.id],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      return getUserTransactions(user!.id, authSupabase)
    },
    enabled: !!user,
  })

  // 3. استعلام جميع المستخدمين (أدمن) - استعلام علاقة موحد لتخفيف حمل قاعدة البيانات
  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-all-profiles'],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      const { data } = await authSupabase
        .from('profiles')
        .select('id, full_name, email, loyalty_points(points)')
      
      return (data || []).map((p: any) => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        points: p.loyalty_points?.[0]?.points || 0
      }))
    },
    enabled: !!isAdmin,
  })

  const userPoints = loyaltyData?.points || 0
  const totalEarned = loyaltyData?.total_earned || 0
  const progress = Math.min((userPoints / POINTS_FOR_FREE) * 100, 100)
  const haircutsCount = Math.floor(totalEarned / POINTS_PER_HAIRCUT)

  // استبدال النقاط
  const redeemMutation = useMutation({
    mutationFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      return redeemPoints(user!.id, POINTS_FOR_FREE, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-loyalty', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['user-transactions', user?.id] })
      toast.success('🎉 تهانينا! حصلت على حلاقة مجانية!')
    },
    onError: (err: any) => toast.error(err.message)
  })

  // إضافة نقاط يدوياً (أدمن)
  const adminAddMutation = useMutation({
    mutationFn: async ({ userId, points }: { userId: string, points: number }) => {
      const authSupabase = await getAuthenticatedClient()
      return adminAddPoints(userId, points, 'إضافة يدوية من المسؤول', authSupabase)
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-profiles'] })
      queryClient.invalidateQueries({ queryKey: ['user-loyalty', variables.userId] })
      setAddingPointsId(null)
      toast.success(`✅ تم إضافة ${variables.points} نقطة بنجاح`)
    }
  })

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="section-subtitle mb-3">برنامج الولاء</p>
          <h1 className="section-title text-white mb-4">
            نقاطك <span className="gold-text">= مكافآتك</span>
          </h1>
          <div className="gold-divider mx-auto mb-4"></div>
        </motion.div>

        {!user ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 glass rounded-2xl"
          >
            <Award className="w-16 h-16 text-yellow-400 mx-auto mb-4 opacity-50" />
            <h3 className="text-white font-bold text-xl mb-3">سجّل دخولك لمشاهدة نقاطك</h3>
            <p className="text-gray-400 mb-6">انضم إلى برنامج الولاء واكسب نقاطاً مع كل حلاقة!</p>
            <div className="flex gap-3 justify-center">
              <Link to="/login" className="btn-gold px-6 py-3">دخول</Link>
              <Link to="/signup" className="btn-outline-gold px-6 py-3">تسجيل مجاني</Link>
            </div>
          </motion.div>
        ) : (
          <>
            {/* بطاقة النقاط */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="points-card mb-8"
            >
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-gray-400 text-sm mb-1">مرحباً، {user.full_name?.split(' ')[0]}</p>
                  <p className="text-gray-400 text-sm">نقاطك الحالية</p>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                    className="text-7xl font-black gold-text mt-2"
                  >
                    {userPoints}
                  </motion.div>
                </div>
                <div className="text-right">
                  <Award className="w-12 h-12 text-yellow-400 opacity-40" />
                  <p className="text-gray-500 text-xs mt-2">{haircutsCount} حلاقة سابقة</p>
                </div>
              </div>

              {/* شريط التقدم */}
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">التقدم نحو الحلاقة المجانية</span>
                  <span className="text-yellow-400 font-bold">{userPoints} / {POINTS_FOR_FREE}</span>
                </div>
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
                    className="h-full gold-gradient rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </motion.div>
                </div>
                {userPoints < POINTS_FOR_FREE ? (
                  <p className="text-gray-400 text-sm mt-2">
                    تحتاج <span className="text-yellow-400 font-bold">{POINTS_FOR_FREE - userPoints}</span> نقطة للحلاقة المجانية
                  </p>
                ) : (
                  <p className="text-green-400 text-sm mt-2 font-bold">🎉 أنت مؤهل للحلاقة المجانية!</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { icon: '✂️', label: 'إجمالي الحلاقات', value: haircutsCount },
                  { icon: '⭐', label: 'نقطة متاحة', value: userPoints },
                  { icon: '🎁', label: 'حلاقات مجانية قادمة', value: Math.floor(userPoints / POINTS_FOR_FREE) },
                ].map(stat => (
                  <div key={stat.label} className="glass rounded-xl p-3 text-center">
                    <div className="text-2xl mb-1">{stat.icon}</div>
                    <div className="text-white font-black text-xl">{stat.value}</div>
                    <div className="text-gray-500 text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => redeemMutation.mutate()}
                disabled={userPoints < POINTS_FOR_FREE || redeemMutation.isPending}
                className="btn-gold w-full py-3 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {redeemMutation.isPending ? (
                   <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
                ) : (
                  <>
                    <Gift className="w-5 h-5" />
                    {userPoints >= POINTS_FOR_FREE ? 'استبدل نقاطك بحلاقة مجانية! 🎉' : `تحتاج ${POINTS_FOR_FREE - userPoints} نقطة أخرى`}
                  </>
                )}
              </button>
            </motion.div>

            {/* سجل المعاملات */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card p-6"
            >
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                سجل النقاط
              </h3>
              <div className="space-y-3">
                {transactions.length === 0 && <p className="text-gray-500 text-center py-4">لا توجد معاملات بعد</p>}
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-3 glass rounded-xl">
                    <div>
                      <p className="text-white text-sm font-medium">{tx.description}</p>
                      <p className="text-gray-500 text-xs">{new Date(tx.created_at).toLocaleDateString('ar-SA')}</p>
                    </div>
                    <span className={`font-black text-lg ${tx.type === 'earned' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'earned' ? '+' : '-'}{tx.points} ⭐
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}

        {/* لوحة الأدمن */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 card p-6 border border-yellow-400/20"
          >
            <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
              <Users className="w-5 h-5 text-yellow-400" />
              إدارة نقاط المستخدمين
            </h3>
            <div className="space-y-4">
              {allUsers.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-4 glass rounded-xl">
                  <div>
                    <p className="text-white font-bold">{u.full_name}</p>
                    <p className="text-gray-400 text-sm">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-yellow-400 font-black text-xl">{u.points}</div>
                      <div className="text-gray-500 text-xs">نقطة</div>
                    </div>
                    {addingPointsId === u.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={pointsToAdd}
                          onChange={e => setPointsToAdd(Number(e.target.value))}
                          className="input-field w-20 py-1.5 text-sm text-center"
                        />
                        <button
                          onClick={() => adminAddMutation.mutate({ userId: u.id, points: pointsToAdd })}
                          className="btn-gold py-1.5 px-3 text-sm"
                        >
                          تأكيد
                        </button>
                        <button
                          onClick={() => setAddingPointsId(null)}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setAddingPointsId(u.id); setPointsToAdd(20); }}
                        className="btn-outline-gold py-1.5 px-3 text-sm flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        إضافة نقاط
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default LoyaltyPage
