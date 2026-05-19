-- 1. Create gallery_photos table if it doesn't exist
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  created_at timestamptz default now() not null
);

-- Enable RLS on gallery_photos
alter table public.gallery_photos enable row level security;

-- Policies for gallery_photos
drop policy if exists "Allow public read access to gallery_photos" on public.gallery_photos;
create policy "Allow public read access to gallery_photos" on public.gallery_photos
  for select using (true);

drop policy if exists "Allow admin full access to gallery_photos" on public.gallery_photos;
create policy "Allow admin full access to gallery_photos" on public.gallery_photos
  for all using (public.is_admin());

-- 2. Create photo_likes table if it doesn't exist
create table if not exists public.photo_likes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  photo_id uuid references public.gallery_photos(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(user_id, photo_id)
);

-- Enable RLS on photo_likes
alter table public.photo_likes enable row level security;

-- Policies for photo_likes
drop policy if exists "Allow public read access to photo_likes" on public.photo_likes;
create policy "Allow public read access to photo_likes" on public.photo_likes
  for select using (true);

drop policy if exists "Allow authenticated users to insert likes" on public.photo_likes;
create policy "Allow authenticated users to insert likes" on public.photo_likes
  for insert with check (auth.uid()::text = user_id);

drop policy if exists "Allow authenticated users to delete their own likes" on public.photo_likes;
create policy "Allow authenticated users to delete their own likes" on public.photo_likes
  for delete using (auth.uid()::text = user_id);

-- 3. Create public studio-images storage bucket
insert into storage.buckets (id, name, public)
values ('studio-images', 'studio-images', true)
on conflict (id) do nothing;

-- Storage policies for studio-images bucket
drop policy if exists "Public Access to studio-images" on storage.objects;
create policy "Public Access to studio-images" on storage.objects
  for select using (bucket_id = 'studio-images');

drop policy if exists "Admins can upload to studio-images" on storage.objects;
create policy "Admins can upload to studio-images" on storage.objects
  for insert with check (bucket_id = 'studio-images' and public.is_admin());

drop policy if exists "Admins can delete from studio-images" on storage.objects;
create policy "Admins can delete from studio-images" on storage.objects
  for delete using (bucket_id = 'studio-images' and public.is_admin());

-- 4. Create public appointments view with user avatars
create or replace view public.appointments as
select 
  b.id,
  b.user_id,
  coalesce(p.full_name, 'عميل الصالون') as customer_name,
  coalesce(p.phone, 'بدون هاتف') as customer_phone,
  coalesce(p.avatar_url, 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80') as avatar_url,
  b.date as appointment_date,
  b.time as appointment_time,
  b.status,
  b.created_at
from public.bookings b
left join public.profiles p on b.user_id = p.id;

-- Grant permissions to access the appointments view
grant select on public.appointments to anon, authenticated, service_role;
