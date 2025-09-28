import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = () => {
  const { signOut } = useAuth();
  const [settings, setSettings] = useState({
    darkMode: false,
    locationServices: true,
    saveHistory: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            // TODO: Implement cache clearing logic
            Alert.alert('Success', 'Cache cleared successfully');
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    description: string,
    key: keyof typeof settings,
    icon: string
  ) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={24} color="#6366F1" />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={settings[key]}
        onValueChange={() => toggleSetting(key)}
        trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
        thumbColor={settings[key] ? '#6366F1' : '#F8FAFC'}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          {renderSettingItem(
            'Dark Mode',
            'Enable dark theme for the app',
            'darkMode',
            'moon-outline'
          )}
          {renderSettingItem(
            'Location Services',
            'Allow app to access your location',
            'locationServices',
            'location-outline'
          )}
          {renderSettingItem(
            'Save History',
            'Keep track of your browsing history',
            'saveHistory',
            'time-outline'
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearCache}
          >
            <Ionicons name="trash-outline" size={24} color="#6366F1" />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={[styles.section, styles.accountSection]}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#DC2626" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText]}>
              Log Out
            </Text>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#6366F1',
    marginLeft: 12,
  },
  accountSection: {
    marginTop: 24,
  },
  logoutButton: {
    borderBottomWidth: 0,
  },
  logoutButtonText: {
    color: '#DC2626',
  },
});

export default SettingsScreen; 