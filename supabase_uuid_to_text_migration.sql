-- ==============================================================
-- صالون الحوّاري - معالجة تعارض البيانات (UUID vs Text) الخاص بـ Clerk
-- انسخ هذا الكود بالكامل وشغله في: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================

-- 1. إسقاط القيود (Foreign Keys) التي تربط الجداول بجدول Profiles لتجنب تعارض تعديل النوع
ALTER TABLE IF EXISTS public.bookings 
  DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;

ALTER TABLE IF EXISTS public.loyalty_points 
  DROP CONSTRAINT IF EXISTS loyalty_points_user_id_fkey;

ALTER TABLE IF EXISTS public.loyalty_transactions 
  DROP CONSTRAINT IF EXISTS loyalty_transactions_user_id_fkey;

ALTER TABLE IF EXISTS public.reviews 
  DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;

ALTER TABLE IF EXISTS public.photo_likes 
  DROP CONSTRAINT IF EXISTS photo_likes_user_id_fkey;

-- 2. إسقاط قيد الربط الخارجي لجدول profiles بجدول auth.users الافتراضي الخاص بـ Supabase
ALTER TABLE IF EXISTS public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- 3. تحويل نوع الأعمدة من UUID إلى Text لتقبل معرّفات Clerk النصية (مثال: user_...)
ALTER TABLE public.profiles 
  ALTER COLUMN id TYPE text;

ALTER TABLE public.bookings 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE public.loyalty_points 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE public.loyalty_transactions 
  ALTER COLUMN user_id TYPE text;

ALTER TABLE public.reviews 
  ALTER COLUMN user_id TYPE text;

-- 4. إعادة إنشاء القيود (Foreign Keys) بالاعتماد على النوع الجديد (Text) لضمان تكامل البيانات
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_points 
  ADD CONSTRAINT loyalty_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.loyalty_transactions 
  ADD CONSTRAINT loyalty_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.reviews 
  ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 5. إعادة بناء دالة التحقق من دور المسؤول (is_admin) لتلائم البيانات النصية
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  );
END;
$$;

-- 6. إعادة بناء دالة تأكيد الحلاقة وإضافة نقاط الولاء (confirm_haircut_completed) بدون أي تحويل UUID خاطئ
CREATE OR REPLACE FUNCTION public.confirm_haircut_completed(
  p_booking_id uuid,
  p_points_to_add integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id text;
BEGIN
  -- 1. التحقق من صلاحية المسؤول
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بإجراء هذه العملية. هذه الصلاحية للمسؤولين فقط.';
  END IF;

  -- 2. جلب معرّف المستخدم الخاص بالحجز
  SELECT user_id INTO v_user_id
  FROM public.bookings
  WHERE id = p_booking_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على الحجز المحدد.';
  END IF;

  -- 3. تحديث حالة الحجز إلى 'completed'
  UPDATE public.bookings
  SET status = 'completed'
  WHERE id = p_booking_id;

  -- 4. زيادة نقاط ولاء المستخدم في جدول public.profiles
  UPDATE public.profiles
  SET loyalty_points = coalesce(loyalty_points, 0) + p_points_to_add
  WHERE id = v_user_id;

  -- 5. التوافق الرجعي: إدخال أو تحديث النقاط في جدول loyalty_points بدون تحويل UUID
  INSERT INTO public.loyalty_points (user_id, points, total_earned, updated_at)
  VALUES (v_user_id, p_points_to_add, p_points_to_add, now())
  ON CONFLICT (user_id) DO UPDATE
  SET points = public.loyalty_points.points + p_points_to_add,
      total_earned = public.loyalty_points.total_earned + p_points_to_add,
      updated_at = now();

  -- 6. تسجيل العملية في جدول العمليات (loyalty_transactions)
  INSERT INTO public.loyalty_transactions (user_id, points, type, description, created_at)
  VALUES (v_user_id, p_points_to_add, 'earned', 'إتمام حلاقة مع تأكيد المسؤول', now());

END;
$$;

-- منح صلاحيات التنفيذ للدالة
GRANT EXECUTE ON FUNCTION public.confirm_haircut_completed(uuid, integer) TO anon, authenticated, service_role;
