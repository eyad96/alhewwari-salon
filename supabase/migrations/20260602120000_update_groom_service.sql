-- Update Groom's Package to be Fixed inside Salon only (30 JOD)
UPDATE public.services
SET salon_price = 30.00,
    home_price = NULL,
    description = 'Includes (Skincare + Legendary Haircut + Blowdry) at the groom''s house before the party'
WHERE name = 'عرض العريس';
