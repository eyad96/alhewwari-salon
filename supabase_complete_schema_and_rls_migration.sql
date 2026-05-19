-- ==============================================================================
-- صالون الحوّاري - الترحيل الشامل والأمني لقاعدة البيانات والسياسات (UUID ➔ TEXT & RLS Rebuild)
-- انسخ هذا الكود بالكامل وشغله في: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================================

-- ==========================================
-- 1. إسقاط الفيو (View) والقيود لتفادي مشاكل القفل والاعتمادية
-- ==========================================
DROP VIEW IF EXISTS public.appointments;

ALTER TABLE IF EXISTS public.bookings DROP CONSTRAINT IF EXISTS bookings_user_id_fkey;
ALTER TABLE IF EXISTS public.loyalty_points DROP CONSTRAINT IF EXISTS loyalty_points_user_id_fkey;
ALTER TABLE IF EXISTS public.loyalty_transactions DROP CONSTRAINT IF EXISTS loyalty_transactions_user_id_fkey;
ALTER TABLE IF EXISTS public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE IF EXISTS public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_author_id_fkey;
ALTER TABLE IF EXISTS public.studio_likes DROP CONSTRAINT IF EXISTS studio_likes_user_id_fkey;
ALTER TABLE IF EXISTS public.photo_likes DROP CONSTRAINT IF EXISTS photo_likes_user_id_fkey;
ALTER TABLE IF EXISTS public.product_likes DROP CONSTRAINT IF EXISTS product_likes_user_id_fkey;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;


-- ==========================================
-- 2. تحويل نوع الأعمدة إلى TEXT لتدعم معرّفات Clerk النصية بالكامل
-- ==========================================
-- جدول الملفات الشخصية
ALTER TABLE public.profiles ALTER COLUMN id TYPE text;

-- جدول الحجوزات
ALTER TABLE public.bookings ALTER COLUMN user_id TYPE text;

-- الجداول التابعة الأخرى
ALTER TABLE public.loyalty_points ALTER COLUMN user_id TYPE text;
ALTER TABLE public.loyalty_transactions ALTER COLUMN user_id TYPE text;
ALTER TABLE public.reviews ALTER COLUMN user_id TYPE text;
ALTER TABLE public.blog_posts ALTER COLUMN author_id TYPE text;
ALTER TABLE public.studio_likes ALTER COLUMN user_id TYPE text;

-- جداول الإعجابات الإضافية (إن وجدت)
ALTER TABLE IF EXISTS public.photo_likes ALTER COLUMN user_id TYPE text;
ALTER TABLE IF EXISTS public.product_likes ALTER COLUMN user_id TYPE text;


-- ==========================================
-- 3. إضافة وتزامن الأعمدة المساعدة
-- ==========================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();


-- ==========================================
-- 4. إعادة بناء قيود المفاتيح الخارجية (Foreign Keys) باستخدام النوع النصي
-- ==========================================
ALTER TABLE public.bookings ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.loyalty_points ADD CONSTRAINT loyalty_points_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.loyalty_transactions ADD CONSTRAINT loyalty_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.blog_posts ADD CONSTRAINT blog_posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.studio_likes ADD CONSTRAINT studio_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- قيود إعجابات الاستوديو والمنتجات (إن وجدت)
ALTER TABLE IF EXISTS public.photo_likes ADD CONSTRAINT photo_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.product_likes ADD CONSTRAINT product_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


-- ==========================================
-- 5. إعادة بناء دالة التحقق من دور المسؤول (is_admin) ودعم RLS للتوكن
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
  -- التحقق من دور المسؤول إما عبر جدول profiles أو عبر بيانات التوكن (JWT user_metadata) المرسلة من Clerk
  RETURN (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text) AND role = 'admin'
    )
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
END;
$$;


-- ==========================================
-- 6. إعادة إنشاء الفيو (View) الخاص بالحجوزات
-- ==========================================
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

GRANT SELECT ON public.appointments TO anon, authenticated, service_role;


-- ==========================================
-- 7. تفعيل وإعادة بناء سياسات Row Level Security (RLS) بالكامل لدعم Clerk
-- ==========================================

-- تفعيل RLS على جميع الجداول المعدلة
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.product_likes ENABLE ROW LEVEL SECURITY;

-- تنظيف السياسات القديمة لتجنب التعارض
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON public.bookings;

DROP POLICY IF EXISTS "Users can view own loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "Users can update own loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "Users can insert own loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "Admin can manage all loyalty" ON public.loyalty_points;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON public.loyalty_transactions;

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert review" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own review" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON public.reviews;
DROP POLICY IF EXISTS "Admin can manage reviews" ON public.reviews;

DROP POLICY IF EXISTS "Allow public read access to photo_likes" ON public.photo_likes;
DROP POLICY IF EXISTS "Allow authenticated users to insert likes" ON public.photo_likes;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own likes" ON public.photo_likes;

DROP POLICY IF EXISTS "Users can view own likes" ON public.studio_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON public.studio_likes;
DROP POLICY IF EXISTS "Users can remove own like" ON public.studio_likes;


-- أ. سياسات جدول الملفات الشخصية (profiles)
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Admin can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());


-- ب. سياسات جدول الحجوزات (bookings)
CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Admin can manage all bookings" ON public.bookings
  FOR ALL USING (public.is_admin());


-- ج. سياسات نقاط الولاء (loyalty_points)
CREATE POLICY "Users can view own loyalty" ON public.loyalty_points
  FOR SELECT USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can update own loyalty" ON public.loyalty_points
  FOR UPDATE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can insert own loyalty" ON public.loyalty_points
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Admin can manage all loyalty" ON public.loyalty_points
  FOR ALL USING (public.is_admin());


-- د. سياسات معاملات نقاط الولاء (loyalty_transactions)
CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions
  FOR SELECT USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can insert own transactions" ON public.loyalty_transactions
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Admin can view all transactions" ON public.loyalty_transactions
  FOR SELECT USING (public.is_admin());


-- هـ. سياسات جدول التقييمات (reviews)
CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert review" ON public.reviews
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can update own review" ON public.reviews
  FOR UPDATE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can delete own review" ON public.reviews
  FOR DELETE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Admin can manage reviews" ON public.reviews
  FOR ALL USING (public.is_admin());


-- و. سياسات إعجابات الاستوديو (photo_likes)
CREATE POLICY "Allow public read access to photo_likes" ON public.photo_likes
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert likes" ON public.photo_likes
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Allow authenticated users to delete their own likes" ON public.photo_likes
  FOR DELETE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));


-- ز. سياسات إعجابات الاستوديو البديلة (studio_likes)
CREATE POLICY "Users can view own likes" ON public.studio_likes
  FOR SELECT USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Authenticated users can like" ON public.studio_likes
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Users can remove own like" ON public.studio_likes
  FOR DELETE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));
