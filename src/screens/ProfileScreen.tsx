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
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
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
} from '../services/transactionService';

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
  const { signOut, user } = useAuth();
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

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
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

        if (listingsRes.error) {
          console.warn('[ProfileScreen] Failed to count listings:', listingsRes.error);
        }
        if (salesRes.error) {
          console.warn('[ProfileScreen] Failed to count sales:', salesRes.error);
        }
        if (purchasesRes.error) {
          console.warn('[ProfileScreen] Failed to count purchases:', purchasesRes.error);
        }

        setStats({
          listings: listingsRes.count ?? 0,
          sales: salesRes.count ?? 0,
          purchases: purchasesRes.count ?? 0,
        });
      } catch (error) {
        if (!isMounted) return;
        console.error('[ProfileScreen] Unexpected error loading stats:', error);
        setStats({ listings: 0, sales: 0, purchases: 0 });
      } finally {
        if (isMounted) {
          setLoadingStats(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  useEffect(() => {
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
          getSalesBySeller(user.id, 20),
          getPurchasesByBuyer(user.id, 20),
        ]);

        if (!isMounted) return;

        if (listingsRes.error) {
          console.warn('[ProfileScreen] Failed to fetch listings:', listingsRes.error);
        }
        if (salesRes.error) {
          console.warn('[ProfileScreen] Failed to fetch sales:', salesRes.error);
        }
        if (purchasesRes.error) {
          console.warn('[ProfileScreen] Failed to fetch purchases:', purchasesRes.error);
        }

        setListings(listingsRes.data ?? []);
        setSales(salesRes.data ?? []);
        setPurchases(purchasesRes.data ?? []);
      } catch (error) {
        if (!isMounted) return;
        console.error('[ProfileScreen] Unexpected error loading lists:', error);
        setListings([]);
        setSales([]);
        setPurchases([]);
      } finally {
        if (isMounted) {
          setLoadingLists(false);
        }
      }
    };

    loadLists();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

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
                onChangeText={(text) => setEditedProfile((prev) => ({ ...prev, name: text }))}
                placeholder="Enter your name"
                editable={!savingProfile}
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
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
          <Text style={styles.transactionTitle}>{item.productTitle}</Text>
          <Text style={styles.transactionPrice}>
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
      <View style={styles.transactionStatus}>
          <Text style={[styles.statusText, styles[`status${item.status}`] ?? styles.statusDefault]}>
            {formatStatus(item.status)}
        </Text>
      </View>
    </View>
  );
  };

  const renderPurchaseItem = ({ item }: { item: PurchaseSummary }) => {
    const priceValue = item.amount ?? item.price ?? 0;
    const createdDate = item.createdAt ? new Date(item.createdAt) : null;
    const sellerId = item.sellerId;

    return (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
          <Text style={styles.transactionTitle}>{item.productTitle}</Text>
          <Text style={styles.transactionPrice}>
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
      <View style={styles.transactionStatus}>
          <Text style={[styles.statusText, styles[`status${item.status}`] ?? styles.statusDefault]}>
            {formatStatus(item.status)}
        </Text>
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
            {listings.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="cube-outline" size={40} color="#94A3B8" />
                <Text style={styles.emptyStateTitle}>No listings yet</Text>
                <Text style={styles.emptyStateSubtitle}>Create your first listing to start selling.</Text>
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
                  style={[styles.listingCard, listingPreview.length === 1 ? styles.singleListingCard : null]}
                  onPress={() => navigation.navigate('ListingDetails', { listingId: item.id })}
                >
                      <Image source={{ uri: imageUrl }} style={styles.listingImage} />
                  <View style={styles.listingInfo}>
                    <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.listingPrice}>
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
            <FlatList<SaleSummary>
              data={sales}
              renderItem={renderSaleItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.transactionsList}
              ListEmptyComponent={
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="trending-up-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No sales yet</Text>
                  <Text style={styles.emptyStateSubtitle}>Completed sales will appear here.</Text>
                </View>
              }
            />
          </View>
        );
      case 'purchases':
        return (
          <View style={styles.transactionsContainer}>
            <FlatList<PurchaseSummary>
              data={purchases}
              renderItem={renderPurchaseItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.transactionsList}
              ListEmptyComponent={
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="cart-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No purchases yet</Text>
                  <Text style={styles.emptyStateSubtitle}>Your purchases will appear here.</Text>
                </View>
              }
            />
          </View>
        );
    }
  };

  if (loadingProfile || loadingStats || loadingLists) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4338CA" />
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
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[1]} // Single item to render the sections
        renderItem={() => (
          <>
            {/* Profile Header */}
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: displayAvatar }} style={styles.avatar} />
                {isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
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
                  <Ionicons name="camera" size={16} color="#4338CA" />
                </TouchableOpacity>
              </View>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{displayEmail}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.rating}>{displayRating}</Text>
                <Text style={styles.reviews}>({displayReviews} reviews)</Text>
              </View>
              <Text style={styles.joinDate}>Member since {joinedAt}</Text>
              {displayLocation ? <Text style={styles.location}>{displayLocation}</Text> : null}
              {displayPhone ? <Text style={styles.phone}>{displayPhone}</Text> : null}
              {displayBio ? <Text style={styles.bio}>{displayBio}</Text> : null}
              <View style={styles.verificationContainer}>
                {isVerified ? (
                  <View style={styles.verifiedStatus}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.verifiedText}>Verified Seller</Text>
                  </View>
                ) : verificationStatus === 'pending' ? (
                  <View style={styles.pendingStatus}>
                    <Ionicons name="time-outline" size={16} color="#F59E0B" />
                    <Text style={styles.pendingText}>Verification in review</Text>
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
                <Text style={styles.statValue}>{stats.listings}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.sales}</Text>
                <Text style={styles.statLabel}>Sales</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{stats.purchases}</Text>
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