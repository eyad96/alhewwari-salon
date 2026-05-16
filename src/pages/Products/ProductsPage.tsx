import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ShoppingCart, Plus, Minus, X, CheckCircle, Filter, Search,
  Trash2, Edit, PackagePlus, AlertTriangle, RefreshCw
} from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { getProducts, createProduct, deleteProduct, updateProduct } from '@/services/products'
import type { Product } from '@/types'
import ImageUpload from '@/components/shared/ImageUpload'
import type { CloudinaryUploadResult } from '@/lib/cloudinary'
import toast from 'react-hot-toast'

const CATEGORIES: Array<{ id: 'all' | Product['category']; label: string; emoji: string }> = [
  { id: 'all', label: 'الكل', emoji: '🛍️' },
  { id: 'perfume', label: 'عطور', emoji: '🌹' },
  { id: 'cream', label: 'عناية', emoji: '💆' },
  { id: 'tool', label: 'أدوات', emoji: '✂️' },
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
        await updateProduct(product.id, data)
        toast.success('✅ تم تحديث المنتج')
      } else {
        await createProduct(data)
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
  const { user, isAdmin } = useAuth()
  const { items, addItem, removeItem, updateQuantity, total, clearCart } = useCart()
  const queryClient = useQueryClient()

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()

  // استعلام المنتجات من Supabase
  const { data: products = [], isLoading, error } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: () => getProducts(selectedCategory === 'all' ? undefined : selectedCategory),
  })

  // حذف منتج
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('✅ تم حذف المنتج')
    },
    onError: () => toast.error('فشل حذف المنتج'),
  })

  const filtered = products.filter(
    (p) =>
      !searchQuery ||
      p.name.includes(searchQuery) ||
      p.description.includes(searchQuery),
  )

  const cartItem = (id: string) => items.find((i) => i.product.id === id)

  const handleAddToCart = (product: Product) => {
    addItem(product)
    toast.success(`✅ تم إضافة "${product.name}" إلى السلة`)
  }

  const handleCheckout = async () => {
    clearCart()
    setShowCheckout(false)
    setShowCart(false)
    setOrderSuccess(true)
    toast.success('🎉 تم استلام طلبك! سنتواصل معك قريباً')
    setTimeout(() => setOrderSuccess(false), 6000)
  }

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
            <p className="section-subtitle mb-2">المتجر</p>
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

            <button
              onClick={() => setShowCart(true)}
              className="relative btn-outline-gold flex items-center gap-2 px-5 py-2.5"
            >
              <ShoppingCart className="w-5 h-5" />
              السلة
              {items.length > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 gold-gradient rounded-full text-black text-xs font-bold flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </button>
          </div>
        </motion.div>

        {/* نجاح الطلب */}
        {orderSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-5 rounded-2xl flex items-center gap-4"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
          >
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-white font-bold">تم استلام طلبك بنجاح! 🎉</p>
              <p className="text-gray-400 text-sm">سنتواصل معك خلال 24 ساعة لتأكيد التوصيل</p>
            </div>
          </motion.div>
        )}

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
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'gold-gradient text-black'
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
            <p className="text-gray-400 text-sm">تأكد من إعداد Supabase وتشغيل ملف SQL</p>
          </div>
        )}

        {/* شبكة المنتجات */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((product, index) => {
              const inCart = cartItem(product.id)
              const catInfo = CATEGORIES.find((c) => c.id === product.category)
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="card group overflow-hidden"
                >
                  <div className="relative overflow-hidden h-52">
                    <img
                      src={product.image_url || 'https://via.placeholder.com/400x300?text=Product'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute top-3 left-3 flex gap-1">
                      <span className="badge-gold text-xs">
                        {catInfo?.emoji} {catInfo?.label}
                      </span>
                    </div>
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white font-bold text-sm bg-red-500/80 px-3 py-1 rounded-full">
                          نفد المخزون
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

                  <div className="p-4">
                    <h3 className="text-white font-bold mb-1 group-hover:text-yellow-400 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-yellow-400 font-black text-xl">{product.price} د.أ</span>
                        {product.stock > 0 && product.stock <= 5 && (
                          <p className="text-orange-400 text-xs mt-0.5">آخر {product.stock} قطع!</p>
                        )}
                      </div>

                      {inCart ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(product.id, inCart.quantity - 1)}
                            className="w-7 h-7 rounded-full glass flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white font-bold w-5 text-center">{inCart.quantity}</span>
                          <button
                            onClick={() => updateQuantity(product.id, inCart.quantity + 1)}
                            className="w-7 h-7 rounded-full gold-gradient flex items-center justify-center text-black"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.stock === 0}
                          className="btn-gold text-sm px-3 py-2 disabled:opacity-40"
                        >
                          أضف للسلة
                        </button>
                      )}
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

        {/* سلة التسوق */}
        <AnimatePresence>
          {showCart && (
            <div className="fixed inset-0 z-50 flex justify-end">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25 }}
                className="relative w-full max-w-md glass-dark flex flex-col"
              >
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h3 className="text-white font-bold text-xl">سلة التسوق ({items.length})</h3>
                  <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {items.length === 0 ? (
                    <div className="text-center text-gray-400 py-12">
                      <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-20" />
                      <p>السلة فارغة</p>
                    </div>
                  ) : (
                    items.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-4 p-3 glass rounded-xl">
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-14 h-14 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="text-white text-sm font-bold">{item.product.name}</p>
                          <p className="text-yellow-400 text-sm">
                            {item.product.price} × {item.quantity} ={' '}
                            <span className="font-bold">{(item.product.price * item.quantity).toFixed(2)} د.أ</span>
                          </p>
                        </div>
                        <button onClick={() => removeItem(item.product.id)} className="text-gray-500 hover:text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
                {items.length > 0 && (
                  <div className="p-6 border-t border-white/10">
                    <div className="flex justify-between mb-4">
                      <span className="text-gray-400">الإجمالي</span>
                      <span className="text-yellow-400 font-black text-2xl">{total.toFixed(2)} د.أ</span>
                    </div>
                    <button
                      onClick={() => { setShowCart(false); setShowCheckout(true) }}
                      className="btn-gold w-full py-3 text-lg"
                    >
                      إتمام الشراء
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* نافذة الدفع */}
        <AnimatePresence>
          {showCheckout && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative glass-dark rounded-2xl p-8 w-full max-w-md z-10"
              >
                <button onClick={() => setShowCheckout(false)} className="absolute top-4 left-4 text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-white font-black text-2xl mb-6">تأكيد الطلب</h3>
                <div className="space-y-4 mb-6">
                  <input className="input-field" placeholder="الاسم الكامل *" required />
                  <input className="input-field" placeholder="رقم الهاتف *" type="tel" required />
                  <input className="input-field" placeholder="عنوان التوصيل" />
                  <textarea className="input-field resize-none" rows={2} placeholder="ملاحظات..." />
                </div>
                <div className="p-4 glass rounded-xl mb-6 text-center">
                  <p className="text-gray-400 text-sm">💳 الدفع عند الاستلام</p>
                  <p className="text-yellow-400 font-black text-3xl mt-1">{total.toFixed(2)} د.أ</p>
                </div>
                <button onClick={handleCheckout} className="btn-gold w-full py-3 text-lg">
                  ✅ تأكيد الطلب
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
