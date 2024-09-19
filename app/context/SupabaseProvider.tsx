'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClientComponentClient, type Session } from '@supabase/auth-helpers-nextjs'
import { type SupabaseClient } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

type SupabaseContext = {
  supabase: SupabaseClient
  session: Session | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient())
  const [session, setSession] = useState<Session | null>(null)
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)

      if (!session) {
        router.push('/login')
      }
    })

    // Check session expiration
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const expiresAt = new Date(session.expires_at! * 1000)
        const now = new Date()
        if (expiresAt <= now) {
          await supabase.auth.signOut()
          router.push('/login')
        }
      }
    }

    // Run the check immediately and set up an interval
    checkSession()
    const intervalId = setInterval(checkSession, 60000) // Check every minute

    return () => {
      subscription.unsubscribe()
      clearInterval(intervalId)
    }
  }, [supabase, router])

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