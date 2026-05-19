import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useAdmin } from '@/hooks/useAdmin'
import { useUser } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

interface AdminRouteProps {
  children: React.ReactNode
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAdmin, loading } = useAdmin()
  const { isLoaded, isSignedIn } = useUser()

  useEffect(() => {
    if (isLoaded && isSignedIn && !loading) {
      if (!isAdmin) {
        toast.error('غير مصرح لك بالدخول إلى صفحة الإدارة')
      }
    }
  }, [isLoaded, isSignedIn, loading, isAdmin])

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="loader mx-auto mb-4 border-t-yellow-400 border-4 rounded-full w-12 h-12 animate-spin"></div>
          <p className="text-gray-400 text-sm">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export default AdminRoute
