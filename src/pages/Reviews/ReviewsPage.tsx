import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageCircle, User as UserIcon, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import StarRating from '@/components/shared/StarRating'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'

const reviewSchema = z.object({
  comment: z.string().min(10, 'الرجاء كتابة تعليق لا يقل عن 10 أحرف'),
})

// تقييمات وهمية للعرض
const DEMO_REVIEWS = [
  { id: '1', user: { full_name: 'أحمد الخطيب', avatar_url: '' }, rating: 5, comment: 'صالون رائع! الحلاقة ممتازة والخدمة احترافية. سأعود بالتأكيد.', created_at: '2024-01-15' },
  { id: '2', user: { full_name: 'محمد العمري', avatar_url: '' }, rating: 5, comment: 'أفضل صالون زرته في حياتي. الحلاق فنان حقيقي والأجواء رائعة.', created_at: '2024-01-20' },
  { id: '3', user: { full_name: 'يوسف الحواري', avatar_url: '' }, rating: 4, comment: 'خدمة ممتازة وسعر مناسب. أنصح به بشدة.', created_at: '2024-01-25' },
  { id: '4', user: { full_name: 'عمر النجار', avatar_url: '' }, rating: 5, comment: 'الحجز المنزلي تجربة مذهلة! وصلوا في الوقت المحدد وعملوا باحترافية.', created_at: '2024-02-01' },
  { id: '5', user: { full_name: 'خالد الشمري', avatar_url: '' }, rating: 4, comment: 'جودة عالية ونظافة تامة. الأجواء مريحة جداً.', created_at: '2024-02-05' },
  { id: '6', user: { full_name: 'سامي البلوي', avatar_url: '' }, rating: 5, comment: 'نظام النقاط رائع! حصلت على حلاقة مجانية بعد 5 زيارات فقط.', created_at: '2024-02-10' },
]

const ReviewsPage: React.FC = () => {
  const { user } = useAuth()
  const [reviews, setReviews] = useState(DEMO_REVIEWS)
  const [myRating, setMyRating] = useState(5)
  const [showForm, setShowForm] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(reviewSchema),
  })

  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length

  const onSubmit = async (data: any) => {
    if (!user) return
    const newReview = {
      id: Date.now().toString(),
      user: { full_name: user.full_name, avatar_url: '' },
      rating: myRating,
      comment: data.comment,
      created_at: new Date().toISOString().split('T')[0],
    }
    setReviews(prev => [newReview, ...prev])
    toast.success('✅ تم إضافة تقييمك بنجاح!')
    setShowForm(false)
    reset()
  }

  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: (reviews.filter(r => r.rating === star).length / reviews.length) * 100,
  }))

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

        {/* زر إضافة تقييم */}
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
              <Plus className="w-4 h-4" />
              {showForm ? 'إلغاء' : 'أضف تقييمك'}
            </button>

            {showForm && (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 card p-6"
              >
                <h3 className="text-white font-bold mb-4">تقييمك يهمنا 💬</h3>
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
                  disabled={isSubmitting}
                  className="btn-gold px-6 py-2.5"
                >
                  {isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم'}
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
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-black font-bold">
                    {review.user.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-white font-bold">{review.user.full_name}</p>
                    <p className="text-gray-500 text-xs">{review.created_at}</p>
                  </div>
                </div>
                <StarRating rating={review.rating} size="sm" />
              </div>
              <p className="text-gray-300 leading-relaxed">{review.comment}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ReviewsPage
