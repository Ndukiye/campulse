import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Image,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { RootStackNavigationProp, RootStackParamList } from '../types/navigation'
import type { ProfilesRow } from '../types/database'
import { getProfileById } from '../services/profileService'
import { countProductsBySeller, getProductsBySeller, type ProductSummary } from '../services/productService'

const SellerProfileScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>()
  const route = useRoute<RouteProp<RootStackParamList, 'SellerProfile'>>()
  const sellerId = route.params.userId

  const [profile, setProfile] = useState<ProfilesRow | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [listingsCount, setListingsCount] = useState(0)
  const [listings, setListings] = useState<ProductSummary[]>([])
  const [listingsLoading, setListingsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const loadProfile = async () => {
      setProfileLoading(true)
      try {
        const res = await getProfileById(sellerId)
        if (!mounted) return
        if (res.error) setProfileError(res.error)
        setProfile(res.data ?? null)
      } catch (e: any) {
        if (!mounted) return
        setProfileError(e?.message || 'Failed to load profile')
      } finally {
        if (mounted) setProfileLoading(false)
      }
    }
    loadProfile()
    return () => { mounted = false }
  }, [sellerId])

  useEffect(() => {
    let mounted = true
    const loadListings = async () => {
      setListingsLoading(true)
      try {
        const [countRes, listingsRes] = await Promise.all([
          countProductsBySeller(sellerId),
          getProductsBySeller(sellerId, 20),
        ])
        if (!mounted) return
        if (countRes.error) console.warn('[SellerProfile] listings count error:', countRes.error)
        if (listingsRes.error) console.warn('[SellerProfile] listings fetch error:', listingsRes.error)
        setListingsCount(countRes.count ?? 0)
        setListings(listingsRes.data ?? [])
      } catch (e) {
        if (!mounted) return
        setListingsCount(0)
        setListings([])
      } finally {
        if (mounted) setListingsLoading(false)
      }
    }
    loadListings()
    return () => { mounted = false }
  }, [sellerId])

  const displayName = profile?.name ?? profile?.email ?? '—'
  const displayAvatar = profile?.avatar_url ?? 'https://placehold.co/200x200?text=User'
  const displayRating = profile?.rating ?? '—'
  const displayReviews = profile?.total_reviews ?? 0
  const isVerified = profile?.verified ?? profile?.verification_status === 'approved'
  const joinedAt = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '—'

  if (profileLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4338CA" />
      </SafeAreaView>
    )
  }

  if (profileError || !profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
        <Text style={styles.errorText}>{profileError ?? 'Seller profile not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  const renderListingItem = ({ item }: { item: ProductSummary }) => {
    const imageUrl = item.images?.[0] ?? 'https://placehold.co/400x500?text=CamPulse'
    const priceValue = item.price ?? 0
    return (
      <TouchableOpacity
        style={styles.listingCard}
        onPress={() => navigation.navigate('ListingDetails', { listingId: item.id })}
      >
        <Image source={{ uri: imageUrl }} style={styles.listingImage} />
        <View style={styles.listingInfo}>
          <Text style={styles.listingTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.listingPrice}>₦{priceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[1]}
        renderItem={() => (
          <>
            <View style={styles.header}>
              <View style={styles.avatarContainer}>
                <Image source={{ uri: displayAvatar }} style={styles.avatar} />
                {isVerified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                )}
              </View>
              <Text style={styles.name}>{displayName}</Text>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={16} color="#F59E0B" />
                <Text style={styles.rating}>{displayRating}</Text>
                <Text style={styles.reviews}>({displayReviews} reviews)</Text>
              </View>
              <Text style={styles.joinDate}>Member since {joinedAt}</Text>
              <View style={styles.verificationContainer}>
                {isVerified ? (
                  <View style={styles.verifiedStatus}>
                    <Ionicons name="shield-checkmark" size={16} color="#10B981" />
                    <Text style={styles.verifiedText}>Verified Seller</Text>
                  </View>
                ) : (
                  <View style={styles.pendingStatus}>
                    <Ionicons name="shield-outline" size={16} color="#64748B" />
                    <Text style={styles.pendingText}>Not Verified</Text>
                  </View>
                )}
              </View>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.messageButton}
                  onPress={() => navigation.navigate('Chat', { userId: sellerId })}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
                  <Text style={styles.messageButtonText}>Message Seller</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{listingsCount}</Text>
                <Text style={styles.statLabel}>Listings</Text>
              </View>
            </View>

            <View style={styles.listingsContainer}>
              <View style={styles.listingsHeader}>
                <Text style={styles.listingsTitle}>Active Listings</Text>
              </View>
              {listingsLoading ? (
                <View style={styles.emptyStateContainer}>
                  <ActivityIndicator size="small" color="#4338CA" />
                </View>
              ) : listings.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                  <Ionicons name="cube-outline" size={40} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No listings yet</Text>
                  <Text style={styles.emptyStateSubtitle}>This seller has no active listings.</Text>
                </View>
              ) : (
                <FlatList
                  data={listings}
                  renderItem={renderListingItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 8 }}
                  contentContainerStyle={{ paddingBottom: 16 }}
                />
              )}
            </View>
          </>
        )}
        keyExtractor={() => 'seller-profile-content'}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  errorText: { marginTop: 10, fontSize: 16, color: 'red', textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: '#6366F1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  header: { alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingTop: 40 },
  avatarContainer: { position: 'relative', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#FFFFFF' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 2 },
  name: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  rating: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginLeft: 4 },
  reviews: { fontSize: 14, color: '#64748B', marginLeft: 4 },
  joinDate: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  verificationContainer: { marginBottom: 12 },
  verifiedStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  verifiedText: { fontSize: 14, fontWeight: '500', color: '#059669', marginLeft: 4 },
  pendingStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  pendingText: { fontSize: 14, fontWeight: '500', color: '#475569', marginLeft: 4 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  messageButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#6366F1', gap: 8, paddingHorizontal: 16 },
  messageButtonText: { fontSize: 16, fontWeight: '600', color: '#6366F1' },
  statsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 16, marginTop: 12, borderRadius: 12, marginHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#1E293B', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#64748B' },
  listingsContainer: { paddingHorizontal: 8, paddingTop: 8 },
  listingsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  listingsTitle: { fontSize: 18, fontWeight: '600', color: '#1E293B' },
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyStateTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginTop: 8 },
  emptyStateSubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 24, marginTop: 4 },
  listingCard: { backgroundColor: '#FFFFFF', borderRadius: 12, marginBottom: 16, marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5, overflow: 'hidden', width: '47%' },
  listingImage: { width: '100%', height: 200, backgroundColor: '#F1F5F9', resizeMode: 'cover' },
  listingInfo: { padding: 12 },
  listingTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  listingPrice: { fontSize: 16, fontWeight: 'bold', color: '#4338CA', marginBottom: 8 },
})

export default SellerProfileScreen
