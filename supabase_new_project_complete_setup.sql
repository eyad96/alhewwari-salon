-- ==============================================================================
-- صالون الحوّاري - إعداد قاعدة البيانات الشامل لمشروع Supabase الجديد (One-Click Blank DB Setup)
-- انسخ هذا الكود بالكامل وشغله في مشروعك الجديد: Supabase Dashboard → SQL Editor → New Query → Run
-- ==============================================================================

-- ==========================================
-- 1. جداول البيانات الأساسية والتابعة بالنوع النصي (TEXT) لـ Clerk
-- ==========================================

-- أ. جدول الملفات الشخصية (profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id text PRIMARY KEY, -- معرف Clerk النصي مباشرة
  full_name text NOT NULL DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  avatar_url text DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- ب. جدول الحجوزات (bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- ج. جدول نقاط الولاء (loyalty_points)
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points int DEFAULT 0 CHECK (points >= 0),
  total_earned int DEFAULT 0 CHECK (total_earned >= 0),
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- د. جدول معاملات نقاط الولاء (loyalty_transactions)
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  points int NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'redeemed')),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- هـ. جدول التقييمات والآراء (reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (length(comment) >= 5),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- و. جدول المنتجات المعروضة (products)
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  category text NOT NULL CHECK (category IN ('perfume', 'tool', 'cream', 'other')),
  image_url text DEFAULT '',
  cloudinary_public_id text DEFAULT '',
  stock int DEFAULT 0 CHECK (stock >= 0),
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ز. جدول مقالات المدونة (blog_posts)
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text DEFAULT '',
  author_id text REFERENCES public.profiles(id) ON DELETE SET NULL,
  image_url text DEFAULT '',
  cloudinary_public_id text DEFAULT '',
  tags text[] DEFAULT '{}',
  published_at timestamptz DEFAULT now() NOT NULL
);

-- ح. جدول صور استوديو الصالون (gallery_photos)
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  cloudinary_public_id text DEFAULT '',
  caption text DEFAULT '',
  created_at timestamptz DEFAULT now() NOT NULL
);

-- ط. جدول إعجابات صور الاستوديو (photo_likes)
CREATE TABLE IF NOT EXISTS public.photo_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  photo_id uuid NOT NULL REFERENCES public.gallery_photos(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, photo_id)
);

-- ي. جدول إعجابات المنتجات (product_likes)
CREATE TABLE IF NOT EXISTS public.product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- ك. جدول المواعيد المضافة يدوياً (available_slots)
CREATE TABLE IF NOT EXISTS public.available_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  created_by text REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(date, time)
);


-- ==========================================
-- 2. إعداد الدوال المساعدة والـ RPC Functions
-- ==========================================

-- دالة التحقق من صلاحية دور المسؤول (Admin Role verification)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean 
LANGUAGE plpgsql 
SECURITY DEFINER AS $$
BEGIN
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
-- 3. بناء الفيو (View) المشترك للحجوزات والمواعيد
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
-- 4. إعداد وتفعيل سياسات Row Level Security (RLS)
-- ==========================================

-- تفعيل الـ RLS على كافة الجداول
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photo_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_slots ENABLE ROW LEVEL SECURITY;

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

-- و. سياسات المنتجات (products)
CREATE POLICY "Anyone can view products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL USING (public.is_admin());

-- ز. سياسات مقالات المدونة (blog_posts)
CREATE POLICY "Anyone can view blog posts" ON public.blog_posts
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage blog posts" ON public.blog_posts
  FOR ALL USING (public.is_admin());

-- ح. سياسات صور استوديو الصالون (gallery_photos)
CREATE POLICY "Anyone can view gallery photos" ON public.gallery_photos
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage gallery photos" ON public.gallery_photos
  FOR ALL USING (public.is_admin());

-- ط. سياسات إعجابات الاستوديو (photo_likes)
CREATE POLICY "Allow public read access to photo_likes" ON public.photo_likes
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert photo likes" ON public.photo_likes
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Allow authenticated users to delete their own photo likes" ON public.photo_likes
  FOR DELETE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

-- ي. سياسات إعجابات المنتجات (product_likes)
CREATE POLICY "Allow public read access to product_likes" ON public.product_likes
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users to insert product likes" ON public.product_likes
  FOR INSERT WITH CHECK (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

CREATE POLICY "Allow authenticated users to delete their own product likes" ON public.product_likes
  FOR DELETE USING (user_id = COALESCE(auth.jwt() ->> 'sub', auth.uid()::text));

-- ك. سياسات المواعيد المتاحة (available_slots)
CREATE POLICY "Anyone can view available slots" ON public.available_slots
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage available slots" ON public.available_slots
  FOR ALL USING (public.is_admin());
