-- ==============================================================
-- صالون الحوّاري - نظام الإعجابات للمنتجات (Product Likes)
-- انسخ هذا الكود بالكامل وشغله في: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================

-- 1. إنشاء جدول الإعجابات للمنتجات
CREATE TABLE IF NOT EXISTS public.product_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, product_id)
);

-- 2. تفعيل الحماية على مستوى الصفوف (Row Level Security)
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;

-- 3. سياسات الوصول والحماية RLS
-- سياسة القراءة: يمكن للجميع رؤية الإعجابات لمعرفة العدد الإجمالي
CREATE POLICY "Anyone can view product likes" ON public.product_likes
  FOR SELECT USING (true);

-- سياسة الإضافة: يمكن للمستخدم المسجل فقط الإعجاب بمنتج باسمه
CREATE POLICY "Authenticated users can like products" ON public.product_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- سياسة الحذف: يمكن للمستخدم فقط إلغاء إعجابه الخاص
CREATE POLICY "Users can remove own product like" ON public.product_likes
  FOR DELETE USING (auth.uid()::text = user_id);
