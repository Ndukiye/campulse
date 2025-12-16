import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { signIn as authSignIn, signOut as authSignOut, signUp as authSignUp, getCurrentUser, signInWithGoogle as authSignInWithGoogle } from '../services/authService';
import { getProfileById, upsertProfile } from '../services/profileService';

type User = {
  id: string;
  email: string | null;
  name?: string | null;
} | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  signUp: async () => ({ error: null }),
  signInWithGoogle: async () => ({ error: null }),
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  // Debug authentication state changes
  React.useEffect(() => {
    console.log('[Auth] State changed:', { 
      user: user ? { id: user.id, email: user.email, name: user.name } : null, 
      isAuthenticated: !!user, 
      loading 
    });
  }, [user, loading]);

  useEffect(() => {
    const initSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const supaUser = data.session?.user ?? null;
        setUser(
          supaUser
            ? {
                id: supaUser.id,
                email: supaUser.email ?? null,
                name: (supaUser.user_metadata as any)?.name ?? (supaUser.user_metadata as any)?.full_name ?? null,
              }
            : null
        );
      } finally {
        setLoading(false);
      }
    };
    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const supaUser = session?.user ?? null;
      setUser(
        supaUser
          ? {
              id: supaUser.id,
              email: supaUser.email ?? null,
            name: (supaUser.user_metadata as any)?.name ?? (supaUser.user_metadata as any)?.full_name ?? null,
            }
          : null
      );
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const res = await authSignIn(email, password);
    if (res.error) return { error: res.error };

    const u = res.user ?? (await getCurrentUser());
    if (u) {
      // Set user immediately so navigation reacts without waiting for onAuthStateChange
      setUser({
        id: u.id,
        email: u.email ?? null,
        name: (u.user_metadata as any)?.name ?? (u.user_metadata as any)?.full_name ?? null,
      });

      try {
        const profile = await getProfileById(u.id);
        if (!profile.data) {
          await upsertProfile({
            id: u.id,
            email: u.email ?? '',
            name:
              (u.user_metadata as any)?.name ??
              (u.user_metadata as any)?.full_name ??
              u.email ??
              'New User',
          });
        }
      } catch (e) {
        console.warn('[Auth] Profile ensure failed:', e);
      }
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, name?: string) => {
    const res = await authSignUp(email, password, name);
    if (res.error) return { error: res.error };

    const u = res.user; // may exist even if email confirmation is required
    if (u) {
      console.log('[Auth] User created:', {
        id: u.id,
        email: u.email,
        user_metadata: u.user_metadata,
        raw_user_meta_data: (u as any).raw_user_meta_data,
        name_param: name,
        has_session: !!res.session,
        full_user_object: JSON.stringify(u, null, 2)
      });

      // If email confirmation is enabled, there will be no session here.
      // In that case, skip profile reads/writes (RLS will block them anyway)
      // and rely on the DB trigger to create the profile.
      if (!res.session) {
        console.log('[Auth] No session after signUp (email verification likely). Skipping profile upsert and waiting for user to sign in.');
        return { error: null };
      }

      try {
        // Check if profile already exists (from trigger)
        const existingProfile = await getProfileById(u.id);
        console.log('[Auth] Existing profile check:', existingProfile);

        if (!existingProfile.data) {
          console.log('[Auth] Creating profile via upsert...');
          const upsertResult = await upsertProfile({
            id: u.id,
            email: u.email ?? '',
            name: name ?? (u.user_metadata as any)?.name ?? (u.user_metadata as any)?.full_name ?? 'New User',
          });
          console.log('[Auth] Profile upsert result:', upsertResult);
        } else {
          console.log('[Auth] Profile already exists, checking name...');
          const currentName = existingProfile.data.name;
          const desiredName = name ?? (u.user_metadata as any)?.name ?? (u.user_metadata as any)?.full_name;
          
          console.log('[Auth] Name comparison:', { currentName, desiredName, shouldUpdate: currentName !== desiredName });
          
          // Always update if we have a name and it's different from current
          if (desiredName && currentName !== desiredName) {
            const updateResult = await upsertProfile({
              id: u.id,
              email: u.email ?? '',
              name: desiredName,
            });
            console.log('[Auth] Profile update result:', updateResult);
          }
        }
      } catch (e) {
        console.error('[Auth] Profile upsert on signup failed:', e);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    console.log('[Auth] Starting logout process...');
    try {
      await authSignOut();
      console.log('[Auth] Supabase signOut completed');
      setUser(null);
      console.log('[Auth] User state cleared, logout complete');
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    return await authSignInWithGoogle();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        signIn,
        signOut,
        signUp,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};