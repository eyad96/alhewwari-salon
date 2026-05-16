import React from 'react'
import { motion } from 'framer-motion'

const TermsPage: React.FC = () => (
  <div className="min-h-screen py-16 px-4">
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-black text-white mb-3">الشروط <span className="gold-text">والأحكام</span></h1>
        <p className="text-gray-400 mb-10">آخر تحديث: يناير 2024</p>
        {[
          { title: '1. قبول الشروط', content: 'باستخدامك لموقع صالون الحوّاري، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام الموقع.' },
          { title: '2. شروط الحجز', content: 'تعديل الموعد: يُسمح بتعديل الموعد مرة واحدة فقط. إلغاء الحجز: يجب إلغاء الحجز خلال 30 دقيقة من وقت الحجز. الحجز الفوري: يتضمن رسوماً إضافية قدرها 5 دنانير أردنية للحجوزات في نفس اليوم.' },
          { title: '3. برنامج الولاء', content: 'تُمنح 20 نقطة مع كل حلاقة مكتملة. تُستبدل 100 نقطة بحلاقة مجانية. النقاط غير قابلة للتحويل بين الحسابات. يحق لنا تعديل قواعد البرنامج بعد إشعار مسبق.' },
          { title: '4. مسؤولية المستخدم', content: 'أنت مسؤول عن الحفاظ على سرية بيانات حسابك. يجب تقديم معلومات دقيقة وحديثة عند التسجيل. يُحظر استخدام الموقع لأي غرض غير مشروع.' },
          { title: '5. الأسعار والدفع', content: 'الأسعار المعروضة بالدينار الأردني وشاملة للضرائب. نحتفظ بحق تعديل الأسعار مع الإشعار المسبق. الدفع يتم عند استلام الخدمة.' },
          { title: '6. حدود المسؤولية', content: 'نسعى لتقديم أفضل خدمة ممكنة، لكننا لا نضمن خلو الموقع من الأخطاء التقنية. لا نتحمل المسؤولية عن أي خسائر ناجمة عن استخدام الموقع.' },
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

export default TermsPage
