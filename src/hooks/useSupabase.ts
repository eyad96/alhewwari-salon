import { useAuth } from './useAuth'
import { supabase as defaultSupabase } from '@/lib/supabase'
import { useMemo, useState, useEffect } from 'react'

/**
 * Hook to get an authenticated Supabase client
 * It will return the default (anon) client while loading or if not signed in,
 * and will refresh the client when the user signs in or the token changes.
 */
export const useSupabase = () => {
  const { getAuthenticatedClient } = useAuth()
  const [client, setClient] = useState(defaultSupabase)

  useEffect(() => {
    let isMounted = true
    
    const updateClient = async () => {
      const authClient = await getAuthenticatedClient()
      if (isMounted) {
        setClient(authClient)
      }
    }

    updateClient()
    
    return () => {
      isMounted = false
    }
  }, [getAuthenticatedClient])

  return client
}
