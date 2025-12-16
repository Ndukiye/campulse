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
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { TextInput } from 'react-native';
import { registerPaystackRecipient, listPaystackBanks } from '../services/paystackService';

const SettingsScreen = () => {
  const { signOut, user } = useAuth();
  const { isDark, toggleTheme, colors } = useThemeMode();
  const navigation = useNavigation<RootStackNavigationProp>();
  const [settings, setSettings] = useState({
    locationServices: true,
    saveHistory: true,
  });
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [banks, setBanks] = useState<Array<{ name: string, code: string }>>([]);
  const [bankQuery, setBankQuery] = useState('');

  React.useEffect(() => {
    const load = async () => {
      const r = await listPaystackBanks();
      if (!r.error) setBanks(r.data);
    };
    load();
  }, []);

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
    key: 'darkMode' | keyof typeof settings,
    icon: string
  ) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }]}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.settingDescription, { color: colors.muted }]}>{description}</Text>
      </View>
      <Switch
        value={key === 'darkMode' ? isDark : settings[key as keyof typeof settings]}
        onValueChange={() => {
          if (key === 'darkMode') {
            toggleTheme();
          } else {
            toggleSetting(key as keyof typeof settings);
          }
        }}
        trackColor={{ false: '#E2E8F0', true: '#C7D2FE' }}
        thumbColor={(key === 'darkMode' ? isDark : settings[key as keyof typeof settings]) ? '#6366F1' : '#F8FAFC'}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }] }>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={[styles.section, { backgroundColor: colors.card }] }>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>App Settings</Text>
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

        <View style={[styles.section, { backgroundColor: colors.card }] }>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Storage</Text>
          <TouchableOpacity
            style={[styles.actionButton, { borderBottomColor: colors.border }]}
            onPress={handleClearCache}
          >
            <Ionicons name="trash-outline" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.text }]}>Clear Cache</Text>
            <Ionicons name="chevron-forward" size={24} color={colors.muted} />
          </TouchableOpacity>
        </View>

        

        <View style={[styles.section, styles.accountSection, { backgroundColor: colors.card }] }>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
          <TouchableOpacity
            style={[styles.actionButton, styles.logoutButton, { borderBottomColor: colors.border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color="#DC2626" />
            <Text style={[styles.actionButtonText, styles.logoutButtonText, { color: colors.text }]}>
              Log Out
            </Text>
            <Ionicons name="chevron-forward" size={24} color={colors.muted} />
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 40,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  placeholder: {
    width: 24,
    height: 24,
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
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    borderBottomWidth: 0,
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  pickerButtonText: {
    color: '#1E293B',
    fontSize: 14,
  },
  modalOverlay: {
    position: 'absolute',
    left: 0, right: 0, top: 0, bottom: 0,
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
  bankItem: {
    paddingVertical: 10,
  },
  bankName: {
    fontSize: 14,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionBox: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
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
