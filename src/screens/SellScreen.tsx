import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import {
  getProductsBySeller,
  createProduct,
  deleteProduct,
  updateProduct,
  getProductById,
  searchSellerProducts,
  type ProductSummary,
} from '../services/productService';
import { RootStackNavigationProp } from '../types/navigation';
import type { ProductsInsert } from '../types/database';
import { APP_CATEGORIES } from '../constants/categories';
import { ensureRemoteImageUrls } from '../services/storageService';
import { useThemeMode } from '../context/ThemeContext';

const CONDITION_OPTIONS = [
  { label: 'New', value: 'new' },
  { label: 'Like New', value: 'like-new' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Poor', value: 'poor' },
];

const SellScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const { colors } = useThemeMode();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductSummary | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [condition, setCondition] = useState(CONDITION_OPTIONS[0]?.value ?? 'new');
  const [selectedCategory, setSelectedCategory] = useState(APP_CATEGORIES[0]?.name ?? '');
  const [images, setImages] = useState<string[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const [availableQuantity, setAvailableQuantity] = useState('1');

  const [listings, setListings] = useState<ProductSummary[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mySearchQuery, setMySearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 24;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadListings = useCallback(
    async (showLoading = true) => {
      if (!user?.id) return;
      if (showLoading) setLoadingListings(true);
      setPage(0);
      const res = await searchSellerProducts({
        sellerId: user.id,
        searchQuery: mySearchQuery,
        page: 0,
        pageSize: PAGE_SIZE,
        sortBy: 'newest',
      });
      if (res.error) {
        console.warn('[SellScreen] Failed to load listings:', res.error);
      }
      const rows = res.data ?? [];
      setListings(rows);
      setHasMore(rows.length === PAGE_SIZE);
      if (showLoading) setLoadingListings(false);
    },
    [user?.id, mySearchQuery]
  );

  useEffect(() => {
    loadListings(true);
  }, [loadListings]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadListings(true);
    }, 250);
    return () => clearTimeout(t);
  }, [mySearchQuery]);

  const onRefresh = useCallback(async () => {
    if (!user?.id) return;
    setRefreshing(true);
    await loadListings(false);
    setRefreshing(false);
  }, [loadListings, user?.id]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !user?.id) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await searchSellerProducts({
      sellerId: user.id,
      searchQuery: mySearchQuery,
      page: nextPage,
      pageSize: PAGE_SIZE,
      sortBy: 'newest',
    });
    const rows = res.data ?? [];
    setListings((prev) => prev.concat(rows));
    setPage(nextPage);
    setHasMore(rows.length === PAGE_SIZE);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page, user?.id, mySearchQuery]);

  const pickImage = useCallback(async () => {
    try {
      if (Platform.OS !== 'web') {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission required', 'Please allow access to your photos to upload images.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.length) {
        const uris = result.assets.map((a) => a.uri).filter(Boolean) as string[];
        setImages((prev) => [...prev, ...uris]);
      }
    } catch (error) {
      console.error('[SellScreen] Image picker error:', error);
      Alert.alert('Image Picker Error', 'Unable to select image. Please try again.');
    }
  }, []);

  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setPrice('');
    setAvailableQuantity('1');
    setCondition(CONDITION_OPTIONS[0]?.value ?? 'new');
    setImages([]);
    setSelectedCategory(APP_CATEGORIES[0]?.name ?? '');
    setEditingItem(null);
  }, []);

  const handleCreateListing = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Authentication required', 'Please sign in to create a listing.');
      return;
    }

    if (!title.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than zero.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Validation Error', 'Please select a category.');
      return;
    }

    const parsedQty = Number(availableQuantity);
    if (Number.isNaN(parsedQty) || parsedQty <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid quantity (at least 1).');
      return;
    }

    setIsSubmitting(true);
    try {
      const ensured = await ensureRemoteImageUrls(images, user.id);
      if (ensured.error) {
        Alert.alert('Image Upload Error', ensured.error);
      }
      const payload: ProductsInsert = {
        seller_id: user.id,
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category: selectedCategory,
        condition: condition as ProductsInsert['condition'],
        available_quantity: parsedQty,
        images: ensured.urls,
      };

      const result = await createProduct(payload);
      if (result.error) {
        Alert.alert('Error', result.error);
        return;
      }

      const created = result.data;
      if (created) {
        setListings((prev) => [created, ...prev]);
      }

      Alert.alert('Success', 'Your listing has been created.');
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('[SellScreen] Failed to create listing:', error);
      Alert.alert('Error', 'Failed to create listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, title, description, price, selectedCategory, condition, images, availableQuantity, resetForm]);

  const openEdit = useCallback((item: ProductSummary) => {
    setEditingItem(item);
    setTitle(item.title ?? '');
    setDescription(item.description ?? '');
    setPrice(item.price !== null && item.price !== undefined ? String(item.price) : '');
    setAvailableQuantity(item.available_quantity !== null && item.available_quantity !== undefined ? String(item.available_quantity) : '1');
    setSelectedCategory(item.category ?? APP_CATEGORIES[0]?.name ?? '');
    setCondition((item.condition as string) ?? CONDITION_OPTIONS[0]?.value ?? 'new');
    setImages(item.images ?? []);
    setShowCreateForm(true);
  }, []);

  const handleSaveChanges = useCallback(async () => {
    if (!user?.id || !editingItem) {
      Alert.alert('Authentication required', 'Please sign in to edit a listing.');
      return;
    }

    if (!title.trim() || !price.trim()) {
      Alert.alert('Validation Error', 'Title and price are required.');
      return;
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid price greater than zero.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Validation Error', 'Please select a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ensured = await ensureRemoteImageUrls(images, user.id);
      if (ensured.error) {
        Alert.alert('Image Upload Error', ensured.error);
      }
      const parsedQtyEdit = Number(availableQuantity)
      if (Number.isNaN(parsedQtyEdit) || parsedQtyEdit < 0) {
        Alert.alert('Validation Error', 'Please enter a valid quantity (0 or more).');
        setIsSubmitting(false);
        return;
      }
      const newQty = Math.floor(parsedQtyEdit)
      const arraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])
      const imagesFinal = arraysEqual(ensured.urls ?? [], editingItem.images ?? []) ? (editingItem.images ?? []) : (ensured.urls ?? [])
      const payloadToSend = {
        id: editingItem.id,
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        category: selectedCategory,
        condition: condition as any,
        images: imagesFinal,
        available_quantity: newQty,
      }
      console.log('[SellScreen] update payload', { payload: payloadToSend, userId: user.id })
      const result = await updateProduct(payloadToSend, user.id);

      if (result.error) {
        Alert.alert('Error', result.error);
        setIsSubmitting(false);
        return;
      }

      console.log('[SellScreen] update response', { error: result.error, data: result.data })
      const updated = result.data;
      if (updated) {
        const fresh = await getProductById(updated.id)
        if (!fresh.error && fresh.data) {
          console.log('[SellScreen] post-update refetch', { data: fresh.data })
          setListings((prev) => prev.map((l) => (l.id === updated.id ? fresh.data! : l)));
        } else {
          setListings((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
        }
      }

      Alert.alert('Success', 'Your listing has been updated.');
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('[SellScreen] Failed to update listing:', error);
      Alert.alert('Error', 'Failed to update listing. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user?.id, editingItem, title, description, price, selectedCategory, condition, images, availableQuantity, resetForm]);

  const handleDeleteListing = useCallback(
    (id: string) => {
      if (!user?.id) return;

      Alert.alert(
        'Delete Listing',
        'Are you sure you want to delete this listing?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setDeletingId(id);
              const res = await deleteProduct(id, user.id);
              if (res.error) {
                Alert.alert('Error', res.error);
                setDeletingId(null);
                return;
              }
              setListings((prev) => prev.filter((listing) => listing.id !== id));
              setDeletingId(null);
            },
          },
        ]
      );
    },
    [user?.id]
  );

  const renderListingItem = useCallback(
    ({ item }: { item: ProductSummary }) => {
      const imageUrl = item.images?.[0] ?? 'https://placehold.co/400x500?text=CamPulse';
      const createdDate = item.created_at ? new Date(item.created_at).toLocaleDateString() : '—';
      const conditionLabel =
        CONDITION_OPTIONS.find((opt) => opt.value === item.condition)?.label ?? item.condition ?? 'N/A';
      const priceValue = item.price ?? 0;

      return (
        <View style={[styles.listingCard, { backgroundColor: colors.card }]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.listingImage}
            resizeMode="cover"
          />
          <View style={styles.listingContent}>
            <Text style={[styles.listingTitle, { color: colors.text }]} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.listingPrice}>
              ₦{priceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
            <Text style={[styles.listingCategory, { color: colors.muted }]}>{item.category ?? 'Uncategorized'}</Text>
            <Text style={[styles.listingCondition, { color: colors.muted }]}>Condition: {conditionLabel}</Text>
            <Text style={[styles.listingDate, { color: colors.muted }]}>Posted: {createdDate}</Text>
            <View style={styles.listingActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => openEdit(item)}
              >
                <Ionicons name="pencil" size={20} color="#4338CA" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteListing(item.id)}
                disabled={deletingId === item.id}
              >
                {deletingId === item.id ? (
                  <ActivityIndicator size="small" color="#DC2626" />
                ) : (
                  <>
                    <Ionicons name="trash" size={20} color="#DC2626" />
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [deletingId, handleDeleteListing]
  );

  const renderPickerModal = (
    visible: boolean,
    onClose: () => void,
    title: string,
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.pickerModalContent}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.pickerOptions}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerOption,
                  selectedValue === option.value && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    selectedValue === option.value && styles.pickerOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {selectedValue === option.value && (
                  <Ionicons name="checkmark" size={24} color="#6366F1" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderCreateForm = () => (
    <Modal
      visible={showCreateForm}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateForm(false)}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Listing' : 'Create New Listing'}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => {
                setShowCreateForm(false);
                resetForm();
              }}
            >
              <Ionicons name="close" size={24} color="#1E293B" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.formScroll}
            contentContainerStyle={styles.formScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title*</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter item title"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description*</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your item"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Price*</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Enter price"
                placeholderTextColor="#94A3B8"
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Available Quantity*</Text>
              <TextInput
                style={styles.input}
                value={availableQuantity}
                onChangeText={setAvailableQuantity}
                placeholder="Number of items in stock"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category*</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  setShowCategoryPicker(true);
                }}
              >
                <Text style={styles.pickerButtonText}>
                  {selectedCategory || 'Select category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Condition*</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowConditionPicker(true)}
              >
                <Text style={styles.pickerButtonText}>{condition}</Text>
                <Ionicons name="chevron-down" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Upload Images</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Text style={styles.imagePickerButtonText}>Add Image(s)</Text>
              </TouchableOpacity>
              {images.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {images.map((uri, idx) => (
                    <View key={uri + idx} style={styles.imagePreviewContainer}>
                      <Image source={{ uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <Text style={styles.removeImageButtonText}>Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
            <View style={styles.infoNotice}>
              <Ionicons name="information-circle-outline" size={16} color="#64748B" />
              <Text style={styles.infoNoticeText}>
                Payments are held in escrow. A 3% transaction fee is deducted from the seller payout after successful delivery confirmation. Delivery is handled by buyer and seller directly.
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={editingItem ? handleSaveChanges : handleCreateListing}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>{editingItem ? 'Save Changes' : 'Create Listing'}</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {renderPickerModal(
        showCategoryPicker,
        () => setShowCategoryPicker(false),
        'Select Category',
        APP_CATEGORIES.map((cat) => ({ label: cat.name, value: cat.name })),
        selectedCategory,
        (value) => {
          setSelectedCategory(value);
        }
      )}

      {renderPickerModal(
        showConditionPicker,
        () => setShowConditionPicker(false),
        'Select Condition',
        CONDITION_OPTIONS,
        condition,
        setCondition
      )}
    </Modal>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: '#E2E8F0' }] }>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>My Listings</Text>
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

      {/* Search for my listings */}
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: '#E2E8F0' }] }>
        <View style={[styles.searchContainer, { backgroundColor: colors.background }] }>
          <Ionicons name="search" size={18} color={colors.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search my listings..."
            placeholderTextColor={colors.muted}
            value={mySearchQuery}
            onChangeText={setMySearchQuery}
            returnKeyType="search"
          />
        </View>
      </View>

      {loadingListings ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color="#4338CA" />
        </View>
      ) : listings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyStateText}>No listings yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first listing to start selling</Text>
        </View>
      ) : (
        <FlatList
          data={listings}
          renderItem={renderListingItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listingsContainer}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16 }}>
                <ActivityIndicator size="small" color="#6366F1" />
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4338CA" />
          }
        />
      )}

      <TouchableOpacity 
        style={styles.fab}
        onPress={() => setShowCreateForm(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {renderCreateForm()}
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
  searchRow: {
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
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: 40, fontSize: 15, color: '#1E293B' },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  listingsContainer: {
    paddingHorizontal: 8,
    paddingTop: 8,
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
    width: '47%',
  },
  listingImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F1F5F9',
  },
  listingContent: {
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
  listingCategory: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  listingCondition: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
  },
  listingDate: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  infoNoticeText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
  },
  listingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  editButton: {
    backgroundColor: '#EEF2FF',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4338CA',
  },
  deleteButtonText: {
    color: '#DC2626',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4338CA',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 50,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  formScroll: {
    flex: 1,
  },
  formScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#1E293B',
  },
  imagePickerButton: {
    backgroundColor: '#EEF2FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  imagePickerButtonText: {
    color: '#4338CA',
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: 10,
    alignItems: 'center',
    position: 'relative',
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: Platform.OS === 'ios' ? 65 : 75,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  removeImageButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  pickerOptions: {
    maxHeight: 400,
  },
  pickerOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  pickerOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#1E293B',
  },
  pickerOptionTextSelected: {
    color: '#6366F1',
    fontWeight: '600',
  },
});

export default SellScreen;
