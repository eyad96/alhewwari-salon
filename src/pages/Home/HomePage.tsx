import React, { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { ChevronDown, Scissors, Star, Clock, MapPin, Award } from 'lucide-react'
import { SERVICES, WORKING_HOURS, WHATSAPP_NUMBER } from '@/types'
import { SignedOut } from '@clerk/clerk-react'

// ============ Hero Section ============
const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* خلفية */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1920&q=80')`,
        }}
      />
      <div className="hero-overlay absolute inset-0" />

      {/* تأثير ذهبي متوهج */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-yellow-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl" />
      </div>

      {/* المحتوى */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="badge-gold text-sm mb-6 inline-block">
            ✨ الصالون الأول في المنطقة
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-5xl sm:text-7xl font-black mb-6 leading-tight"
        >
          <span className="text-white">صالون </span>
          <span className="gold-text">الحوّاري</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-xl sm:text-2xl text-gray-300 mb-4 leading-relaxed"
        >
          تجربة حلاقة فاخرة بلمسة احترافية
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-gray-400 mb-10"
        >
          {WORKING_HOURS.label} • يومياً
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/booking" className="btn-gold text-lg px-8 py-4 rounded-xl">
            احجز موعدك الآن 📅
          </Link>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline-gold text-lg px-8 py-4 rounded-xl flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            تواصل واتساب
          </a>
        </motion.div>

        {/* إحصائيات */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto"
        >
          {[
            { num: '700+', label: 'عميل راضٍ' },
            { num: '10+', label: 'سنوات خبرة' },
            { num: '98%', label: 'رضا العملاء' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-black gold-text">{stat.num}</div>
              <div className="text-gray-400 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* سهم للأسفل */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-yellow-400/60"
      >
        <ChevronDown className="w-8 h-8" />
      </motion.div>
    </section>
  )
}

// ============ Services Section ============
const ServicesSection: React.FC = () => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="py-24 px-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-16"
      >
        <p className="section-subtitle mb-3">خدماتنا</p>
        <h2 className="section-title text-white mb-4">
          خدمات <span className="gold-text">متميزة</span> بأسعار معقولة
        </h2>
        <div className="gold-divider mx-auto"></div>
        <p className="text-gray-400 mt-4 max-w-xl mx-auto">
          نقدم مجموعة متكاملة من خدمات الحلاقة والعناية بالمظهر
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {SERVICES.map((service, index) => (
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 40 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="card p-6 group"
          >
            <div className="text-4xl mb-4">{service.icon}</div>
            <h3 className="text-white font-bold text-lg mb-2 group-hover:text-yellow-400 transition-colors">
              {service.name}
            </h3>
            <div className="flex items-end justify-between mt-4">
              <div>
                <div className="text-yellow-400 font-black text-2xl">{service.salonPrice} د.أ</div>
                <div className="text-gray-500 text-xs">في الصالون</div>
              </div>
              {service.homePrice && (
                <div className="text-right">
                  <div className="text-gray-300 font-bold text-lg">{service.homePrice} د.أ</div>
                  <div className="text-gray-500 text-xs">منزلي</div>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {service.duration} دقيقة تقريباً
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.8 }}
        className="text-center mt-10"
      >
        <Link to="/booking" className="btn-gold px-10 py-3 text-lg">
          احجز الآن ✨
        </Link>
      </motion.div>
    </section>
  )
}

// ============ Discount Banner ============
const DiscountBanner: React.FC = () => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="py-8 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="max-w-5xl mx-auto"
      >
        <div
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, #1a1200 0%, #2a1e00 50%, #1a1200 100%)',
            border: '1px solid rgba(212,175,55,0.4)',
          }}
        >
          {/* تأثيرات ضوئية */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-yellow-400/10 rounded-full blur-3xl" />

          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-6xl mb-4"
          >
            👑
          </motion.div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            عرض <span className="gold-text">حصري!</span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-200 font-bold mb-6">
            صاحب أكثر لايكات في الاستوديو
            <br />
            <span className="gold-text text-3xl">يحصل على خصم 50%</span>
          </p>
          <p className="text-gray-400 mb-8 text-sm max-w-md mx-auto">
            صورك في استوديونا اجمع أكبر عدد من الإعجابات لتحصل على خصم 50% على حلاقتك القادمة!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/studio" className="btn-gold px-8 py-3 text-lg">
              زيارة الاستوديو 📸
            </Link>
            <SignedOut>
              <Link to="/signup" className="btn-outline-gold px-8 py-3 text-lg">
                سجّل مجاناً
              </Link>
            </SignedOut>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

// ============ Working Hours ============
const WorkingHoursSection: React.FC = () => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  const features = [
    { icon: '⏰', title: 'ساعات العمل', desc: '12:00 ظهراً - 2:00 صباحاً' },
    { icon: '📍', title: 'الموقع', desc: 'عمّان، الأردن' },
    { icon: '🏠', title: 'حجز منزلي', desc: 'نصل إليك في أي مكان' },
    { icon: '⚡', title: 'حجز فوري', desc: 'نفس اليوم بإضافة 5 دنانير' },
  ]

  return (
    <section ref={ref} className="py-16 px-4 bg-[#0D0D0D]">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-12"
        >
          <p className="section-subtitle mb-3">معلومات مهمة</p>
          <h2 className="section-title text-white">
            نحن هنا <span className="gold-text">من أجلك</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.15 }}
              className="glass rounded-2xl p-6 text-center"
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-yellow-400 font-bold text-sm mb-2">{f.title}</h3>
              <p className="text-gray-300 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ============ Loyalty Preview ============
const LoyaltyPreview: React.FC = () => {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section ref={ref} className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <p className="section-subtitle mb-3">برنامج الولاء</p>
            <h2 className="section-title text-white mb-6">
              اكسب نقاطاً مع كل <span className="gold-text">حلاقة!</span>
            </h2>
            <div className="space-y-4 mb-8">
              {[
                { emoji: '✂️', text: 'كل حلاقة = 20 نقطة تضاف تلقائياً' },
                { emoji: '🎁', text: '100 نقطة = حلاقة مجانية كاملة' },
                { emoji: '👑', text: 'نقاط لا تنتهي صلاحيتها' },
                { emoji: '📱', text: 'تابع نقاطك من لوحة التحكم' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-4">
                  <span className="text-2xl">{item.emoji}</span>
                  <p className="text-gray-300">{item.text}</p>
                </div>
              ))}
            </div>
            <Link to="/loyalty" className="btn-gold px-8 py-3">
              اعرف نقاطك الآن
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="points-card">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-400 text-sm">نقاطك الحالية</p>
                  <div className="text-5xl font-black gold-text mt-1">80</div>
                </div>
                <Award className="w-10 h-10 text-yellow-400 opacity-50" />
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>التقدم نحو حلاقة مجانية</span>
                  <span>80 / 100</span>
                </div>
                <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={inView ? { width: '80%' } : {}}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="h-full gold-gradient rounded-full"
                  />
                </div>
                <p className="text-yellow-400 text-xs mt-2">تحتاج 20 نقطة فقط للحلاقة المجانية! 🎉</p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                {[
                  { num: '4', label: 'حلاقات' },
                  { num: '80', label: 'نقطة' },
                  { num: '0', label: 'مجاني' },
                ].map(stat => (
                  <div key={stat.label} className="glass rounded-lg p-3">
                    <div className="text-xl font-bold text-white">{stat.num}</div>
                    <div className="text-xs text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ============ الصفحة الرئيسية الكاملة ============
const HomePage: React.FC = () => {
  return (
    <div>
      <HeroSection />
      <ServicesSection />
      <DiscountBanner />
      <WorkingHoursSection />
      <LoyaltyPreview />
    </div>
  )
}

export default HomePage
