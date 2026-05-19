-- ==============================================================================
-- صالون الحوّاري - الترحيل النهائي والأمن لجميع أنواع الأعمدة من UUID إلى Text
-- انسخ هذا الكود بالكامل وشغله في: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================================

-- 1. إسقاط الفيو (View) التابع للحجوزات لتفادي قفل تعديل نوع البيانات من قبل PostgreSQL
DROP VIEW IF EXISTS public.appointments;


-- 2. إسقاط جميع قيود المفاتيح الخارجية (Foreign Keys) لتفادي أي أخطاء أثناء تعديل نوع البيانات
ALTER TABLE IF EXISTS public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

ALTER TABLE IF EXISTS public.loyalty_points 
  DROP CONSTRAINT IF EXISTS loyalty_points_user_id_fkey;

ALTER TABLE IF EXISTS public.loyalty_transactions 
  DROP CONSTRAINT IF EXISTS loyalty_transactions_user_id_fkey;

ALTER TABLE IF EXISTS public.reviews 
  DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE IF EXISTS public.blog_posts 
  DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;

ALTER TABLE IF EXISTS public.studio_likes 
  DROP CONSTRAINT IF EXISTS studio_likes_user_id_fkey;

ALTER TABLE IF EXISTS public.photo_likes 
  DROP CONSTRAINT IF EXISTS photo_likes_user_id_fkey;

ALTER TABLE IF EXISTS public.product_likes 
  DROP CONSTRAINT IF EXISTS product_likes_user_id_fkey;

-- إسقاط قيد المفتاح الخارجي الافتراضي لجدول profiles بجدول auth.users الافتراضي الخاص بـ Supabase
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;


-- 3. تحويل نوع العمود التعريفي لجدول الملفات الشخصية (profiles.id) إلى نص ليدعم Clerk IDs
ALTER TABLE public.profiles 
  ALTER COLUMN id TYPE text;


-- 4. تحويل نوع الأعمدة لجميع الجداول التي تشير لجدول الملفات الشخصية إلى نص لتقبل Clerk IDs
ALTER TABLE public.bookings 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE public.loyalty_points 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE public.loyalty_transactions 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE public.reviews 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE public.blog_posts 
  ALTER COLUMN author_id TYPE text;

ALTER TABLE public.studio_likes 
  ALTER COLUMN user_id TYPE text;

-- تحويل جداول الإعجابات الإضافية إن وجدت
ALTER TABLE IF EXISTS public.photo_likes 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE IF EXISTS public.product_likes 
  ALTER COLUMN user_id TYPE text;


-- 5. إضافة عمود updated_at المفقود في جدول profiles لتفادي تعارض كود المزامنة بالواجهة
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- 6. إعادة بناء جميع قيود المفاتيح الخارجية (Foreign Keys) لربط الجداول بجدول profiles(id)
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_points 
  ADD CONSTRAINT loyalty_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_transactions 
  ADD CONSTRAINT loyalty_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.blog_posts 
  ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

ALTER TABLE public.studio_likes 
  ADD CONSTRAINT studio_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- إعادة إنشاء قيود الإعجابات الإضافية إن وجدت
ALTER TABLE IF EXISTS public.photo_likes 
  ADD CONSTRAINT photo_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS public.product_likes 
  ADD CONSTRAINT product_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- 7. إعادة إنشاء الفيو (appointments) ليعمل بسلاسة تامة بالنوع النصي الجديد للمعرفات
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

-- منح الصلاحيات العامة للفيو
GRANT SELECT ON public.appointments TO anon, authenticated, service_role;


-- 8. إعادة بناء دالة التحقق من المسؤول (is_admin) وتعديلها لتعتمد على الدعم النصي لمعرفات Clerk
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (auth.jwt() ->> 'sub') AND role = 'admin'
  );
END;
$$;
