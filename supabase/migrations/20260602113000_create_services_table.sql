-- 1. Create loyalty_points column on profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0 CHECK (loyalty_points >= 0);
UPDATE public.profiles SET loyalty_points = 0 WHERE loyalty_points IS NULL;

-- 2. Create services table
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  english_name text NOT NULL,
  icon text DEFAULT '✂️',
  salon_price numeric(10,2),
  home_price numeric(10,2),
  duration integer DEFAULT 30, -- minutes
  description text DEFAULT '',
  is_custom boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- 3. Add selected_services JSONB column to bookings for rich data persistence
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selected_services jsonb DEFAULT '[]'::jsonb;

-- 4. Enable RLS on services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5. Drop old policies if they exist
DROP POLICY IF EXISTS "Anyone can view services" ON public.services;
DROP POLICY IF EXISTS "Admin can manage services" ON public.services;

-- 6. Create RLS policies
CREATE POLICY "Anyone can view services" ON public.services
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage services" ON public.services
  FOR ALL USING (public.is_admin());

-- 7. Seed default services
INSERT INTO public.services (name, english_name, icon, salon_price, home_price, duration) VALUES
('حلاقة شعر', 'Haircut', '✂️', 5.00, 10.00, 30),
('حلاقة ذقن', 'Beard Shave', '🪒', 2.00, 5.00, 20),
('حلاقة شعر وذقن', 'Haircut & Beard', '💈', 7.00, 15.00, 45),
('تنظيف بشرة', 'Skincare', '🌿', 10.00, NULL, 45),
('كرياتين او بروتين', 'Keratin or Protein', '✨', 15.00, 25.00, 90),
('سشوار', 'Blowdry / Blow-out', '💨', 2.00, 5.00, 15),
('شمع', 'Waxing', '🕯️', 2.00, 5.00, 20),
('كيرلي', 'Curly Hair', '🌀', 5.00, 10.00, 30),
('عرض العريس', 'Groom''s Package', '👑', NULL, 30.00, 120)
ON CONFLICT (name) DO UPDATE
SET english_name = EXCLUDED.english_name,
    icon = EXCLUDED.icon,
    salon_price = EXCLUDED.salon_price,
    home_price = EXCLUDED.home_price,
    duration = EXCLUDED.duration;

-- 8. Recreate confirm_haircut_completed function with correct text type mapping for Clerk IDs
CREATE OR REPLACE FUNCTION public.confirm_haircut_completed(
  p_booking_id uuid,
  p_points_to_add integer DEFAULT 20
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id text;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بإجراء هذه العملية. هذه الصلاحية للمسؤولين فقط.';
  END IF;

  -- Fetch target user_id for this booking
  SELECT user_id INTO v_user_id
  FROM public.bookings
  WHERE id = p_booking_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على الحجز المحدد.';
  END IF;

  -- Update booking status to 'completed'
  UPDATE public.bookings
  SET status = 'completed'
  WHERE id = p_booking_id;

  -- Update user profiles points (+20)
  UPDATE public.profiles
  SET loyalty_points = COALESCE(loyalty_points, 0) + p_points_to_add
  WHERE id = v_user_id;

  -- Update legacy loyalty_points table (using text types)
  INSERT INTO public.loyalty_points (user_id, points, total_earned, updated_at)
  VALUES (v_user_id, p_points_to_add, p_points_to_add, now())
  ON CONFLICT (user_id) DO UPDATE
  SET points = public.loyalty_points.points + p_points_to_add,
      total_earned = public.loyalty_points.total_earned + p_points_to_add,
      updated_at = now();

  -- Insert transaction log (using text types)
  INSERT INTO public.loyalty_transactions (user_id, points, type, description, created_at)
  VALUES (v_user_id, p_points_to_add, 'earned', 'إتمام حلاقة مع تأكيد المسؤول بنقاط مضاعفة (+20)', now());
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.confirm_haircut_completed(uuid, integer) TO anon, authenticated, service_role;
