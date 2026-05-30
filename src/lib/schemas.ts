import { z } from 'zod'

// ==========================================
// 1. نظام التحقق من صحة الحجوزات (Booking Schema)
// ==========================================
export const bookingSchema = z.object({
  user_id: z.string({
    required_error: 'معرف العميل مطلوب',
    invalid_type_error: 'معرف العميل يجب أن يكون نصاً'
  }).min(1, 'معرف العميل مطلوب'),
  service_name: z.string({
    required_error: 'اسم الخدمة مطلوب'
  }).min(1, 'اسم الخدمة مطلوب'),
  service_price: z.number({
    required_error: 'سعر الخدمة مطلوب'
  }).nonnegative('السعر يجب أن يكون قيمة موجبة'),
  booking_type: z.enum(['salon', 'home'], {
    required_error: 'نوع الحجز مطلوب',
    invalid_type_error: 'نوع الحجز يجب أن يكون داخل الصالون أو خدمة منزلية'
  }),
  date: z.string({
    required_error: 'تاريخ الحجز مطلوب'
  }).regex(/^\d{4}-\d{2}-\d{2}$/, 'التاريخ يجب أن يكون بصيغة YYYY-MM-DD'),
  time: z.string({
    required_error: 'وقت الحجز مطلوب'
  }).regex(/^\d{2}:\d{2}(:\d{2})?$/, 'الوقت يجب أن يكون بصيغة HH:MM'),
  is_urgent: z.boolean({
    required_error: 'مؤشر الحجز المستعجل مطلوب'
  }),
  notes: z.string().optional().default(''),
})

// ==========================================
// 2. نظام التحقق من صحة التقييمات (Review Schema)
// ==========================================
export const reviewSchema = z.object({
  user_id: z.string({
    required_error: 'معرف العميل مطلوب'
  }).min(1, 'معرف العميل مطلوب'),
  rating: z.number({
    required_error: 'التقييم مطلوب'
  }).int('التقييم يجب أن يكون رقماً صحيحاً')
    .min(1, 'التقييم الأدنى هو نجمة واحدة')
    .max(5, 'التقييم الأقصى هو خمس نجوم'),
  comment: z.string({
    required_error: 'التعليق مطلوب'
  }).min(5, 'التعليق يجب أن لا يقل عن 5 أحرف لحفظ جودة التقييمات'),
})

// ==========================================
// 3. نظام التحقق من صحة المنتجات (Product Schema)
// ==========================================
export const productSchema = z.object({
  name: z.string({
    required_error: 'اسم المنتج مطلوب'
  }).min(1, 'اسم المنتج مطلوب'),
  description: z.string().optional().default(''),
  price: z.number({
    required_error: 'سعر المنتج مطلوب'
  }).nonnegative('سعر المنتج يجب أن يكون قيمة موجبة'),
  category: z.enum(['perfume', 'tool', 'cream', 'other'], {
    required_error: 'فئة المنتج مطلوبة',
    invalid_type_error: 'فئة المنتج يجب أن تكون صحيحة (perfume, tool, cream, other)'
  }),
  stock: z.number({
    required_error: 'كمية المخزون مطلوبة'
  }).int('كمية المخزون يجب أن تكون رقماً صحيحاً')
    .nonnegative('كمية المخزون لا يمكن أن تكون سالبة'),
  image_url: z.string().optional().default(''),
})

// ==========================================
// 4. نظام التحقق من نموذج الاتصال (Contact Schema)
// ==========================================
export const contactSchema = z.object({
  name: z.string({
    required_error: 'الاسم الكامل مطلوب'
  }).min(2, 'الاسم الكامل يجب أن يكون حرفين على الأقل'),
  email: z.string({
    required_error: 'البريد الإلكتروني مطلوب'
  }).email('البريد الإلكتروني غير صالح، يرجى كتابته بشكل صحيح (مثال: email@domain.com)'),
  message: z.string({
    required_error: 'محتوى الرسالة مطلوب'
  }).min(10, 'تفاصيل الرسالة يجب أن لا تقل عن 10 أحرف لتوضيح الاستفسار'),
})
