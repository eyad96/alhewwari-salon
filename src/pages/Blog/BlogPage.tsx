import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Calendar, Clock, Tag, ChevronLeft, Plus, Edit, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { format } from 'date-fns'

const DEMO_POSTS = [
  {
    id: '1',
    title: '5 نصائح ذهبية للمحافظة على شعرك في الشتاء',
    excerpt: 'الشتاء يجلب معه برودة تؤثر على صحة شعرك. اكتشف كيف تحافظ على قوة ولمعة شعرك في هذا الموسم.',
    image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80',
    published_at: '2024-02-12',
    tags: ['شعر', 'عناية', 'شتاء'],
    read_time: 3,
  },
  {
    id: '2',
    title: 'دليلك الكامل لاختيار تسريحة تناسب شكل وجهك',
    excerpt: 'ليست كل التسريحات مناسبة لكل الأشكال. تعرّف على شكل وجهك وأنسب التسريحات له.',
    image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
    published_at: '2024-02-05',
    tags: ['تسريحات', 'نصائح'],
    read_time: 5,
  },
  {
    id: '3',
    title: 'أسرار العناية بالذقن: من الزيت إلى التشكيل',
    excerpt: 'الذقن الأنيقة تحتاج اهتماماً خاصاً. تعلم كيف تعتني بها يومياً وتحافظ على شكلها.',
    image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80',
    published_at: '2024-01-28',
    tags: ['ذقن', 'عناية', 'رجال'],
    read_time: 4,
  },
  {
    id: '4',
    title: 'هل الكيراتين مناسب لك؟ كل ما تريد معرفته',
    excerpt: 'الكيراتين شائع جداً، لكن هل هو الخيار المناسب لكل الأنواع؟ إليك الإجابة الشاملة.',
    image_url: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80',
    published_at: '2024-01-20',
    tags: ['كيراتين', 'علاجات'],
    read_time: 6,
  },
  {
    id: '5',
    title: 'ترطيب فروة الرأس: أهمية لا تقدر بثمن',
    excerpt: 'جفاف فروة الرأس مشكلة شائعة، لكن علاجها بسيط إذا عرفت الأسباب والحلول الصحيحة.',
    image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80',
    published_at: '2024-01-15',
    tags: ['فروة الرأس', 'ترطيب'],
    read_time: 4,
  },
  {
    id: '6',
    title: 'موضة الشعر 2024: أبرز التسريحات للرجال',
    excerpt: 'اكتشف أحدث صيحات الشعر لعام 2024 واختر ما يناسب أسلوبك وشخصيتك.',
    image_url: 'https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=600&q=80',
    published_at: '2024-01-08',
    tags: ['موضة', '2024', 'رجال'],
    read_time: 5,
  },
]

const BlogPage: React.FC = () => {
  const { isAdmin } = useAuth()
  const [posts, setPosts] = useState(DEMO_POSTS)
  const [search, setSearch] = useState('')
  const [selectedPost, setSelectedPost] = useState<typeof DEMO_POSTS[0] | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', excerpt: '', content: '', tags: '' })

  const filtered = posts.filter(p =>
    p.title.includes(search) || p.excerpt.includes(search)
  )

  const handleAddPost = () => {
    if (!newPost.title || !newPost.excerpt) return
    const post = {
      id: Date.now().toString(),
      title: newPost.title,
      excerpt: newPost.excerpt,
      image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80',
      published_at: format(new Date(), 'yyyy-MM-dd'),
      tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean),
      read_time: 3,
    }
    setPosts(prev => [post, ...prev])
    setShowEditor(false)
    setNewPost({ title: '', excerpt: '', content: '', tags: '' })
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
          <img src={selectedPost.image_url} alt={selectedPost.title}
            className="w-full h-64 object-cover rounded-2xl mb-8" />
          <div className="flex flex-wrap gap-2 mb-4">
            {selectedPost.tags.map(tag => (
              <span key={tag} className="badge-gold text-xs">{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl font-black text-white mb-4">{selectedPost.title}</h1>
          <div className="flex items-center gap-4 text-gray-400 text-sm mb-8">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{selectedPost.published_at}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{selectedPost.read_time} دقائق قراءة</span>
          </div>
          <div className="prose text-gray-300 leading-relaxed space-y-4">
            <p>{selectedPost.excerpt}</p>
            <p>هذا النص هو مثال لنص يمكن أن يستبدل في نفس المساحة، لقد تم توليد هذا النص من مولّد النص العربى...</p>
            <p>يحتوي على جمل مفيدة ونصائح عملية للمحافظة على صحة شعرك وبشرتك طوال العام. نتمنى أن تستفيد من هذه المعلومات وتشاركها مع أصدقائك.</p>
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
        {showEditor && isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-6 mb-8 border border-yellow-400/20"
          >
            <h3 className="text-white font-bold mb-4">إضافة مقال جديد</h3>
            <div className="space-y-4">
              <input
                placeholder="عنوان المقال"
                value={newPost.title}
                onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                className="input-field"
              />
              <textarea
                placeholder="مقتطف المقال..."
                value={newPost.excerpt}
                onChange={e => setNewPost(p => ({ ...p, excerpt: e.target.value }))}
                rows={3}
                className="input-field resize-none"
              />
              <textarea
                placeholder="محتوى المقال الكامل..."
                value={newPost.content}
                onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
                rows={5}
                className="input-field resize-none"
              />
              <input
                placeholder="الوسوم (مفصولة بفاصلة)"
                value={newPost.tags}
                onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
                className="input-field"
              />
              <div className="flex gap-3">
                <button onClick={handleAddPost} className="btn-gold px-6 py-2">نشر المقال</button>
                <button onClick={() => setShowEditor(false)} className="btn-outline-gold px-6 py-2">إلغاء</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* بحث */}
        <div className="relative mb-8 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            placeholder="ابحث في المدونة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-field pr-10"
          />
        </div>

        {/* المقالات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card group cursor-pointer overflow-hidden"
              onClick={() => setSelectedPost(post)}
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={post.image_url}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </div>
              
              <div className="p-5">
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="badge-gold text-xs">{tag}</span>
                  ))}
                </div>
                <h3 className="text-white font-bold text-lg mb-2 leading-tight group-hover:text-yellow-400 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm line-clamp-2 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />{post.published_at}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />{post.read_time} د
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BlogPage
