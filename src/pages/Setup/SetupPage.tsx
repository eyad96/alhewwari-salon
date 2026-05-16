import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, Upload, Database, Cloud, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cloudinaryConfig } from '@/lib/cloudinary'
import toast from 'react-hot-toast'

interface TestResult {
  label: string
  status: 'idle' | 'testing' | 'ok' | 'error'
  message?: string
}

const SetupPage: React.FC = () => {
  const [tests, setTests] = useState<TestResult[]>([
    { label: 'Supabase URL', status: 'idle' },
    { label: 'Supabase Auth', status: 'idle' },
    { label: 'Cloudinary Cloud Name', status: 'idle' },
    { label: 'Cloudinary Upload Preset', status: 'idle' },
  ])
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  const updateTest = (index: number, update: Partial<TestResult>) => {
    setTests((prev) => prev.map((t, i) => (i === index ? { ...t, ...update } : t)))
  }

  const runTests = async () => {
    setRunning(true)

    // Test 1: Supabase URL
    updateTest(0, { status: 'testing' })
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('your-project')) {
      updateTest(0, {
        status: 'error',
        message: 'VITE_SUPABASE_URL غير محدد. أضفه في ملف .env',
      })
    } else {
      updateTest(0, { status: 'ok', message: supabaseUrl })
    }

    // Test 2: Supabase Auth
    updateTest(1, { status: 'testing' })
    try {
      const { error } = await supabase.from('profiles').select('count').limit(1)
      if (error && error.code === 'PGRST116') {
        updateTest(1, { status: 'ok', message: 'متصل (جداول تحتاج SQL setup)' })
      } else if (error) {
        if (error.message?.includes('JWT')) {
          updateTest(1, { status: 'error', message: 'ANON_KEY خاطئ. تحقق من مفاتيح Supabase' })
        } else {
          updateTest(1, { status: 'error', message: error.message })
        }
      } else {
        updateTest(1, { status: 'ok', message: 'متصل بنجاح ✅' })
      }
    } catch (err: any) {
      updateTest(1, { status: 'error', message: 'تعذر الاتصال بـ Supabase' })
    }

    // Test 3: Cloudinary Cloud Name
    updateTest(2, { status: 'testing' })
    const cloudName = cloudinaryConfig.cloudName
    if (!cloudName || cloudName === 'demo') {
      updateTest(2, { status: 'error', message: 'VITE_CLOUDINARY_CLOUD_NAME غير محدد' })
    } else {
      // Check if cloud exists
      try {
        const res = await fetch(`https://res.cloudinary.com/${cloudName}/image/upload/sample.jpg`, { method: 'HEAD' })
        if (res.ok || res.status === 302) {
          updateTest(2, { status: 'ok', message: `Cloud: ${cloudName} ✅` })
        } else {
          updateTest(2, { status: 'ok', message: `Cloud: ${cloudName} (تحقق منه يدوياً)` })
        }
      } catch {
        updateTest(2, { status: 'ok', message: `Cloud: ${cloudName}` })
      }
    }

    // Test 4: Cloudinary Upload Preset
    updateTest(3, { status: 'testing' })
    const preset = cloudinaryConfig.uploadPreset
    if (!preset) {
      updateTest(3, { status: 'error', message: 'VITE_CLOUDINARY_UPLOAD_PRESET غير محدد' })
    } else {
      // Try to upload a tiny test blob
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'))
        const fd = new FormData()
        fd.append('file', blob, 'test.png')
        fd.append('upload_preset', preset)
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: fd,
        })
        const data = await response.json()
        if (data.secure_url) {
          updateTest(3, { status: 'ok', message: `Preset "${preset}" يعمل ✅` })
        } else if (data.error?.message?.includes('Unknown API key')) {
          updateTest(3, {
            status: 'error',
            message: 'Preset غير موجود. أنشئه في Cloudinary Dashboard (انظر التعليمات أدناه)',
          })
        } else {
          updateTest(3, {
            status: 'error',
            message: data.error?.message || `Preset "${preset}" غير صحيح`,
          })
        }
      } catch {
        updateTest(3, { status: 'error', message: 'تعذر اختبار Upload Preset' })
      }
    }

    setRunning(false)
  }

  const sqlCommand = `update public.profiles set role = 'admin' where email = 'your@email.com';`

  const copySQL = () => {
    navigator.clipboard.writeText(sqlCommand)
    setCopied(true)
    toast.success('تم نسخ الأمر!')
    setTimeout(() => setCopied(false), 2000)
  }

  const StatusIcon = ({ status }: { status: TestResult['status'] }) => {
    if (status === 'idle') return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />
    if (status === 'testing') return <div className="w-5 h-5 rounded-full border-2 border-yellow-400 border-t-transparent animate-spin" />
    if (status === 'ok') return <CheckCircle className="w-5 h-5 text-green-400" />
    return <XCircle className="w-5 h-5 text-red-400" />
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <p className="section-subtitle mb-3">الإعداد</p>
          <h1 className="section-title text-white mb-4">
            إعداد <span className="gold-text">المشروع</span>
          </h1>
          <div className="gold-divider mx-auto"></div>
        </motion.div>

        {/* اختبار الاتصال */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            اختبار الاتصال
          </h2>

          <div className="space-y-4 mb-6">
            {tests.map((test, i) => (
              <div key={i} className="flex items-start gap-4 p-3 glass rounded-xl">
                <StatusIcon status={test.status} />
                <div className="flex-1">
                  <p className="text-white text-sm font-medium">{test.label}</p>
                  {test.message && (
                    <p className={`text-xs mt-0.5 ${test.status === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                      {test.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={runTests}
            disabled={running}
            className="btn-gold w-full py-3 flex items-center justify-center gap-2"
          >
            {running ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                جاري الاختبار...
              </>
            ) : (
              '🔍 اختبار الاتصال الآن'
            )}
          </button>
        </motion.div>

        {/* خطوات الإعداد */}
        <div className="space-y-6">

          {/* Cloudinary Preset */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-6">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-yellow-400" />
              الخطوة 1: إنشاء Cloudinary Upload Preset
            </h2>
            <div className="space-y-3 text-sm text-gray-400">
              <p>Cloud Name الخاص بك: <span className="text-yellow-400 font-bold">dnwjkvnqw</span> ✅</p>
              <div className="p-3 glass rounded-lg border border-yellow-400/20 space-y-2">
                <p className="text-yellow-400 font-bold text-xs">اتبع هذه الخطوات:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>اذهب إلى <span className="text-yellow-400">cloudinary.com → Login</span></li>
                  <li>Settings → <span className="text-yellow-400">Upload</span> → Upload Presets</li>
                  <li>انقر <span className="text-yellow-400">Add upload preset</span></li>
                  <li>Preset name: <code className="bg-black/30 px-1 rounded text-yellow-400">salon_alhewwari_unsigned</code></li>
                  <li>Signing Mode: <span className="text-yellow-400 font-bold">Unsigned</span> ⚠️</li>
                  <li>Folder: <code className="bg-black/30 px-1 rounded">salon-alhewwari</code></li>
                  <li>انقر <span className="text-yellow-400">Save</span></li>
                </ol>
              </div>
              <a
                href="https://cloudinary.com/console/settings/upload"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold text-sm px-4 py-2 inline-flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                فتح Cloudinary Settings
              </a>
            </div>
          </motion.div>

          {/* Supabase */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card p-6">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-yellow-400" />
              الخطوة 2: إعداد Supabase
            </h2>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="p-3 glass rounded-lg space-y-2">
                <p className="text-yellow-400 font-bold text-xs">أضف هذه القيم في ملف .env:</p>
                <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-green-400">
                  VITE_SUPABASE_URL=https://xxxx.supabase.co<br />
                  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
                </div>
              </div>

              <div className="p-3 glass rounded-lg space-y-2">
                <p className="text-yellow-400 font-bold text-xs">ثم شغّل SQL في Supabase Dashboard → SQL Editor:</p>
                <ol className="list-decimal list-inside space-y-1.5 text-xs">
                  <li>افتح <span className="text-yellow-400">supabase_setup.sql</span> في مجلد المشروع</li>
                  <li>انسخ المحتوى كاملاً</li>
                  <li>الصقه في <span className="text-yellow-400">SQL Editor → New Query</span></li>
                  <li>انقر Run ▶️</li>
                </ol>
              </div>

              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline-gold text-sm px-4 py-2 inline-flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                فتح Supabase Dashboard
              </a>
            </div>
          </motion.div>

          {/* جعل حساب أدمن */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card p-6">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <span>🔑</span>
              الخطوة 3: جعل حسابك أدمن
            </h2>
            <div className="space-y-3 text-sm text-gray-400">
              <p>بعد تسجيل حسابك في الموقع، شغّل هذا الأمر في Supabase SQL Editor:</p>
              <div className="bg-black/40 rounded-lg p-3 font-mono text-xs text-yellow-400 flex items-center justify-between gap-3 flex-wrap">
                <span className="break-all">{sqlCommand}</span>
                <button onClick={copySQL} className="shrink-0 text-gray-400 hover:text-white transition-colors">
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500">غيّر <span className="text-yellow-400">your@email.com</span> ببريدك الفعلي</p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  )
}

export default SetupPage
