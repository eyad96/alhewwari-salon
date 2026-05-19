import { useUser } from '@clerk/clerk-react'
import { useAuth } from '@/hooks/useAuth'

export const useAdmin = () => {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { user: profileUser, loading: profileLoading, isAdmin: authContextIsAdmin } = useAuth()

  // 1. Check Clerk publicMetadata role
  const isClerkAdmin = clerkUser?.publicMetadata?.role === 'admin'

  // 2. Check Supabase profile database role
  const isProfileAdmin = profileUser?.role === 'admin'

  // 3. Overall admin access boolean
  const isAdmin = isClerkAdmin || isProfileAdmin || authContextIsAdmin
  const loading = !clerkLoaded || profileLoading

  return { isAdmin, loading }
}
