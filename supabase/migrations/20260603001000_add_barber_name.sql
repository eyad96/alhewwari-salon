-- 1. Add barber_name column to public.bookings table (as text, nullable)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS barber_name text;

-- 2. Recreate appointments view to select the barber_name column from bookings
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
  b.barber_name,
  b.created_at
FROM public.bookings b
LEFT JOIN public.profiles p ON b.user_id = p.id;

-- 3. Reload PostgREST schema cache to reflect updates instantly
NOTIFY pgrst, 'reload schema';
