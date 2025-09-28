import React, { useState } from 'react';
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
} from 'react-native';
import { APP_CATEGORIES } from '../constants/categories';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// We will use these later for category and condition pickers
// import { APP_CATEGORIES } from '../constants/categories'; 

const CONDITION_OPTIONS = [
  { label: 'New', value: 'New' },
  { label: 'Like New', value: 'Like New' },
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Used', value: 'Used' },
];

// Mock user listings - replace with actual data management later
const MOCK_USER_LISTINGS = [
  {
    id: '1',
    title: 'iPhone 12 Pro',
    description: 'Excellent condition, barely used',
    price: 699.99,
    category: 'Electronics',
    condition: 'Like New',
    image: 'https://picsum.photos/seed/iphone/400/500',
    sellerVerified: true,
    datePosted: '2024-03-15',
  },
  {
    id: '2',
    title: 'Nike Air Max',
    description: 'Size 10, worn twice',
    price: 89.99,
    category: 'Clothing',
    condition: 'Good',
    image: 'https://picsum.photos/seed/nike/400/500',
    sellerVerified: true,
    datePosted: '2024-03-14',
  },
];

const SellScreen = () => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [userListings, setUserListings] = useState(MOCK_USER_LISTINGS);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState(APP_CATEGORIES[0]?.name || '');
  const [condition, setCondition] = useState(CONDITION_OPTIONS[0]?.value || '');
  const [image, setImage] = useState<string | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConditionPicker, setShowConditionPicker] = useState(false);
  const navigation = useNavigation();

  const pickImage = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImage(event.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  const handleCreateListing = () => {
    if (!title || !description || !price || !category || !condition) {
      Alert.alert('Validation Error', 'Please fill in all required fields, including category and condition.');
      return;
    }
    const newListing = {
      id: String(Date.now()),
      title,
      description,
      price: parseFloat(price),
      category,
      condition,
      image: image || 'https://picsum.photos/seed/default/400/500',
      sellerVerified: false,
      datePosted: new Date().toISOString().split('T')[0],
    };
    
    setUserListings([newListing, ...userListings]);
    setShowCreateForm(false);
    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPrice('');
    setCategory(APP_CATEGORIES[0]?.name || '');
    setCondition(CONDITION_OPTIONS[0]?.value || '');
    setImage(null);
  };

  const handleDeleteListing = (id: string) => {
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
          onPress: () => {
            setUserListings(userListings.filter(listing => listing.id !== id));
          },
        },
      ]
    );
  };

  const renderListingItem = ({ item }: { item: typeof MOCK_USER_LISTINGS[0] }) => (
    <View style={styles.listingCard}>
      <Image 
        source={{ uri: item.image }} 
        style={styles.listingImage}
        resizeMode="cover"
      />
      <View style={styles.listingContent}>
        <Text style={styles.listingTitle}>{item.title}</Text>
        <Text style={styles.listingPrice}>${item.price.toFixed(2)}</Text>
        <Text style={styles.listingCategory}>{item.category}</Text>
        <Text style={styles.listingCondition}>Condition: {item.condition}</Text>
        <Text style={styles.listingDate}>Posted: {item.datePosted}</Text>
        <View style={styles.listingActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {/* TODO: Implement edit functionality */}}
          >
            <Ionicons name="pencil" size={20} color="#4338CA" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteListing(item.id)}
          >
            <Ionicons name="trash" size={20} color="#DC2626" />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
            <Text style={styles.modalTitle}>Create New Listing</Text>
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
              <Text style={styles.label}>Category*</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={styles.pickerButtonText}>{category}</Text>
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
              <Text style={styles.label}>Upload Image</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Text style={styles.imagePickerButtonText}>{image ? 'Change Image' : 'Select Image'}</Text>
              </TouchableOpacity>
              {image && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: image }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
                    <Text style={styles.removeImageButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleCreateListing}>
              <Text style={styles.submitButtonText}>Create Listing</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {renderPickerModal(
        showCategoryPicker,
        () => setShowCategoryPicker(false),
        'Select Category',
        APP_CATEGORIES.map(cat => ({ label: cat.name, value: cat.name })),
        category,
        setCategory
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>My Listings</Text>
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

      {userListings.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyStateText}>No listings yet</Text>
          <Text style={styles.emptyStateSubtext}>Create your first listing to start selling</Text>
        </View>
      ) : (
        <FlatList
          data={userListings}
          renderItem={renderListingItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.listingsContainer}
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
  emptyState: {
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