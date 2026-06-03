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
  selected_services?: any[]
  barber_name?: string
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
  salonPrice: number | null
  homePrice: number | null
  duration: number
  description?: string
  is_custom?: boolean
}

export const SERVICES: Service[] = [
  { id: 'haircut', name: 'حلاقة شعر', icon: '✂️', salonPrice: 5, homePrice: 10, duration: 30 },
  { id: 'beard', name: 'حلاقة ذقن', icon: '🪒', salonPrice: 2, homePrice: 5, duration: 20 },
  { id: 'haircut-beard', name: 'حلاقة شعر وذقن', icon: '💈', salonPrice: 7, homePrice: 15, duration: 45 },
  { id: 'skin', name: 'تنظيف بشرة', icon: '🌿', salonPrice: 10, homePrice: null, duration: 45 },
  { id: 'keratin', name: 'كرياتين او بروتين', icon: '✨', salonPrice: 15, homePrice: 25, duration: 90 },
  { id: 'blowdry', name: 'سشوار', icon: '💨', salonPrice: 2, homePrice: 5, duration: 15 },
  { id: 'wax', name: 'شمع', icon: '🕯️', salonPrice: 2, homePrice: 5, duration: 20 },
  { id: 'curly', name: 'كيرلي+حلاقة', icon: '🌀', salonPrice: 5, homePrice: 10, duration: 30 },
  { id: 'groom', name: 'عرض العريس', icon: '👑', salonPrice: 30, homePrice: null, duration: 120, description: 'Includes (Skincare + Legendary Haircut + Blowdry) at the groom\'s house before the party' },
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

// ==============================
// قائمة الحلاقين (Barbers List)
// ==============================
export const BARBERS = [
  'عبدالله الحواري',
  'حمزة الحواري',
  'ادهم',
  'مصطفى',
  'محمود',
  'زيد'
]
