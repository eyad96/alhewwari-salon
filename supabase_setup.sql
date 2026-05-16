-- ==============================
-- صالون الحوّاري - إعداد قاعدة البيانات الكامل
-- نسخ وتشغيل في: Supabase Dashboard → SQL Editor → New Query
-- ==============================

-- 1. جدول الملفات الشخصية
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text not null default '',
  phone text default '',
  email text default '',
  role text default 'customer' check (role in ('customer', 'admin')),
  avatar_url text default '',
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Admin can manage all profiles" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 2. جدول الحجوزات
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  service_name text not null,
  service_price numeric(10,2) not null,
  booking_type text not null check (booking_type in ('salon', 'home')),
  date date not null,
  time time not null,
  is_urgent boolean default false,
  status text default 'pending' check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  total_price numeric(10,2) not null,
  notes text default '',
  modified_count int default 0 check (modified_count >= 0),
  created_at timestamptz default now() not null
);

alter table public.bookings enable row level security;

create policy "Users can view own bookings" on public.bookings
  for select using (auth.uid() = user_id);

create policy "Users can create bookings" on public.bookings
  for insert with check (auth.uid() = user_id);

create policy "Users can update own bookings" on public.bookings
  for update using (auth.uid() = user_id);

create policy "Admin can manage all bookings" on public.bookings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. جدول نقاط الولاء
create table if not exists public.loyalty_points (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade unique not null,
  points int default 0 check (points >= 0),
  total_earned int default 0 check (total_earned >= 0),
  updated_at timestamptz default now() not null
);

alter table public.loyalty_points enable row level security;

create policy "Users can view own loyalty" on public.loyalty_points
  for select using (auth.uid() = user_id);

create policy "Users can update own loyalty" on public.loyalty_points
  for update using (auth.uid() = user_id);

create policy "Users can insert own loyalty" on public.loyalty_points
  for insert with check (auth.uid() = user_id);

create policy "Admin can manage all loyalty" on public.loyalty_points
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4. جدول معاملات نقاط الولاء
create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  points int not null,
  type text not null check (type in ('earned', 'redeemed')),
  description text default '',
  created_at timestamptz default now() not null
);

alter table public.loyalty_transactions enable row level security;

create policy "Users can view own transactions" on public.loyalty_transactions
  for select using (auth.uid() = user_id);

create policy "Users can insert own transactions" on public.loyalty_transactions
  for insert with check (auth.uid() = user_id);

create policy "Admin can view all transactions" on public.loyalty_transactions
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 5. جدول التقييمات
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
  rating int not null check (rating between 1 and 5),
  comment text not null check (length(comment) >= 5),
  created_at timestamptz default now() not null
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews" on public.reviews
  for select using (true);

create policy "Authenticated users can insert review" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can update own review" on public.reviews
  for update using (auth.uid() = user_id);

create policy "Users can delete own review" on public.reviews
  for delete using (auth.uid() = user_id);

create policy "Admin can manage reviews" on public.reviews
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 6. جدول المنتجات
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text default '',
  price numeric(10,2) not null check (price >= 0),
  category text not null check (category in ('perfume', 'tool', 'cream', 'other')),
  image_url text default '',
  cloudinary_public_id text default '',
  stock int default 0 check (stock >= 0),
  created_at timestamptz default now() not null
);

alter table public.products enable row level security;

create policy "Anyone can view products" on public.products
  for select using (true);

create policy "Admin can manage products" on public.products
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 7. جدول مقالات المدونة
create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null default '',
  excerpt text default '',
  author_id uuid references public.profiles(id) on delete set null,
  image_url text default '',
  cloudinary_public_id text default '',
  tags text[] default '{}',
  published_at timestamptz default now() not null
);

alter table public.blog_posts enable row level security;

create policy "Anyone can view blog posts" on public.blog_posts
  for select using (true);

create policy "Admin can manage blog posts" on public.blog_posts
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 8. جدول صور الاستوديو
create table if not exists public.studio_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  cloudinary_public_id text default '',
  caption text default '',
  likes_count int default 0 check (likes_count >= 0),
  uploaded_at timestamptz default now() not null
);

alter table public.studio_photos enable row level security;

create policy "Anyone can view studio photos" on public.studio_photos
  for select using (true);

create policy "Admin can manage studio photos" on public.studio_photos
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 9. جدول إعجابات الاستوديو
create table if not exists public.studio_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  photo_id uuid references public.studio_photos(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, photo_id)
);

alter table public.studio_likes enable row level security;

create policy "Users can view own likes" on public.studio_likes
  for select using (auth.uid() = user_id);

create policy "Authenticated users can like" on public.studio_likes
  for insert with check (auth.uid() = user_id);

create policy "Users can remove own like" on public.studio_likes
  for delete using (auth.uid() = user_id);

