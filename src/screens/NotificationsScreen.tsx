import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications, markNotificationReadForUser, markAllNotificationsRead, subscribeToUserNotifications, clearNotifications, deleteNotificationForUser, type NotificationRow } from '../services/notificationService';
import { RootStackNavigationProp } from '../types/navigation';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  date: string;
};

const NotificationsScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors } = useThemeMode();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  const formatRelativeTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.max(0, now.getTime() - d.getTime());
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const dateLabel = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yday = new Date();
    yday.setDate(today.getDate() - 1);
    const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (isSameDay(d, today)) return 'Today';
    if (isSameDay(d, yday)) return 'Yesterday';
    return d.toLocaleDateString();
  };

  const mapRow = (row: NotificationRow): Notification => ({
    id: row.id,
    type: row.type,
    title: row.title,
    message: row.body,
    time: formatRelativeTime(row.created_at),
    read: !!row.read,
    date: dateLabel(row.created_at),
  });

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const init = async () => {
      if (!user?.id) {
        setNotifications([]);
        return;
      }
      setLoading(true);
      const res = await fetchNotifications(user.id, 50);
      const rows = res.data ?? [];
      setNotifications(rows.map(mapRow));
      setLoading(false);
      unsub = subscribeToUserNotifications(user.id, (row) => {
        setNotifications((prev) => [mapRow(row), ...prev]);
      });
    };
    init();
    return () => {
      if (unsub) unsub();
    };
  }, [user?.id]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'chatbubble-outline';
      case 'favorite':
        return 'heart-outline';
      case 'review':
        return 'star-outline';
      case 'product_sold':
        return 'cube-outline';
      case 'system':
        return 'shield-checkmark-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return colors.primary;
      case 'favorite':
        return colors.danger;
      case 'review':
        return colors.warning;
      case 'product_sold':
        return colors.success;
      case 'system':
        return colors.muted;
      default:
        return colors.muted;
    }
  };

  const markAsRead = async (id: string) => {
    if (!user?.id) return;
    const r = await markNotificationReadForUser(id, user.id);
    if (!r.error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    if (!user?.id) return;
    const r = await clearNotifications(user.id);
    if (!r.error) {
      setNotifications([]);
    }
  };

  const onRefresh = useCallback(() => {
    if (!user?.id) return;
    setRefreshing(true);
    fetchNotifications(user.id, 50).then((res) => {
      const rows = res.data ?? [];
      setNotifications(rows.map(mapRow));
      setRefreshing(false);
    });
  }, [user?.id]);

  const renderSectionHeader = (date: string) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: colors.muted }]}>{date}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color={colors.muted} />
      <Text style={[styles.emptyStateText, { color: colors.text }]}>No notifications yet</Text>
      <Text style={[styles.emptyStateSubtext, { color: colors.muted }]}>
        We'll notify you when something important happens
      </Text>
    </View>
  );

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, { backgroundColor: colors.card }, !item.read ? { backgroundColor: colors.surface } : null]}
      onPress={async () => {
        setSelected(item);
        setShowDetail(true);
        if (!item.read && user?.id) {
          await markNotificationReadForUser(item.id, user.id);
          setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: true } : n));
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
        <Ionicons name={getNotificationIcon(item.type)} size={24} color={getNotificationColor(item.type)} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.notificationTime, { color: colors.muted }]}>{item.time}</Text>
        </View>
        <Text style={[styles.notificationMessage, { color: colors.text }]} numberOfLines={1}>{item.message}</Text>
      </View>
      {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      <TouchableOpacity
        onPress={async () => {
          if (!user?.id) return
          const r = await deleteNotificationForUser(item.id, user.id)
          if (!r.error) {
            setNotifications(prev => prev.filter(n => n.id !== item.id))
          }
        }}
        style={styles.deleteBtn}
      >
        <Ionicons name="trash-outline" size={20} color={colors.danger} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const groupedNotifications = notifications.reduce((acc, notification) => {
    if (!acc[notification.date]) {
      acc[notification.date] = [];
    }
    acc[notification.date].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const sections = Object.entries(groupedNotifications).map(([date, items]) => ({
    date,
    data: items,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={{ padding: 4 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
        </View>
        <View style={{ flexDirection: 'row' }}>
          {notifications.some(n => !n.read) && (
            <TouchableOpacity onPress={markAllAsRead} style={[styles.markAllButton, { backgroundColor: colors.background, marginRight: 8 }]}>
              <Text style={[styles.markAllText, { color: colors.primary }]}>Mark all</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity onPress={clearAll} style={[styles.markAllButton, { backgroundColor: colors.background }]}>
              <Text style={[styles.markAllText, { color: '#DC2626' }]}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : notifications.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={sections}
          renderItem={({ item }) => (
            <View key={item.date}>
              {renderSectionHeader(item.date)}
              {item.data.map(notification => (
                <View key={notification.id}>
                  {renderNotification({ item: notification })}
                </View>
              ))}
            </View>
          )}
          keyExtractor={item => item.date}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      {showDetail && selected && (
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selected.title}</Text>
              <Text style={[styles.modalTime, { color: colors.muted }]}>{selected.time}</Text>
            </View>
            <Text style={[styles.modalMessage, { color: colors.text }]}>{selected.message}</Text>
            <View style={styles.modalActions}>
              {/* {!selected.read && (
                <TouchableOpacity onPress={async () => { await markAsRead(selected.id); }} style={[styles.modalBtn, { backgroundColor: '#6366F1' }]}>
                  <Text style={styles.modalBtnText}>Mark as read</Text>
                </TouchableOpacity>
              )} */}
              <TouchableOpacity onPress={() => { setShowDetail(false); setSelected(null); }} style={[styles.modalBtn, { backgroundColor: colors.surface }]}>
                <Text style={[styles.modalBtnText, { color: colors.text }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

  const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  markAllText: {
    fontSize: 14,
    color: '#4338CA',
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 8,
    marginTop: 16,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadNotification: {
    backgroundColor: '#F8FAFC',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  notificationTime: {
    fontSize: 12,
    color: '#64748B',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4338CA',
    marginLeft: 8,
  },
  deleteBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    marginLeft: 8,
  },
  modalOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalTime: {
    fontSize: 12,
  },
  modalMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  modalBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default NotificationsScreen;
