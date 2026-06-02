-- 1. Add points_awarded column to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS points_awarded boolean DEFAULT false;

-- 2. Create the trigger function to automatically reward points when status becomes 'completed'
CREATE OR REPLACE FUNCTION public.handle_booking_completed_points()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if status is transitioning to 'completed' and points have not been awarded yet
  IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR COALESCE(OLD.status, '') <> 'completed') AND NOT COALESCE(NEW.points_awarded, false) THEN
    -- Update profiles loyalty_points
    UPDATE public.profiles
    SET loyalty_points = COALESCE(loyalty_points, 0) + 20
    WHERE id = NEW.user_id;

    -- Update loyalty_points table
    INSERT INTO public.loyalty_points (user_id, points, total_earned, updated_at)
    VALUES (NEW.user_id, 20, 20, now())
    ON CONFLICT (user_id) DO UPDATE
    SET points = public.loyalty_points.points + 20,
        total_earned = public.loyalty_points.total_earned + 20,
        updated_at = now();

    -- Insert transaction log
    INSERT INTO public.loyalty_transactions (user_id, points, type, description, created_at)
    VALUES (NEW.user_id, 20, 'earned', 'إتمام حلاقة - إضافة نقاط ولاء تلقائية (+20)', now());

    -- Set points_awarded to true in the same row update
    NEW.points_awarded := true;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Bind trigger to bookings table
DROP TRIGGER IF EXISTS trg_booking_completed_points ON public.bookings;
CREATE TRIGGER trg_booking_completed_points
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_booking_completed_points();

-- 4. Recreate confirm_haircut_completed to use public.is_admin() and trigger points addition via status update
CREATE OR REPLACE FUNCTION public.confirm_haircut_completed(
  p_booking_id uuid,
  p_points_to_add integer DEFAULT 20
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is admin using the secure is_admin helper
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'غير مصرح لك بإجراء هذه العملية. هذه الصلاحية للمسؤولين فقط.';
  END IF;

  -- Update booking status to 'completed'
  -- (The trigger handle_booking_completed_points will automatically award the points and set points_awarded to true)
  UPDATE public.bookings
  SET status = 'completed'
  WHERE id = p_booking_id;
END;
$$;
