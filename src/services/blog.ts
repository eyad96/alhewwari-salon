import { supabase as defaultSupabase } from '@/lib/supabase'

export interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  image_url: string
  published_at: string
  tags: string[]
  read_time: number
  created_at: string
}

export const getBlogPosts = async (supabase = defaultSupabase): Promise<BlogPost[]> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .order('published_at', { ascending: false })
  
  if (error) throw error
  return data as BlogPost[]
}

export const createBlogPost = async (post: Partial<BlogPost>, supabase = defaultSupabase): Promise<BlogPost> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      ...post,
      published_at: post.published_at || new Date().toISOString(),
      tags: post.tags || [],
    })
    .select()
    .single()
  
  if (error) throw error
  return data as BlogPost
}

export const updateBlogPost = async (id: string, updates: Partial<BlogPost>, supabase = defaultSupabase): Promise<BlogPost> => {
  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data as BlogPost
}

export const deleteBlogPost = async (id: string, supabase = defaultSupabase): Promise<void> => {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw error
}
