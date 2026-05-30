import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageCircle, User as UserIcon, Plus, Edit2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import StarRating from '@/components/shared/StarRating'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getReviews, getUserReview, upsertReview } from '@/services/reviews'

const reviewSchema = z.object({
  comment: z.string().min(10, 'الرجاء كتابة تعليق لا يقل عن 10 أحرف'),
})

const ReviewsPage: React.FC = () => {
  const { user, getAuthenticatedClient } = useAuth()
  const queryClient = useQueryClient()
  const [myRating, setMyRating] = useState(5)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(reviewSchema),
  })

  // 1. استعلام جميع التقييمات من قاعدة البيانات
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews'],
    queryFn: () => getReviews(),
  })

  // 2. استعلام تقييم المستخدم الحالي (إن وجد)
  const { data: userReview } = useQuery({
    queryKey: ['user-review', user?.id],
    queryFn: async () => {
      const authSupabase = await getAuthenticatedClient()
      return getUserReview(user!.id, authSupabase)
    },
    enabled: !!user,
  })

  // تعبئة النموذج تلقائياً إذا كان للمستخدم تقييم سابق
  useEffect(() => {
    if (userReview) {
      setMyRating(userReview.rating)
      setValue('comment', userReview.comment)
    }
  }, [userReview, setValue])

  // 3. طفرة إضافة أو تعديل تقييم
  const reviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment: string }) => {
      const authSupabase = await getAuthenticatedClient()
      return upsertReview(user!.id, data.rating, data.comment, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
      queryClient.invalidateQueries({ queryKey: ['user-review', user?.id] })
      toast.success(userReview ? '✅ تم تحديث تقييمك بنجاح!' : '✅ تم إضافة تقييمك بنجاح!')
      setShowForm(false)
    },
    onError: (err: any) => {
      toast.error('❌ حدث خطأ أثناء حفظ التقييم: ' + err.message)
    }
  })

  const onSubmit = async (data: any) => {
    if (!user) return
    reviewMutation.mutate({ rating: myRating, comment: data.comment })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-gray-400">جاري تحميل الآراء والتقييمات...</p>
        </div>
      </div>
    )
  }

  const avgRating = reviews.length > 0 
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length 
    : 5

  const ratingDist = [5, 4, 3, 2, 1].map(star => {
    const count = reviews.filter(r => r.rating === star).length
    return {
      star,
      count,
      pct: reviews.length > 0 ? (count / reviews.length) * 100 : 0,
    }
  })

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="section-subtitle mb-3">التقييمات</p>
          <h1 className="section-title text-white mb-4">
            آراء <span className="gold-text">عملائنا</span>
          </h1>
          <div className="gold-divider mx-auto"></div>
        </motion.div>

        {/* ملخص التقييمات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card p-8 mb-10"
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-center">
              <div className="text-8xl font-black gold-text mb-2">{avgRating.toFixed(1)}</div>
              <StarRating rating={Math.round(avgRating)} size="lg" />
              <p className="text-gray-400 mt-2">{reviews.length} تقييم</p>
            </div>
            <div className="space-y-3">
              {ratingDist.map(({ star, count, pct }) => (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm w-4">{star}</span>
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full gold-gradient rounded-full"
                    />
                  </div>
                  <span className="text-gray-400 text-xs w-6">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* زر إضافة أو تعديل تقييم */}
        {user ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-gold flex items-center gap-2 mx-auto"
            >
              {userReview ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showForm ? 'إلغاء' : (userReview ? 'تعديل تقييمك' : 'أضف تقييمك')}
            </button>

            {showForm && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 card p-6"
              >
                <h3 className="text-white font-bold mb-4">
                  {userReview ? 'تحديث تقييمك السابق 💬' : 'تقييمك يهمنا 💬'}
                </h3>
                <div className="mb-4">
                  <label className="text-gray-400 text-sm mb-2 block">تقييمك</label>
                  <StarRating
                    rating={myRating}
                    size="lg"
                    interactive
                    onChange={setMyRating}
                  />
                </div>
                <div className="mb-4">
                  <label className="text-gray-400 text-sm mb-2 block">تعليقك</label>
                  <textarea
                    {...register('comment')}
                    placeholder="شاركنا تجربتك مع صالون الحوّاري..."
                    rows={4}
                    className="input-field resize-none"
                  />
                  {errors.comment && (
                    <p className="text-red-400 text-sm mt-1">{errors.comment.message as string}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  className="btn-gold px-6 py-2.5 flex items-center gap-2"
                >
                  {reviewMutation.isPending ? 'جاري الحفظ...' : (userReview ? 'حفظ التعديلات' : 'إرسال التقييم')}
                </button>
              </motion.form>
            )}
          </motion.div>
        ) : (
          <div className="text-center mb-8">
            <p className="text-gray-400 mb-3">سجّل دخولك لإضافة تقييمك</p>
            <Link to="/login" className="btn-gold px-6 py-2">تسجيل الدخول</Link>
          </div>
        )}

        {/* قائمة التقييمات */}
        <div className="space-y-5">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد تقييمات حالياً. كن أول من يضيف تقييماً!</p>
          ) : (
            reviews.map((review, index) => {
              const fullName = review.user?.full_name || 'عميل الصالون'
              const avatarLetter = fullName.charAt(0)
              const formattedDate = review.created_at 
                ? new Date(review.created_at).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
                : ''

              return (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.05 * index, 0.5) }}
                  className="card p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {review.user?.avatar_url ? (
                        <img 
                          src={review.user.avatar_url} 
                          alt={fullName} 
                          className="w-10 h-10 rounded-full object-cover border border-yellow-500/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-black font-bold">
                          {avatarLetter}
                        </div>
                      )}
                      <div>
                        <p className="text-white font-bold">{fullName}</p>
                        <p className="text-gray-500 text-xs">{formattedDate}</p>
                      </div>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  <p className="text-gray-300 leading-relaxed">{review.comment}</p>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ReviewsPage

