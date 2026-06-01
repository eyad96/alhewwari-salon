import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'

// =========================================================================
// 📱 Facebook Native App Deep Linking Hook (iOS / Android Integration)
// =========================================================================
const setupFacebookDeepLink = () => {
  if (typeof window === 'undefined') return

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  if (!isMobile) return

  try {
    // Intercept Location.prototype.href property setter
    const descriptor = Object.getOwnPropertyDescriptor(Location.prototype, 'href')
    if (descriptor && descriptor.set && !(window as any).__fb_deeplink_set) {
      ;(window as any).__fb_deeplink_set = true
      const originalSetHref = descriptor.set

      Object.defineProperty(Location.prototype, 'href', {
        configurable: true,
        enumerable: true,
        get: descriptor.get,
        set: function(url) {
          if (typeof url === 'string' && (url.includes('oauth_facebook') || url.includes('facebook.com'))) {
            console.log('📱 [Facebook Deep Link] Intercepted href redirect:', url)
            const fbAppUrl = `fb://facewebmodal/f?href=${encodeURIComponent(url)}`
            
            // Try to open the Facebook native app first
            originalSetHref.call(window.location, fbAppUrl)

            // Safe fallback: redirect standard browser web version if app isn't installed after 2.5s
            setTimeout(() => {
              originalSetHref.call(window.location, url)
            }, 2500)
            return
          }
          originalSetHref.call(this, url)
        }
      })
    }

    // Intercept Location.prototype.assign method
    const originalAssign = Location.prototype.assign
    if (originalAssign && !(window as any).__fb_assign_set) {
      ;(window as any).__fb_assign_set = true
      Location.prototype.assign = function(url) {
        if (typeof url === 'string' && (url.includes('oauth_facebook') || url.includes('facebook.com'))) {
          console.log('📱 [Facebook Deep Link] Intercepted assign:', url)
          const fbAppUrl = `fb://facewebmodal/f?href=${encodeURIComponent(url)}`
          
          window.location.href = fbAppUrl
          setTimeout(() => {
            originalAssign.call(window.location, url)
          }, 2500)
          return
        }
        originalAssign.call(this, url)
      }
    }

    // Intercept Location.prototype.replace method
    const originalReplace = Location.prototype.replace
    if (originalReplace && !(window as any).__fb_replace_set) {
      ;(window as any).__fb_replace_set = true
      Location.prototype.replace = function(url) {
        if (typeof url === 'string' && (url.includes('oauth_facebook') || url.includes('facebook.com'))) {
          console.log('📱 [Facebook Deep Link] Intercepted replace:', url)
          const fbAppUrl = `fb://facewebmodal/f?href=${encodeURIComponent(url)}`
          
          window.location.href = fbAppUrl
          setTimeout(() => {
            originalReplace.call(window.location, url)
          }, 2500)
          return
        }
        originalReplace.call(this, url)
      }
    }
  } catch (err) {
    console.warn('⚠️ [Facebook Deep Link] Hook setup failed:', err)
  }
}

// Run the Facebook deep-linking handler immediately on boot
setupFacebookDeepLink()

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registered successfully!', reg.scope))
      .catch(err => console.log('Service Worker registration failed:', err))
  })
}
