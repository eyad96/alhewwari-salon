import { supabase } from '@/lib/supabase'
import { uploadToCloudinary } from '@/lib/cloudinary'
import type { Product } from '@/types'

// ==============================
// استعلام المنتجات
// ==============================

export const getProducts = async (category?: string): Promise<Product[]> => {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Product[]
}

export const getProductById = async (id: string): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Product
}

// ==============================
// إدارة المنتجات (أدمن)
// ==============================

export interface CreateProductData {
  name: string
  description: string
  price: number
  category: string
  stock: number
  imageFile?: File
  image_url?: string
}

export const createProduct = async (data: CreateProductData): Promise<Product> => {
  let image_url = data.image_url || ''

  // رفع الصورة إلى Cloudinary إذا كانت موجودة
  if (data.imageFile) {
    const result = await uploadToCloudinary(data.imageFile, 'salon-alhewwari/products')
    image_url = result.secure_url
  }

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      stock: data.stock,
      image_url,
    })
    .select()
    .single()

  if (error) throw error
  return product as Product
}

export const updateProduct = async (
  id: string,
  updates: Partial<CreateProductData>,
): Promise<Product> => {
  let image_url = updates.image_url

  if (updates.imageFile) {
    const result = await uploadToCloudinary(updates.imageFile, 'salon-alhewwari/products')
    image_url = result.secure_url
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      ...updates,
      image_url: image_url ?? undefined,
      imageFile: undefined,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Product
}

export const deleteProduct = async (id: string): Promise<void> => {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export const updateProductStock = async (id: string, stock: number): Promise<void> => {
  const { error } = await supabase.from('products').update({ stock }).eq('id', id)
  if (error) throw error
}
