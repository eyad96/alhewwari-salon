-- ==============================================================================
-- صالون الحوّاري - الإصلاح النهائي لسياسات RLS والدعم الكامل لمعرّفات Clerk النصية
-- انسخ هذا الكود بالكامل وشغله في: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================================

-- 1. إعادة بناء دالة التحقق من المسؤول (Admin) لتعتمد على التوكن مباشرة وبدون تكرار
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

COMMENT ON FUNCTION public.is_admin() IS 'دالة أمنية للتحقق من دور المسؤول بالاعتماد على معرّف Clerk الممرر في التوكن';


-- ==========================================
-- 2. إعداد سياسات جدول الملفات الشخصية (profiles)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "Admin can manage all profiles" ON public.profiles
  FOR ALL USING (public.is_admin());


-- ==========================================
-- 3. إعداد سياسات جدول الحجوزات (bookings)
-- ==========================================
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admin can manage all bookings" ON public.bookings;

CREATE POLICY "Users can view own bookings" ON public.bookings
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can create bookings" ON public.bookings
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Admin can manage all bookings" ON public.bookings
  FOR ALL USING (public.is_admin());


-- ==========================================
-- 4. إعداد سياسات نقاط الولاء (loyalty_points)
-- ==========================================
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "Users can update own loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "Users can insert own loyalty" ON public.loyalty_points;
DROP POLICY IF EXISTS "Admin can manage all loyalty" ON public.loyalty_points;

CREATE POLICY "Users can view own loyalty" ON public.loyalty_points
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update own loyalty" ON public.loyalty_points
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert own loyalty" ON public.loyalty_points
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Admin can manage all loyalty" ON public.loyalty_points
  FOR ALL USING (public.is_admin());


-- ==========================================
-- 5. إعداد سياسات معاملات نقاط الولاء (loyalty_transactions)
-- ==========================================
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.loyalty_transactions;
DROP POLICY IF EXISTS "Admin can view all transactions" ON public.loyalty_transactions;

CREATE POLICY "Users can view own transactions" ON public.loyalty_transactions
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can insert own transactions" ON public.loyalty_transactions
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Admin can view all transactions" ON public.loyalty_transactions
  FOR SELECT USING (public.is_admin());


-- ==========================================
-- 6. إعداد سياسات جدول التقييمات (reviews)
-- ==========================================
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated users can insert review" ON public.reviews;
DROP POLICY IF EXISTS "Users can update own review" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete own review" ON public.reviews;
DROP POLICY IF EXISTS "Admin can manage reviews" ON public.reviews;

CREATE POLICY "Anyone can view reviews" ON public.reviews
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert review" ON public.reviews
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can update own review" ON public.reviews
  FOR UPDATE USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can delete own review" ON public.reviews
  FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Admin can manage reviews" ON public.reviews
  FOR ALL USING (public.is_admin());


-- ==========================================
-- 7. إعداد سياسات إعجابات المنتجات (product_likes)
-- ==========================================
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view product likes" ON public.product_likes;
DROP POLICY IF EXISTS "Authenticated users can like products" ON public.product_likes;
DROP POLICY IF EXISTS "Users can remove own product like" ON public.product_likes;

CREATE POLICY "Anyone can view product likes" ON public.product_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like products" ON public.product_likes
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can remove own product like" ON public.product_likes
  FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);


-- ==========================================
-- 8. إعداد سياسات إعجابات الاستوديو (photo_likes / studio_likes)
-- ==========================================
-- جدول photo_likes
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to photo_likes" ON public.photo_likes;
DROP POLICY IF EXISTS "Allow authenticated users to insert likes" ON public.photo_likes;
DROP POLICY IF EXISTS "Allow authenticated users to delete their own likes" ON public.photo_likes;

CREATE POLICY "Allow public read access to photo_likes" ON public.photo_likes
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert likes" ON public.photo_likes
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Allow authenticated users to delete their own likes" ON public.photo_likes
  FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);

-- جدول studio_likes (في حال وجوده)
ALTER TABLE public.studio_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own likes" ON public.studio_likes;
DROP POLICY IF EXISTS "Authenticated users can like" ON public.studio_likes;
DROP POLICY IF EXISTS "Users can remove own like" ON public.studio_likes;

CREATE POLICY "Users can view own likes" ON public.studio_likes
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Authenticated users can like" ON public.studio_likes
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "Users can remove own like" ON public.studio_likes
  FOR DELETE USING ((auth.jwt() ->> 'sub') = user_id);
