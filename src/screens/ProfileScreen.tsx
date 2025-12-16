import React, { useEffect, useState } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import type { ProfilesRow } from '../types/database';
import { getProfileById, upsertProfile } from '../services/profileService';
import { countProductsBySeller, getProductsBySeller, type ProductSummary } from '../services/productService';
//
import {
  countCompletedTransactionsByBuyer,
  countCompletedTransactionsBySeller,
  getPurchasesByBuyer,
  getSalesBySeller,
  type PurchaseSummary,
  type SaleSummary,
  confirmBuyerReceived,
  confirmSellerDelivered,
} from '../services/transactionService';
import { useToast } from '../context/ToastContext';
import { registerPaystackRecipient, listPaystackBanks } from '../services/paystackService';
import { signIn as verifyPasswordSignIn } from '../services/authService';
import { submitSellerReview, submitProductReview } from '../services/reviewService';

type EditableProfile = {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
};

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

const ProfileScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors, isDark } = useThemeMode();
  const { signOut, user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'listings' | 'sales' | 'purchases'>('listings');
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [profile, setProfile] = useState<ProfilesRow | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<EditableProfile>({
    name: '',
    email: '',
    phone: '',
    location: '',
    bio: '',
  });
  const [stats, setStats] = useState({ listings: 0, sales: 0, purchases: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [listings, setListings] = useState<ProductSummary[]>([]);
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  //
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [banks, setBanks] = useState<Array<{ name: string, code: string }>>([]);
  const [bankQuery, setBankQuery] = useState('');
  const [showBankSuggestions, setShowBankSuggestions] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [savingRecipient, setSavingRecipient] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewSellerRating, setReviewSellerRating] = useState(0);
  const [reviewProductRating, setReviewProductRating] = useState(0);
  const [reviewProductComment, setReviewProductComment] = useState('');
  const [reviewContext, setReviewContext] = useState<{ sellerId: string | null, productId: string | null } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      if (!user?.id) {
        setProfile(null);
        setEditedProfile({
          name: user?.name ?? (user as any)?.full_name ?? user?.email ?? '',
          email: user?.email ?? '',
          phone: '',
          location: '',
          bio: '',
        });
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      try {
        const res = await getProfileById(user.id);
        if (!isMounted) return;
        if (res.error) {
          console.warn('[ProfileScreen] Failed to load profile:', res.error);
        }
        const fetchedProfile = res.data ?? null;
        setProfile(fetchedProfile);
        setEditedProfile({
          name: fetchedProfile?.name ?? user?.name ?? (user as any)?.full_name ?? user?.email ?? '',
          email: fetchedProfile?.email ?? user?.email ?? '',
          phone: fetchedProfile?.phone ?? '',
          location: fetchedProfile?.location ?? '',
          bio: fetchedProfile?.bio ?? '',
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('[ProfileScreen] Unexpected error loading profile:', error);
      } finally {
        if (isMounted) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    const loadBanks = async () => {
      const r = await listPaystackBanks();
      if (!isMounted) return;
      if (!r.error) setBanks(r.data);
    };
    loadBanks();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!profile) return
    if (profile.bank_name) {
      setBankQuery(profile.bank_name)
      const match = banks.find(b => b.name.toLowerCase() === String(profile.bank_name).toLowerCase())
      if (match) setBankCode(match.code)
    } else {
      setBankQuery('')
      setBankCode('')
    }
    setAccountNumber(profile.account_number ?? '')
  }, [banks, profile])

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const loadStats = async () => {
        if (!user?.id) {
          if (isMounted) {
            setStats({ listings: 0, sales: 0, purchases: 0 });
            setLoadingStats(false);
          }
          return;
        }
        setLoadingStats(true);
        try {
          const [listingsRes, salesRes, purchasesRes] = await Promise.all([
            countProductsBySeller(user.id),
            countCompletedTransactionsBySeller(user.id),
            countCompletedTransactionsByBuyer(user.id),
          ]);
          if (!isMounted) return;
          setStats({
            listings: listingsRes.count ?? 0,
            sales: salesRes.count ?? 0,
            purchases: purchasesRes.count ?? 0,
          });
        } catch (error) {
          if (!isMounted) return;
          setStats({ listings: 0, sales: 0, purchases: 0 });
        } finally {
          if (isMounted) setLoadingStats(false);
        }
      };
      loadStats();
      return () => { isMounted = false; };
    }, [user?.id])
  );

  useFocusEffect(
    React.useCallback(() => {
      let isMounted = true;
      const loadLists = async () => {
        if (!user?.id) {
          if (isMounted) {
            setListings([]);
            setSales([]);
            setPurchases([]);
            setLoadingLists(false);
          }
          return;
        }
        setLoadingLists(true);
        try {
          const [listingsRes, salesRes, purchasesRes] = await Promise.all([
            getProductsBySeller(user.id, 20),
            getSalesBySeller(user.id, 100, 0, 'pending'),
            getPurchasesByBuyer(user.id, 100, 0, 'pending'),
          ]);
          if (!isMounted) return;
          setListings(listingsRes.data ?? []);
          setSales(salesRes.data ?? []);
          setPurchases(purchasesRes.data ?? []);
        } catch (error) {
          if (!isMounted) return;
          setListings([]);
          setSales([]);
          setPurchases([]);
        } finally {
          if (isMounted) setLoadingLists(false);
        }
      };
      loadLists();
      return () => { isMounted = false; };
    }, [user?.id])
  );

  // Filter active listings and limit to 4
  const listingPreview = listings.slice(0, 4);

  const handleEditProfile = () => {
    if (!user) return;
    setEditedProfile({
      name: profile?.name ?? user.name ?? (user as any)?.full_name ?? user.email ?? '',
      email: profile?.email ?? user.email ?? '',
      phone: profile?.phone ?? '',
      location: profile?.location ?? '',
      bio: profile?.bio ?? '',
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'User session not found. Please sign in again.');
      return;
    }

    const trimToNull = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
  };

    const trimmedEmail = editedProfile.email.trim();
    if (!trimmedEmail) {
      Alert.alert('Validation', 'Email is required.');
      return;
    }

    const payload = {
      id: user.id,
      email: trimmedEmail,
      name:
        trimToNull(editedProfile.name) ??
        profile?.name ??
        user?.name ??
        (user as any)?.full_name ??
        user?.email ??
        'User',
      phone: trimToNull(editedProfile.phone),
      location: trimToNull(editedProfile.location),
      bio: trimToNull(editedProfile.bio),
    };

    setSavingProfile(true);
    try {
      const { data, error } = await upsertProfile(payload);
      if (error) {
        Alert.alert('Error', error);
      return;
    }
    
      const updatedProfile: ProfilesRow | null = data
        ? data
        : profile
        ? { ...profile, ...payload }
        : ({ ...payload } as ProfilesRow);

      if (updatedProfile) {
        setProfile(updatedProfile);
        setEditedProfile({
          name: updatedProfile.name ?? '',
          email: updatedProfile.email ?? trimmedEmail,
          phone: updatedProfile.phone ?? '',
          location: updatedProfile.location ?? '',
          bio: updatedProfile.bio ?? '',
        });
      }

      setShowEditProfile(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      console.error('[ProfileScreen] Failed to update profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleVerificationRequest = () => {
    setShowVerificationModal(true);
  };

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('[ProfileScreen] Error logging out:', error);
            Alert.alert('Error', 'Failed to log out. Please try again.');
    }
        },
      },
    ]);
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
            <TouchableOpacity onPress={() => setShowEditProfile(false)} disabled={savingProfile}>
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.editForm}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editedProfile.name}
                placeholder="Name cannot be changed"
                editable={false}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={editedProfile.email}
                onChangeText={(text) => setEditedProfile((prev) => ({ ...prev, email: text }))}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!savingProfile}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone</Text>
              <TextInput
                style={styles.input}
                value={editedProfile.phone}
                onChangeText={(text) => setEditedProfile((prev) => ({ ...prev, phone: text }))}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                editable={!savingProfile}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <TextInput
                style={styles.input}
                value={editedProfile.location}
                onChangeText={(text) => setEditedProfile((prev) => ({ ...prev, location: text }))}
                placeholder="Enter your location"
                editable={!savingProfile}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={editedProfile.bio}
                onChangeText={(text) => setEditedProfile((prev) => ({ ...prev, bio: text }))}
                placeholder="Tell us about yourself"
                multiline
                numberOfLines={4}
                editable={!savingProfile}
              />
            </View>
            <TouchableOpacity
              style={[styles.saveButton, savingProfile && styles.saveButtonDisabled]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
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
                Alert.alert('Success', 'Verification request submitted. We will review your application within 24 hours.');
              }}
            >
              <Text style={styles.verifyButtonText}>Submit Request</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const formatStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const renderSaleItem = ({ item }: { item: SaleSummary }) => {
    const priceValue = item.amount ?? item.price ?? 0;
    const createdDate = item.createdAt ? new Date(item.createdAt) : null;
    const buyerId = item.buyerId;

    return (
    <View style={[styles.transactionCard, { backgroundColor: colors.card }]}>
      <View style={styles.transactionHeader}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>{item.productTitle}</Text>
          <Text style={[styles.transactionPrice, { color: colors.primary }]}>
            ₦{priceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionUserContainer}>
          <Text style={styles.transactionLabel}>Buyer: </Text>
            {buyerId ? (
              <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: buyerId })}>
            <Text style={styles.transactionUserName}>{item.buyerName}</Text>
          </TouchableOpacity>
            ) : (
              <Text style={styles.transactionUserName}>{item.buyerName}</Text>
            )}
        </View>
          <Text style={styles.transactionDate}>
            {createdDate ? createdDate.toLocaleDateString() : '—'}
          </Text>
      </View>
      <View style={styles.confirmationRow}>
        <View style={[styles.confirmChip, item.buyerConfirmed ? styles.confirmChipActive : styles.confirmChipInactive]}>
          <Ionicons
            name={item.buyerConfirmed ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={item.buyerConfirmed ? '#059669' : '#64748B'}
          />
          <Text style={[styles.confirmChipText, item.buyerConfirmed ? styles.confirmChipTextActive : styles.confirmChipTextInactive]}>
            Buyer Confirmed
          </Text>
        </View>
        <View style={[styles.confirmChip, item.sellerConfirmed ? styles.confirmChipActive : styles.confirmChipInactive]}>
          <Ionicons
            name={item.sellerConfirmed ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={item.sellerConfirmed ? '#059669' : '#64748B'}
          />
          <Text style={[styles.confirmChipText, item.sellerConfirmed ? styles.confirmChipTextActive : styles.confirmChipTextInactive]}>
            Seller Confirmed
          </Text>
        </View>
      </View>
      <View style={styles.transactionStatus}>
          <Text style={[styles.statusText, styles[`status${item.status}`] ?? styles.statusDefault]}>
            {formatStatus(item.status)}
        </Text>
        {item.status === 'pending' && !item.sellerConfirmed && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={async () => {
              const r = await confirmSellerDelivered(item.id)
              if (r.error) {
                Alert.alert('Confirm Delivery', r.error)
              } else {
                toast.show('Confirm Delivery', 'Delivery confirmed. Awaiting buyer confirmation.', 'success')
                setSales(prev => prev.map(s => s.id === item.id ? { ...s, sellerConfirmed: true } : s))
                try {
                  const res = await getSalesBySeller(user!.id, 100, 0, 'pending')
                  setSales(res.data ?? [])
                } catch {}
              }
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.confirmButtonText}>Confirm Delivered</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  };

  const renderPurchaseItem = ({ item }: { item: PurchaseSummary }) => {
    const priceValue = item.amount ?? item.price ?? 0;
    const createdDate = item.createdAt ? new Date(item.createdAt) : null;
    const sellerId = item.sellerId;

    return (
    <View style={[styles.transactionCard, { backgroundColor: colors.card }]}>
      <View style={styles.transactionHeader}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>{item.productTitle}</Text>
          <Text style={[styles.transactionPrice, { color: colors.primary }]}>
            ₦{priceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
      </View>
      <View style={styles.transactionDetails}>
        <View style={styles.transactionUserContainer}>
          <Text style={styles.transactionLabel}>Seller: </Text>
            {sellerId ? (
              <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: sellerId })}>
            <Text style={styles.transactionUserName}>{item.sellerName}</Text>
          </TouchableOpacity>
            ) : (
              <Text style={styles.transactionUserName}>{item.sellerName}</Text>
            )}
        </View>
          <Text style={styles.transactionDate}>
            {createdDate ? createdDate.toLocaleDateString() : '—'}
          </Text>
      </View>
      <View style={styles.confirmationRow}>
        <View style={[styles.confirmChip, item.buyerConfirmed ? styles.confirmChipActive : styles.confirmChipInactive]}>
          <Ionicons
            name={item.buyerConfirmed ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={item.buyerConfirmed ? '#059669' : '#64748B'}
          />
          <Text style={[styles.confirmChipText, item.buyerConfirmed ? styles.confirmChipTextActive : styles.confirmChipTextInactive]}>
            Buyer Confirmed
          </Text>
        </View>
        <View style={[styles.confirmChip, item.sellerConfirmed ? styles.confirmChipActive : styles.confirmChipInactive]}>
          <Ionicons
            name={item.sellerConfirmed ? 'checkmark-circle' : 'time-outline'}
            size={14}
            color={item.sellerConfirmed ? '#059669' : '#64748B'}
          />
          <Text style={[styles.confirmChipText, item.sellerConfirmed ? styles.confirmChipTextActive : styles.confirmChipTextInactive]}>
            Seller Confirmed
          </Text>
        </View>
      </View>
      <View style={styles.transactionStatus}>
          <Text style={[styles.statusText, styles[`status${item.status}`] ?? styles.statusDefault]}>
            {formatStatus(item.status)}
        </Text>
        {item.status === 'pending' && !item.buyerConfirmed && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={async () => {
              const r = await confirmBuyerReceived(item.id)
              if (r.error) {
                Alert.alert('Confirm Received', r.error)
              } else {
                toast.show('Confirm Received', 'Item received. Awaiting seller confirmation.', 'success')
                setPurchases(prev => prev.map(p => p.id === item.id ? { ...p, buyerConfirmed: true } : p))
                try {
                  const res = await getPurchasesByBuyer(user!.id, 100, 0, 'pending')
                  setPurchases(res.data ?? [])
                } catch {}
                setReviewContext({ sellerId: item.sellerId ?? null, productId: item.productId ?? null })
                setReviewSellerRating(0)
                setReviewProductRating(0)
                setReviewProductComment('')
                setShowReviewModal(true)
              }
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.confirmButtonText}>Confirm Received</Text>
          </TouchableOpacity>
        )}
        {(item.productId && (item.status === 'completed' || (item.buyerConfirmed && item.sellerConfirmed))) && (
          <TouchableOpacity
            style={[styles.addReviewButton, { borderColor: colors.border, backgroundColor: colors.card }]}
            onPress={() => {
              setReviewContext({ sellerId: item.sellerId ?? null, productId: item.productId ?? null })
              setReviewSellerRating(0)
              setReviewProductRating(0)
              setReviewProductComment('')
              setShowReviewModal(true)
            }}
          >
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={[styles.addReviewButtonText, { color: colors.primary }]}>Add Review</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'listings':
        return (
            <View style={styles.listingsContainer}>
              <View style={styles.listingsHeader}>
                <Text style={[styles.listingsTitle, { color: colors.text }]}>Active Listings</Text>
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => {
                    navigation.navigate('Main', {
                      screen: 'Sell'
                    });
                  }}
                >
                  <Text style={[styles.showMoreText, { color: colors.primary }]}>Show All</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              {listings.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="cube-outline" size={40} color={colors.muted} />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>No listings yet</Text>
                  <Text style={[styles.emptyStateSubtitle, { color: colors.muted }]}>Create your first listing to start selling.</Text>
                </View>
              ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listingsCarousel}
              >
                  {listingPreview.map((item) => {
                    const imageUrl = item.images?.[0] ?? 'https://placehold.co/400x500?text=CamPulse';
                    const priceValue = item.price ?? 0;
                    return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.listingCard, { backgroundColor: colors.card, borderColor: colors.border }, listingPreview.length === 1 ? styles.singleListingCard : null]}
                  onPress={() => navigation.navigate('ListingDetails', { listingId: item.id })}
                >
                      <Image source={{ uri: imageUrl }} style={[styles.listingImage, { backgroundColor: colors.surface }]} />
                  <View style={[styles.listingInfo, { backgroundColor: colors.card }]}>
                    <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
                        <Text style={[styles.listingPrice, { color: colors.primary }]}>
                          ₦{priceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </Text>
                  </View>
                </TouchableOpacity>
                  );
                })}
              </ScrollView>
              )}
            </View>
        );
      case 'sales':
        return (
          <View style={styles.transactionsContainer}>
            <View style={sales.length > 0 ? { maxHeight: 400 } : undefined}>
              <FlatList<SaleSummary>
                data={sales}
                renderItem={renderSaleItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.transactionsList}
                nestedScrollEnabled={true}
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="trending-up-outline" size={40} color="#94A3B8" />
                    <Text style={styles.emptyStateTitle}>No pending sales</Text>
                    <Text style={styles.emptyStateSubtitle}>Pending sales will appear here.</Text>
                  </View>
                }
              />
            </View>
            <TouchableOpacity
              style={styles.viewHistoryButton}
              onPress={() => navigation.navigate('TransactionHistory', { userId: user?.id, initialTab: 'sales' })}
            >
              <Text style={[styles.viewHistoryText, { color: colors.primary }]}>View Full History</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        );
      case 'purchases':
        return (
          <View style={styles.transactionsContainer}>
            <View style={purchases.length > 0 ? { maxHeight: 400 } : undefined}>
              <FlatList<PurchaseSummary>
                data={purchases}
                renderItem={renderPurchaseItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.transactionsList}
                nestedScrollEnabled={true}
                ListEmptyComponent={
                  <View style={styles.emptyStateContainer}>
                    <Ionicons name="cart-outline" size={40} color="#94A3B8" />
                    <Text style={styles.emptyStateTitle}>No pending purchases</Text>
                    <Text style={styles.emptyStateSubtitle}>Pending purchases will appear here.</Text>
                  </View>
                }
              />
            </View>
            <TouchableOpacity
              style={styles.viewHistoryButton}
              onPress={() => navigation.navigate('TransactionHistory', { userId: user?.id, initialTab: 'purchases' })}
            >
              <Text style={[styles.viewHistoryText, { color: colors.primary }]}>View Full History</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        );
    }
  };

  const renderReviewModal = () => (
    <Modal
      visible={showReviewModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReviewModal(false)}
    >
      <View style={[styles.centerOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.passCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Rate Seller & Product</Text>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={[styles.label, { color: colors.text }]}>Seller Rating</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setReviewSellerRating(n)}>
                  <Ionicons name={reviewSellerRating >= n ? 'star' : 'star-outline'} size={22} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Product Rating</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setReviewProductRating(n)}>
                  <Ionicons name={reviewProductRating >= n ? 'star' : 'star-outline'} size={22} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Product Comment</Text>
            <TextInput
              style={[styles.input, styles.bioInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="Share your experience with the product"
              placeholderTextColor={colors.muted}
              value={reviewProductComment}
              onChangeText={setReviewProductComment}
              multiline
            />
            <View style={[styles.actionRow]}>
              <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface }]} onPress={() => setShowReviewModal(false)}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  if (!user?.id || !reviewContext?.sellerId || !reviewContext?.productId) { Alert.alert('Review', 'Unable to submit review'); return }
                  if (reviewSellerRating < 1 || reviewProductRating < 1) { Alert.alert('Review', 'Please rate seller and product'); return }
                  try {
                    setSubmittingReview(true)
                    const res = await submitSellerReview({
                      reviewerId: user.id,
                      reviewedUserId: reviewContext.sellerId,
                      productId: reviewContext.productId,
                      rating: reviewSellerRating,
                      comment: undefined,
                    })
                    if (res.error) {
                      setSubmittingReview(false)
                      Alert.alert('Review', res.error)
                      return
                    }
                    const res2 = await submitProductReview({
                      reviewerId: user.id,
                      productId: reviewContext.productId,
                      rating: reviewProductRating,
                      comment: reviewProductComment.trim() || undefined,
                    })
                    setSubmittingReview(false)
                    if (res2.error) {
                      Alert.alert('Review', res2.error)
                      return
                    }
                    toast.show('Review', 'Thanks for your review', 'success')
                    setShowReviewModal(false)
                  } catch (e: any) {
                    setSubmittingReview(false)
                    Alert.alert('Review', e?.message || 'Failed to submit review')
                  }
                }}
                disabled={submittingReview}
              >
                {submittingReview ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.saveButtonText]}>Submit Review</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )

  if (loadingProfile || loadingStats || loadingLists) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const displayName =
    profile?.name ??
    user?.name ??
    (user as any)?.full_name ??
    user?.email ??
    MOCK_USER.name;
  const displayEmail = profile?.email ?? user?.email ?? MOCK_USER.email;
  const displayAvatar = profile?.avatar_url ?? MOCK_USER.avatar;
  const displayRating = profile?.rating ?? MOCK_USER.rating;
  const displayReviews = profile?.total_reviews ?? MOCK_USER.reviews;
  const isVerified = profile?.verified ?? profile?.verification_status === 'approved';
  const verificationStatus = profile?.verification_status ?? 'none';
  const joinedAt =
    profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString(undefined, {
          month: 'long',
          year: 'numeric',
        })
      : MOCK_USER.joinDate;
  const displayBio = profile?.bio ?? '';
  const displayPhone = profile?.phone ?? '';
  const displayLocation = profile?.location ?? '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={[1]} // Single item to render the sections
        renderItem={() => (
          <>
            {/* Profile Header */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: displayAvatar }} style={[styles.avatar, { borderColor: colors.card }]} />
                {isVerified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: colors.card }]}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  </View>
                )}
                <TouchableOpacity style={styles.avatarEditButton} onPress={async () => {
                  try {
                    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
                    if (perm.status !== 'granted') {
                      Alert.alert('Permission', 'Media library permission is required.');
                      return;
                    }
                    const res = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ImagePicker.MediaTypeOptions.Images,
                      quality: 0.8,
                    });
                    const uri = (res as any)?.assets?.[0]?.uri;
                    if (!uri) return;
                    if (!user?.id) {
                      Alert.alert('Error', 'User session not found. Please sign in again.');
                      return;
                    }
                    const { uploadAvatarImage } = await import('../services/storageService');
                    const up = await uploadAvatarImage(uri, user.id);
                    if (up.error || !up.url) {
                      Alert.alert('Error', up.error ?? 'Failed to upload avatar');
                      return;
                    }
                    const { data, error } = await upsertProfile({
                      id: user.id,
                      email: displayEmail ?? '',
                      name: profile?.name ?? user?.name ?? (user as any)?.full_name ?? displayEmail ?? 'User',
                      avatar_url: up.url,
                    });
                    if (error) {
                      Alert.alert('Error', error);
                      return;
                    }
                    const newProfile = data ?? (profile ? { ...profile, avatar_url: up.url } : null);
                    if (newProfile) setProfile(newProfile);
                    Alert.alert('Success', 'Profile photo updated.');
                  } catch (e: any) {
                    Alert.alert('Error', e?.message ?? 'Failed to update avatar');
                  }
                }}>
                  <Ionicons name="camera" size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.name, { color: colors.text }]}>{displayName}</Text>
              <Text style={[styles.email, { color: colors.muted }]}>{displayEmail}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color={colors.warning} />
                <Text style={[styles.rating, { color: colors.text }]}>{displayRating}</Text>
                <Text style={[styles.reviews, { color: colors.muted }]}>({displayReviews} reviews)</Text>
              </View>
              <Text style={[styles.joinDate, { color: colors.muted }]}>Member since {joinedAt}</Text>
              {displayLocation ? <Text style={[styles.location, { color: colors.muted }]}>{displayLocation}</Text> : null}
              {displayPhone ? <Text style={[styles.phone, { color: colors.muted }]}>{displayPhone}</Text> : null}
              {displayBio ? <Text style={[styles.bio, { color: colors.muted }]}>{displayBio}</Text> : null}
              <View style={styles.verificationContainer}>
                {isVerified ? (
                  <View style={[styles.verifiedStatus, { backgroundColor: colors.successMuted }]}>
                    <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                    <Text style={[styles.verifiedText, { color: colors.success }]}>Verified Seller</Text>
                  </View>
                ) : verificationStatus === 'pending' ? (
                  <View style={[styles.pendingStatus, { backgroundColor: colors.warningMuted }]}>
                    <Ionicons name="time-outline" size={16} color={colors.warning} />
                    <Text style={[styles.pendingText, { color: colors.warning } ]}>Verification in review</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[styles.verifyButton, { backgroundColor: colors.primary }]}
                    onPress={handleVerificationRequest}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                    <Text style={[styles.verifyButtonText, { color: '#FFFFFF' }]}>Get Verified</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity 
                style={[styles.editProfileButton, { backgroundColor: colors.surface }]}
                onPress={handleEditProfile}
              >
                <Ionicons name="pencil" size={16} color={colors.primary} />
                <Text style={[styles.editProfileText, { color: colors.primary }]}>Edit Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Stats Section */}
            <View style={[styles.statsContainer, { backgroundColor: colors.card }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.listings}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Listings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.sales}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Sales</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.text }]}>{stats.purchases}</Text>
                <Text style={[styles.statLabel, { color: colors.muted }]}>Purchases</Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'listings' ? { backgroundColor: colors.surface } : null]}
                onPress={() => setActiveTab('listings')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'listings' ? colors.primary : colors.muted }]}>
                  My Listings
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'sales' ? { backgroundColor: colors.surface } : null]}
                onPress={() => setActiveTab('sales')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'sales' ? colors.primary : colors.muted }]}>
                  Sales
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'purchases' ? { backgroundColor: colors.surface } : null]}
                onPress={() => setActiveTab('purchases')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'purchases' ? colors.primary : colors.muted }]}>
                  Purchases
                </Text>
              </TouchableOpacity>
            </View>

            {/* Content based on active tab */}
            {renderContent()}

            {/* Settings Section */}
            <View style={[styles.settingsContainer, { backgroundColor: colors.card }]}>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => setShowPasswordPrompt(true)}
              >
                <Ionicons name="card-outline" size={24} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>{profile?.bank_name && profile?.account_number ? `${profile.bank_name} • ${profile.account_number}` : 'Payment Details'}</Text>
                <Ionicons name="chevron-forward" size={24} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('Favorites')}
              >
                <Ionicons name="heart-outline" size={24} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Favorites</Text>
                <Ionicons name="chevron-forward" size={24} color={colors.muted} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('Settings')}
              >
                <Ionicons name="settings-outline" size={24} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Settings</Text>
                <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('PrivacySecurity')}
              >
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Privacy & Security</Text>
                <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('HelpSupport')}
              >
                <Ionicons name="help-circle-outline" size={24} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.settingItem}
                onPress={() => navigation.navigate('AdminDashboard')}
              >
                <Ionicons name="speedometer-outline" size={24} color={colors.text} />
                <Text style={[styles.settingText, { color: colors.text }]}>Admin Dashboard</Text>
                <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Logout Button */}
            <TouchableOpacity style={[styles.logoutButton, { backgroundColor: isDark ? colors.dangerMuted : colors.dangerMuted }]} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={colors.danger} />
              <Text style={[styles.logoutText, { color: colors.danger }]}>Log Out</Text>
            </TouchableOpacity>
          </>
        )}
        keyExtractor={() => 'profile-content'}
        showsVerticalScrollIndicator={false}
      />

      {renderEditProfileModal()}
      {renderVerificationModal()}
      {renderReviewModal()}
      <Modal
        visible={showPasswordPrompt}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPasswordPrompt(false)}
      >
        <View style={[styles.centerOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.passCard, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                <Text style={[styles.modalTitle, { color: colors.text }]}>Confirm Password</Text>
              </View>
              <TouchableOpacity onPress={() => setShowPasswordPrompt(false)} disabled={verifyingPassword}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Account Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={[styles.input, { flex: 1, borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={passwordInput}
                  secureTextEntry={!showPassword}
                  onChangeText={setPasswordInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                />
                <TouchableOpacity style={[styles.eyeIconSmall, { borderColor: colors.border, backgroundColor: colors.surface }]} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.surface }]}
                onPress={() => setShowPasswordPrompt(false)}
                disabled={verifyingPassword}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }, verifyingPassword && styles.saveButtonDisabled]}
                disabled={verifyingPassword}
                onPress={async () => {
                  if (!user?.email) { Alert.alert('Authentication', 'Sign in required'); return }
                  if (!passwordInput.trim()) { Alert.alert('Validation', 'Enter your password'); return }
                  try {
                    setVerifyingPassword(true)
                    const res = await verifyPasswordSignIn(user.email, passwordInput.trim())
                    setVerifyingPassword(false)
                    if (res.error) {
                      Alert.alert('Authentication', res.error.includes('Invalid login credentials') ? 'Invalid password' : res.error)
                      return
                    }
                    setShowPasswordPrompt(false)
                    setPasswordInput('')
                    setShowPassword(false)
                    setShowPaymentModal(true)
                  } catch (e: any) {
                    setVerifyingPassword(false)
                    Alert.alert('Authentication', e?.message || 'Failed to verify password')
                  }
                }}
              >
                {verifyingPassword ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Verify</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Payment Details</Text>
              <TouchableOpacity onPress={() => { setShowBankSuggestions(false); setShowPaymentModal(false) }} disabled={savingRecipient}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.editForm}>
              <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Bank</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                value={bankQuery}
                onChangeText={(v) => {
                  setBankQuery(v);
                  setShowBankSuggestions(!!v.trim());
                  const match = banks.find(b => b.name.toLowerCase() === v.toLowerCase());
                  if (match) setBankCode(match.code);
                }}
                placeholder="Type bank name"
                placeholderTextColor={colors.muted}
              />
              {!!bankQuery.trim() && showBankSuggestions && (
                <View style={[styles.suggestionBox, { borderColor: colors.border }]}>
                  <ScrollView style={{ maxHeight: 220 }}>
                    {banks
                      .filter(b => b.name.toLowerCase().includes(bankQuery.toLowerCase()))
                      .map((b) => (
                        <TouchableOpacity
                          key={b.code}
                          style={[styles.suggestionRow, { borderBottomColor: colors.border }]}
                          onPress={() => {
                            setBankCode(b.code);
                            setBankQuery(b.name);
                            setShowBankSuggestions(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.bankName, { color: colors.text }]}>{b.name}</Text>
                          {bankCode === b.code && (
                            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Account Number</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={accountNumber}
                  onChangeText={setAccountNumber}
                  placeholder="10-digit account number"
                  placeholderTextColor={colors.muted}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Account Name</Text>
                <TextInput
                  style={[styles.input, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="Account holder name"
                  placeholderTextColor={colors.muted}
                />
              </View>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }, savingRecipient && styles.saveButtonDisabled]}
                onPress={async () => {
                  if (!bankCode.trim() || !accountNumber.trim() || !accountName.trim()) {
                    Alert.alert('Validation', 'Please fill all payment details');
                    return;
                  }
                  if (!user?.id) { Alert.alert('Authentication', 'Please sign in'); return }
                  try {
                    setSavingRecipient(true)
                    const res = await registerPaystackRecipient({
                      userId: user.id,
                      bankCode,
                      accountNumber,
                      accountName,
                    })
                    setSavingRecipient(false)
                    if (res.error) {
                      Alert.alert('Payment Details', res.error)
                    } else {
                      Alert.alert('Payment Details', 'Recipient saved successfully')
                      try {
                        const refreshed = await getProfileById(user.id)
                        if (!refreshed.error) setProfile(refreshed.data)
                      } catch {}
                      setShowBankSuggestions(false)
                      setShowPaymentModal(false)
                    }
                  } catch (e: any) {
                    setSavingRecipient(false)
                    Alert.alert('Payment Details', e?.message || 'Failed to save recipient')
                  }
                }}
                disabled={savingRecipient}
              >
                {savingRecipient ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save Payment Details</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatarEditButton: {
    position: 'absolute',
    right: 4,
    top: 4,
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 6,
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
  location: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  phone: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
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
  pendingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pendingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D97706',
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
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
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
    width: 220,
  },
  singleListingCard: {
    width: '92%',
    alignSelf: 'center',
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
  confirmationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  confirmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  confirmChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  confirmChipInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  confirmChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmChipTextActive: {
    color: '#059669',
  },
  confirmChipTextInactive: {
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
  statusrefunded: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
  },
  statusDefault: {
    backgroundColor: '#E2E8F0',
    color: '#475569',
  },
  confirmButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-end',
    gap: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  addReviewButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-end',
    gap: 6,
    borderWidth: 1,
  },
  addReviewButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  viewHistoryText: {
    fontSize: 14,
    fontWeight: '600',
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
  centerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  passCard: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionBox: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 8,
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eyeIconSmall: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  primaryButton: {
    backgroundColor: '#4338CA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButton: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#1E293B',
    fontWeight: '600',
    fontSize: 14,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bankName: {
    fontSize: 14,
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
  saveButtonDisabled: {
    opacity: 0.6,
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
