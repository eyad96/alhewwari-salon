import { supabase } from '@/lib/supabase'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import type { StudioPhoto } from '@/types'

// ==============================
// استعلامات الصور
// ==============================

export const getStudioPhotos = async (): Promise<StudioPhoto[]> => {
  const { data, error } = await supabase
    .from('studio_photos')
    .select('*')
    .order('uploaded_at', { ascending: false })

  if (error) throw error
  return data as StudioPhoto[]
}

export const getTopLikedPhoto = async (): Promise<StudioPhoto | null> => {
  const { data } = await supabase
    .from('studio_photos')
    .select('*')
    .order('likes_count', { ascending: false })
    .limit(1)
    .single()
  return data as StudioPhoto | null
}

// ==============================
// الإعجابات
// ==============================

export const getUserLikes = async (userId: string): Promise<string[]> => {
  const { data } = await supabase
    .from('studio_likes')
    .select('photo_id')
    .eq('user_id', userId)
  return data?.map((l) => l.photo_id) || []
}

export const toggleLike = async (
  userId: string,
  photoId: string,
  isLiked: boolean,
): Promise<number> => {
  if (isLiked) {
    // إزالة اللايك
    await supabase
      .from('studio_likes')
      .delete()
      .eq('user_id', userId)
      .eq('photo_id', photoId)

    const { data } = await supabase.rpc('decrement_photo_likes', { p_id: photoId })
    return data ?? 0
  } else {
    // إضافة لايك
    const { error: likeError } = await supabase
      .from('studio_likes')
      .insert({ user_id: userId, photo_id: photoId })

    if (likeError && likeError.code !== '23505') throw likeError // تجاهل duplicate

    const { data } = await supabase.rpc('increment_photo_likes', { p_id: photoId })
    return data ?? 0
  }
}

// ==============================
// رفع الصور (Cloudinary + Supabase)
// ==============================

export interface UploadStudioPhotoParams {
  file: File
  caption?: string
  onProgress?: (progress: number) => void
}

export const uploadStudioPhoto = async ({
  file,
  caption,
  onProgress,
}: UploadStudioPhotoParams): Promise<StudioPhoto> => {
  // 1. رفع الصورة إلى Cloudinary
  const cloudResult = await uploadToCloudinary(file, 'salon-alhewwari/studio', onProgress)

  // 2. حفظ سجل في Supabase
  const { data, error } = await supabase
    .from('studio_photos')
    .insert({
      image_url: cloudResult.secure_url,
      cloudinary_public_id: cloudResult.public_id,
      caption: caption || '',
      likes_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as StudioPhoto
}

export const updateStudioPhoto = async (
  photoId: string,
  updates: { caption?: string },
): Promise<StudioPhoto> => {
  const { data, error } = await supabase
    .from('studio_photos')
    .update(updates)
    .eq('id', photoId)
    .select()
    .single()

  if (error) throw error
  return data as StudioPhoto
}

export const deleteStudioPhoto = async (
  photoId: string,
  cloudinaryPublicId?: string,
): Promise<void> => {
  // 1. حذف اللايكات المرتبطة
  await supabase.from('studio_likes').delete().eq('photo_id', photoId)

  // 2. حذف السجل من Supabase
  const { error } = await supabase.from('studio_photos').delete().eq('id', photoId)
  if (error) throw error

  // 3. حذف من Cloudinary (server-side في الإنتاج)
  if (cloudinaryPublicId) {
    await deleteFromCloudinary(cloudinaryPublicId)
  }
}

// ==============================
// تصفير الإعجابات (أدمن)
// ==============================

export const resetAllLikes = async (): Promise<void> => {
  // حذف جميع الإعجابات
  const { error: likesError } = await supabase
    .from('studio_likes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all

  if (likesError) throw likesError

  // تصفير العدادات
  const { error: photosError } = await supabase
    .from('studio_photos')
    .update({ likes_count: 0 })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (photosError) throw photosError
}
