// ==============================
// TypeScript Types & Interfaces
// ==============================

export interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  role: 'customer' | 'admin'
  avatar_url?: string
  loyalty_points?: number
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  service_name: string
  service_price: number
  booking_type: 'salon' | 'home'
  date: string
  time: string
  is_urgent: boolean
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  total_price: number
  notes?: string
  modified_count: number
  created_at: string
  user?: Pick<User, 'full_name' | 'phone' | 'email'>
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: 'perfume' | 'tool' | 'cream' | 'other'
  image_url: string
  stock: number
  created_at: string
  likes_count?: number
  likes?: string[]
}

export interface SignUpForm {
  full_name: string
  email: string
  phone?: string
  password: string
}

export interface StudioPhoto {
  id: string
  image_url: string
  cloudinary_public_id?: string
  caption?: string
  likes_count: number
  uploaded_at: string
}

export interface Review {
  id: string
  user_id: string
  rating: number
  comment: string
  created_at: string
  user?: Pick<User, 'full_name' | 'avatar_url'>
}

export interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  author_id?: string
  image_url: string
  tags: string[]
  published_at: string
  author?: Pick<User, 'full_name' | 'avatar_url'>
}

export interface LoyaltyPoints {
  id: string
  user_id: string
  points: number
  total_earned: number
  updated_at: string
}

export interface LoyaltyTransaction {
  id: string
  user_id: string
  points: number
  type: 'earned' | 'redeemed'
  description: string
  created_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

// ==============================
// خدمات الصالون
// ==============================

export interface Service {
  id: string
  name: string
  icon: string
  salonPrice: number
  homePrice: number
  duration: number
  description?: string
}

export const SERVICES: Service[] = [
  { id: 'haircut', name: 'قص الشعر', icon: '✂️', salonPrice: 3, homePrice: 7, duration: 30 },
  { id: 'beard', name: 'حلاقة الذقن', icon: '🪒', salonPrice: 2, homePrice: 5, duration: 20 },
  { id: 'haircut-beard', name: 'قص + ذقن', icon: '💈', salonPrice: 4, homePrice: 9, duration: 45 },
  { id: 'kids', name: 'قص أطفال', icon: '👦', salonPrice: 2, homePrice: 5, duration: 20 },
  { id: 'keratin', name: 'كيراتين', icon: '✨', salonPrice: 10, homePrice: 15, duration: 90 },
  { id: 'color', name: 'صبغة الشعر', icon: '🎨', salonPrice: 8, homePrice: 12, duration: 60 },
  { id: 'skin', name: 'تنظيف البشرة', icon: '🌿', salonPrice: 6, homePrice: 10, duration: 45 },
  { id: 'wax', name: 'إزالة الشعر بالشمع', icon: '🕯️', salonPrice: 4, homePrice: 7, duration: 30 },
]

// ==============================
// ثوابت التطبيق
// ==============================

export const WHATSAPP_NUMBER = '962787146476'
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`

export const WORKING_HOURS = {
  start: '12:00',
  end: '02:00',
  label: '12:00 م - 2:00 ص',
}

export const URGENT_FEE = 5 // دينار أردني إضافي للحجز الفوري
export const POINTS_PER_HAIRCUT = 20
export const POINTS_FOR_FREE = 100 // نقاط للحلاقة المجانية
export const CANCEL_WINDOW_MINUTES = 30 // نافذة الإلغاء بالدقائق
export const MAX_BOOKING_MODIFICATIONS = 1 // عدد التعديلات المسموحة
