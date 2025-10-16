"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient, type Session } from "@supabase/auth-helpers-nextjs";
import { type SupabaseClient } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";

type SupabaseContext = {
  supabase: SupabaseClient;
  session: Session | null;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClientComponentClient());
  const [session, setSession] = useState<Session | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Don't run session checks on login page
    if (pathname === "/login") {
      return;
    }

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log("Initial session check:", session); // Debug log
        setSession(session);

        if (!session && pathname !== "/login") {
          router.push("/login");
        } else if (session) {
          const expiresAt = new Date(session.expires_at! * 1000);
          const now = new Date();
          if (expiresAt <= new Date(now.getTime() + 60000)) {
            await supabase.auth.signOut();
            router.push("/login");
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
        if (pathname !== "/login") {
          await supabase.auth.signOut();
          router.push("/login");
        }
      }
    };

    checkSession();

    // Handle auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth state changed:", _event, session); // Debug log
      setSession(session);

      if (!session && pathname !== "/login") {
        router.push("/login");
      }
    });

    // Set up interval for periodic checks
    const intervalId = setInterval(checkSession, 30000); // Check every 30 seconds

    return () => {
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [supabase, pathname, router]);

  return <Context.Provider value={{ supabase, session }}>{children}</Context.Provider>;
}

export const useSupabase = () => {
  const context = useContext(Context);
  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }
  return context;
};