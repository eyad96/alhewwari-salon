import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSignUp } from '@clerk/clerk-react'
import { Scissors, Mail, Lock, User, KeyRound, AlertCircle, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const SignUpPage: React.FC = () => {
  const { isLoaded, signUp, setActive } = useSignUp()
  const navigate = useNavigate()

  // Form States
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pendingVerification, setPendingVerification] = useState(false)
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle Form Submission for Email/Password Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      const first = fullName.split(' ')[0] || ''
      const last = fullName.split(' ').slice(1).join(' ') || ''

      // 1. Create user in Clerk
      await signUp.create({
        emailAddress: email,
        password,
        firstName: first,
        lastName: last,
      })

      // 2. Request verification code sent to email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      setPendingVerification(true)
      toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني')
    } catch (err: any) {
      console.error('Sign-Up Error:', err)
      setError(err.errors?.[0]?.message || 'حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Verification Code Submission
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      // 3. Attempt verification code check
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      })

      if (completeSignUp.status === 'complete') {
        // 4. Mark session active to login the user
        await setActive({ session: completeSignUp.createdSessionId })
        toast.success('تم إنشاء الحساب وتفعيل البريد الإلكتروني بنجاح!')
        navigate('/dashboard')
      } else {
        console.error(completeSignUp)
        setError('تعذر إكمال التسجيل، يرجى التحقق من المدخلات')
      }
    } catch (err: any) {
      console.error('Verification Error:', err)
      setError(err.errors?.[0]?.message || 'رمز التحقق غير صحيح، يرجى إعادة المحاولة')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Social OAuth Sign Up (Google / Facebook)
  const handleOAuthSignUp = async (provider: 'oauth_google' | 'oauth_facebook') => {
    if (!isLoaded) return
    setIsLoading(true)
    setError('')

    try {
      await signUp.authenticateWithRedirect({
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-black">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80')" }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="glass-dark rounded-3xl p-8 shadow-2xl border border-white/5">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4 animate-pulse-gold">
              <Scissors className="w-8 h-8 text-black" />
            </div>
            <h1 className="text-2xl font-black text-white">إنشاء حساب جديد</h1>
            <p className="text-gray-400 text-sm mt-1">انضم إلى عائلة صالون الحوّاري</p>
          </div>

          <AnimatePresence mode="wait">
            {!pendingVerification ? (
              <motion.div
                key="signup-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
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
                    onClick={() => handleOAuthSignUp('oauth_google')}
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
                    onClick={() => handleOAuthSignUp('oauth_facebook')}
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

                {/* Email Signup Form */}
                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  {/* Name Input */}
                  <div>
                    <label className="text-gray-400 text-sm mb-1.5 block">الاسم الكامل</label>
                    <div className="relative">
                      <User className="absolute right-3.5 top-3.5 text-gray-500 w-5 h-5" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        placeholder="أدخل اسمك بالكامل"
                        className="w-full bg-gray-900/40 border border-gray-800 rounded-xl py-3 pr-11 pl-4 text-white placeholder-gray-600 focus:outline-none focus:border-yellow-400/50 transition-all text-right"
                        required
                      />
                    </div>
                  </div>

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
                    <label className="text-gray-400 text-sm mb-1.5 block">كلمة المرور</label>
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
                      <>إنشاء الحساب</>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="verification-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                {/* Error Banner */}
                {error && (
                  <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2.5 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Verification Wizard */}
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-full bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-6 h-6 text-yellow-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">تأكيد البريد الإلكتروني</h3>
                  <p className="text-gray-400 text-sm">أدخل رمز التحقق المكون من 6 أرقام المرسل إلى <span className="text-yellow-400 font-semibold">{email}</span></p>
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      placeholder="000000"
                      className="w-full bg-gray-900/40 border border-gray-800 rounded-xl py-3 px-4 text-white text-center text-2xl font-bold tracking-[0.75em] focus:outline-none focus:border-yellow-400/50 transition-all placeholder-gray-700"
                      dir="ltr"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-gold py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-black transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
                    ) : (
                      <>تأكيد الرمز وتفعيل الحساب</>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPendingVerification(false)}
                    className="w-full bg-transparent border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    العودة لنموذج التسجيل
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

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
