import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useSignIn } from '@clerk/clerk-react'
import { Scissors, Mail, Lock, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const LoginPage: React.FC = () => {
  const { isLoaded, signIn, setActive } = useSignIn()
  const navigate = useNavigate()

  // Form States
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle Form Submission for Email/Password Sign In
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      })

      if (result.status === 'complete') {
        // Mark session active to login the user
        await setActive({ session: result.createdSessionId })
        toast.success('مرحباً بك مجدداً!')
        navigate('/dashboard')
      } else {
        console.error(result)
        setError('تعذر تسجيل الدخول، يرجى التحقق من حالة حسابك')
      }
    } catch (err: any) {
      console.error('Sign-In Error:', err)
      setError(err.errors?.[0]?.message || 'البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Social OAuth Sign In (Google / Facebook)
  const handleOAuthSignIn = async (provider: 'oauth_google' | 'oauth_facebook') => {
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      await signIn.authenticateWithRedirect({
        strategy: provider,
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/dashboard',
      })
    } catch (err: any) {
      console.error('Social OAuth Error:', err)
      setError(err.errors?.[0]?.message || 'حدث خطأ أثناء الاتصال بمزود الخدمة')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-black">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&q=80')" }} />
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-dark rounded-3xl p-8 shadow-2xl border border-white/5">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4 animate-pulse-gold">
              <Scissors className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white">تسجيل الدخول</h1>
            <p className="text-gray-400 text-sm mt-1">أهلاً بعودتك في صالون الحوّاري</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Google Button */}
            <button
              onClick={() => handleOAuthSignIn('oauth_google')}
              type="button"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-800 bg-gray-900/30 hover:bg-gray-900/60 hover:border-yellow-400/20 text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              <span>جوجل</span>
            </button>

            {/* Facebook Button */}
            <button
              onClick={() => handleOAuthSignIn('oauth_facebook')}
              type="button"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-gray-800 bg-gray-900/30 hover:bg-gray-900/60 hover:border-yellow-400/20 text-white font-semibold text-sm transition-all duration-300 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
              </svg>
              <span>فيسبوك</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800" />
            </div>
            <span className="relative px-3 bg-[#0a0a0a] text-xs text-gray-500 uppercase">أو عن طريق البريد</span>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            {/* Email Input */}
            <div>
              <label className="text-gray-400 text-sm mb-1.5 block">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3.5 top-3.5 text-gray-500 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full bg-gray-900/40 border border-gray-800 rounded-xl py-3 pr-11 pl-4 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-gray-400 text-sm block">كلمة المرور</label>
                <Link to="/forgot-password" className="text-yellow-400/90 hover:text-yellow-400 text-xs transition">
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute right-3.5 top-3.5 text-gray-500 w-5 h-5" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-900/40 border border-gray-800 rounded-xl py-3 pr-11 pl-4 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-gold py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-black transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isLoading ? (
                <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
              ) : (
                <>تسجيل الدخول</>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 text-sm mt-6">
            ليس لديك حساب؟{' '}
            <Link to="/signup" className="text-yellow-400 font-bold hover:underline">
              سجّل الآن مجاناً
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default LoginPage
