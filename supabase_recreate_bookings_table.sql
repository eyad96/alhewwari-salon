-- ==============================================================================
-- صالون الحوّاري - إعادة إنشاء جدول الحجوزات وإعداد الحماية بالكامل (Clerk Native TEXT)
-- انسخ هذا الكود بالكامل وشغله في: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================================

-- 1. إسقاط الفيو (View) التابع للحجوزات أولاً إن وجد لتجنب تعارض البناء
DROP VIEW IF EXISTS public.appointments;

-- 2. التأكد من أن جدول الملفات الشخصية (profiles) يدعم النوع النصي لمعرف Clerk
ALTER TABLE IF EXISTS public.profiles 
  ALTER COLUMN id TYPE text;

-- 3. إعادة إنشاء جدول الحجوزات (bookings) بالخصائص والمواصفات النصية المطلوبة
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  service_name text NOT NULL,
  service_price numeric(10,2) NOT NULL,
  booking_type text DEFAULT 'salon' CHECK (booking_type IN ('salon', 'home')),
  date date NOT NULL,
  time time NOT NULL,
  is_urgent boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  total_price numeric(10,2),
  notes text DEFAULT '',
  modified_count int4 DEFAULT 0 CHECK (modified_count >= 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 4. إعداد ربط قيد المفتاح الخارجي (Foreign Key) بجدول profiles(id)
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. تفعيل حماية مستوى الصف (RLS) على جدول الحجوزات الجديد
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 6. إنشاء سياسات الحماية (RLS Policies) المتوافقة مع معرّفات Clerk النصية
-- أ. تنظيف السياسات القديمة
DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON public.bookings;

-- ب. سياسة القراءة للمستخدمين العاديين (SELECT)
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

-- ج. سياسة الإضافة للمستخدمين العاديين (INSERT)
CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

-- د. سياسة التحديث للمستخدمين العاديين (UPDATE)
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

-- هـ. سياسة المسؤولين (Admin) لإدارة جميع الحجوزات بالكامل
CREATE POLICY "Admin can manage all bookings" ON public.bookings
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text) AND role = 'admin'
    )
  );

-- 7. إعادة إنشاء الفيو (View) المشترك للحجوزات لتسهيل الاستعلامات بالواجهة
CREATE OR REPLACE VIEW public.appointments AS
SELECT 
  b.id,
  b.user_id,
  COALESCE(p.full_name, 'عميل الصالون') AS customer_name,
  COALESCE(p.phone, 'بدون هاتف') AS customer_phone,
  COALESCE(p.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80') AS avatar_url,
  b.date AS appointment_date,
  b.time AS appointment_time,
  b.status,
  b.created_at
FROM public.bookings b
LEFT JOIN public.profiles p ON b.user_id = p.id;

-- منح الصلاحيات لقراءة الفيو
GRANT SELECT ON public.appointments TO anon, authenticated, service_role;
