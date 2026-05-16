# دليل إعداد Cloudinary + Supabase - صالون الحوّاري

## ⚡ الخطوة 1: إعداد Cloudinary

### 1.1 إنشاء حساب Cloudinary
1. اذهب إلى [cloudinary.com](https://cloudinary.com) وأنشئ حساباً مجانياً
2. من الـ Dashboard، انسخ **Cloud Name**

### 1.2 إنشاء Upload Preset (مطلوب!)
1. اذهب إلى **Settings → Upload → Upload Presets**
2. انقر **Add upload preset**
3. اضبط هذه الإعدادات:
   - **Preset name**: `salon_alhewwari_unsigned`
   - **Signing Mode**: `Unsigned` ⚠️ مهم جداً
   - **Folder**: `salon-alhewwari`
   - **Allowed formats**: `jpg, jpeg, png, webp, gif`
   - **Max file size**: `5MB`
   - **Quality**: `auto`
4. انقر **Save**

### 1.3 تحديث ملف .env
```env
VITE_CLOUDINARY_CLOUD_NAME=your-actual-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=salon_alhewwari_unsigned
```

---

## ⚡ الخطوة 2: إعداد Supabase

### 2.1 الحصول على المفاتيح
1. اذهب إلى [supabase.com](https://supabase.com) → مشروعك
2. **Settings → API**
3. انسخ:
   - **Project URL**
   - **anon/public** key

### 2.2 تحديث ملف .env
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 تشغيل SQL
1. اذهب إلى **Supabase Dashboard → SQL Editor → New Query**
2. انسخ محتوى ملف `supabase_setup.sql`
3. انقر **Run** ✅

### 2.4 جعل مستخدم أدمن
بعد تسجيل حسابك، شغّل هذا في SQL Editor:
```sql
update public.profiles set role = 'admin' where email = 'بريدك@example.com';
```

### 2.5 تفعيل OAuth (اختياري)
- **Google**: Settings → Authentication → Providers → Google → Enable
- **Facebook**: Settings → Authentication → Providers → Facebook → Enable

---

## ⚡ الخطوة 3: ملف .env الكامل

```env
# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_UPLOAD_PRESET=salon_alhewwari_unsigned
```

---

## ⚡ الخطوة 4: تشغيل المشروع

```bash
cd salon-alhewwari/frontend/vite-project
npm run dev
```

الموقع: **http://localhost:5173/**

---

## 🔑 صلاحيات الأدمن

| الميزة | الأدمن | العميل |
|--------|--------|--------|
| رفع صور الاستوديو | ✅ | ❌ |
| حذف صور الاستوديو | ✅ | ❌ |
| تصفير الإعجابات | ✅ | ❌ |
| إضافة/تعديل/حذف منتج | ✅ | ❌ |
| إضافة/حذف مقال مدونة | ✅ | ❌ |
| إدارة حجوزات العملاء | ✅ | ❌ |
| إضافة نقاط ولاء | ✅ | ❌ |
| رفع أي صورة | ✅ | ❌ |

---

## 📁 هيكل Cloudinary Folders

```
salon-alhewwari/
├── studio/     ← صور الاستوديو
├── products/   ← صور المنتجات  
└── blog/       ← صور المدونة
```

---

## ❗ تشخيص المشكلات الشائعة

| المشكلة | الحل |
|---------|------|
| خطأ 401 من Cloudinary | تأكد أن Upload Preset = `Unsigned` |
| صور لا تُحمل | تحقق من `CLOUD_NAME` و `UPLOAD_PRESET` في .env |
| خطأ Supabase RLS | تأكد من تشغيل ملف SQL كاملاً |
| تسجيل الدخول لا يعمل | تحقق من `SUPABASE_URL` و `ANON_KEY` |
| لا يظهر كأدمن | شغّل SQL لجعل حسابك أدمن |
