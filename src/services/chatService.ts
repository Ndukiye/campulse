import { supabase } from '../lib/supabase';

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  attachment?: {
    type: 'image' | 'document';
    url: string;
    name: string;
    size?: number;
    mime_type?: string;
  };
};

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  attachment?: {
    type: 'image' | 'document';
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  }
) {
  const payload: any = { conversation_id: conversationId, sender_id: senderId, content: text, read: false };
  if (attachment) {
    payload.message_type = attachment.type === 'image' ? 'image' : 'document';
    payload.attachment_url = attachment.uri; // caller should upload first and pass final URL
  }
  const { data, error } = await supabase
    .from('messages')
    .insert(payload)
    .select('id,conversation_id,sender_id,content,read,created_at,message_type,attachment_url')
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    conversationId: data.conversation_id,
    senderId: data.sender_id,
    text: data.content,
    read: !!data.read,
    timestamp: new Date(data.created_at),
    attachment: data.attachment_url
      ? {
          type: (data.message_type ?? 'image') as 'image' | 'document',
          url: data.attachment_url,
          name: '',
        }
      : undefined,
  } as import('./chatService').Message;
}

export function subscribeToMessages(
  conversationId: string,
  onMessages: (messages: Message[]) => void
) {
  let unsubscribed = false;
  let current: Message[] = [];
  const loadInitial = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('id,conversation_id,sender_id,content,read,created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) return;
    if (!unsubscribed) {
      current = (data ?? []).map((m: any) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        text: m.content,
        read: !!m.read,
        timestamp: new Date(m.created_at),
      }));
      onMessages(current);
    }
  };
  loadInitial();

  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        const m: any = payload.new;
        current = current.concat({
          id: m.id,
          conversationId: m.conversation_id,
          senderId: m.sender_id,
          text: m.content,
          read: !!m.read,
          timestamp: new Date(m.created_at),
        });
        onMessages(current);
      }
    )
    .subscribe();

  return () => {
    unsubscribed = true;
    supabase.removeChannel(channel);
  };
}

export async function ensureConversation(userA: string, userB: string) {
  const [p1, p2] = [userA, userB].sort();
  const { data } = await supabase
    .from('conversations')
    .select('id,participant_1,participant_2,product_id')
    .or(`and(participant_1.eq.${p1},participant_2.eq.${p2}),and(participant_1.eq.${p2},participant_2.eq.${p1})`)
    .maybeSingle();
  if (data?.id) return { id: data.id };
  const { data: created, error } = await supabase
    .from('conversations')
    .insert({ participant_1: p1, participant_2: p2, product_id: null })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  return { id: created.id };
}

export type ConversationSummary = {
  id: string;
  otherUser: { id: string; name: string; avatar_url: string | null; verified: boolean };
  lastMessage?: { text: string | null; type: 'text' | 'image' | 'document'; created_at: string | null };
  unreadCount: number;
  product?: { id: string; title: string; image?: string | null } | null;
};

export async function listConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id,participant_1,participant_2,product_id')
    .or(`participant_1.eq.${userId},participant_2.eq.${userId})`);
  if (error) return { data: [], error: error.message };

  const convs = (data ?? []) as any[];
  const summaries: ConversationSummary[] = [];
  for (const c of convs) {
    const otherId = c.participant_1 === userId ? c.participant_2 : c.participant_1;
    const [profileRes, lastMsgRes, unreadRes, productRes] = await Promise.all([
      supabase.from('profiles').select('id,name,avatar_url,verified').eq('id', otherId).maybeSingle(),
      supabase
        .from('messages')
        .select('content,message_type,created_at')
        .eq('conversation_id', c.id)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('messages')
        .select('id', { head: true, count: 'exact' })
        .eq('conversation_id', c.id)
        .eq('read', false)
        .neq('sender_id', userId),
      c.product_id
        ? supabase.from('products').select('id,title,images').eq('id', c.product_id).maybeSingle()
        : Promise.resolve({ data: null as any, error: null }),
    ]);

    const otherUser = profileRes.data
      ? {
          id: otherId,
          name: profileRes.data.name ?? 'User',
          avatar_url: profileRes.data.avatar_url ?? null,
          verified: !!profileRes.data.verified,
        }
      : { id: otherId, name: 'User', avatar_url: null, verified: false };
    const lastRow = Array.isArray(lastMsgRes.data) ? lastMsgRes.data[0] : null;
    const lastMessage = lastRow
      ? { text: lastRow.content ?? null, type: (lastRow.message_type ?? 'text') as any, created_at: lastRow.created_at ?? null }
      : undefined;
    const unreadCount = unreadRes.count ?? 0;
    const product = productRes.data
      ? { id: productRes.data.id, title: productRes.data.title, image: (productRes.data.images ?? [])[0] ?? null }
      : null;

    summaries.push({ id: c.id, otherUser, lastMessage, unreadCount, product });
  }
  return { data: summaries, error: null };
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .eq('read', false);
  if (error) throw new Error(error.message);
}

export function subscribeToTypingStatus(
  conversationId: string,
  userId: string,
  onTypingStatus: (isTyping: boolean) => void
) {
  const channel = supabase.channel(`typing:${conversationId}`, {
    config: { broadcast: { self: true } },
  });
  channel.on('broadcast', { event: 'typing' }, (payload) => {
    const { userId: uid, isTyping } = payload.payload as any;
    if (uid !== userId) onTypingStatus(!!isTyping);
  });
  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function updateTypingStatus(conversationId: string, userId: string, isTyping: boolean) {
  const channel = supabase.channel(`typing:${conversationId}`, {
    config: { broadcast: { self: true } },
  });
  await channel.subscribe();
  await channel.send({ type: 'broadcast', event: 'typing', payload: { userId, isTyping } });
}