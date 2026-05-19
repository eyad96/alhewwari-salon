import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Heart, Plus, X, Search, Trash2, Edit, PackagePlus, AlertTriangle, RefreshCw
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useAdmin } from '@/hooks/useAdmin'
import { getProducts, createProduct, deleteProduct, updateProduct, toggleProductLike } from '@/services/products'
import type { Product } from '@/types'
import ImageUpload from '@/components/shared/ImageUpload'
import type { CloudinaryUploadResult } from '@/lib/cloudinary'
import toast from 'react-hot-toast'

const CATEGORIES: Array<{ id: 'all' | Product['category']; label: string; emoji: string }> = [
  { id: 'all', label: 'الكل', emoji: '✨' },
  { id: 'cream', label: 'عناية بالبشرة والشعر', emoji: '💆' },
  { id: 'tool', label: 'أدوات حلاقة', emoji: '✂️' },
  { id: 'perfume', label: 'عطور فاخرة', emoji: '🌹' },
  { id: 'other', label: 'أخرى', emoji: '📦' },
]

// ==============================
// نموذج إضافة / تعديل منتج
// ==============================
interface ProductFormProps {
  product?: Product
  onClose: () => void
  onSuccess: () => void
}

type ProductFormState = {
  name: string
  description: string
  price: string
  category: Product['category']
  stock: string
  image_url: string
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onClose, onSuccess }) => {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<ProductFormState>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    category: product?.category || 'cream',
    stock: product?.stock?.toString() || '10',
    image_url: product?.image_url || '',
  })
  const [uploadedImage, setUploadedImage] = useState<CloudinaryUploadResult | null>(null)
  const [saving, setSaving] = useState(false)
  const { getAuthenticatedClient } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.price) {
      toast.error('يرجى ملء الحقول المطلوبة')
      return
    }

    setSaving(true)
    try {
      const data = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        category: form.category as Product['category'],
        stock: parseInt(form.stock) || 0,
        image_url: uploadedImage?.secure_url || form.image_url,
      }

      if (product) {
        const authSupabase = await getAuthenticatedClient()
        await updateProduct(product.id, data, authSupabase)
        toast.success('✅ تم تحديث المنتج')
      } else {
        const authSupabase = await getAuthenticatedClient()
        await createProduct(data, authSupabase)
        toast.success('✅ تم إضافة المنتج')
      }

      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ')
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
        className="relative glass-dark rounded-2xl p-6 w-full max-w-lg z-10 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-white font-bold text-xl">
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ImageUpload
            onUpload={(result) => setUploadedImage(result)}
            onRemove={() => setUploadedImage(null)}
            currentImage={form.image_url}
            folder="salon-alhewwari/products"
            label="صورة المنتج"
            aspectRatio="square"
          />

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-gray-400 text-sm mb-1.5 block">اسم المنتج *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="مثال: عطر أود الملكي"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">السعر (د.أ) *</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                placeholder="25"
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">المخزون</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((p) => ({ ...p, stock: e.target.value }))}
                placeholder="10"
                className="input-field"
              />
            </div>

            <div className="col-span-2">
              <label className="text-gray-400 text-sm mb-1.5 block">الفئة</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category: cat.id as Product['category'] }))}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      form.category === cat.id
                        ? 'gold-gradient text-black font-bold'
                        : 'glass text-gray-300 hover:text-white'
                    }`}
                  >
                    {cat.emoji} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="col-span-2">
              <label className="text-gray-400 text-sm mb-1.5 block">الوصف</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="وصف مختصر للمنتج..."
                rows={2}
                className="input-field resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-gold flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {saving ? 'جاري الحفظ...' : product ? 'تحديث المنتج' : 'إضافة المنتج'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline-gold py-3 px-4">
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ==============================
// صفحة المنتجات الرئيسية
// ==============================
const ProductsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user, getAuthenticatedClient } = useAuth()
  const { isAdmin } = useAdmin()
  const queryClient = useQueryClient()

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()

  // استعلام المنتجات من Supabase
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => getProducts(selectedCategory === 'all' ? undefined : selectedCategory),
  })

  // حذف منتج
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const authSupabase = await getAuthenticatedClient()
      return deleteProduct(id, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('✅ تم حذف المنتج')
    },
    onError: () => toast.error('فشل حذف المنتج'),
  })

  // إعجاب بمنتج
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ productId, isLiked }: { productId: string; isLiked: boolean }) => {
      const authSupabase = await getAuthenticatedClient()
      return toggleProductLike(user!.id, productId, isLiked, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (err: any) => {
      toast.error(err.message || 'حدث خطأ أثناء معالجة الإعجاب')
    },
  })

  const handleLikeToggle = (productId: string, isLiked: boolean) => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً للإعجاب بمنتجاتنا الفاخرة')
      setTimeout(() => {
        navigate(`/login?redirect=/products`)
      }, 1500)
      return
    }
    toggleLikeMutation.mutate({ productId, isLiked })
  }

  const filtered = products.filter(
    (p) =>
      !searchQuery ||
      p.name.includes(searchQuery) ||
      p.description.includes(searchQuery),
  )

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-4 mb-12"
        >
          <div>
            <p className="section-subtitle mb-2">معرض المنتجات الفاخرة</p>
            <h1 className="text-4xl font-black text-white">
              منتجاتنا <span className="gold-text">الفاخرة</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => { setEditingProduct(undefined); setShowProductForm(true) }}
                className="btn-gold flex items-center gap-2 px-4 py-2.5"
              >
                <PackagePlus className="w-4 h-4" />
                منتج جديد
              </button>
            )}
          </div>
        </motion.div>

        {/* فلاتر وبحث */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              placeholder="ابحث عن منتج..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pr-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'gold-gradient text-black font-bold shadow-lg shadow-yellow-500/20'
                    : 'glass text-gray-300 hover:text-yellow-400'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="loader"></div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="text-center py-12 glass rounded-2xl">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-white font-bold mb-2">تعذر تحميل المنتجات</p>
            <p className="text-gray-400 text-sm">تأكد من إعداد Supabase وتشغيل ملف SQL الخاص بنظام الإعجابات</p>
          </div>
        )}

        {/* شبكة المنتجات */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((product, index) => {
              const catInfo = CATEGORIES.find((c) => c.id === product.category)
              const isLiked = user ? product.likes?.includes(user.id) : false

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="card group overflow-hidden flex flex-col h-[380px]"
                >
                  {/* صورة المنتج */}
                  <div className="relative overflow-hidden h-52 shrink-0">
                    <img
                      src={product.image_url || 'https://via.placeholder.com/400x300?text=Product'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-red-500/80 px-3 py-1 rounded-full">
                          غير متوفر حالياً
                        </span>
                      </div>
                    )}

                    {/* أزرار الأدمن */}
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingProduct(product); setShowProductForm(true) }}
                          className="w-8 h-8 bg-blue-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-blue-500"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`هل تريد حذف "${product.name}"؟`)) {
                              deleteMutation.mutate(product.id)
                            }
                          }}
                          className="w-8 h-8 bg-red-500/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* تفاصيل المنتج */}
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs text-yellow-400/80 font-medium">
                          {catInfo?.emoji} {catInfo?.label}
                        </span>
                        {product.stock > 0 && product.stock <= 5 && (
                          <span className="text-[10px] text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">
                            محدود
                          </span>
                        )}
                      </div>
                      <h3 className="text-white font-bold text-base group-hover:text-yellow-400 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <span className="text-yellow-400 font-black text-lg">{product.price} د.أ</span>

                      <button
                        onClick={() => handleLikeToggle(product.id, !!isLiked)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 ${
                          isLiked
                            ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30'
                            : 'glass text-gray-400 hover:text-white border border-white/5'
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 transition-transform duration-300 ${
                            isLiked ? 'fill-yellow-400 scale-110 text-yellow-400' : 'text-gray-400 hover:scale-110'
                          }`}
                        />
                        <span className="text-xs font-bold">{product.likes_count || 0}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-16 glass rounded-2xl">
            <p className="text-gray-400 text-lg">لا توجد منتجات في هذه الفئة</p>
          </div>
        )}

        {/* نموذج المنتج */}
        <AnimatePresence>
          {showProductForm && (
            <ProductForm
              product={editingProduct}
              onClose={() => { setShowProductForm(false); setEditingProduct(undefined) }}
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default ProductsPage
