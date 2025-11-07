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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackNavigationProp, RootStackParamList, Product } from '../types/navigation';
import { MOCK_PRODUCTS } from '../constants/products';

const { width } = Dimensions.get('window');

const ListingDetailsScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const route = useRoute<RouteProp<RootStackParamList, 'ListingDetails'>>();
  const params = route.params;

  const currentProduct: Product | undefined = useMemo(() => {
    if (params?.product) {
      return params.product;
    }
    if (params?.listingId) {
      return MOCK_PRODUCTS.find(p => p.id === params.listingId);
    }
    return undefined;
  }, [params]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageCarouselRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    if (currentProduct) {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setError(null);
      }, 750);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(false);
    }
  }, [currentProduct]);

  const productImages = useMemo(() => {
    if (!currentProduct) return []; // If no product, return empty array
    // Restore placeholder images for gallery testing purposes
    return [
      { id: '1', url: currentProduct.image },
      { id: '2', url: `https://picsum.photos/seed/${currentProduct.id}/1/400/501` }, // Unique seed
      { id: '3', url: `https://picsum.photos/seed/${currentProduct.id}/2/400/502` }, // Unique seed
      { id: '4', url: `https://picsum.photos/seed/${currentProduct.id}/3/400/503` }, // Unique seed
    ];
  }, [currentProduct]);

  const relatedProducts = useMemo(() => {
    if (!currentProduct) return [];
    return MOCK_PRODUCTS.filter(
      p => p.category === currentProduct.category && p.id !== currentProduct.id
    ).slice(0, 5);
  }, [currentProduct]);

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

  const renderRelatedItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.relatedItemCard}
      onPress={() => navigation.push('ListingDetails', { product: item })}
    >
      <Image source={{ uri: item.image }} style={styles.relatedItemImage} />
      <View style={styles.relatedItemInfo}>
        <Text style={styles.relatedItemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.relatedItemPrice}>₦{item.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderComment = ({ item }) => (
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{currentProduct.title}</Text>
        <TouchableOpacity 
          style={styles.heartButton}
          onPress={() => setIsFavorite(!isFavorite)}
        >
          <Ionicons name={isFavorite ? "heart" : "heart-outline"} size={24} color={isFavorite ? "#FF0000" : "#1E293B"} />
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
              <Text style={styles.price}>₦{currentProduct.price.toLocaleString()}</Text>
              <Text style={styles.title}>{currentProduct.title}</Text>
              <View style={styles.conditionContainer}>
                <Text style={styles.conditionLabel}>Condition:</Text>
                <Text style={styles.condition}>{currentProduct.condition}</Text>
              </View>
              <Text style={styles.dateListed}>Listed {currentProduct.datePosted}</Text>
            </View>

            <View style={styles.sellerContainer}>
              <View style={styles.sellerHeader}>
                <View style={styles.sellerAvatar}>
                  <Ionicons name="person" size={24} color="#6366F1" />
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.sellerName}>John Doe</Text> 
                  <View style={styles.sellerMeta}>
                    <Text style={styles.sellerRating}>⭐ 4.8 (120 reviews)</Text>
                    {currentProduct.sellerVerified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.viewProfileButton}
                onPress={() => navigation.navigate('Profile', { userId: '123' })} 
              >
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.descriptionContainer}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>
                {currentProduct.description}
              </Text>
            </View>
       
            /* bruhhh */
            <View style={styles.locationContainer}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationInfo}>
                <Ionicons name="location-outline" size={20} color="#6366F1" />
                <Text style={styles.locationText}>Near Engineering Building, University Campus</Text>
              </View>
            </View>
            */
            
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
          onPress={() => navigation.navigate('Chat', { userId: '123' })}
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
    resizeMode: 'cover',
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