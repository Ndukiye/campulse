import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const FAQ_ITEMS = [
  {
    question: 'How do I create a listing?',
    answer: 'To create a listing, go to the Sell tab and tap the + button. Fill in the required information about your item, add photos, and set your price. Once you submit, your listing will be visible to other users.',
  },
  {
    question: 'How do I contact a seller?',
    answer: 'You can contact a seller by tapping the "Message" button on their listing. This will open a chat where you can discuss the item and arrange the sale.',
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'Currently, we support cash payments for in-person transactions. We recommend meeting in a safe, public location to complete the transaction.',
  },
  {
    question: 'How do I report a problem?',
    answer: 'If you encounter any issues, you can report them through the "Report an Issue" option in this Help & Support section. Our team will review your report and take appropriate action.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'To delete your account, go to Profile > Settings > Privacy & Security > Delete Account. Please note that this action cannot be undone.',
  },
];

const HelpSupportScreen = () => {
  const navigation = useNavigation();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@campulse.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+2341234567890');
  };

  const handleReportIssue = () => {
    // TODO: Implement issue reporting logic
    Alert.alert('Coming Soon', 'Issue reporting functionality will be available soon.');
  };

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const renderFaqItem = (item: typeof FAQ_ITEMS[0], index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.faqItem}
      onPress={() => toggleFaq(index)}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.question}</Text>
        <Ionicons
          name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#64748B"
        />
      </View>
      {expandedFaq === index && (
        <Text style={styles.faqAnswer}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
            <Ionicons name="mail-outline" size={24} color="#6366F1" />
            <Text style={styles.contactButtonText}>Email Support</Text>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleCallSupport}>
            <Ionicons name="call-outline" size={24} color="#6366F1" />
            <Text style={styles.contactButtonText}>Call Support</Text>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={handleReportIssue}>
            <Ionicons name="alert-circle-outline" size={24} color="#6366F1" />
            <Text style={styles.contactButtonText}>Report an Issue</Text>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          {FAQ_ITEMS.map((item, index) => renderFaqItem(item, index))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <TouchableOpacity style={styles.resourceButton}>
            <Ionicons name="document-text-outline" size={24} color="#6366F1" />
            <Text style={styles.resourceButtonText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceButton}>
            <Ionicons name="shield-outline" size={24} color="#6366F1" />
            <Text style={styles.resourceButtonText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={24} color="#64748B" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceButton}>
            <Ionicons name="help-circle-outline" size={24} color="#6366F1" />
            <Text style={styles.resourceButtonText}>Safety Guidelines</Text>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  placeholder: {
    width: 40,
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
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  contactButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#6366F1',
    marginLeft: 12,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 12,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginTop: 8,
  },
  resourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resourceButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#6366F1',
    marginLeft: 12,
  },
});

export default HelpSupportScreen; 