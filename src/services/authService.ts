import { supabase } from '../lib/supabase';
import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

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

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error: error ? error.message : null };
}

export async function signInWithGoogle() {
  try {
    const redirectUrl = makeRedirectUri({
      scheme: 'campulse',
      path: 'auth/callback',
    });

    console.log('Google Auth Redirect URL:', redirectUrl);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        skipBrowserRedirect: true,
      },
    });

    if (error) return { error: error.message };
    if (!data?.url) return { error: 'No URL returned from Supabase' };

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

    if (result.type === 'success' && result.url) {
      const url = result.url;
      const fragment = url.split('#')[1];
      if (!fragment) return { error: 'No tokens found in redirect URL' };

      const params: { [key: string]: string } = {};
      fragment.split('&').forEach((part) => {
        const [key, value] = part.split('=');
        params[key] = decodeURIComponent(value);
      });

      const { access_token, refresh_token } = params;

      if (access_token && refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });
        if (sessionError) return { error: sessionError.message };
        return { error: null };
      }
      return { error: 'No tokens found in redirect URL' };
    }
    
    return { error: 'Google sign in cancelled' };
  } catch (e: any) {
    return { error: e.message || 'An unexpected error occurred' };
  }
}
