import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, CheckCircle } from 'lucide-react'
import { resetPassword } from '@/services/auth'
import toast from 'react-hot-toast'

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setIsLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
      toast.success('تم إرسال رابط إعادة تعيين كلمة المرور')
    } catch {
      toast.error('لم يتم العثور على هذا البريد')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="glass-dark rounded-3xl p-8">
          {!sent ? (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-yellow-400" />
                </div>
                <h1 className="text-2xl font-black text-white">نسيت كلمة المرور؟</h1>
                <p className="text-gray-400 text-sm mt-2">
                  أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-gray-400 text-sm mb-1.5 block">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="input-field"
                    dir="ltr"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-gold w-full py-3.5 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
                  ) : (
                    <>إرسال رابط التعيين <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-black text-white mb-3">تم الإرسال!</h2>
              <p className="text-gray-400 mb-6">
                تحقق من بريدك الإلكتروني <span className="text-yellow-400">{email}</span> للحصول على رابط إعادة التعيين
              </p>
              <p className="text-gray-500 text-sm">لم تتلق البريد؟ تحقق من مجلد الـ Spam</p>
            </div>
          )}

          <p className="text-center text-gray-400 text-sm mt-6">
            <Link to="/login" className="text-yellow-400 hover:underline flex items-center justify-center gap-1">
              <ArrowRight className="w-4 h-4 rotate-180" />
              العودة لتسجيل الدخول
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default ForgotPasswordPage
