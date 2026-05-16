import React from 'react'
import { Link } from 'react-router-dom'
import { Scissors, Phone, MapPin, Clock, Instagram, Facebook, Twitter } from 'lucide-react'
import { WHATSAPP_NUMBER, WORKING_HOURS } from '@/types'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#080808] border-t border-yellow-400/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          
          {/* العلامة التجارية */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                <Scissors className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-lg font-bold gold-text">صالون الحوّاري</h3>
                <p className="text-xs text-gray-400">للحلاقة والعناية</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              نقدم أفضل خدمات الحلاقة والعناية بالشعر بأيدي محترفين متخصصين، بأجواء فاخرة وأسعار مناسبة.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:border-yellow-400/40 transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-all">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-all">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* روابط سريعة */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">روابط سريعة</h4>
            <ul className="space-y-3">
              {[
                { label: 'الصفحة الرئيسية', path: '/' },
                { label: 'الاستوديو', path: '/studio' },
                { label: 'حجز موعد', path: '/booking' },
                { label: 'المنتجات', path: '/products' },
                { label: 'التقييمات', path: '/reviews' },
                { label: 'المدونة', path: '/blog' },
              ].map(link => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-yellow-400 text-sm transition-colors flex items-center gap-2"
                  >
                    <span className="w-1 h-1 rounded-full bg-yellow-400/50"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* معلومات الاتصال */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">تواصل معنا</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">رقم الهاتف</p>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`}
                    className="text-white text-sm hover:text-yellow-400 transition-colors">
                    0787146476
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">الموقع</p>
                  <p className="text-white text-sm">عمّان، الأردن</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-gray-400 text-sm">ساعات العمل</p>
                  <p className="text-white text-sm">{WORKING_HOURS.label}</p>
                  <p className="text-gray-500 text-xs">يومياً</p>
                </div>
              </li>
            </ul>
          </div>

          {/* نظام الولاء */}
          <div>
            <h4 className="text-white font-bold mb-5 text-sm uppercase tracking-wider">برنامج الولاء</h4>
            <div className="glass rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🌟</span>
                <span className="text-yellow-400 font-bold">اكسب نقاط مع كل حلاقة!</span>
              </div>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>✅ كل حلاقة = 20 نقطة</li>
                <li>🎁 100 نقطة = حلاقة مجانية</li>
                <li>💎 حصري للأعضاء المسجلين</li>
              </ul>
            </div>
            <Link to="/loyalty" className="btn-gold w-full text-center text-sm block py-2.5">
              اعرف نقاطك
            </Link>
          </div>
        </div>

        {/* الحقوق */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            © {currentYear} صالون الحوّاري. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              سياسة الخصوصية
            </Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              الشروط والأحكام
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