-- ==============================
-- دوال RPC
-- ==============================

-- زيادة عدد الإعجابات
create or replace function public.increment_photo_likes(p_id uuid)
returns int language plpgsql security definer as $$
declare
  new_count int;
begin
  update public.studio_photos
  set likes_count = likes_count + 1
  where id = p_id
  returning likes_count into new_count;
  return new_count;
end;
$$;

-- تقليل عدد الإعجابات
create or replace function public.decrement_photo_likes(p_id uuid)
returns int language plpgsql security definer as $$
declare
  new_count int;
begin
  update public.studio_photos
  set likes_count = greatest(0, likes_count - 1)
  where id = p_id
  returning likes_count into new_count;
  return new_count;
end;
$$;

-- ==============================
-- Trigger: إنشاء Profile عند التسجيل
-- ==============================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.email, ''),
    'customer'
  )
  on conflict (id) do nothing;

  insert into public.loyalty_points (user_id, points, total_earned)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- حذف الـ trigger القديم وإعادة إنشائه
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ==============================
-- بيانات أولية (seed data)
-- ==============================

-- صور الاستوديو
insert into public.studio_photos (image_url, caption, likes_count) values
  ('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80', 'قصة كلاسيكية', 47),
  ('https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80', 'تسريحة عصرية', 32),
  ('https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80', 'فيد مميز', 89),
  ('https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80', 'لوك أنيق', 21),
  ('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80', 'قصة رياضية', 56),
  ('https://images.unsplash.com/photo-1560869713-7d0a29430803?w=600&q=80', 'تسريحة مميزة', 38),
  ('https://images.unsplash.com/photo-1534297635766-a262cdcb8ee4?w=600&q=80', 'قصة عصرية', 72),
  ('https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80', 'ستايل فاخر', 44)
on conflict do nothing;

-- منتجات أولية
insert into public.products (name, description, price, category, image_url, stock) values
  ('عطر أود الملكي', 'عطر فاخر بمسك الأود الأصيل، يدوم طويلاً', 45, 'perfume', 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80', 10),
  ('كريم الشعر الفاخر', 'كريم مرطب ومثبت للشعر بزيت الأرغان', 18, 'cream', 'https://images.unsplash.com/photo-1631730486784-74757b48ea60?w=400&q=80', 25),
  ('ماكينة الحلاقة الاحترافية', 'ماكينة حلاقة ذات تقنية متقدمة مع شفرات تيتانيوم', 85, 'tool', 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=400&q=80', 5),
  ('زيت اللحية الطبيعي', 'زيت طبيعي مغذي للحية يمنحها لمعاناً وليونة', 22, 'cream', 'https://images.unsplash.com/photo-1555374018-13a8994ab246?w=400&q=80', 15),
  ('عطر عود وورد', 'مزيج فريد من الأود والورد المستخرج من الطبيعة', 55, 'perfume', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&q=80', 8)
on conflict do nothing;

-- مقالات المدونة
insert into public.blog_posts (title, content, excerpt, image_url, tags) values
  (
    '5 نصائح ذهبية للمحافظة على شعرك في الشتاء',
    'الشتاء يجلب معه برودة تؤثر على صحة شعرك. هنا 5 نصائح مجربة: 1. استخدم كريم مرطب يومياً. 2. قلل من الاستحمام بالماء الساخن. 3. استخدم مشطاً بدلاً من الفرشاة عند الشعر المبلل. 4. غطِّ رأسك في الطقس البارد. 5. تناول الأطعمة الغنية بالبيوتين والزنك.',
    'الشتاء يجلب معه برودة تؤثر على صحة شعرك. اكتشف كيف تحافظ على قوة ولمعة شعرك في هذا الموسم.',
    'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&q=80',
    ARRAY['شعر', 'عناية', 'شتاء']
  ),
  (
    'دليلك الكامل لاختيار تسريحة تناسب شكل وجهك',
    'ليست كل التسريحات مناسبة لكل الأشكال. الوجه البيضاوي: مناسب لجميع التسريحات. الوجه المربع: التسريحات القصيرة من الجانبين مع حجم في الأعلى. الوجه المدور: التسريحات العالية تمنح الوجه شكلاً أطول. الوجه المثلث: التسريحات المتوسطة الطول هي الأنسب.',
    'ليست كل التسريحات مناسبة لكل الأشكال. تعرّف على شكل وجهك وأنسب التسريحات له.',
    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80',
    ARRAY['تسريحات', 'نصائح', 'دليل']
  )
on conflict do nothing;

-- ==============================
-- جعل مستخدم أدمن (غيّر البريد الإلكتروني)
-- ==============================
-- update public.profiles set role = 'admin' where email = 'your-email@example.com';

-- ==============================
-- للتحقق من الجداول
-- ==============================
-- select table_name from information_schema.tables where table_schema = 'public';
