-- ==============================================================
-- صالون الحوّاري - حل مشكلة التكرار اللانهائي (Infinite Recursion) في سياسات RLS
-- انسخ هذا الكود وشغله في: Supabase Dashboard → SQL Editor → New Query
-- ==============================================================

-- 1. إنشاء دالة التحقق من دور المسؤول (Admin) مع تجاوز RLS بأمان
create or replace function public.is_admin()
returns boolean language plpgsql security definer as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$;

-- 2. إيقاف السياسات القديمة للمسؤولين لتجنب التعارض
drop policy if exists "Admin can manage all profiles" on public.profiles;
drop policy if exists "Admin can manage all bookings" on public.bookings;
drop policy if exists "Admin can manage all loyalty" on public.loyalty_points;
drop policy if exists "Admin can view all transactions" on public.loyalty_transactions;
drop policy if exists "Admin can manage reviews" on public.reviews;
drop policy if exists "Admin can manage products" on public.products;
drop policy if exists "Admin can manage blog posts" on public.blog_posts;
drop policy if exists "Admin can manage studio photos" on public.studio_photos;

-- 3. إعادة إنشاء سياسات RLS للمسؤولين باستخدام الدالة الجديدة الخالية من التكرار اللانهائي

-- ملفات التعريف (Profiles)
create policy "Admin can manage all profiles" on public.profiles
  for all using (public.is_admin());

-- الحجوزات (Bookings / Appointments)
create policy "Admin can manage all bookings" on public.bookings
  for all using (public.is_admin());

-- نقاط الولاء (Loyalty Points)
create policy "Admin can manage all loyalty" on public.loyalty_points
  for all using (public.is_admin());

-- معاملات الولاء (Loyalty Transactions)
create policy "Admin can view all transactions" on public.loyalty_transactions
  for select using (public.is_admin());

-- التقييمات (Reviews)
create policy "Admin can manage reviews" on public.reviews
  for all using (public.is_admin());

-- المنتجات (Products)
create policy "Admin can manage products" on public.products
  for all using (public.is_admin());

-- المدونة (Blog)
create policy "Admin can manage blog posts" on public.blog_posts
  for all using (public.is_admin());

-- صور الاستوديو (Studio Photos)
create policy "Admin can manage studio photos" on public.studio_photos
  for all using (public.is_admin());

-- 4. إثبات عمل السياسات
comment on function public.is_admin() is 'دالة أمنية لتحديد دور الآدمن وتجاوز التكرار اللانهائي في RLS';
