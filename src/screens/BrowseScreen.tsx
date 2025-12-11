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
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MainTabNavigationProp, RootStackNavigationProp, MainTabParamList } from '../types/navigation';
import { useRoute, RouteProp } from '@react-navigation/native';
import { APP_CATEGORIES } from '../constants/categories';
import { searchProducts, type ProductSummary } from '../services/productService';
import { useThemeMode } from '../context/ThemeContext';

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

// Generate categories for the filter list dynamically
const browseScreenCategories = ['All', ...APP_CATEGORIES.map(cat => cat.name)];

const BrowseScreen = ({ navigation }: BrowseScreenProps) => {
  const route = useRoute<RouteProp<MainTabParamList, 'Browse'>>();
  const { colors } = useThemeMode();
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
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 24;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadProducts = async () => {
    setLoading(true);
    setPage(0);
    const res = await searchProducts({
      category: selectedCategory,
      searchQuery,
      minPrice: filters.priceRange.min,
      maxPrice: filters.priceRange.max,
      condition: filters.condition === 'all' ? 'all' : (filters.condition as any),
      sortBy,
      page: 0,
      pageSize: PAGE_SIZE,
    });
    const rows = res.data ?? [];
    setProducts(rows);
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await searchProducts({
      category: selectedCategory,
      searchQuery,
      minPrice: filters.priceRange.min,
      maxPrice: filters.priceRange.max,
      condition: filters.condition === 'all' ? 'all' : (filters.condition as any),
      sortBy,
      page: nextPage,
      pageSize: PAGE_SIZE,
    });
    const rows = res.data ?? [];
    setProducts((prev) => prev.concat(rows));
    setPage(nextPage);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedCategory, filters, sortBy]);

  const renderProductItem = ({ item }: { item: ProductSummary }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => navigation.navigate('ListingDetails', { listingId: item.id })}
    >
      <Image 
        source={{ uri: item.images?.[0] ?? 'https://placehold.co/400x500?text=CamPulse' }} 
        style={styles.productImage}
        resizeMode="cover"
      />
      <View style={styles.productInfo}>
        <Text style={[styles.productTitle, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.productPrice, { color: colors.primary }]}>₦{(item.price ?? 0).toLocaleString()}</Text>
        <View style={styles.productMeta}>
          <Text style={[styles.productCondition, { color: colors.muted }]}>{String(item.condition ?? '').replace('-', ' ')}</Text>
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
          <View style={styles.filterSection}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Ionicons name="close" size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterContent}>
              {/* Price Range */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Price Range</Text>
                <View style={styles.priceInputs}>
                  <View style={styles.priceInput}>
                    <Text style={styles.priceLabel}>Min</Text>
                    <TextInput
                      style={styles.priceField}
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
                      style={styles.priceField}
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
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Seller Type</Text>
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
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Condition</Text>
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

              {/* Sort By */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterGroupTitle}>Sort By</Text>
                <View style={styles.filterOptions}>
                  {[
                    { key: 'newest', label: 'Newest' },
                    { key: 'price_asc', label: 'Price Low to High' },
                    { key: 'price_desc', label: 'Price High to Low' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.filterOption,
                        sortBy === (opt.key as any) && styles.filterOptionActive,
                      ]}
                      onPress={() => setSortBy(opt.key as any)}
                    >
                      <Text
                        style={[
                          styles.filterOptionText,
                          sortBy === (opt.key as any) && styles.filterOptionTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterActions}>
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
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }] }>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>Browse</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Messages')}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Cart')}
          >
            <Ionicons name="cart-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search and Filters */}
      <View style={[styles.searchFilterContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }] }>
        <View style={[styles.searchContainer, { backgroundColor: colors.background }] }>
          <Ionicons name="search" size={18} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search listings..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilters(true)}>
          <Ionicons name="options-outline" size={20} color="#6366F1" />
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>

      {/* Category Selector */}
      <View style={[styles.categoriesWrapper, { backgroundColor: colors.card }] }>
        <FlatList
          horizontal
          data={browseScreenCategories}
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
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      ) : (
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.productList}
        onEndReachedThreshold={0.5}
        onEndReached={loadMore}
        ListFooterComponent={
          loadingMore ? (
            <View style={{ paddingVertical: 16 }}>
              <ActivityIndicator size="small" color="#6366F1" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyStateText}>No products found</Text>
            <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
          </View>
        }
      />
      )}

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
  searchFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginRight: 8,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#1E293B',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    height: 40,
  },
  filterButtonText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '500',
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
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  productList: {
    paddingHorizontal: 8,
    paddingTop: 8,
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
    width: '47%',
  },
  productImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
  },
  productInfo: {
    padding: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4338CA',
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCondition: {
    fontSize: 12,
    color: '#64748B',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 2,
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
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    height: '80%',
    display: 'flex',
    flexDirection: 'column',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 12,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  filterContent: {
    flex: 1,
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 16,
  },
  filterGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  priceInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    marginRight: 8,
  },
  priceLabel: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 4,
  },
  priceField: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1E293B',
    height: 40,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterOptionActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  filterOptionText: {
    fontSize: 13,
    fontWeight: '500',
  },
  filterOptionTextActive: {
    fontSize: 13,
    fontWeight: '600',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 'auto',
  },
  resetButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginRight: 8,
  },
  resetButtonText: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
