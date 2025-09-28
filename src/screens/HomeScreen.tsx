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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MainTabNavigationProp } from '../types/navigation';
import { APP_CATEGORIES, AppCategory } from '../constants/categories';

// Mock data for development
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
    title: 'Pencils',
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

  const renderCategoryItem = (category: AppCategory) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryItem}
      onPress={() => navigation.navigate('Browse', { category: category.name })}
    >
      <Ionicons name={category.icon} size={24} color="#6366F1" />
      <Text style={styles.categoryText}>{category.name}</Text>
    </TouchableOpacity>
  );

  const renderFeaturedListing = (listing: typeof FEATURED_LISTINGS[0]) => (
    <TouchableOpacity
      key={listing.id}
      style={styles.productCard}
      onPress={() => navigation.navigate('ListingDetails', { listingId: listing.id })}
    >
      <Image source={{ uri: listing.image }} style={styles.productImage} />
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
            style={styles.headerButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={22} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

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

      <FlatList
        data={[1]} // Single item to render the sections
        renderItem={() => (
          <>
            {/* Categories */}
            <View style={styles.categoriesContainer}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {APP_CATEGORIES.map(renderCategoryItem)}
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
          </>
        )}
        keyExtractor={() => 'home-content'}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    height: 44,
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
    height: 44,
    fontSize: 15,
    color: '#1E293B',
  },
  categoriesContainer: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    paddingVertical: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
    marginBottom: 12,
    color: '#1E293B',
  },
  categoryItem: {
    alignItems: 'center',
    marginHorizontal: 10,
    width: 70,
    paddingVertical: 8,
  },
  categoryText: {
    marginTop: 4,
    fontSize: 11,
    textAlign: 'center',
    color: '#1E293B',
  },
  featuredContainer: {
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 12,
    paddingLeft: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  productCard: {
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
    width: 200,
  },
  productImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
  },
  featuredInfo: {
    padding: 12,
  },
  featuredTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  featuredPrice: {
    fontSize: 14,
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
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 11,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  featuredLocation: {
    fontSize: 11,
    color: '#475569',
  },
  justInContainer: {
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 12,
    paddingLeft: 16,
    paddingBottom: 20,
    backgroundColor: '#fff',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  popularContainer: {
    marginTop: 8,
    marginBottom: 24,
    paddingTop: 12,
    paddingLeft: 16,
    paddingBottom: 20,
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
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingTop: 40,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
  },
  headerIcon: {
    marginLeft: 16,
    padding: 4,
  },
});

export default HomeScreen; 