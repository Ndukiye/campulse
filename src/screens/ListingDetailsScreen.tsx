import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackNavigationProp, RootStackParamList } from '../types/navigation';
import { getProductById, searchProducts, type ProductSummary } from '../services/productService';
import type { ProfilesRow } from '../types/database';
import { getProfileById } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import { isFavorite as checkFavorite, addFavorite, removeFavorite } from '../services/favoritesService';

const { width } = Dimensions.get('window');

const ListingDetailsScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetails'>>();
  const params = route.params;
  const { user } = useAuth();
  const { colors } = useThemeMode();

  const [currentProduct, setCurrentProduct] = useState<ProductSummary | undefined>(undefined);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageCarouselRef = useRef<FlatList<any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<ProfilesRow | null>(null);
  const [sellerLoading, setSellerLoading] = useState(false);
  const [sellerError, setSellerError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (params?.listingId) {
        setIsLoading(true);
        const res = await getProductById(params.listingId);
        if (res.error) {
          setError(res.error);
        }
        setCurrentProduct(res.data ?? undefined);
        setIsLoading(false);
      } else {
        setCurrentProduct(undefined);
      }
    };
    fetchProduct();
  }, [params?.listingId]);

  useEffect(() => {
    const checkFav = async () => {
      if (user?.id && currentProduct?.id) {
        const r = await checkFavorite(user.id, currentProduct.id);
        setIsFavorite(!!r.data);
      } else {
        setIsFavorite(false);
      }
    };
    checkFav();
  }, [user?.id, currentProduct?.id]);

  useEffect(() => {
    const loadSeller = async () => {
      if (!currentProduct?.seller_id) {
        setSellerProfile(null);
        setSellerError(null);
        return;
      }
      setSellerLoading(true);
      try {
        const res = await getProfileById(currentProduct.seller_id);
        if (res.error) {
          setSellerError(res.error);
        }
        setSellerProfile(res.data ?? null);
      } finally {
        setSellerLoading(false);
      }
    };
    loadSeller();
  }, [currentProduct?.seller_id]);

  const productImages = useMemo(() => {
    if (!currentProduct) return [];
    const imgs = currentProduct.images ?? [];
    if (imgs.length === 0) {
      return [{ id: 'placeholder', url: 'https://placehold.co/800x600?text=CamPulse' }];
    }
    return imgs.map((u, idx) => ({ id: `${currentProduct.id}-${idx}`, url: u }));
  }, [currentProduct]);

  const [relatedProducts, setRelatedProducts] = useState<ProductSummary[]>([]);
  useEffect(() => {
    const fetchRelated = async () => {
      if (!currentProduct?.category) {
        setRelatedProducts([]);
        return;
      }
      const res = await searchProducts({ category: currentProduct.category, limit: 10 });
      const filtered = (res.data ?? []).filter((p) => p.id !== currentProduct.id).slice(0, 5);
      setRelatedProducts(filtered);
    };
    fetchRelated();
  }, [currentProduct?.category, currentProduct?.id]);

  const comments = [
    {
      id: '1',
      user: 'Sarah M.',
      rating: 5,
      date: '2 days ago',
      comment: 'Great condition, exactly as described!',
    },
    {
      id: '2',
      user: 'Mike R.',
      rating: 4,
      date: '1 week ago',
      comment: 'Good seller, fast response.',
    },
  ];

  const renderImageItem = ({ item }: { item: { id: string; url: string }}) => (
    <Image source={{ uri: item.url }} style={styles.productImage} />
  );

  const renderRelatedItem = ({ item }: { item: ProductSummary }) => (
    <TouchableOpacity
      style={styles.relatedItemCard}
      onPress={() => navigation.push('ListingDetails', { listingId: item.id })}
    >
      <Image source={{ uri: item.images?.[0] ?? 'https://placehold.co/200x200?text=CamPulse' }} style={styles.relatedItemImage} />
      <View style={styles.relatedItemInfo}>
        <Text style={styles.relatedItemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.relatedItemPrice}>₦{(item.price ?? 0).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderComment = ({ item }: { item: { id: string; user: string; rating: number; date: string; comment: string } }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <View style={styles.commentUserAvatar}>
            <Ionicons name="person" size={20} color="#6366F1" />
          </View>
          <View>
            <Text style={styles.commentUser}>{item.user}</Text>
            <View style={styles.commentMeta}>
              <Text style={styles.commentRating}>⭐ {item.rating}</Text>
              <Text style={styles.commentDate}>{item.date}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.commentContent}>
        <Text style={styles.commentText}>{item.comment}</Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading Details...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="red" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => { /* Implement retry logic */ }} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  if (!currentProduct) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Ionicons name="alert-circle-outline" size={48} color="orange" />
        <Text style={styles.errorText}>Product not found.</Text>
         <TouchableOpacity onPress={() => navigation.goBack()} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{currentProduct.title}</Text>
        <TouchableOpacity 
          style={styles.heartButton}
          onPress={async () => {
            if (!user?.id) {
              Alert.alert('Sign in required', 'Please sign in to save favorites.');
              return;
            }
            if (isFavorite) {
              const r = await removeFavorite(user.id, currentProduct.id);
              if (r.error) {
                Alert.alert('Error', r.error);
                return;
              }
              setIsFavorite(false);
            } else {
              const r = await addFavorite(user.id, currentProduct.id);
              if (r.error) {
                Alert.alert('Error', r.error);
                return;
              }
              setIsFavorite(true);
            }
          }}
        >
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#FF0000" : colors.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[1]} // Single item to render the sections
        renderItem={() => (
          <>
            <View style={styles.imageCarousel}>
              <FlatList
                ref={imageCarouselRef}
                data={productImages}
                renderItem={renderImageItem}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEnabled={productImages.length > 1}
                onMomentumScrollEnd={(e) => {
                  if (productImages.length > 1) {
                    const index = Math.round(e.nativeEvent.contentOffset.x / width);
                    setActiveImageIndex(index);
                  }
                }}
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
              />
              {productImages.length > 1 && (
                <View style={styles.imageCounter}>
                  <Text style={styles.imageCounterText}>
                    {activeImageIndex + 1}/{productImages.length}
                  </Text>
                </View>
              )}
            </View>

            {productImages.length > 1 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailsContainer}
                contentContainerStyle={styles.thumbnailsContentContainer}
              >
                {productImages.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.thumbnail,
                      activeImageIndex === index && styles.activeThumbnail,
                    ]}
                    onPress={() => {
                      setActiveImageIndex(index);
                      imageCarouselRef.current?.scrollToIndex({ index, animated: true });
                    }}
                  >
                    <Image source={{ uri: item.url }} style={styles.thumbnailImage} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={styles.infoContainer}>
              <Text style={styles.price}>₦{(currentProduct.price ?? 0).toLocaleString()}</Text>
              <Text style={styles.title}>{currentProduct.title}</Text>
              <View style={styles.conditionContainer}>
                <Text style={styles.conditionLabel}>Condition:</Text>
                <Text style={styles.condition}>{String(currentProduct.condition ?? '').replace('-', ' ')}</Text>
              </View>
              <Text style={styles.dateListed}>Listed {currentProduct.created_at ? new Date(currentProduct.created_at).toLocaleDateString() : '—'}</Text>
            </View>

            <View style={styles.sellerContainer}>
            <View style={styles.sellerHeader}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={24} color="#6366F1" />
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>
                  {sellerProfile?.name ?? '—'}
                </Text>
                <View style={styles.sellerMeta}>
                  {sellerLoading ? (
                    <ActivityIndicator size="small" color="#6366F1" />
                  ) : sellerError ? (
                    <Text style={styles.sellerRating}>Seller info unavailable</Text>
                  ) : (
                    <Text style={styles.sellerRating}>
                      ⭐ {sellerProfile?.rating ?? '—'}{typeof sellerProfile?.total_reviews === 'number' ? ` (${sellerProfile.total_reviews} reviews)` : ''}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.viewProfileButton}
              onPress={() => {
                if (currentProduct?.seller_id) {
                  navigation.navigate('SellerProfile', { userId: currentProduct.seller_id });
                }
              }} 
            >
              <Text style={styles.viewProfileText}>View Seller</Text>
            </TouchableOpacity>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {currentProduct.description ?? 'No description'}
              </Text>
            </View>
            {/** Location **/}
            <View style={styles.locationContainer}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={20} color="#6366F1" />
                <Text style={styles.locationText}>{sellerProfile?.location ?? '—'}</Text>
              </View>
            </View>
            
            {comments.length > 0 && (
              <View style={styles.commentsSection}>
                <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
                <FlatList
                  data={comments}
                  renderItem={renderComment}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                />
              </View>
            )}
            
            {relatedProducts.length > 0 && (
              <View style={styles.relatedItemsSection}>
                <Text style={styles.sectionTitle}>Related Items</Text>
                <FlatList
                  data={relatedProducts}
                  renderItem={renderRelatedItem}
                  keyExtractor={(item) => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.relatedItemsList}
                />
              </View>
            )}
          </>
        )}
        keyExtractor={() => 'listing-details-content'}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => {
            if (currentProduct?.seller_id) {
              navigation.navigate('Chat', { userId: currentProduct.seller_id });
            }
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.buyButton}
          onPress={() => console.log('Buy Now pressed for product:', currentProduct.id)}
        >
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4B5563',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginHorizontal: 8,
  },
  heartButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  imageCarousel: {
    position: 'relative',
    backgroundColor: '#e0e0e0',
  },
  productImage: {
    width: width,
    height: 300,
    resizeMode: 'contain',
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  thumbnailsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  thumbnailsContentContainer: {
    paddingHorizontal: 16,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  activeThumbnail: {
    borderColor: '#6366F1',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  infoContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  price: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 30,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 15,
    color: '#475569',
    marginRight: 8,
  },
  condition: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: 'hidden',
  },
  dateListed: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  sellerContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 8,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sellerRating: {
    fontSize: 14,
    color: '#475569',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#0EA5E9',
    fontWeight: '500',
  },
  viewProfileButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
  },
  descriptionContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
  },
  locationContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
  },
  commentsSection: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 8,
  },
  commentContainer: {
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentUserAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentUser: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  commentRating: {
    fontSize: 13,
    color: '#475569',
  },
  commentDate: {
    fontSize: 13,
    color: '#64748B',
  },
  commentContent: {
    paddingLeft: 46,
  },
  commentText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  relatedItemsSection: {
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: '#fff',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  relatedItemsList: {
    paddingVertical: 8,
  },
  relatedItemCard: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  relatedItemImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    resizeMode: 'cover',
  },
  relatedItemInfo: {
    padding: 10,
  },
  relatedItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  relatedItemPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  actionContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#6366F1',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  buyButton: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ListingDetailsScreen;
