import { supabase } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import type { BlogPost } from '@/types'

// ==============================
// استعلام المقالات
// ==============================

export const getBlogPosts = async (): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, author:profiles(full_name, avatar_url)')
    .order('published_at', { ascending: false })

  if (error) throw error
  return data as BlogPost[]
}

export const getBlogPostById = async (id: string): Promise<BlogPost> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*, author:profiles(full_name, avatar_url)')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as BlogPost
}

// ==============================
// إدارة المقالات (أدمن)
// ==============================

export interface CreatePostData {
  title: string
  content: string
  excerpt: string
  tags: string[]
  imageFile?: File
  image_url?: string
}

export const createBlogPost = async (
  authorId: string,
  data: CreatePostData,
): Promise<BlogPost> => {
  let image_url = data.image_url || ''

  if (data.imageFile) {
    const result = await uploadToCloudinary(data.imageFile, 'salon-alhewwari/blog')
    image_url = result.secure_url
  }

  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert({
      title: data.title,
      content: data.content,
      excerpt: data.excerpt,
      tags: data.tags,
      image_url,
      author_id: authorId,
      published_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return post as BlogPost
}

export const updateBlogPost = async (
  id: string,
  updates: Partial<CreatePostData>,
): Promise<BlogPost> => {
  let image_url = updates.image_url

  if (updates.imageFile) {
    const result = await uploadToCloudinary(updates.imageFile, 'salon-alhewwari/blog')
    image_url = result.secure_url
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      title: updates.title,
      content: updates.content,
      excerpt: updates.excerpt,
      tags: updates.tags,
      ...(image_url && { image_url }),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as BlogPost
}

export const deleteBlogPost = async (id: string): Promise<void> => {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw error
}
