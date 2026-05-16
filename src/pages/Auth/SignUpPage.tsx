import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, User, Phone, Scissors } from 'lucide-react'
import { signUp, signInWithGoogle, signInWithFacebook } from '@/services/auth'
import toast from 'react-hot-toast'

const signUpSchema = z.object({
  full_name: z.string().min(3, 'الاسم 3 أحرف على الأقل'),
  email: z.string().email('بريد إلكتروني غير صحيح'),
  phone: z.string().optional(),
  password: z.string().min(8, 'كلمة المرور 8 أحرف على الأقل'),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirm_password'],
})

type SignUpForm = z.infer<typeof signUpSchema>

const SignUpPage: React.FC = () => {
  const navigate = useNavigate()
  const [showPwd, setShowPwd] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: SignUpForm) => {
    setIsLoading(true)
    try {
      await signUp(data)
      toast.success('🎉 تم إنشاء حسابك بنجاح! تحقق من بريدك لتأكيد الحساب')
      navigate('/login')
    } catch (err: any) {
      if (err.message?.includes('already registered')) {
        toast.error('هذا البريد مسجل مسبقاً. جرّب تسجيل الدخول')
      } else {
        toast.error(err.message || 'حدث خطأ في إنشاء الحساب')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    try {
      await signInWithGoogle()
    } catch {
      toast.error('حدث خطأ في التسجيل بـ Google')
    }
  }

  const handleFacebook = async () => {
    try {
      await signInWithFacebook()
    } catch {
      toast.error('حدث خطأ في التسجيل بـ Facebook')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80')" }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-dark rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4 animate-pulse-gold">
              <Scissors className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white">إنشاء حساب جديد</h1>
            <p className="text-gray-400 text-sm mt-1">انضم إلى عائلة صالون الحوّاري</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              onClick={handleGoogle}
              className="flex items-center justify-center gap-2 p-3 glass rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-all text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              onClick={handleFacebook}
              className="flex items-center justify-center gap-2 p-3 glass rounded-xl text-gray-300 hover:text-white hover:bg-blue-600/20 transition-all text-sm"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-blue-500">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 text-gray-500">أو أنشئ حساباً بالبريد</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('full_name')} placeholder="أحمد محمد" className="input-field pr-10" />
              </div>
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('email')} type="email" placeholder="example@email.com" className="input-field pr-10" dir="ltr" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">رقم الهاتف (اختياري)</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input {...register('phone')} type="tel" placeholder="07XXXXXXXX" className="input-field pr-10" dir="ltr" />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="8 أحرف على الأقل"
                  className="input-field pr-10 pl-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('confirm_password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="أعد كتابة كلمة المرور"
                  className="input-field pr-10"
                />
              </div>
              {errors.confirm_password && <p className="text-red-400 text-xs mt-1">{errors.confirm_password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full py-3.5 text-base disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? (
                <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
              ) : 'إنشاء الحساب'}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            لديك حساب بالفعل؟{' '}
            <Link to="/login" className="text-yellow-400 font-bold hover:underline">تسجيل الدخول</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default SignUpPage
