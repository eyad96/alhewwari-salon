import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, ChevronDown, LayoutDashboard, Scissors } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useClerk, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

const navLinks = [
  { label: 'الرئيسية', path: '/' },
  { label: 'الاستوديو', path: '/studio' },
  { label: 'الحجز', path: '/booking' },
  { label: 'المنتجات', path: '/products' },
  { label: 'التقييمات', path: '/reviews' },
  { label: 'المدونة', path: '/blog' },
  { label: 'الولاء', path: '/loyalty' },
  { label: 'تواصل معنا', path: '/contact' },
]

const Header: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  
  const { user: profileUser, isAdmin: authIsAdmin } = useAuth()
  const { isSignedIn, user } = useUser()
  const isAdmin = !!(isSignedIn && authIsAdmin)
  
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      console.log('👤 [Clerk Public Metadata]:', user.publicMetadata)
    }
  }, [user])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setUserMenuOpen(false)
  }, [location])

  const { signOut: clerkSignOut } = useClerk()

  const handleSignOut = async () => {
    try {
      await clerkSignOut()
      toast.success('تم تسجيل الخروج بنجاح')
      navigate('/')
    } catch {
      toast.error('حدث خطأ أثناء تسجيل الخروج')
    }
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'glass-dark shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* لوغو */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center animate-pulse-gold">
              <Scissors className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold gold-text leading-none">صالون الحوّاري</h1>
              <p className="text-xs text-gray-400">للحلاقة والعناية</p>
            </div>
          </Link>

          {/* روابط الناف بار - ديسكتوب */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'text-yellow-400 bg-yellow-400/10'
                    : 'text-gray-300 hover:text-yellow-400 hover:bg-white/5'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* أزرار اليسار */}
          <div className="flex items-center gap-3">

            <SignedIn>
              <div className="flex items-center gap-4">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="btn-outline-gold text-xs py-2 px-3 sm:px-4 sm:text-sm flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    لوحة التحكم
                  </Link>
                ) : (
                  <div className="flex items-center gap-3">
                    {profileUser && (
                      <span className="hidden sm:inline-block text-xs bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-400/20 font-bold font-mono">
                        ⭐ نقاطك: {profileUser.loyalty_points ?? 0}
                      </span>
                    )}
                    <Link
                      to="/user-dashboard"
                      className="btn-gold text-xs py-2 px-3 sm:px-4 sm:text-sm flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      حجوزاتي
                    </Link>
                  </div>
                )}
                <UserButton afterSignOutUrl="/" />
              </div>
            </SignedIn>
            <SignedOut>
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-outline-gold text-sm py-2 px-4 hidden sm:block">
                  دخول
                </Link>
                <Link to="/signup" className="btn-gold text-sm py-2 px-4">
                  تسجيل
                </Link>
              </div>
            </SignedOut>

            {/* زر القائمة - موبايل */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-yellow-400"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* قائمة الموبايل */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-dark border-t border-yellow-400/10"
          >
            <nav className="px-4 py-4 space-y-1">
              {navLinks.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    location.pathname === link.path
                      ? 'text-yellow-400 bg-yellow-400/10'
                      : 'text-gray-300 hover:text-yellow-400 hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <SignedOut>
                <div className="pt-2 border-t border-white/10 flex gap-2">
                  <Link to="/login" className="btn-outline-gold text-sm py-2 flex-1 text-center">دخول</Link>
                  <Link to="/signup" className="btn-gold text-sm py-2 flex-1 text-center">تسجيل</Link>
                </div>
              </SignedOut>
              <SignedIn>
                <div className="pt-4 border-t border-white/10 flex flex-col gap-3 px-2">
                  {isAdmin ? (
                    <div className="flex items-center justify-between w-full">
                      <Link 
                        to="/admin" 
                        className="btn-outline-gold text-xs py-2 px-4 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        لوحة التحكم
                      </Link>
                      <UserButton afterSignOutUrl="/" />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3 w-full">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs bg-yellow-400/10 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-400/20 font-bold font-mono">
                          ⭐ نقاطك: {profileUser?.loyalty_points ?? 0}
                        </span>
                        <UserButton afterSignOutUrl="/" />
                      </div>
                      <Link 
                        to="/user-dashboard" 
                        className="btn-gold text-xs py-2 px-4 flex items-center justify-center gap-2 w-full text-center"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        حجوزاتي
                      </Link>
                    </div>
                  )}
                </div>
              </SignedIn>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Header
