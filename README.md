# صالون الحوّاري - دليل الإعداد الكامل

## 🚀 تشغيل المشروع

```bash
cd salon-alhewwari/frontend/vite-project
npm run dev
```

الموقع يعمل على: **http://localhost:5173/**

---

## 🔑 إعداد Supabase (مطلوب)

### الخطوة 1: الحصول على مفاتيح Supabase
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروعاً جديداً أو افتح مشروعك الحالي
3. اذهب إلى **Settings → API**
4. انسخ:
   - **Project URL** (مثال: `https://xxxxx.supabase.co`)
   - **anon/public key** (يبدأ بـ `eyJ...`)

### الخطوة 2: تحديث ملف `.env`
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_gy8r95agtTtIicZtk_wzoQ_8siZHHy7
```

### الخطوة 3: إنشاء جداول قاعدة البيانات
1. اذهب إلى **Supabase Dashboard → SQL Editor**
2. انسخ محتوى ملف `supabase_setup.sql` وشغّله

### الخطوة 4: تفعيل OAuth (اختياري)
1. اذهب إلى **Authentication → Providers**
2. فعّل **Google** و**Facebook** وأضف مفاتيحهم

---

## 📁 هيكل المشروع

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx        # شريط التنقل
│   │   ├── Footer.tsx        # تذييل الصفحة
│   │   └── MainLayout.tsx    # التخطيط الرئيسي
│   └── shared/
│       ├── WhatsAppFloat.tsx  # زر واتساب الثابت
│       └── StarRating.tsx     # تقييم النجوم
├── hooks/
│   ├── useAuth.tsx           # إدارة المصادقة
│   └── useCart.tsx           # إدارة سلة التسوق
├── lib/
│   └── supabase.ts           # Supabase client
├── pages/
│   ├── Home/HomePage.tsx     # الصفحة الرئيسية
│   ├── Studio/StudioPage.tsx # الاستوديو
│   ├── Booking/BookingPage.tsx # الحجز
│   ├── Loyalty/LoyaltyPage.tsx # الولاء
│   ├── Reviews/ReviewsPage.tsx # التقييمات
│   ├── Products/ProductsPage.tsx # المنتجات
│   ├── Blog/BlogPage.tsx     # المدونة
│   ├── Auth/                 # صفحات المصادقة
│   ├── Dashboard/            # لوحة التحكم
│   ├── Contact/              # تواصل معنا
│   └── Legal/                # الخصوصية والشروط
├── services/                 # Supabase API calls
├── types/index.ts            # TypeScript types والثوابت
├── App.tsx                   # الجذر مع Routes
└── index.css                 # Global styles
```

---

## 🎨 نظام التصميم

| العنصر | القيمة |
|--------|---------|
| الخلفية | `#0A0A0A` |
| النص | `#FFFFFF` |
| الذهبي | `#D4AF37` |
| الرمادي | `#6B7280` |
| الخط | Cairo / Tajawal |
| الاتجاه | RTL |

---

## 📱 الصفحات المبنية

| الصفحة | المسار | الوصف |
|--------|--------|-------|
| الرئيسية | `/` | Hero + خدمات + بانر خصم |
| الاستوديو | `/studio` | معرض صور + لايكات |
| الحجز | `/booking` | تقويم + أوقات متاحة |
| الولاء | `/loyalty` | نقاط + استبدال |
| التقييمات | `/reviews` | تقييمات بالنجوم |
| المنتجات | `/products` | متجر + سلة |
| المدونة | `/blog` | مقالات + محرر أدمن |
| تسجيل الدخول | `/login` | بريد + Google/Facebook |
| التسجيل | `/signup` | حساب جديد |
| نسيان المرور | `/forgot-password` | إعادة تعيين |
| لوحة التحكم | `/dashboard` | للمستخدم والأدمن |
| تواصل معنا | `/contact` | نموذج + خريطة |
| الخصوصية | `/privacy` | سياسة الخصوصية |
| الشروط | `/terms` | الشروط والأحكام |

---

## 👑 صلاحيات الأدمن

لجعل مستخدم أدمن، شغّل هذا الـ SQL في Supabase:
```sql
update profiles set role = 'admin' where email = 'your-email@example.com';
```

### مميزات الأدمن:
- تصفير لايكات الاستوديو
- إدارة جميع الحجوزات
- إضافة نقاط للمستخدمين
- نشر مقالات المدونة
- إدارة المنتجات

---

## ⚙️ الثوابت القابلة للتعديل

في `src/types/index.ts`:
```ts
export const WHATSAPP_NUMBER = '962787146476'  // رقم الواتساب
export const URGENT_FEE = 5                     // رسوم الحجز الفوري
export const POINTS_PER_HAIRCUT = 20            // نقاط لكل حلاقة
export const POINTS_FOR_FREE = 100              // نقاط للحلاقة المجانية
```

---

## 🛠️ المكتبات المستخدمة

| المكتبة | الاستخدام |
|---------|----------|
| `@supabase/supabase-js` | قاعدة البيانات والمصادقة |
| `react-router-dom` | التنقل بين الصفحات |
| `@tanstack/react-query` | إدارة البيانات |
| `react-hook-form` + `zod` | النماذج والتحقق |
| `framer-motion` | الأنيميشن |
| `react-calendar` | تقويم الحجز |
| `react-hot-toast` | الإشعارات |
| `lucide-react` | الأيقونات |
| `date-fns` | معالجة التواريخ |
| `tailwindcss v4` | التنسيق |
