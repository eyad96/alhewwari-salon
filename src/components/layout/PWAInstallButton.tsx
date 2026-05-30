import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSTip, setShowIOSTip] = useState(false)

  useEffect(() => {
    // 1. Check if already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true

    if (isStandalone) return

    // 2. Check if user previously dismissed the prompt during this session
    const isDismissed = localStorage.getItem('pwa_prompt_dismissed') === 'true'
    if (isDismissed) return

    // 3. Detect iOS devices
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(isIOSDevice)

    if (isIOSDevice) {
      // iOS Safari doesn't fire beforeinstallprompt. Show the button for iOS after a small delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 5000)
      return () => clearTimeout(timer)
    }

    // 4. Listen for PWA installation prompt (Android / Chrome / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Delay showing the button slightly for a premium entrance
      setTimeout(() => {
        setIsVisible(true)
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      // Show elegant iOS manual install tips
      setShowIOSTip(true)
      return
    }

    if (!deferredPrompt) return

    // Trigger install prompt
    await deferredPrompt.prompt()

    // Wait for the user's choice
    const { outcome } = await deferredPrompt.userChoice
    console.log(`PWA Installation outcome: ${outcome}`)

    if (outcome === 'accepted') {
      toast.success('🎉 شكراً لك على تحميل تطبيق صالون الحوّاري!')
      setIsVisible(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent triggering install prompt
    setIsVisible(false)
    localStorage.setItem('pwa_prompt_dismissed', 'true')
    toast.success('تم إخفاء التنبيه. يمكنك دائماً تحميل التطبيق لاحقاً!')
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Floating Action Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            whileHover={{ scale: 1.05 }}
            className="fixed bottom-24 left-6 z-50 flex items-center gap-2 text-right"
            dir="rtl"
          >
            {/* Main Install Button */}
            <button
              onClick={handleInstallClick}
              className="gold-gradient text-black font-black text-sm px-4 py-3 rounded-full flex items-center gap-2 shadow-2xl shadow-yellow-500/20 transition-all hover:brightness-110 active:scale-95 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full transition-transform group-hover:translate-y-0" />
              <Download className="w-4 h-4 animate-bounce shrink-0" />
              <span className="whitespace-nowrap">تحميل تطبيق الصالون</span>
              
              {/* Dismiss Button */}
              <div
                onClick={handleDismiss}
                className="p-1 hover:bg-black/20 rounded-full transition-colors mr-1 cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </div>
            </button>
          </motion.div>

          {/* iOS Manual Installation Tip Overlay */}
          {showIOSTip && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 text-right" 
              onClick={() => setShowIOSTip(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass border border-yellow-400/20 rounded-3xl p-6 max-w-md w-full space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                  <div className="p-2.5 bg-yellow-400/10 rounded-xl text-yellow-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-white font-black text-lg">تحميل التطبيق على الـ iPhone الخاص بك</h3>
                </div>

                <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
                  <p>
                    نظراً لقيود نظام iOS، يرجى اتباع هذه الخطوات البسيطة لتثبيت تطبيق صالون الحوّاري على شاشتك الرئيسية:
                  </p>
                  <ol className="list-decimal list-inside space-y-2.5 text-right font-medium">
                    <li>في أسفل متصفح Safari، انقر على زر المشاركة <span className="text-yellow-400 font-bold">⎋ (Share)</span>.</li>
                    <li>اسحب القائمة للأعلى قليلاً واختر <span className="text-yellow-400 font-bold">"إضافة إلى الصفحة الرئيسية" ⊕ (Add to Home Screen)</span>.</li>
                    <li>انقر على زر <span className="text-yellow-400 font-bold">"إضافة" (Add)</span> في أعلى الزاوية اليسرى لتأكيد التثبيت.</li>
                  </ol>
                  <div className="p-3 bg-yellow-400/5 border border-yellow-400/10 rounded-xl text-xs text-yellow-400/80 text-center">
                     ستظهر أيقونة التطبيق الفاخرة مباشرة على شاشتك الرئيسية لسهولة الحجز الفوري في أي وقت!
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIOSTip(false)}
                  className="btn-gold w-full py-2.5 rounded-xl font-bold text-sm"
                >
                  حسناً، فهمت ذلك
                </button>
              </motion.div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  )
}

export default PWAInstallButton
