import { supabase } from '../lib/supabase';

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    error: error ? error.message : null,
  };
}

export async function signUp(email: string, password: string, full_name?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // send 'name' as canonical; keep 'full_name' for backward compatibility
      data: { name: full_name, full_name },
    },
  });
  return {
    user: data?.user ?? null,
    session: data?.session ?? null,
    error: error ? error.message : null,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}