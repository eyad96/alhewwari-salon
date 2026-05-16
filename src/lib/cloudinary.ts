// Cloudinary Configuration & Upload Utilities

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'salon_unsigned'

export const cloudinaryConfig = {
  cloudName: CLOUD_NAME,
  uploadPreset: UPLOAD_PRESET,
}

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  width: number
  height: number
  format: string
  resource_type: string
  original_filename: string
  bytes: number
}

/**
 * Upload a file to Cloudinary using unsigned upload preset
 */
export const uploadToCloudinary = async (
  file: File,
  folder: string = 'salon-alhewwari',
  onProgress?: (progress: number) => void,
): Promise<CloudinaryUploadResult> => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)
  formData.append('quality', 'auto')
  formData.append('fetch_format', 'auto')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const result = JSON.parse(xhr.responseText) as CloudinaryUploadResult
        resolve(result)
      } else {
        try {
          const error = JSON.parse(xhr.responseText)
          reject(new Error(error.error?.message || 'فشل رفع الصورة'))
        } catch {
          reject(new Error('فشل رفع الصورة'))
        }
      }
    })

    xhr.addEventListener('error', () => reject(new Error('خطأ في الشبكة أثناء رفع الصورة')))
    xhr.addEventListener('abort', () => reject(new Error('تم إلغاء رفع الصورة')))

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`)
    xhr.send(formData)
  })
}

/**
 * Delete image from Cloudinary (requires backend or signed preset)
 * For now just returns success - delete via Supabase record removal
 */
export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  // In production, this should call a backend endpoint that signs the delete request
  console.log('Delete from Cloudinary:', publicId)
  // TODO: Implement server-side deletion
}

/**
 * Get optimized Cloudinary URL with transformations
 */
export const getCloudinaryUrl = (
  url: string,
  options: {
    width?: number
    height?: number
    quality?: 'auto' | number
    format?: 'auto' | 'webp' | 'jpg'
    crop?: 'fill' | 'fit' | 'scale' | 'thumb'
  } = {},
): string => {
  if (!url || !url.includes('cloudinary')) return url

  const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = options

  const transformations: string[] = [`q_${quality}`, `f_${format}`]
  if (width) transformations.push(`w_${width}`)
  if (height) transformations.push(`h_${height}`)
  if (width || height) transformations.push(`c_${crop}`)

  return url.replace('/upload/', `/upload/${transformations.join(',')}/`)
}

/**
 * Validate file before upload
 */
export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const MAX_SIZE = 5 * 1024 * 1024 // 5MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'صيغة الملف غير مدعومة. استخدم JPG, PNG, WebP, أو GIF' }
  }

  if (file.size > MAX_SIZE) {
    return { valid: false, error: 'حجم الصورة كبير جداً. الحد الأقصى 5MB' }
  }

  return { valid: true }
}
