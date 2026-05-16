import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react'
import { WHATSAPP_NUMBER, WORKING_HOURS } from '@/types'
import toast from 'react-hot-toast'

const ContactPage: React.FC = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      toast.error('يرجى ملء جميع الحقول')
      return
    }
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setSent(true)
    toast.success('✅ تم إرسال رسالتك بنجاح!')
    setLoading(false)
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="section-subtitle mb-3">تواصل معنا</p>
          <h1 className="section-title text-white mb-4">
            نحن هنا <span className="gold-text">لمساعدتك</span>
          </h1>
          <div className="gold-divider mx-auto"></div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          
          {/* معلومات التواصل */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-black text-white mb-8">معلومات التواصل</h2>
            <div className="space-y-6 mb-10">
              {[
                { icon: <Phone className="w-5 h-5" />, title: 'واتساب', value: '0787146476', href: `https://wa.me/${WHATSAPP_NUMBER}` },
                { icon: <Mail className="w-5 h-5" />, title: 'البريد الإلكتروني', value: 'info@alhewwari.com', href: 'mailto:info@alhewwari.com' },
                { icon: <MapPin className="w-5 h-5" />, title: 'الموقع', value: 'عمّان، الأردن', href: '#map' },
                { icon: <Clock className="w-5 h-5" />, title: 'ساعات العمل', value: WORKING_HOURS.label, href: undefined },
              ].map(info => (
                <div key={info.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center text-black shrink-0">
                    {info.icon}
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{info.title}</p>
                    {info.href ? (
                      <a href={info.href} className="text-white font-medium hover:text-yellow-400 transition-colors">
                        {info.value}
                      </a>
                    ) : (
                      <p className="text-white font-medium">{info.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* خريطة Google Maps */}
            <div id="map" className="rounded-2xl overflow-hidden border border-yellow-400/20 h-64">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d108706.39432065003!2d35.83040765!3d31.95252465!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151b5fb85d7981af%3A0x631c30c0f8dc65e8!2sAmman%2C%20Jordan!5e0!3m2!1sar!2sjo!4v1700000000000!5m2!1sar!2sjo"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="موقع صالون الحوّاري"
              />
            </div>
          </motion.div>

          {/* نموذج التواصل */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="card p-8">
              {sent ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-white font-black text-2xl mb-3">تم الإرسال!</h3>
                  <p className="text-gray-400 mb-6">شكراً لتواصلك معنا، سنرد عليك في أقرب وقت ممكن</p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', message: '' }) }}
                    className="btn-outline-gold px-6 py-2"
                  >
                    إرسال رسالة أخرى
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-black text-white mb-6">أرسل لنا رسالة</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="text-gray-400 text-sm mb-1.5 block">اسمك الكامل</label>
                      <input
                        value={form.name}
                        onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="أحمد محمد"
                        className="input-field"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-1.5 block">البريد الإلكتروني</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="example@email.com"
                        className="input-field"
                        dir="ltr"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-sm mb-1.5 block">رسالتك</label>
                      <textarea
                        value={form.message}
                        onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                        placeholder="اكتب رسالتك هنا..."
                        rows={5}
                        className="input-field resize-none"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn-gold w-full py-3.5 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="loader w-5 h-5 border-2 border-black/30 border-t-black" />
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          إرسال الرسالة
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ContactPage
