import React from 'react'
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react'

const SsoCallbackPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-cover bg-center opacity-5"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1920&q=80')" }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
      
      <div className="relative z-10 text-center glass-dark rounded-3xl p-8 max-w-sm border border-white/5 shadow-2xl">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">جاري تسجيل الدخول</h3>
        <p className="text-gray-400 text-sm">برجاء الانتظار لحظة واحدة أثناء توجيهك...</p>
      </div>

      {/* Clerk pre-built handler that parses the URL token and logs the user in */}
      <AuthenticateWithRedirectCallback 
        signUpForceRedirectUrl="/dashboard"
        signInForceRedirectUrl="/dashboard"
      />
    </div>
  )
}

export default SsoCallbackPage
