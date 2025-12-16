import { supabase } from '../lib/supabase';

export interface Dispute {
  id: string;
  transaction_id: string;
  opener_id: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'resolved_refunded' | 'resolved_dismissed';
  created_at: string;
  updated_at: string;
  transaction?: any;
  opener?: { email: string; name: string };
}

export async function createDispute(dispute: Omit<Dispute, 'id' | 'created_at' | 'updated_at' | 'status'>) {
  const { data, error } = await supabase
    .from('disputes')
    .insert([dispute])
    .select()
    .single();

  return { data, error };
}

export async function getDisputes() {
  const { data, error } = await supabase
    .from('disputes')
    .select(`
      *,
      opener:opener_id(email, name),
      transaction:transaction_id(
        *,
        product:product_id(title),
        buyer:buyer_id(email, name),
        seller:seller_id(email, name)
      )
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}

export async function updateDisputeStatus(id: string, status: Dispute['status']) {
  const { data, error } = await supabase
    .from('disputes')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}
