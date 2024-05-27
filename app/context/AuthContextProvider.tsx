// "use client"// authContext.tsx""
// import { createContext, useContext, useEffect, useState } from 'react';
// import { createClient } from '@/utils/supabase/client';
// import { Subscription } from '@supabase/supabase-js';

// const AuthContext = createContext<{
//   session: any;
//   loading: boolean;
// }>({
//   session: null,
//   loading: true,
// });

// export const useAuth = () => useContext(AuthContext);

// export const AuthProvider: React.FC = ({ children }) => {
//   const [session, setSession] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [authListener, setAuthListener] = useState<Subscription | null>(null);

//   useEffect(() => {
//     const supabase = createClient();
//     const session = supabase.auth.getSession();
//     setSession(session);
//     setLoading(false);

//     const listener = supabase.auth.onAuthStateChange(
//       (event, session) => {
//         setSession(session);
//       }
//     );

//     setAuthListener(listener);

//     return () => {
//       if (authListener) {
//         authListener?.subscription.unsubscribe();
//       }
//     };
//   }, [authListener]);

//   return (
//     <AuthContext.Provider value={{ session, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

