import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Calendar, Clock, ChevronLeft, Plus, Trash2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBlogPosts, createBlogPost, deleteBlogPost } from '@/services/blog'
import ImageUpload from '@/components/shared/ImageUpload'
import toast from 'react-hot-toast'

const BlogPage: React.FC = () => {
  const { isAdmin, getAuthenticatedClient } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedPost, setSelectedPost] = useState<any | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', excerpt: '', content: '', tags: '', image_url: '' })
  const [saving, setSaving] = useState(false)

  // استعلام المقالات
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => getBlogPosts(),
  })

  // حذف مقال
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const authSupabase = await getAuthenticatedClient()
      return deleteBlogPost(id, authSupabase)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      toast.success('✅ تم حذف المقال')
    }
  })

  const filtered = posts.filter(p =>
    p.title.includes(search) || p.excerpt.includes(search)
  )

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.excerpt) {
      toast.error('يرجى ملء الحقول المطلوبة')
      return
    }
    
    setSaving(true)
    try {
      const authSupabase = await getAuthenticatedClient()
      await createBlogPost({
        ...newPost,
        tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean),
        read_time: Math.max(1, Math.ceil(newPost.content.length / 500)),
      }, authSupabase)
      
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      setShowEditor(false)
      setNewPost({ title: '', excerpt: '', content: '', tags: '', image_url: '' })
      toast.success('✅ تم نشر المقال بنجاح')
    } catch (err: any) {
      toast.error(err.message || 'فشل النشر')
    } finally {
      setSaving(false)
    }
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <button
            onClick={() => setSelectedPost(null)}
            className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 mb-8 text-sm"
          >
            <ChevronLeft className="w-4 h-4" />
            العودة للمدونة
          </button>
          <img src={selectedPost.image_url || 'https://via.placeholder.com/800x400'} alt={selectedPost.title}
            className="w-full h-64 md:h-96 object-cover rounded-2xl mb-8 shadow-2xl" />
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedPost.tags?.map((tag: string) => (
              <span key={tag} className="badge-gold text-xs">{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-6">{selectedPost.title}</h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm mb-8 border-b border-white/10 pb-6">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{new Date(selectedPost.published_at).toLocaleDateString('ar-SA')}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedPost.read_time} دقائق قراءة</span>
          </div>
          <div className="prose prose-invert max-w-none text-gray-300 leading-relaxed space-y-6 text-lg">
            <p className="font-bold text-white text-xl">{selectedPost.excerpt}</p>
            <div dangerouslySetInnerHTML={{ __html: selectedPost.content.replace(/\n/g, '<br/>') }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <p className="section-subtitle mb-2">المدونة</p>
            <h1 className="text-4xl font-black text-white">
              نصائح & <span className="gold-text">مقالات</span>
            </h1>
          </div>
          {isAdmin && (
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="btn-gold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              مقال جديد
            </button>
          )}
        </motion.div>

        {/* محرر الأدمن */}
        <AnimatePresence>
          {showEditor && isAdmin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-6 mb-12 border border-yellow-400/20 overflow-hidden"
            >
              <h3 className="text-white font-bold mb-6 text-xl">إضافة مقال جديد</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">عنوان المقال *</label>
                    <input
                      placeholder="أدخل عنواناً جذاباً..."
                      value={newPost.title}
                      onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">مقتطف قصير *</label>
                    <textarea
                      placeholder="وصف مختصر يظهر في القائمة..."
                      value={newPost.excerpt}
                      onChange={e => setNewPost(p => ({ ...p, excerpt: e.target.value }))}
                      rows={2}
                      className="input-field resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">الوسوم (مفصولة بفاصلة)</label>
                    <input
                      placeholder="مثال: شعر, عناية, نصائح"
                      value={newPost.tags}
                      onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
                      className="input-field"
                    />
                  </div>
                </div>
                <div>
                  <ImageUpload
                    onUpload={(res) => setNewPost(p => ({ ...p, image_url: res.secure_url }))}
                    onRemove={() => setNewPost(p => ({ ...p, image_url: '' }))}
                    label="صورة الغلاف"
                    aspectRatio="wide"
                    folder="salon-alhewwari/blog"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="text-gray-400 text-sm mb-1.5 block">محتوى المقال الكامل *</label>
                <textarea
                  placeholder="اكتب مقالك هنا بالتفصيل..."
                  value={newPost.content}
                  onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                  rows={8}
                  className="input-field resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleAddPost} 
                  disabled={saving}
                  className="btn-gold px-8 py-3 flex items-center gap-2"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  نشر المقال
                </button>
                <button onClick={() => setShowEditor(false)} className="btn-outline-gold px-6 py-3">إلغاء</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* بحث */}
        <div className="relative mb-12 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="ابحث في المدونة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pr-10 h-12"
          />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="loader"></div>
          </div>
        )}

        {/* المقالات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card group cursor-pointer overflow-hidden flex flex-col h-full"
              onClick={() => setSelectedPost(post)}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={post.image_url || 'https://via.placeholder.com/600x400'}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                {isAdmin && (
                   <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (window.confirm('حذف المقال؟')) deleteMutation.mutate(post.id)
                    }}
                    className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-1">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags?.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="badge-gold text-[10px] py-0.5">{tag}</span>
                  ))}
                </div>
                <h3 className="text-white font-bold text-xl mb-3 leading-tight group-hover:text-yellow-400 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-3 mb-6 flex-1">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 border-t border-white/5 pt-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />{new Date(post.published_at).toLocaleDateString('ar-SA')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />{post.read_time} دقيقة قراءة
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20 glass rounded-2xl">
            <p className="text-gray-400 text-lg italic">لا توجد مقالات تتوافق مع بحثك</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogPage
