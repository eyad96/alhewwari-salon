import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, createClerkSupabaseClient } from '@/lib/supabase'
import type { User } from '@/types'
import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  refetch: () => Promise<void>
  getAuthenticatedClient: () => Promise<any>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  refetch: async () => {},
  getAuthenticatedClient: async () => supabase,
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { isLoaded: clerkLoaded, isSignedIn, user: clerkUser } = useUser()
  const { getToken } = useClerkAuth()

  const fetchProfile = async (userId: string) => {
    try {
      const token = await getToken({ template: 'supabase' })
      const client = token ? createClerkSupabaseClient(token) : supabase
      const { data } = await client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        return {
          ...data,
          phone: data.phone_number || data.phone
        } as User
      }
      return null
    } catch (err: any) {
      console.warn("⚠️ [Clerk JWT] Failed to get 'supabase' template token in fetchProfile, falling back to anon client:", err.message)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      if (data) {
        return {
          ...data,
          phone: data.phone_number || data.phone
        } as User
      }
      return null
    }
  }

  const getAuthenticatedClient = async () => {
    if (!isSignedIn) return supabase
    try {
      const token = await getToken({ template: 'supabase' })
      if (!token) return supabase
      return createClerkSupabaseClient(token)
    } catch (err: any) {
      console.warn("⚠️ [Clerk JWT] Failed to get 'supabase' template token in getAuthenticatedClient, falling back to anon client:", err.message)
      return supabase
    }
  }

  const refetch = async () => {
    if (!clerkLoaded || !isSignedIn || !clerkUser) return
    const profile = await fetchProfile(clerkUser.id)
    setUser(profile)
  }

  useEffect(() => {
    const sync = async () => {
      if (!clerkLoaded) return
      
      try {
        if (isSignedIn && clerkUser) {
          let token: string | null = null
          try {
            token = await getToken({ template: 'supabase' })
          } catch (e: any) {
            console.warn("⚠️ [Clerk JWT Setup Required] No 'supabase' JWT template found in Clerk yet. Please configure a JWT template named 'supabase' in your Clerk Dashboard so that secure RLS claims function properly. Error:", e.message)
          }

          const authSupabase = token ? createClerkSupabaseClient(token) : supabase
          const clerkRole = (clerkUser as any)?.publicMetadata?.role || (clerkUser as any)?.privateMetadata?.role || null

          // Ensure profile exists in Supabase (use Clerk user id as profile id)
          let existing = null
          try {
            const { data } = await authSupabase
              .from('profiles')
              .select('*')
              .eq('id', clerkUser.id)
              .maybeSingle()
            existing = data
          } catch (err: any) {
            console.warn("⚠️ Failed to select profile via authSupabase, attempting with fallback client:", err.message)
            try {
              const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', clerkUser.id)
                .maybeSingle()
              existing = data
            } catch (fallbackErr: any) {
              console.error("❌ Failed to query profile from both authenticated and standard clients:", fallbackErr.message)
            }
          }

          if (!existing) {
            const fullName = clerkUser.fullName || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'مستخدم'
            try {
              await authSupabase.from('profiles').insert({
                id: clerkUser.id,
                full_name: fullName,
                email: clerkUser.primaryEmailAddress?.emailAddress || '',
                role: clerkRole || 'customer',
              })
            } catch (insertErr: any) {
              console.warn("⚠️ profiles insert failed on authenticated client, retrying with standard client:", insertErr.message)
              try {
                await supabase.from('profiles').insert({
                  id: clerkUser.id,
                  full_name: fullName,
                  email: clerkUser.primaryEmailAddress?.emailAddress || '',
                  role: clerkRole || 'customer',
                })
              } catch (fallbackInsertErr: any) {
                console.error("❌ Failed to sync profile to database:", fallbackInsertErr.message)
              }
            }
            
            // Initial loyalty points
            try {
              await authSupabase.from('loyalty_points').insert({
                user_id: clerkUser.id,
                points: 0,
                total_earned: 0,
              })
            } catch (loyaltyErr: any) {
              try {
                await supabase.from('loyalty_points').insert({
                  user_id: clerkUser.id,
                  points: 0,
                  total_earned: 0,
                })
              } catch (fallbackLoyaltyErr: any) {
                console.warn("⚠️ Initial loyalty points insertion failed:", fallbackLoyaltyErr.message)
              }
            }
          } else {
            // if Clerk has a role and it differs from Supabase, sync it
            if (clerkRole && existing.role !== clerkRole) {
              try {
                await authSupabase.from('profiles').update({ role: clerkRole }).eq('id', clerkUser.id)
              } catch (updateErr: any) {
                try {
                  await supabase.from('profiles').update({ role: clerkRole }).eq('id', clerkUser.id)
                } catch (fallbackUpdateErr: any) {
                  console.warn("⚠️ Failed to update profile role sync:", fallbackUpdateErr.message)
                }
              }
            }
          }

          const profile = await fetchProfile(clerkUser.id)
          setUser(profile || {
            id: clerkUser.id,
            full_name: clerkUser.fullName || clerkUser.firstName || 'مستخدم',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            role: clerkRole || 'customer'
          } as any)
        } else {
          setUser(null)
        }
      } catch (err: any) {
        console.error('⚠️ Error syncing user with Supabase, using Clerk metadata fallback:', err.message)
        if (isSignedIn && clerkUser) {
          const fallbackName = clerkUser.fullName || clerkUser.firstName || clerkUser.primaryEmailAddress?.emailAddress?.split('@')[0] || 'مستخدم'
          setUser({
            id: clerkUser.id,
            full_name: fallbackName,
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            role: ((clerkUser as any)?.publicMetadata?.role === 'admin') ? 'admin' : 'customer'
          } as any)
        } else {
          setUser(null)
        }
      } finally {
        setLoading(false)
      }
    }

    sync()
  }, [clerkLoaded, isSignedIn, clerkUser])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAdmin: user?.role === 'admin',
      refetch,
      getAuthenticatedClient,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
