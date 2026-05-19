-- 1. Add loyalty_points column to profiles table with DEFAULT of 0
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0 CHECK (loyalty_points >= 0);

-- Initialize existing records to 0
UPDATE public.profiles SET loyalty_points = 0 WHERE loyalty_points IS NULL;

-- 2. Create high-security confirm_haircut_completed RPC function
CREATE OR REPLACE FUNCTION public.confirm_haircut_completed(
  p_booking_id uuid,
  p_points_to_add integer DEFAULT 10
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- runs with security definer to allow modifying RLS tables
AS $$
DECLARE
  v_user_id text;
BEGIN
  -- 1. Check if caller is admin
  -- We fetch user details using auth.uid()::text or matching profiles
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()::text AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بإجراء هذه العملية. هذه الصلاحية للمسؤولين فقط.';
  END IF;

  -- 2. Fetch the user_id corresponding to this booking
  SELECT user_id::text INTO v_user_id
  FROM public.bookings
  WHERE id = p_booking_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'لم يتم العثور على الحجز المحدد.';
  END IF;

  -- 3. Update the booking status to 'completed'
  UPDATE public.bookings
  SET status = 'completed'
  WHERE id = p_booking_id;

  -- 4. Increment the corresponding user's loyalty_points in public.profiles table
  UPDATE public.profiles
  SET loyalty_points = coalesce(loyalty_points, 0) + p_points_to_add
  WHERE id = v_user_id;

  -- 5. Backwards compatibility: update or insert legacy loyalty_points records
  INSERT INTO public.loyalty_points (user_id, points, total_earned, updated_at)
  VALUES (v_user_id::uuid, p_points_to_add, p_points_to_add, now())
  ON CONFLICT (user_id) DO UPDATE
  SET points = public.loyalty_points.points + p_points_to_add,
      total_earned = public.loyalty_points.total_earned + p_points_to_add,
      updated_at = now();

  -- 6. Insert transaction log
  INSERT INTO public.loyalty_transactions (user_id, points, type, description, created_at)
  VALUES (v_user_id::uuid, p_points_to_add, 'earned', 'إتمام حلاقة مع تأكيد المسؤول', now());

END;
$$;

-- Grant execution permission to the RPC
GRANT EXECUTE ON FUNCTION public.confirm_haircut_completed(uuid, integer) TO anon, authenticated, service_role;
