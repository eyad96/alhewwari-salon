import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/hooks/useAuth'
import MainLayout from '@/components/layout/MainLayout'
import AdminRoute from '@/components/shared/AdminRoute'
import HomePage from '@/pages/Home/HomePage'

// Lazy loading للصفحات
const StudioPage = lazy(() => import('@/pages/Studio/StudioPage'))
const BookingPage = lazy(() => import('@/pages/Booking/BookingPage'))
const LoyaltyPage = lazy(() => import('@/pages/Loyalty/LoyaltyPage'))
const ReviewsPage = lazy(() => import('@/pages/Reviews/ReviewsPage'))
const ProductsPage = lazy(() => import('@/pages/Products/ProductsPage'))
const BlogPage = lazy(() => import('@/pages/Blog/BlogPage'))
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'))
const SignUpPage = lazy(() => import('@/pages/Auth/SignUpPage'))
const ForgotPasswordPage = lazy(() => import('@/pages/Auth/ForgotPasswordPage'))
const SsoCallbackPage = lazy(() => import('@/pages/Auth/SsoCallbackPage'))
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'))
const UserDashboardPage = lazy(() => import('@/pages/Dashboard/UserDashboardPage'))
const AdminDashboardPage = lazy(() => import('@/pages/Dashboard/AdminDashboardPage'))
const ContactPage = lazy(() => import('@/pages/Contact/ContactPage'))
const PrivacyPage = lazy(() => import('@/pages/Legal/PrivacyPage'))
const TermsPage = lazy(() => import('@/pages/Legal/TermsPage'))
const SetupPage = lazy(() => import('@/pages/Setup/SetupPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 دقائق
    },
  },
})

// Loading Fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="loader mx-auto mb-4"></div>
      <p className="text-gray-400 text-sm">جاري التحميل...</p>
    </div>
  </div>
)

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<MainLayout><HomePage /></MainLayout>} />
              <Route path="/studio" element={<MainLayout><StudioPage /></MainLayout>} />
              <Route path="/booking" element={<MainLayout><BookingPage /></MainLayout>} />
              <Route path="/loyalty" element={<MainLayout><LoyaltyPage /></MainLayout>} />
              <Route path="/reviews" element={<MainLayout><ReviewsPage /></MainLayout>} />
              <Route path="/products" element={<MainLayout><ProductsPage /></MainLayout>} />
              <Route path="/blog" element={<MainLayout><BlogPage /></MainLayout>} />
              <Route path="/contact" element={<MainLayout><ContactPage /></MainLayout>} />
              <Route path="/privacy" element={<MainLayout><PrivacyPage /></MainLayout>} />
              <Route path="/terms" element={<MainLayout><TermsPage /></MainLayout>} />
              <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
              <Route path="/user-dashboard" element={<MainLayout><UserDashboardPage /></MainLayout>} />
              <Route path="/admin" element={<AdminRoute><MainLayout><AdminDashboardPage /></MainLayout></AdminRoute>} />
              <Route path="/setup" element={<MainLayout><SetupPage /></MainLayout>} />
              {/* صفحات المصادقة بدون Footer */}
              <Route path="/sso-callback" element={<MainLayout><SsoCallbackPage /></MainLayout>} />
              <Route path="/login/*" element={<MainLayout><LoginPage /></MainLayout>} />
              <Route path="/signup/*" element={<MainLayout><SignUpPage /></MainLayout>} />
              <Route path="/forgot-password" element={<MainLayout><ForgotPasswordPage /></MainLayout>} />
              {/* 404 */}
              <Route path="*" element={
                <MainLayout>
                  <div className="min-h-screen flex items-center justify-center text-center">
                    <div>
                      <div className="text-8xl font-black gold-text mb-4">404</div>
                      <h2 className="text-2xl font-bold text-white mb-4">الصفحة غير موجودة</h2>
                      <a href="/" className="btn-gold px-6 py-3">العودة للرئيسية</a>
                    </div>
                  </div>
                </MainLayout>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
