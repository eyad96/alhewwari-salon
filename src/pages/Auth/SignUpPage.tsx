import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SignUp } from '@clerk/clerk-react'
import { Scissors } from 'lucide-react'
 

const SignUpPage: React.FC = () => {


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

          <div className="mb-6">
            <SignUp path="/signup" routing="path" />
          </div>
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
