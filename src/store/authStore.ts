import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company_name: string | null;
  role: 'admin' | 'lp';
  is_approved: boolean;
}

interface AuthState {
  user: Profile | null;
  loading: boolean;
  setUser: (user: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  initializeAuth: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<Profile>;
  signUp: (email: string, password: string, data: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
  checkAdmin: (code: string) => boolean;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
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

    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        set({ user: null });
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
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
      }
    });
  },

  signIn: async (email, password) => {
    await supabase.auth.signOut({ scope: 'global' });
    await new Promise(resolve => setTimeout(resolve, 100));

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

    await new Promise(resolve => setTimeout(resolve, 200));

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) throw signInError;

    set({ user: profile });
    return profile;
  },

  signUp: async (email, password, data) => {
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...data,
          is_approved: data.role === 'admin',
        },
      },
    });
    if (signUpError) throw signUpError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert([{
        id: authData.user.id,
        email,
        ...data,
        is_approved: data.role === 'admin',
      }]);

    if (profileError) throw profileError;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    set({ user: null });
    window.location.href = '/auth';
  },

  checkAdmin: (code) => code === 'sert5656',
}));