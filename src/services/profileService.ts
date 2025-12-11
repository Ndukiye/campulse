import { supabase } from '../lib/supabase';
import type { ProfilesRow, ProfilesInsert, ProfilesUpdate } from '../types/database';

export async function getProfileById(id: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  return {
    data: (data as ProfilesRow) ?? null,
    error: error ? error.message : null,
  };
}

export async function upsertProfile(row: ProfilesInsert | ProfilesUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select('*');

  return {
    data: (data as ProfilesRow[])?.[0] ?? null,
    error: error ? error.message : null,
  };
}

export async function updateProfile(id: string, patch: ProfilesUpdate) {
  const { data, error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  return {
    data: (data as ProfilesRow) ?? null,
    error: error ? error.message : null,
  };
}
