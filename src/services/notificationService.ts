import { supabase } from '../lib/supabase'

export type NotificationRow = {
  id: string
  user_id: string
  type: 'message' | 'favorite' | 'review' | 'product_sold' | 'system'
  title: string
  body: string
  data?: any
  read: boolean
  created_at: string
}

export async function fetchNotifications(userId: string, limit = 50) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id,user_id,type,title,body,read,created_at,data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  return {
    data: (data ?? []) as NotificationRow[],
    error: error ? error.message : null,
  }
}

export async function markNotificationRead(notificationId: string) {
  console.warn('[notificationService] markNotificationRead called without userId; prefer markNotificationReadForUser')
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
  return { error: error ? error.message : null }
}

export async function markAllNotificationsRead(userId: string) {
  const base =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim()
  if (!base) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
    return { error: error ? error.message : null }
  }
  try {
    const res = await fetch(`${base.replace(/\/+$/,'')}/api/notifications-mark-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return { error: t || `Mark all failed: ${res.status}` }
    }
    return { error: null }
  } catch (e: any) {
    return { error: e?.message || 'Network error' }
  }
}

export async function markNotificationReadForUser(notificationId: string, userId: string) {
  const base =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim()
  if (!base) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
    return { error: error ? error.message : null }
  }
  try {
    const res = await fetch(`${base.replace(/\/+$/,'')}/api/notifications-read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, notification_id: notificationId }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return { error: t || `Read failed: ${res.status}` }
    }
    return { error: null }
  } catch (e: any) {
    return { error: e?.message || 'Network error' }
  }
}

export function subscribeToUserNotifications(
  userId: string,
  onInsert: (row: NotificationRow) => void
) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        const n = payload.new as any
        onInsert({
          id: n.id,
          user_id: n.user_id,
          type: n.type,
          title: n.title,
          body: n.body,
          data: n.data,
          read: !!n.read,
          created_at: n.created_at,
        })
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

export async function clearNotifications(userId: string) {
  const base =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim()
  if (!base) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId)
    return { error: error ? error.message : null }
  }
  try {
    const res = await fetch(`${base.replace(/\/+$/,'')}/api/notifications-clear`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return { error: t || `Clear failed: ${res.status}` }
    }
    return { error: null }
  } catch (e: any) {
    return { error: e?.message || 'Network error' }
  }
}

export async function deleteNotificationForUser(notificationId: string, userId: string) {
  const base =
    (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').trim() ||
    (process.env.EXPO_PUBLIC_FUNCTIONS_BASE_URL ?? '').trim()
  if (!base) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)
    return { error: error ? error.message : null }
  }
  try {
    const res = await fetch(`${base.replace(/\/+$/,'')}/api/notifications-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, notification_id: notificationId }),
    })
    if (!res.ok) {
      const t = await res.text().catch(() => '')
      return { error: t || `Delete failed: ${res.status}` }
    }
    return { error: null }
  } catch (e: any) {
    return { error: e?.message || 'Network error' }
  }
}
