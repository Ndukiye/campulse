import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabNavigationProp, RootStackNavigationProp, Product, MainTabParamList } from '../types/navigation';
import { useRoute, RouteProp } from '@react-navigation/native';

type BrowseScreenProps = {
  navigation: MainTabNavigationProp & RootStackNavigationProp;
};

type FilterOptions = {
  priceRange: {
    min: number;
    max: number;
  };
  sellerType: 'all' | 'verified' | 'unverified';
  condition: 'all' | 'new' | 'like-new' | 'good' | 'fair';
};

// Mock data for products
const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Textbook: Introduction to Computer Science',
    price: 45000,
    image: 'https://picsum.photos/400/500',
    category: 'Books',
    condition: 'Like New',
    sellerVerified: true,
  },
  {
    id: '2',
    title: 'Scientific Calculator',
    price: 15000,
    image: 'https://picsum.photos/400/501',
    category: 'Electronics',
    condition: 'Good',
    sellerVerified: false,
  },
  {
    id: '3',
    title: 'Dorm Room Chair',
    price: 25000,
    image: 'https://picsum.photos/400/502',
    category: 'Furniture',
    condition: 'Like New',
    sellerVerified: true,
  },
  {
    id: '4',
    title: 'Chemistry Lab Kit',
    price: 35000,
    image: 'https://picsum.photos/400/503',
    category: 'Other',
    condition: 'Good',
    sellerVerified: false,
  },
];

const categories = ['All', 'Books', 'Electronics', 'Furniture', 'Clothing', 'Other'];

const BrowseScreen = ({ navigation }: BrowseScreenProps) => {
  const route = useRoute<RouteProp<MainTabParamList, 'Browse'>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    priceRange: { min: 0, max: 1000000 },
    sellerType: 'all',
    condition: 'all',
  });

  // Handle incoming search query and category from navigation
  useEffect(() => {
    if (route.params?.searchQuery) {
      setSearchQuery(route.params.searchQuery);
    }
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    }
  }, [route.params]);

  // Filter products based on search, category, and filters
  const filteredProducts = useMemo(() => {
    return mockProducts.filter(product => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase());

      // Category filter
      const matchesCategory = selectedCategory === 'All' || 
        product.category === selectedCategory;

      // Price range filter
      const matchesPrice = product.price >= filters.priceRange.min && 
        product.price <= filters.priceRange.max;

      // Seller type filter
      const matchesSeller = filters.sellerType === 'all' || 
        (filters.sellerType === 'verified' && product.sellerVerified) ||
        (filters.sellerType === 'unverified' && !product.sellerVerified);

      // Condition filter
      const matchesCondition = filters.condition === 'all' || 
        product.condition.toLowerCase() === filters.condition;

      return matchesSearch && matchesCategory && matchesPrice && matchesSeller && matchesCondition;
    });
  }, [searchQuery, selectedCategory, filters]);

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ListingDetails', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.productPrice}>₦{item.price.toLocaleString()}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.productCondition}>{item.condition}</Text>
          {item.sellerVerified && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.priceInputs}>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <TextInput
                    style={styles.priceTextInput}
                    placeholder="₦0"
                    keyboardType="numeric"
                    value={filters.priceRange.min.toString()}
                    onChangeText={(text) => setFilters({
                      ...filters,
                      priceRange: { ...filters.priceRange, min: Number(text) || 0 }
                    })}
                  />
                </View>
                <View style={styles.priceInput}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <TextInput
                    style={styles.priceTextInput}
                    placeholder="₦1,000,000"
                    keyboardType="numeric"
                    value={filters.priceRange.max.toString()}
                    onChangeText={(text) => setFilters({
                      ...filters,
                      priceRange: { ...filters.priceRange, max: Number(text) || 0 }
                    })}
                  />
                </View>
              </View>
            </View>

            {/* Seller Type */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Seller Type</Text>
              <View style={styles.filterOptions}>
                {['all', 'verified', 'unverified'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.filterOption,
                      filters.sellerType === type && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters({ ...filters, sellerType: type as FilterOptions['sellerType'] })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.sellerType === type && styles.filterOptionTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Condition */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Condition</Text>
              <View style={styles.filterOptions}>
                {['all', 'new', 'like-new', 'good', 'fair'].map((condition) => (
                  <TouchableOpacity
                    key={condition}
                    style={[
                      styles.filterOption,
                      filters.condition === condition && styles.filterOptionActive,
                    ]}
                    onPress={() => setFilters({ ...filters, condition: condition as FilterOptions['condition'] })}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        filters.condition === condition && styles.filterOptionTextActive,
                      ]}
                    >
                      {condition.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setFilters({
                priceRange: { min: 0, max: 1000000 },
                sellerType: 'all',
                condition: 'all',
              })}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={() => setShowFilters(false)}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Browse</Text>
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

      {/* Search Bar with Filter */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6366F1" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94A3B8"
          />
        </View>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Ionicons name="options-outline" size={24} color="#6366F1" />
        </TouchableOpacity>
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(item)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === item && styles.categoryButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        />
      </View>

      {/* Product Grid */}
      <FlatList
        data={filteredProducts}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productsGrid}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyStateText}>No products found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />

      {renderFilterModal()}
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
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
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
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  categoriesWrapper: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    marginBottom: 16,
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 25,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  categoryButtonText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  productsGrid: {
    padding: 8,
  },
  productCard: {
    flex: 1,
    margin: 8,
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
  productImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
    lineHeight: 20,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 4,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productCondition: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  filterContent: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  priceTextInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: '#1E293B',
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
});

export default BrowseScreen; 