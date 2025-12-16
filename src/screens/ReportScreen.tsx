import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types/navigation';
import { useThemeMode } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { createReport } from '../services/reportService';
import { useToast } from '../context/ToastContext';

type ReportScreenRouteProp = RouteProp<RootStackParamList, 'Report'>;

const REASONS = [
  'Inappropriate Content',
  'Scam / Fraud',
  'Harassment',
  'Fake Item',
  'Other'
];

export default function ReportScreen() {
  const navigation = useNavigation();
  const route = useRoute<ReportScreenRouteProp>();
  const { colors } = useThemeMode();
  const { user } = useAuth();
  const toast = useToast();

  const { type, targetId } = route.params;

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Error', 'Please select a reason');
      return;
    }
    if (!details.trim()) {
      Alert.alert('Error', 'Please provide details');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to report');
      return;
    }

    setLoading(true);
    try {
      const reportData = {
        reporter_id: user.id,
        reason,
        details,
        ...(type === 'user' ? { reported_id: targetId } : {}),
        ...(type === 'listing' ? { listing_id: targetId } : {}),
      };

      const { error } = await createReport(reportData);

      if (error) throw new Error(error.message);

      toast.show('Report Submitted', 'Thank you for your report. We will review it shortly.', 'success');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Report {type === 'user' ? 'User' : 'Listing'}</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>Why are you reporting this?</Text>
        <View style={styles.reasonsContainer}>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r}
              style={[
                styles.reasonChip,
                { borderColor: colors.border, backgroundColor: colors.card },
                reason === r && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setReason(r)}
            >
              <Text style={[
                styles.reasonText,
                { color: colors.text },
                reason === r && { color: '#fff' }
              ]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>Details</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
          placeholder="Please provide more information..."
          placeholderTextColor={colors.muted}
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={details}
          onChangeText={setDetails}
        />

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 50,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 8,
  },
  reasonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  reasonChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  reasonText: {
    fontSize: 14,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    minHeight: 120,
    fontSize: 16,
    marginBottom: 24,
  },
  submitButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
