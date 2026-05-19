import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

const DashboardPage: React.FC = () => {
  const { user, loading, isAdmin } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="loader mx-auto mb-4 border-t-yellow-400 border-4 rounded-full w-12 h-12 animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">جاري الانتقال إلى لوحة التحكم الخاصة بك...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />
  }

  return <Navigate to="/user-dashboard" replace />
}

export default DashboardPage
