import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, User, LogOut, ShoppingCart, ChevronDown, LayoutDashboard, Scissors } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/hooks/useCart'
import { signOut } from '@/services/auth'
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
  const { user, isAdmin } = useAuth()
  const { itemCount } = useCart()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setUserMenuOpen(false)
  }, [location])

  const handleSignOut = async () => {
    try {
      await signOut()
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
            {/* سلة التسوق */}
            <Link
              to="/products"
              className="relative p-2 rounded-lg text-gray-300 hover:text-yellow-400 hover:bg-white/5 transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-yellow-400 text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-2 py-2 rounded-full border border-yellow-400/20 hover:border-yellow-400/40 transition-all"
                >
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.full_name || 'Avatar'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-yellow-400/10 flex items-center justify-center text-yellow-400 text-base font-bold">
                      <User className="w-5 h-5" />
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute left-0 mt-2 w-48 glass-dark rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-white/10">
                        <p className="text-sm font-semibold text-white truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        {isAdmin && <span className="badge-gold text-xs mt-1 inline-block">أدمن</span>}
                      </div>
                      <div className="py-1">
                        <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:text-yellow-400 hover:bg-white/5 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          لوحة التحكم
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          تسجيل الخروج
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-outline-gold text-sm py-2 px-4 hidden sm:block">
                  دخول
                </Link>
                <Link to="/signup" className="btn-gold text-sm py-2 px-4">
                  تسجيل
                </Link>
              </div>
            )}

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
              {!user && (
                <div className="pt-2 border-t border-white/10 flex gap-2">
                  <Link to="/login" className="btn-outline-gold text-sm py-2 flex-1 text-center">دخول</Link>
                  <Link to="/signup" className="btn-gold text-sm py-2 flex-1 text-center">تسجيل</Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}

export default Header
