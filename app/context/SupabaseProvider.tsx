'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient, type Session } from '@supabase/auth-helpers-nextjs'
import { type SupabaseClient } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

type SupabaseContext = {
  supabase: SupabaseClient
  session: Session | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient())
  const [session, setSession] = useState<Session | null>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Don't run session checks on login page
    if (pathname === '/login') {
      return
    }

    // Handle auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)

      if (!session) {
        window.location.href = '/login'
        return
      }
    })

    // Check session expiration
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const expiresAt = new Date(session.expires_at! * 1000)
          const now = new Date()
          
          // If session is expired or about to expire in the next minute
          if (expiresAt <= new Date(now.getTime() + 60000)) {
            await supabase.auth.signOut()
            window.location.href = '/login'
          }
        } else if (pathname !== '/login') {
          // Only redirect if we're not already on the login page
          window.location.href = '/login'
        }
      } catch (error) {
        console.error('Error checking session:', error)
        if (pathname !== '/login') {
          await supabase.auth.signOut()
          window.location.href = '/login'
        }
      }
    }

    // Initial session check
    checkSession()

    // Set up interval for periodic checks
    const intervalId = setInterval(checkSession, 30000) // Check every 30 seconds

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [supabase, pathname])

  return (
    <Context.Provider value={{ supabase, session }}>
      {children}
    </Context.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(Context)
  if (context === undefined) {
    throw new Error('useSupabase must be used inside SupabaseProvider')
  }
  return context
}