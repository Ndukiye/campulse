import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MainTabNavigationProp } from '../types/navigation';

// Mock data for development
const CATEGORIES = [
  { id: '1', name: 'Textbooks', icon: 'book' },
  { id: '2', name: 'Electronics', icon: 'laptop' },
  { id: '3', name: 'Dorm & Home', icon: 'home' },
  { id: '4', name: 'Fashion', icon: 'shirt' },
  { id: '5', name: 'Sports', icon: 'basketball' },
  { id: '6', name: 'Tickets', icon: 'ticket' },
  { id: '7', name: 'Services', icon: 'construct' },
  { id: '8', name: 'Other', icon: 'apps' },
];

const FEATURED_LISTINGS = [
  {
    id: '1',
    title: 'Calculus Textbook',
    price: 45000,
    image: 'https://picsum.photos/200/300',
    seller: 'JohnD',
    location: 'Near Library',
    condition: 'Like New',
    sellerVerified: true,
  },
  {
    id: '2',
    title: 'MacBook Pro 2020',
    price: 1200000,
    image: 'https://picsum.photos/200/301',
    seller: 'SarahM',
    location: 'Engineering Building',
    condition: 'Good',
    sellerVerified: true,
  },
  {
    id: '3',
    title: 'Dorm Room Chair',
    price: 25000,
    image: 'https://picsum.photos/200/302',
    seller: 'MikeR',
    location: 'Student Housing',
    condition: 'Like New',
    sellerVerified: false,
  },
  {
    id: '4',
    title: 'Chemistry Lab Kit',
    price: 35000,
    image: 'https://picsum.photos/200/303',
    seller: 'LisaK',
    location: 'Science Building',
    condition: 'Good',
    sellerVerified: true,
  },
];

const HomeScreen = () => {
  const navigation = useNavigation<MainTabNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigation.navigate('Browse', { searchQuery: searchQuery.trim() });
    }
  };

  const renderCategoryItem = (category: typeof CATEGORIES[0]) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryItem}
      onPress={() => navigation.navigate('Browse', { category: category.name })}
    >
      <Ionicons name={category.icon as any} size={24} color="#6366F1" />
      <Text style={styles.categoryText}>{category.name}</Text>
    </TouchableOpacity>
  );

  const renderFeaturedListing = (listing: typeof FEATURED_LISTINGS[0]) => (
    <TouchableOpacity
      key={listing.id}
      style={styles.featuredItem}
      onPress={() => navigation.navigate('ListingDetails', { listingId: listing.id })}
    >
      <Image source={{ uri: listing.image }} style={styles.featuredImage} />
      <View style={styles.featuredInfo}>
        <Text style={styles.featuredTitle} numberOfLines={2}>
          {listing.title}
        </Text>
        <Text style={styles.featuredPrice}>₦{listing.price.toLocaleString()}</Text>
        <View style={styles.featuredMeta}>
          <Text style={styles.featuredCondition}>{listing.condition}</Text>
          {listing.sellerVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <Text style={styles.featuredLocation}>{listing.location}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>CamPulse</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Profile')}
          >
            <Ionicons name="person-circle-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6366F1" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for textbooks, furniture, electronics..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map(renderCategoryItem)}
          </ScrollView>
        </View>

        {/* Featured Listings */}
        <View style={styles.featuredContainer}>
          <Text style={styles.sectionTitle}>Featured Listings</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FEATURED_LISTINGS.map(renderFeaturedListing)}
          </ScrollView>
        </View>

        {/* Just In Section */}
        <View style={styles.justInContainer}>
          <Text style={styles.sectionTitle}>Just In</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FEATURED_LISTINGS.map(renderFeaturedListing)}
          </ScrollView>
        </View>

        {/* Popular Near You */}
        <View style={styles.popularContainer}>
          <Text style={styles.sectionTitle}>Popular Near You</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FEATURED_LISTINGS.map(renderFeaturedListing)}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 48,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: '#1E293B',
  },
  categoriesContainer: {
    marginVertical: 8,
    backgroundColor: '#fff',
    paddingVertical: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    marginBottom: 16,
    color: '#1E293B',
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 12,
    width: 80,
  },
  categoryText: {
    marginTop: 4,
    fontSize: 12,
    textAlign: 'center',
    color: '#1E293B',
  },
  featuredContainer: {
    marginVertical: 8,
    marginTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  featuredItem: {
    width: 200,
    marginLeft: 16,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuredImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 20,
  },
  featuredPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 4,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  featuredCondition: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  featuredLocation: {
    fontSize: 12,
    color: '#64748B',
  },
  justInContainer: {
    marginVertical: 8,
    marginTop: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  popularContainer: {
    marginVertical: 8,
    marginTop: 16,
    marginBottom: 32,
    paddingBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
    padding: 4,
  },
});

export default HomeScreen; 