import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'
import { useUser } from '@clerk/clerk-react'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  refetch: async () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser()

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return data as User | null
  }

  const refetch = async () => {
    if (!clerkLoaded || !isSignedIn || !clerkUser) return
    const profile = await fetchProfile(clerkUser.id)
    setUser(profile)
  }

  useEffect(() => {
    const sync = async () => {
      if (!clerkLoaded) return
      setLoading(false)
      if (isSignedIn && clerkUser) {
        // determine role from Clerk metadata if present
        const clerkRole = (clerkUser as any)?.publicMetadata?.role || (clerkUser as any)?.privateMetadata?.role || null

        // ensure profile exists in Supabase (use Clerk user id as profile id)
        const { data: existing } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', clerkUser.id)
          .single()

        if (!existing) {
          const fullName = (clerkUser as any).fullName || (clerkUser as any).firstName || (clerkUser as any).primaryEmailAddress || (clerkUser as any).emailAddresses?.[0]?.emailAddress || 'مستخدم'
          await supabase.from('profiles').insert({
            id: clerkUser.id,
            full_name: fullName,
            role: clerkRole || 'customer',
          })
          await supabase.from('loyalty_points').insert({
            user_id: clerkUser.id,
            points: 0,
            total_earned: 0,
          })
        } else {
          // if Clerk has a role and it differs from Supabase, sync it
          if (clerkRole && existing.role !== clerkRole) {
            await supabase.from('profiles').update({ role: clerkRole }).eq('id', clerkUser.id)
          }
        }

        const profile = await fetchProfile(clerkUser.id)
        setUser(profile)
      } else {
        setUser(null)
      }
    }

    sync()
  }, [clerkLoaded, isSignedIn, clerkUser])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin: ((clerkUser as any)?.publicMetadata?.role === 'admin') || user?.role === 'admin',
      refetch,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
