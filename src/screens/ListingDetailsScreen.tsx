import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';

const { width } = Dimensions.get('window');

const ListingDetailsScreen = ({ route }) => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { product } = route.params;
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const imageCarouselRef = useRef(null);

  // Mock data for multiple images
  const productImages = [
    { id: '1', url: product.image },
    { id: '2', url: 'https://picsum.photos/400/501' },
    { id: '3', url: 'https://picsum.photos/400/502' },
    { id: '4', url: 'https://picsum.photos/400/503' },
  ];

  // Mock comments data
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

  const renderImageItem = ({ item, index }) => (
    <Image source={{ uri: item.url }} style={styles.productImage} />
  );

  const renderThumbnail = ({ item, index }) => (
    <TouchableOpacity
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity style={styles.heartButton}>
          <Ionicons name="heart-outline" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Image Carousel */}
        <View style={styles.imageCarousel}>
          <FlatList
            ref={imageCarouselRef}
            data={productImages}
            renderItem={renderImageItem}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveImageIndex(index);
            }}
            getItemLayout={(data, index) => ({
              length: width,
              offset: width * index,
              index,
            })}
          />
          <View style={styles.imageCounter}>
            <Text style={styles.imageCounterText}>
              {activeImageIndex + 1}/{productImages.length}
            </Text>
          </View>
        </View>

        {/* Thumbnails */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailsContainer}
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

        {/* Product Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.price}>₦{product.price.toLocaleString()}</Text>
          <Text style={styles.title}>{product.title}</Text>
          <View style={styles.conditionContainer}>
            <Text style={styles.conditionLabel}>Condition:</Text>
            <Text style={styles.condition}>{product.condition}</Text>
          </View>
          <Text style={styles.dateListed}>Listed 3 days ago</Text>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerContainer}>
          <View style={styles.sellerHeader}>
            <View style={styles.sellerAvatar}>
              <Ionicons name="person" size={24} color="#6366F1" />
            </View>
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>John Doe</Text>
              <View style={styles.sellerMeta}>
                <Text style={styles.sellerRating}>⭐ 4.8 (120 reviews)</Text>
                {product.sellerVerified && (
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

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>
            This is a detailed description of the product. It includes information about the condition,
            usage, and any other relevant details that potential buyers might want to know.
          </Text>
        </View>

        {/* Location */}
        <View style={styles.locationContainer}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.locationInfo}>
            <Ionicons name="location-outline" size={20} color="#6366F1" />
            <Text style={styles.locationText}>Near Engineering Building, University Campus</Text>
          </View>
        </View>

        {/* Comments */}
        <View style={styles.commentsContainer}>
          <View style={styles.commentsHeader}>
            <Text style={styles.sectionTitle}>Comments</Text>
          </View>
          <FlatList
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity 
          style={styles.messageButton}
          onPress={() => navigation.navigate('Chat', { userId: '123' })}
        >
          <Ionicons name="chatbubble-outline" size={20} color="#6366F1" />
          <Text style={styles.messageButtonText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
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
  imageCarousel: {
    position: 'relative',
  },
  productImage: {
    width: width,
    height: 300,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  thumbnailsContainer: {
    padding: 16,
    gap: 8,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#6366F1',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    lineHeight: 28,
  },
  conditionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  conditionLabel: {
    fontSize: 15,
    color: '#64748B',
    marginRight: 8,
  },
  condition: {
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
  },
  dateListed: {
    fontSize: 14,
    color: '#64748B',
  },
  sellerContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  sellerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerRating: {
    fontSize: 14,
    color: '#64748B',
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
  viewProfileButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  viewProfileText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
  },
  descriptionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
    lineHeight: 22,
  },
  locationContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  commentsContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginTop: 24,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  commentContainer: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  commentUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },
  commentRating: {
    fontSize: 14,
    color: '#64748B',
  },
  commentDate: {
    fontSize: 14,
    color: '#64748B',
  },
  commentContent: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
  },
  commentText: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: 16,
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
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#6366F1',
    gap: 8,
  },
  messageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6366F1',
  },
  buyButton: {
    flex: 2,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#6366F1',
    alignItems: 'center',
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  backButton: {
    padding: 4,
  },
  heartButton: {
    padding: 4,
  },
});

export default ListingDetailsScreen; 