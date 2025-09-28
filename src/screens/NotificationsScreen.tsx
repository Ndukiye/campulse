import React, { useState, useCallback } from 'react';
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
import { RootStackNavigationProp } from '../types/navigation';

type Notification = {
  id: string;
  type: 'message' | 'offer' | 'price' | 'security';
  title: string;
  message: string;
  time: string;
  read: boolean;
  date: string; // Added for grouping
};

const NotificationsScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'message',
      title: 'New Message',
      message: 'John Doe sent you a message about your listing',
      time: '2m ago',
      read: false,
      date: 'Today',
    },
    {
      id: '2',
      type: 'offer',
      title: 'New Offer',
      message: 'You received a new offer for your camera',
      time: '1h ago',
      read: false,
      date: 'Today',
    },
    {
      id: '3',
      type: 'price',
      title: 'Price Alert',
      message: 'The price of Canon EOS R5 has dropped by 15%',
      time: '3h ago',
      read: true,
      date: 'Today',
    },
    {
      id: '4',
      type: 'security',
      title: 'Security Alert',
      message: 'New login detected from a new device',
      time: '1d ago',
      read: true,
      date: 'Yesterday',
    },
  ]);

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'chatbubble-outline';
      case 'offer':
        return 'pricetag-outline';
      case 'price':
        return 'trending-up-outline';
      case 'security':
        return 'shield-checkmark-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return '#4338CA';
      case 'offer':
        return '#059669';
      case 'price':
        return '#F59E0B';
      case 'security':
        return '#DC2626';
      default:
        return '#64748B';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({
      ...notification,
      read: true,
    })));
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const renderSectionHeader = (date: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{date}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off-outline" size={64} color="#94A3B8" />
      <Text style={styles.emptyStateText}>No notifications yet</Text>
      <Text style={styles.emptyStateSubtext}>
        We'll notify you when something important happens
      </Text>
    </View>
  );

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => markAsRead(item.id)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
        <Ionicons name={getNotificationIcon(item.type)} size={24} color={getNotificationColor(item.type)} />
      </View>
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>{item.time}</Text>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        )}
      </View>

      {notifications.length === 0 ? (
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
  emptyState: {
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