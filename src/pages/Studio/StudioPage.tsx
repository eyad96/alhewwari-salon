import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Trash2, Trophy, Plus, X, Edit2, RefreshCw, AlertTriangle } from 'lucide-react'
import {
  getStudioPhotos,
  getUserLikes,
  toggleLike,
  resetAllLikes,
  uploadStudioPhoto,
  deleteStudioPhoto,
  updateStudioPhoto,
} from '@/services/studio'
import { useAuth } from '@/hooks/useAuth'
import ImageUpload from '@/components/shared/ImageUpload'
import type { CloudinaryUploadResult } from '@/lib/cloudinary'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import type { StudioPhoto } from '@/types'

// ==============================
// نموذج رفع صورة جديدة (أدمن)
// ==============================
interface UploadModalProps {
  onClose: () => void
  onSuccess: () => void
}

const UploadModal: React.FC<UploadModalProps> = ({ onClose, onSuccess }) => {
  const [uploadedResult, setUploadedResult] = useState<CloudinaryUploadResult | null>(null)
  const [caption, setCaption] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!uploadedResult) {
      toast.error('يرجى رفع صورة أولاً')
      return
    }

    setSaving(true)
    try {
      await uploadStudioPhoto({
        file: new File([], ''), // placeholder - already uploaded
        caption,
      })
      // In real case, we save the cloudinary result directly
      // Let's save via a direct Supabase insert
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('studio_photos').insert({
        image_url: uploadedResult.secure_url,
        cloudinary_public_id: uploadedResult.public_id,
        caption: caption || '',
        likes_count: 0,
      })

      toast.success('✅ تم رفع الصورة بنجاح!')
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الصورة')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative glass-dark rounded-2xl p-6 w-full max-w-md z-10"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-xl">رفع صورة جديدة</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ImageUpload
          onUpload={(result) => setUploadedResult(result)}
          onRemove={() => setUploadedResult(null)}
          folder="salon-alhewwari/studio"
          label="صورة الاستوديو"
          aspectRatio="portrait"
          className="mb-4"
        />

        <div className="mb-4">
          <label className="text-gray-400 text-sm mb-1.5 block">تعليق الصورة (اختياري)</label>
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="مثال: قصة كلاسيكية، تسريحة عصرية..."
            className="input-field"
            maxLength={100}
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!uploadedResult || saving}
            className="btn-gold flex-1 py-3 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {saving ? 'جاري الحفظ...' : 'حفظ الصورة'}
          </button>
          <button onClick={onClose} className="btn-outline-gold py-3 px-4">
            إلغاء
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ==============================
// بطاقة الصورة
// ==============================
interface PhotoCardProps {
  photo: StudioPhoto
  isLiked: boolean
  onLike: () => void
  onDelete?: () => void
  isAdmin: boolean
  isLoggedIn: boolean
  isTop: boolean
}

