-- ك. جدول المواعيد المحظورة/المحذوفة يدوياً (blocked_slots)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  time time NOT NULL,
  created_by text REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(date, time)
);

ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;

-- سياسة القراءة للجميع لمعرفة المواعيد المحظورة عند التحقق من الأوقات المتاحة
CREATE POLICY "Anyone can view blocked slots" ON public.blocked_slots
  FOR SELECT USING (true);

-- سياسة التحكم الكامل للمسؤول فقط (Admin Only)
CREATE POLICY "Admin can manage blocked slots" ON public.blocked_slots
  FOR ALL USING (public.is_admin());
