import { supabase } from '../lib/supabase';

export interface Report {
  id: string;
  reporter_id: string;
  reported_id?: string;
  listing_id?: string;
  reason: string;
  details: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  reporter?: { email: string; name: string };
  reported?: { email: string; name: string };
  listing?: { title: string };
}

export async function createReport(report: Omit<Report, 'id' | 'created_at' | 'status'>) {
  const { data, error } = await supabase
    .from('reports')
    .insert([report])
    .select()
    .single();

  return { data, error };
}

export async function getReports() {
  const { data, error } = await supabase
    .from('reports')
    .select(`
      *,
      reporter:reporter_id(email, name),
      reported:reported_id(email, name),
      listing:listing_id(title)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function updateReportStatus(id: string, status: Report['status']) {
  const { data, error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}