const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  isLiked,
  onLike,
  onDelete,
  isAdmin,
  isLoggedIn,
  isTop,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="masonry-item"
    >
      <div className="relative group photo-container overflow-hidden rounded-2xl">
        {/* شارة الأول */}
        {isTop && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1 bg-yellow-400 text-black text-xs font-bold px-2.5 py-1 rounded-full shadow-lg">
            <Trophy className="w-3 h-3" />
            الأول
          </div>
        )}

        {/* زر حذف الأدمن */}
        {isAdmin && onDelete && (
          <button
            onClick={onDelete}
            className="absolute top-3 left-3 z-20 w-8 h-8 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        <img
          src={photo.image_url}
          alt={photo.caption || 'صورة الاستوديو'}
          className="w-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay */}
        <div className="photo-overlay rounded-2xl" />

        {/* زر اللايك والتعليق */}
        <div className="absolute inset-x-0 bottom-0 p-4 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          {photo.caption && (
            <p className="text-white text-sm font-medium mb-2 drop-shadow">{photo.caption}</p>
          )}
          <button
            onClick={(e) => {
              e.preventDefault()
              if (!isLoggedIn) {
                toast.error('يجب تسجيل الدخول للإعجاب')
                return
              }
              onLike()
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
              isLiked
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-white/20 backdrop-blur-sm text-white hover:bg-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''} transition-all`} />
            {photo.likes_count}
          </button>
        </div>

        {/* عدد اللايكات دائماً مرئي */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full group-hover:opacity-0 transition-opacity">
          <Heart className="w-3 h-3 fill-red-400 text-red-400" />
          {photo.likes_count}
        </div>
      </div>
    </motion.div>
  )
}

// ==============================
// صفحة الاستوديو الرئيسية
// ==============================
const StudioPage: React.FC = () => {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // استعلام الصور
  const {
    data: photos = [],
    isLoading: photosLoading,
    error: photosError,
  } = useQuery({
    queryKey: ['studio-photos'],
    queryFn: getStudioPhotos,
  })

  // استعلام لايكات المستخدم
  const { data: userLikes = [] } = useQuery({
    queryKey: ['user-likes', user?.id],
    queryFn: () => getUserLikes(user!.id),
    enabled: !!user,
  })

  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: ({ photoId, isLiked }: { photoId: string; isLiked: boolean }) =>
      toggleLike(user!.id, photoId, isLiked),
    onMutate: async ({ photoId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ['studio-photos'] })
      await queryClient.cancelQueries({ queryKey: ['user-likes', user?.id] })

      // Optimistic update
      queryClient.setQueryData<StudioPhoto[]>(['studio-photos'], (old) =>
        old?.map((p) =>
          p.id === photoId
            ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
            : p,
        ) ?? [],
      )
      queryClient.setQueryData<string[]>(['user-likes', user?.id], (old) =>
        isLiked ? (old ?? []).filter((id) => id !== photoId) : [...(old ?? []), photoId],
      )
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-photos'] })
      queryClient.invalidateQueries({ queryKey: ['user-likes', user?.id] })
      toast.error('حدث خطأ. حاول مرة أخرى')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (photo: StudioPhoto) =>
      deleteStudioPhoto(photo.id, (photo as any).cloudinary_public_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-photos'] })
      toast.success('✅ تم حذف الصورة')
    },
    onError: () => toast.error('فشل حذف الصورة'),
  })

  // Reset likes mutation
  const resetMutation = useMutation({
    mutationFn: resetAllLikes,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-photos'] })
      queryClient.invalidateQueries({ queryKey: ['user-likes', user?.id] })
      setShowResetConfirm(false)
      toast.success('✅ تم تصفير جميع الإعجابات')
    },
    onError: () => toast.error('فشل تصفير الإعجابات'),
  })

  const topPhoto = [...photos].sort((a, b) => b.likes_count - a.likes_count)[0]

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <p className="section-subtitle mb-3">الاستوديو</p>
          <h1 className="section-title text-white mb-4">
            معرض <span className="gold-text">الأعمال</span>
          </h1>
          <div className="gold-divider mx-auto mb-4"></div>
          <p className="text-gray-400 max-w-xl mx-auto text-sm">
            استعرض أحدث تسريحاتنا وأعجب بالأعمال المميزة
          </p>
        </motion.div>

        {/* بانر المسابقة */}
        {topPhoto && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-10 p-6 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #1a1200, #2a1e00)',
              border: '1px solid rgba(212,175,55,0.4)',
            }}
          >
            <div className="flex items-center gap-4 flex-wrap">
              <Trophy className="w-10 h-10 text-yellow-400 shrink-0 animate-float" />
              <div className="flex-1 min-w-0">
                <h3 className="text-yellow-400 font-bold text-lg">
                  🏆 الصورة الأولى بأكثر إعجابات
                </h3>
                <p className="text-gray-300 text-sm mt-0.5">
                  {topPhoto.caption ? `"${topPhoto.caption}"` : 'بدون تعليق'} —{' '}
                  <span className="text-yellow-400 font-bold">{topPhoto.likes_count}</span> إعجاب
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  صاحب الصورة الأولى يحصل على خصم 50% على حلاقته القادمة! 🎉
                </p>
              </div>
              {!user && (
                <Link to="/login" className="btn-gold text-sm px-4 py-2 shrink-0">
                  سجّل دخول
                </Link>
              )}
            </div>
          </motion.div>
        )}

        {/* شريط أدوات الأدمن */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-3 mb-8 p-4 glass rounded-xl border border-yellow-400/20"
          >
            <span className="text-yellow-400 font-bold text-sm">🔑 أدوات الأدمن:</span>

            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-gold text-sm px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              رفع صورة جديدة
            </button>

            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/20 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              تصفير الإعجابات
            </button>

            <span className="text-gray-500 text-xs">
              {photos.length} صورة • {photos.reduce((s, p) => s + p.likes_count, 0)} إعجاب إجمالاً
            </span>
          </motion.div>
        )}

        {/* Loading */}
        {photosLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="loader mx-auto mb-4"></div>
              <p className="text-gray-400">جاري تحميل الصور...</p>
            </div>
          </div>
        )}

        {/* Error */}
        {photosError && (
          <div className="text-center py-16 glass rounded-2xl">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-white font-bold mb-2">تعذر تحميل الصور</p>
            <p className="text-gray-400 text-sm mb-4">تأكد من ربط Supabase وإضافة المفاتيح في ملف .env</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['studio-photos'] })}
              className="btn-outline-gold px-4 py-2 text-sm"
            >
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* معرض الصور - Masonry */}
        {!photosLoading && !photosError && (
          <>
            {photos.length === 0 ? (
              <div className="text-center py-20 glass rounded-2xl">
                <div className="text-6xl mb-4">📸</div>
                <p className="text-white font-bold text-xl mb-2">لا توجد صور بعد</p>
                {isAdmin ? (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="btn-gold px-6 py-3 mt-4"
                  >
                    ارفع أول صورة
                  </button>
                ) : (
                  <p className="text-gray-400">سيتم إضافة الصور قريباً</p>
                )}
              </div>
            ) : (
              <AnimatePresence>
                <div className="masonry-grid">
                  {photos.map((photo, index) => (
                    <PhotoCard
                      key={photo.id}
                      photo={photo}
                      isLiked={userLikes.includes(photo.id)}
                      isTop={photo.id === topPhoto?.id && photo.likes_count > 0}
                      isAdmin={isAdmin}
                      isLoggedIn={!!user}
                      onLike={() =>
                        likeMutation.mutate({
                          photoId: photo.id,
                          isLiked: userLikes.includes(photo.id),
                        })
                      }
                      onDelete={
                        isAdmin
                          ? () => {
                              if (window.confirm('هل تريد حذف هذه الصورة؟')) {
                                deleteMutation.mutate(photo)
                              }
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </>
        )}

        {/* تسجيل الدخول للإعجاب */}
        {!user && photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-12 p-8 glass rounded-2xl border border-yellow-400/10"
          >
            <p className="text-gray-400 mb-4">
              سجّل دخولك لتتمكن من الإعجاب بالصور والمشاركة في مسابقة الخصم 50%!
            </p>
            <Link to="/login" className="btn-gold px-8 py-3">
              تسجيل الدخول
            </Link>
          </motion.div>
        )}
      </div>

      {/* Modal رفع الصور */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onSuccess={() => queryClient.invalidateQueries({ queryKey: ['studio-photos'] })}
          />
        )}
      </AnimatePresence>

      {/* تأكيد تصفير الإعجابات */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setShowResetConfirm(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative glass-dark rounded-2xl p-6 w-full max-w-sm z-10 text-center"
            >
              <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <h3 className="text-white font-black text-xl mb-2">تصفير الإعجابات؟</h3>
              <p className="text-gray-400 text-sm mb-6">
                سيتم حذف جميع الإعجابات وإعادة عدادات جميع الصور إلى صفر. لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {resetMutation.isPending ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    'نعم، تصفير'
                  )}
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 btn-outline-gold"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StudioPage
