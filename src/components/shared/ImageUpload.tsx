import React, { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { uploadToCloudinary, validateImageFile, getCloudinaryUrl, type CloudinaryUploadResult } from '@/lib/cloudinary'
import toast from 'react-hot-toast'

interface ImageUploadProps {
  onUpload: (result: CloudinaryUploadResult) => void
  onRemove?: () => void
  currentImage?: string
  folder?: string
  label?: string
  aspectRatio?: 'square' | 'wide' | 'portrait' | 'free'
  className?: string
  disabled?: boolean
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onUpload,
  onRemove,
  currentImage,
  folder = 'salon-alhewwari',
  label = 'رفع صورة',
  aspectRatio = 'square',
  className = '',
  disabled = false,
}) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const displayImage = preview || currentImage

  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    portrait: 'aspect-[3/4]',
    free: 'min-h-[200px]',
  }

  const handleFile = useCallback(async (file: File) => {
    const validation = validateImageFile(file)
    if (!validation.valid) {
      toast.error(validation.error || 'خطأ في الملف')
      return
    }

    // Preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    setProgress(0)

    try {
      const result = await uploadToCloudinary(file, folder, (p) => setProgress(p))
      onUpload(result)
      toast.success('✅ تم رفع الصورة بنجاح!')
    } catch (err: any) {
      toast.error(err.message || 'فشل رفع الصورة')
      setPreview(null)
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [folder, onUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (disabled || uploading) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [disabled, uploading, handleFile])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    setPreview(null)
    onRemove?.()
  }

  return (
    <div className={`relative ${className}`}>
      <label className="text-gray-400 text-sm mb-2 block">{label}</label>

      <div
        onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`relative ${aspectClasses[aspectRatio]} rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          dragOver
            ? 'border-yellow-400 bg-yellow-400/10'
            : displayImage
            ? 'border-yellow-400/30 hover:border-yellow-400/50'
            : 'border-gray-700 hover:border-yellow-400/40 bg-white/3'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* صورة معروضة */}
        {displayImage && (
          <img
            src={displayImage.includes('cloudinary') ? getCloudinaryUrl(displayImage, { width: 600, quality: 'auto' }) : displayImage}
            alt="preview"
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay للتحميل */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center"
            >
              <Loader2 className="w-8 h-8 text-yellow-400 animate-spin mb-3" />
              <div className="w-3/4 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full gold-gradient rounded-full"
                />
              </div>
              <p className="text-white text-sm mt-2">{progress}%</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* محتوى الـ placeholder */}
        {!displayImage && !uploading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
              dragOver ? 'gold-gradient' : 'bg-white/5 border border-white/10'
            }`}>
              <Upload className={`w-6 h-6 ${dragOver ? 'text-black' : 'text-yellow-400'}`} />
            </div>
            <div className="text-center">
              <p className="text-gray-300 text-sm font-medium">اسحب الصورة هنا</p>
              <p className="text-gray-500 text-xs mt-1">أو انقر للاختيار</p>
              <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP • حتى 5MB</p>
            </div>
          </div>
        )}

        {/* زر الإزالة */}
        {displayImage && !uploading && onRemove && (
          <button
            onClick={handleRemove}
            className="absolute top-2 left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Overlay تغيير الصورة */}
        {displayImage && !uploading && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition-all flex items-center justify-center opacity-0 hover:opacity-100">
            <div className="flex items-center gap-2 text-white text-sm font-medium">
              <ImageIcon className="w-4 h-4" />
              تغيير الصورة
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  )
}

export default ImageUpload
