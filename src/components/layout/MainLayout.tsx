import React from 'react'
import Header from './Header'
import Footer from './Footer'
import WhatsAppFloat from '@/components/shared/WhatsAppFloat'
import { Toaster } from 'react-hot-toast'

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A]">
      <Header />
      <main className="flex-1 pt-20">
        {children}
      </main>
      <Footer />
      <WhatsAppFloat />
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1A1A1A',
            color: '#fff',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: '0.75rem',
            fontFamily: 'Cairo, sans-serif',
            direction: 'rtl',
          },
          success: {
            iconTheme: { primary: '#D4AF37', secondary: '#0A0A0A' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
    </div>
  )
}

export default MainLayout
