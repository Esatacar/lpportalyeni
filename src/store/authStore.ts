import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: 'admin' | 'lp';
  is_approved: boolean;
  assigned_company_id?: string;
}

interface AuthState {
  user: Profile | null;
  loading: boolean;
  signingIn: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<Profile>;
  signUp: (email: string, password: string, data: { full_name: string; company_name?: string }) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: true,
  signingIn: false,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),

  initializeAuth: async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        set({ user: profile });
      }
    }

    supabase.auth.onAuthStateChange((event, session) => {
      if (get().signingIn) return;

      if (event === 'SIGNED_OUT') {
        set({ user: null });
      } else if (event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          (async () => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile) {
              set({ user: profile });
            }
          })();
        }
      }
    });
  },

  signIn: async (email, password) => {
    set({ signingIn: true });

    try {
      await supabase.auth.signOut({ scope: 'local' });

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-login`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid login credentials');
      }

      const { profile } = await response.json();

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      set({ user: profile, signingIn: false });
      return profile;
    } catch (err) {
      set({ signingIn: false });
      throw err;
    }
  },

  signUp: async (email, password, data) => {
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth-signup`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email,
        password,
        full_name: data.full_name,
        company_name: data.company_name || '',
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to create account');
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    set({ user: null });
    window.location.href = '/auth';
  },
}));
