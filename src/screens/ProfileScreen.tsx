import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  FlatList,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';
import { useAuth } from '../context/AuthContext';

// Types
type TransactionStatus = 'completed' | 'pending' | 'cancelled';

interface Sale {
  id: string;
  itemName: string;
  buyerName: string;
  buyerId: string;
  price: number;
  date: string; // ISO string
  status: TransactionStatus;
}

interface Purchase {
  id: string;
  itemName: string;
  sellerName: string;
  sellerId: string;
  price: number;
  date: string; // ISO string
  status: TransactionStatus;
}

// Mock user data
const MOCK_USER = {
  id: '1',
  name: 'John Doe',
  email: 'john.doe@example.com',
  avatar: 'https://picsum.photos/seed/user1/200/200',
  joinDate: 'March 2024',
  stats: {
    listings: 12,
    sales: 8,
    purchases: 15,
  },
  rating: 4.8,
  reviews: 24,
  isVerified: false,
  phone: '+234 123 456 7890',
  location: 'Lagos, Nigeria',
  bio: 'Student at University of Lagos. Selling items to help other students.',
};

// Mock user listings
const MOCK_USER_LISTINGS = [
  {
    id: '1',
    title: 'iPhone 12 Pro',
    price: 699.99,
    image: 'https://picsum.photos/seed/iphone/400/500',
    status: 'active',
  },
  {
    id: '2',
    title: 'Nike Air Max',
    price: 89.99,
    image: 'https://picsum.photos/seed/nike/400/500',
    status: 'sold',
  },
  {
    id: '3',
    title: 'MacBook Pro 2020',
    price: 1299.99,
    image: 'https://picsum.photos/seed/macbook/400/500',
    status: 'active',
  },
];

// Mock sales data
const MOCK_SALES: Sale[] = [
  {
    id: '1',
    itemName: 'iPhone 12 Pro',
    buyerName: 'Sarah Johnson',
    buyerId: 'buyer1',
    price: 699.99,
    date: '2024-03-15',
    status: 'completed',
  },
  {
    id: '2',
    itemName: 'Nike Air Max',
    buyerName: 'Mike Wilson',
    buyerId: 'buyer2',
    price: 89.99,
    date: '2024-03-10',
    status: 'completed',
  },
];

// Mock purchases data
const MOCK_PURCHASES: Purchase[] = [
  {
    id: '1',
    itemName: 'Sony Headphones',
    sellerName: 'Alex Brown',
    sellerId: 'seller1',
    price: 199.99,
    date: '2024-03-18',
    status: 'completed',
  },
  {
    id: '2',
    itemName: 'Gaming Mouse',
    sellerName: 'Emma Davis',
    sellerId: 'seller2',
    price: 49.99,
    date: '2024-03-12',
    status: 'completed',
  },
];

const ProfileScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'listings' | 'sales' | 'purchases'>('listings');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editedUser, setEditedUser] = useState(MOCK_USER);
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  // Filter active listings and limit to 4
  const activeListings = MOCK_USER_LISTINGS
    .filter(listing => listing.status === 'active')
    .slice(0, 4);

  const handleEditProfile = () => {
    setShowEditProfile(true);
  };

  const handleSaveProfile = () => {
    // TODO: Implement API call to save profile changes
    setShowEditProfile(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleVerificationRequest = () => {
    setShowVerificationModal(true);
  };

  const handleLogout = async () => {
    console.log('[ProfileScreen] Logout button pressed');
    
    // Use window.confirm for better web compatibility
    const confirmed = window.confirm('Are you sure you want to logout?');
    
    if (!confirmed) {
      console.log('[ProfileScreen] Logout cancelled');
      return;
    }
    
    console.log('[ProfileScreen] Logout confirmed, calling signOut...');
    try {
      await signOut();
      console.log('[ProfileScreen] SignOut completed successfully');
      // No need to navigate - AppNavigator will handle it
    } catch (error) {
      console.error('[ProfileScreen] Error logging out:', error);
      window.alert('Failed to logout. Please try again.');
    }
  };

  const renderEditProfileModal = () => (
    <Modal
      visible={showEditProfile}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditProfile(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={() => setShowEditProfile(false)}>
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedUser.name}
                onChangeText={(text) => setEditedUser({ ...editedUser, name: text })}
                placeholder="Enter your name"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editedUser.email}
                onChangeText={(text) => setEditedUser({ ...editedUser, email: text })}
                placeholder="Enter your email"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editedUser.phone}
                onChangeText={(text) => setEditedUser({ ...editedUser, phone: text })}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={editedUser.location}
                onChangeText={(text) => setEditedUser({ ...editedUser, location: text })}
                placeholder="Enter your location"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editedUser.bio}
                onChangeText={(text) => setEditedUser({ ...editedUser, bio: text })}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
              />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderVerificationModal = () => (
    <Modal
      visible={showVerificationModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowVerificationModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Request Verification</Text>
            <TouchableOpacity onPress={() => setShowVerificationModal(false)}>
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.verificationForm}>
            <Text style={styles.verificationText}>
              To become a verified seller, please provide the following information:
            </Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Matric Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your matric number"
                keyboardType="default"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NIN Picture</Text>
              <TouchableOpacity style={styles.uploadButton}>
                <Ionicons name="cloud-upload-outline" size={24} color="#4338CA" />
                <Text style={styles.uploadText}>Upload NIN Picture</Text>
              </TouchableOpacity>
              <Text style={styles.uploadHint}>
                Please upload a clear picture of your NIN card
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.verifyButton} 
              onPress={() => {
                setShowVerificationModal(false);
                Alert.alert(
                  'Success', 
                  'Verification request submitted. We will review your application within 24 hours.'
                );
              }}
            >
              <Text style={styles.verifyButtonText}>Submit Request</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderSaleItem = ({ item }: { item: Sale }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionTitle}>{item.itemName}</Text>
        <Text style={styles.transactionPrice}>₦{item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionUserContainer}>
          <Text style={styles.transactionLabel}>Buyer: </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile', { userId: item.buyerId })}
          >
            <Text style={styles.transactionUserName}>{item.buyerName}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.transactionStatus}>
        <Text style={[styles.statusText, styles[`status${item.status}`]]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
    </View>
  );

  const renderPurchaseItem = ({ item }: { item: Purchase }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={styles.transactionTitle}>{item.itemName}</Text>
        <Text style={styles.transactionPrice}>₦{item.price.toLocaleString()}</Text>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionUserContainer}>
          <Text style={styles.transactionLabel}>Seller: </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('Profile', { userId: item.sellerId })}
          >
            <Text style={styles.transactionUserName}>{item.sellerName}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.transactionDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <View style={styles.transactionStatus}>
        <Text style={[styles.statusText, styles[`status${item.status}`]]}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </Text>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'listings':
        return (
          <View style={styles.listingsContainer}>
            <View style={styles.listingsHeader}>
              <Text style={styles.listingsTitle}>Active Listings</Text>
              <TouchableOpacity 
                style={styles.showMoreButton}
                onPress={() => {
                  navigation.navigate('Main', {
                    screen: 'Sell'
                  });
                }}
              >
                <Text style={styles.showMoreText}>Show All</Text>
                <Ionicons name="chevron-forward" size={16} color="#4338CA" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listingsCarousel}
            >
              {activeListings.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listingCard}
                  onPress={() => navigation.navigate('ListingDetails', { listingId: item.id })}
                >
                  <Image source={{ uri: item.image }} style={styles.listingImage} />
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={styles.listingPrice}>₦{item.price.toLocaleString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        );
      case 'sales':
        return (
          <View style={styles.transactionsContainer}>
            <FlatList<Sale>
              data={MOCK_SALES}
              renderItem={renderSaleItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.transactionsList}
            />
          </View>
        );
      case 'purchases':
        return (
          <View style={styles.transactionsContainer}>
            <FlatList<Purchase>
              data={MOCK_PURCHASES}
              renderItem={renderPurchaseItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.transactionsList}
            />
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[1]} // Single item to render the sections
        renderItem={() => (
          <>
            {/* Profile Header */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: MOCK_USER.avatar }} style={styles.avatar} />
                {MOCK_USER.isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                )}
              </View>
              <Text style={styles.name}>{MOCK_USER.name}</Text>
              <Text style={styles.email}>{MOCK_USER.email}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.rating}>{MOCK_USER.rating}</Text>
                <Text style={styles.reviews}>({MOCK_USER.reviews} reviews)</Text>
              </View>
              <Text style={styles.joinDate}>Member since {MOCK_USER.joinDate}</Text>
              <View style={styles.verificationContainer}>
                {MOCK_USER.isVerified ? (
                  <View style={styles.verifiedStatus}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.verifiedText}>Verified Seller</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.verifyButton}
                    onPress={handleVerificationRequest}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.verifyButtonText}>Get Verified</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={styles.editProfileButton}
                onPress={handleEditProfile}
              >
                <Ionicons name="pencil" size={16} color="#4338CA" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Section */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_USER.stats.listings}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_USER.stats.sales}</Text>
                <Text style={styles.statLabel}>Sales</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{MOCK_USER.stats.purchases}</Text>
                <Text style={styles.statLabel}>Purchases</Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'listings' && styles.activeTab]}
                onPress={() => setActiveTab('listings')}
              >
                <Text style={[styles.tabText, activeTab === 'listings' && styles.activeTabText]}>
                  My Listings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
                onPress={() => setActiveTab('sales')}
              >
                <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
                  Sales
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'purchases' && styles.activeTab]}
                onPress={() => setActiveTab('purchases')}
              >
                <Text style={[styles.tabText, activeTab === 'purchases' && styles.activeTabText]}>
                  Purchases
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
            {renderContent()}

            {/* Settings Section */}
            <View style={styles.settingsContainer}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={24} color="#1E293B" />
                <Text style={styles.settingText}>Settings</Text>
                <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('PrivacySecurity')}
              >
                <Ionicons name="shield-checkmark-outline" size={24} color="#1E293B" />
                <Text style={styles.settingText}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('HelpSupport')}
              >
                <Ionicons name="help-circle-outline" size={24} color="#1E293B" />
                <Text style={styles.settingText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#DC2626" />
              <Text style={styles.logoutText}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}
        keyExtractor={() => 'profile-content'}
        showsVerticalScrollIndicator={false}
      />

      {renderEditProfileModal()}
      {renderVerificationModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 4,
  },
  reviews: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  verificationContainer: {
    marginBottom: 12,
  },
  verifiedStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
    marginLeft: 4,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    marginBottom: 8,
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4338CA',
    marginLeft: 4,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#4338CA',
  },
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginTop: 12,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#EEF2FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  activeTabText: {
    color: '#4338CA',
    fontWeight: '600',
  },
  listingsContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  listingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listingsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4338CA',
    marginRight: 4,
  },
  listingsCarousel: {
    paddingRight: 16,
  },
  listingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    width: '47%',
  },
  listingImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
  },
  listingInfo: {
    padding: 12,
  },
  listingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  listingPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4338CA',
    marginBottom: 8,
  },
  settingsContainer: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginLeft: 8,
  },
  transactionsContainer: {
    marginTop: 12,
    marginHorizontal: 16,
  },
  transactionsList: {
    paddingBottom: 16,
  },
  transactionCard: {
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
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  transactionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4338CA',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionUserName: {
    fontSize: 14,
    color: '#4338CA',
    textDecorationLine: 'underline',
  },
  transactionDate: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionStatus: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statuscompleted: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
  statuspending: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  statuscancelled: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  editForm: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4338CA',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  verificationForm: {
    padding: 16,
  },
  verificationText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 16,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#4338CA',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4338CA',
    marginLeft: 8,
  },
  uploadHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
});

export default ProfileScreen;