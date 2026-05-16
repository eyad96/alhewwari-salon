import React from 'react'
import { motion } from 'framer-motion'

const PrivacyPage: React.FC = () => (
  <div className="min-h-screen py-16 px-4">
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-white mb-3">سياسة <span className="gold-text">الخصوصية</span></h1>
        <p className="text-gray-400 mb-10">آخر تحديث: يناير 2024</p>
        {[
          { title: '1. المعلومات التي نجمعها', content: 'نجمع المعلومات التي تقدمها عند إنشاء حساب، مثل الاسم والبريد الإلكتروني ورقم الهاتف. كما نجمع بيانات استخدام الموقع لتحسين تجربتك.' },
          { title: '2. كيف نستخدم معلوماتك', content: 'نستخدم معلوماتك لتأكيد الحجوزات، وإرسال التذكيرات، وإدارة برنامج الولاء، وتحسين خدماتنا. لن نبيع أو نشارك معلوماتك مع أطراف ثالثة.' },
          { title: '3. أمان البيانات', content: 'نحن ملتزمون بحماية بياناتك الشخصية. نستخدم تشفير SSL وأحدث تقنيات الأمان لحماية معلوماتك.' },
          { title: '4. ملفات تعريف الارتباط (Cookies)', content: 'نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح وحفظ تفضيلاتك. يمكنك تعطيلها من إعدادات متصفحك.' },
          { title: '5. حقوقك', content: 'يحق لك طلب الاطلاع على بياناتك أو تصحيحها أو حذفها في أي وقت عبر التواصل معنا.' },
          { title: '6. التغييرات على هذه السياسة', content: 'قد نحدّث سياسة الخصوصية بين الحين والآخر. سنخطرك بأي تغييرات جوهرية عبر البريد الإلكتروني.' },
        ].map(sec => (
          <section key={sec.title} className="card p-6 mb-5">
            <h2 className="text-white font-bold text-xl mb-3 gold-text">{sec.title}</h2>
            <p className="text-gray-400 leading-relaxed">{sec.content}</p>
          </section>
        ))}
      </motion.div>
    </div>
  </div>
)

export default PrivacyPage
