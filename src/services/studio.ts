import { supabase as defaultSupabase } from '@/lib/supabase'
import type { StudioPhoto } from '@/types'
import { uploadToCloudinary } from '@/lib/cloudinary'


// ==============================
// استعلامات الصور
// ==============================

export const getStudioPhotos = async (supabase = defaultSupabase): Promise<StudioPhoto[]> => {
  const { data, error } = await supabase
    .from('gallery_photos')
    .select('*, likes:photo_likes(user_id)')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data || []).map((p: any) => ({
    id: p.id,
    image_url: p.image_url,
    caption: p.caption || '',
    likes_count: p.likes?.length || 0,
    uploaded_at: p.created_at,
    likes: p.likes?.map((l: any) => l.user_id) || []
  })) as any[]
}

export const getTopLikedPhoto = async (supabase = defaultSupabase): Promise<StudioPhoto | null> => {
  const photos = await getStudioPhotos(supabase)
  if (photos.length === 0) return null
  return photos.sort((a, b) => b.likes_count - a.likes_count)[0]
}

// ==============================
// الإعجابات
// ==============================

export const getUserLikes = async (userId: string, supabase = defaultSupabase): Promise<string[]> => {
  const { data, error } = await supabase
    .from('photo_likes')
    .select('photo_id')
    .eq('user_id', userId)

  if (error) throw error
  return data?.map((l: any) => l.photo_id) || []
}

export const toggleLike = async (
  userId: string,
  photoId: string,
  isLiked: boolean,
  supabase = defaultSupabase,
): Promise<number> => {
  if (isLiked) {
    const { error } = await supabase
      .from('photo_likes')
      .delete()
      .eq('user_id', userId)
      .eq('photo_id', photoId)

    if (error) throw error
    return 0
  } else {
    const { error } = await supabase
      .from('photo_likes')
      .insert({ user_id: userId, photo_id: photoId })

    if (error && error.code !== '23505') throw error
    return 0
  }
}

// ==============================
// رفع الصور (Supabase Storage)
// ==============================

export interface UploadStudioPhotoParams {
  file: File
  caption?: string
  onProgress?: (progress: number) => void
  supabase?: any
}

export const uploadStudioPhoto = async ({
  file,
  caption,
  supabase = defaultSupabase,
}: UploadStudioPhotoParams): Promise<StudioPhoto> => {
  // 1. Upload directly to Cloudinary
  const result = await uploadToCloudinary(file, 'salon-alhewwari/studio')

  // 2. Save the resulting secure_url and caption to Supabase gallery_photos table
  const { data, error } = await supabase
    .from('gallery_photos')
    .insert({
      image_url: result.secure_url,
      caption: caption || '',
    })
    .select()
    .single()

  if (error) throw error
  return {
    id: data.id,
    image_url: data.image_url,
    caption: data.caption,
    likes_count: 0,
    uploaded_at: data.created_at,
  } as StudioPhoto
}


export const updateStudioPhoto = async (
  photoId: string,
  updates: { caption?: string },
  supabase = defaultSupabase,
): Promise<StudioPhoto> => {
  const { data, error } = await supabase
    .from('gallery_photos')
    .update(updates)
    .eq('id', photoId)
    .select()
    .single()

  if (error) throw error
  return {
    id: data.id,
    image_url: data.image_url,
    caption: data.caption,
    likes_count: 0,
    uploaded_at: data.created_at,
  } as StudioPhoto
}

export const deleteStudioPhoto = async (
  photoId: string,
  image_url?: string,
  supabase = defaultSupabase,
): Promise<void> => {
  // 1. Delete from database
  const { error } = await supabase.from('gallery_photos').delete().eq('id', photoId)
  if (error) throw error

  // 2. Delete from storage
  if (image_url) {
    try {
      const parts = image_url.split('/studio-images/')
      if (parts.length > 1) {
        const filePath = parts[1]
        await supabase.storage.from('studio-images').remove([filePath])
      }
    } catch (e) {
      console.error('Failed to remove image from storage:', e)
    }
  }
}

// ==============================
// تصفير الإعجابات (أدمن)
// ==============================

export const resetAllLikes = async (supabase = defaultSupabase): Promise<void> => {
  const { error } = await supabase
    .from('photo_likes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) throw error
}
