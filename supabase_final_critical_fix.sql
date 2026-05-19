-- ==============================================================================
-- صالون الحوّاري - الإصلاح النهائي والأهم لقاعدة البيانات (UUID Type & Profiles Sync)
-- انسخ هذا الكود بالكامل وشغله في: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================================

-- 1. إسقاط قيد المفتاح الخارجي المؤقت لجدول الحجوزات لتفادي تعارض تعديل نوع البيانات
ALTER TABLE IF EXISTS public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

-- 2. تحويل عمود user_id في جدول bookings إلى النوع النصي ليتوافق تماماً مع Clerk IDs النصية
ALTER TABLE public.bookings 
  ALTER COLUMN user_id TYPE text;

-- 3. إعادة إنشاء قيد المفتاح الخارجي (Foreign Key) ليرتبط بجدول profiles(id)
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 4. إضافة عمود updated_at المفقود في جدول profiles لتفادي خطأ الـ schema cache
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 5. إعادة بناء دالة التحقق من المسؤول (Admin) لتعتمد على الدعم النصي لمعرفات Clerk
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
