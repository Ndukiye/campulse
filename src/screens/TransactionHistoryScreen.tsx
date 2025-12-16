import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types/navigation';
import { useThemeMode } from '../context/ThemeContext';
import {
  getSalesBySeller,
  getPurchasesByBuyer,
  SaleSummary,
  PurchaseSummary,
  confirmSellerDelivered,
  confirmBuyerReceived,
  TransactionStatus,
} from '../services/transactionService';
import { useToast } from '../context/ToastContext';
import { submitSellerReview, submitProductReview } from '../services/reviewService';
import { useAuth } from '../context/AuthContext';

type ScreenRouteProp = RouteProp<RootStackParamList, 'TransactionHistory'>;

export default function TransactionHistoryScreen() {
  const route = useRoute<ScreenRouteProp>();
  const navigation = useNavigation<any>();
  const { colors, isDark } = useThemeMode();
  const { user } = useAuth();
  const toast = useToast();
  
  const { userId, initialTab = 'purchases' } = route.params;
  const [activeTab, setActiveTab] = useState<'sales' | 'purchases'>(initialTab);
  
  const [sales, setSales] = useState<SaleSummary[]>([]);
  const [purchases, setPurchases] = useState<PurchaseSummary[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewContext, setReviewContext] = useState<{ sellerId: string | null; productId: string | null } | null>(null);
  const [reviewSellerRating, setReviewSellerRating] = useState(0);
  const [reviewProductRating, setReviewProductRating] = useState(0);
  const [reviewProductComment, setReviewProductComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadData(true);
  }, [activeTab]);

  const loadData = async (refresh = false) => {
    if (loading || (loadingMore && !refresh)) return;
    
    if (refresh) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const offset = refresh ? 0 : (activeTab === 'sales' ? sales.length : purchases.length);
      
      if (activeTab === 'sales') {
        const { data, error } = await getSalesBySeller(userId, ITEMS_PER_PAGE, offset);
        if (error) throw new Error(error);
        
        const newItems = data ?? [];
        if (refresh) {
          setSales(newItems);
        } else {
          setSales(prev => [...prev, ...newItems]);
        }
        setHasMore(newItems.length === ITEMS_PER_PAGE);
      } else {
        const { data, error } = await getPurchasesByBuyer(userId, ITEMS_PER_PAGE, offset);
        if (error) throw new Error(error);
        
        const newItems = data ?? [];
        if (refresh) {
          setPurchases(newItems);
        } else {
          setPurchases(prev => [...prev, ...newItems]);
        }
        setHasMore(newItems.length === ITEMS_PER_PAGE);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const formatStatus = (status: string) =>
    status.charAt(0).toUpperCase() + status.slice(1);

  const renderSaleItem = ({ item }: { item: SaleSummary }) => {
    const priceValue = item.amount ?? item.price ?? 0;
    const createdDate = item.createdAt ? new Date(item.createdAt) : null;
    const buyerId = item.buyerId;

    return (
      <View style={[styles.transactionCard, { backgroundColor: colors.card }]}>
        <View style={styles.transactionHeader}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>{item.productTitle}</Text>
          <Text style={[styles.transactionPrice, { color: colors.primary }]}>
            ₦{priceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.transactionDetails}>
          <View style={styles.transactionUserContainer}>
            <Text style={styles.transactionLabel}>Buyer: </Text>
            {buyerId ? (
              <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: buyerId })}>
                <Text style={styles.transactionUserName}>{item.buyerName}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.transactionUserName}>{item.buyerName}</Text>
            )}
          </View>
          <Text style={styles.transactionDate}>
            {createdDate ? createdDate.toLocaleDateString() : '—'}
          </Text>
        </View>
        <View style={styles.confirmationRow}>
          <View style={[styles.confirmChip, item.buyerConfirmed ? styles.confirmChipActive : styles.confirmChipInactive]}>
            <Ionicons
              name={item.buyerConfirmed ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={item.buyerConfirmed ? '#059669' : '#64748B'}
            />
            <Text style={[styles.confirmChipText, item.buyerConfirmed ? styles.confirmChipTextActive : styles.confirmChipTextInactive]}>
              Buyer Confirmed
            </Text>
          </View>
          <View style={[styles.confirmChip, item.sellerConfirmed ? styles.confirmChipActive : styles.confirmChipInactive]}>
            <Ionicons
              name={item.sellerConfirmed ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={item.sellerConfirmed ? '#059669' : '#64748B'}
            />
            <Text style={[styles.confirmChipText, item.sellerConfirmed ? styles.confirmChipTextActive : styles.confirmChipTextInactive]}>
              Seller Confirmed
            </Text>
          </View>
        </View>
        <View style={styles.transactionStatus}>
          <Text style={[styles.statusText, styles[`status${item.status}` as keyof typeof styles] ?? styles.statusDefault]}>
            {formatStatus(item.status)}
          </Text>
          {item.status === 'pending' && !item.sellerConfirmed && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={async () => {
                const r = await confirmSellerDelivered(item.id)
                if (r.error) {
                  Alert.alert('Confirm Delivery', r.error)
                } else {
                  toast.show('Confirm Delivery', 'Delivery confirmed. Awaiting buyer confirmation.', 'success')
                  setSales(prev => prev.map(s => s.id === item.id ? { ...s, sellerConfirmed: true } : s))
                }
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm Delivered</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderPurchaseItem = ({ item }: { item: PurchaseSummary }) => {
    const priceValue = item.amount ?? item.price ?? 0;
    const createdDate = item.createdAt ? new Date(item.createdAt) : null;
    const sellerId = item.sellerId;

    return (
      <View style={[styles.transactionCard, { backgroundColor: colors.card }]}>
        <View style={styles.transactionHeader}>
          <Text style={[styles.transactionTitle, { color: colors.text }]}>{item.productTitle}</Text>
          <Text style={[styles.transactionPrice, { color: colors.primary }]}>
            ₦{priceValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </Text>
        </View>
        <View style={styles.transactionDetails}>
          <View style={styles.transactionUserContainer}>
            <Text style={styles.transactionLabel}>Seller: </Text>
            {sellerId ? (
              <TouchableOpacity onPress={() => navigation.navigate('Profile', { userId: sellerId })}>
                <Text style={styles.transactionUserName}>{item.sellerName}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.transactionUserName}>{item.sellerName}</Text>
            )}
          </View>
          <Text style={styles.transactionDate}>
            {createdDate ? createdDate.toLocaleDateString() : '—'}
          </Text>
        </View>
        <View style={styles.confirmationRow}>
          <View style={[styles.confirmChip, item.buyerConfirmed ? styles.confirmChipActive : styles.confirmChipInactive]}>
            <Ionicons
              name={item.buyerConfirmed ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={item.buyerConfirmed ? '#059669' : '#64748B'}
            />
            <Text style={[styles.confirmChipText, item.buyerConfirmed ? styles.confirmChipTextActive : styles.confirmChipTextInactive]}>
              Buyer Confirmed
            </Text>
          </View>
          <View style={[styles.confirmChip, item.sellerConfirmed ? styles.confirmChipActive : styles.confirmChipInactive]}>
            <Ionicons
              name={item.sellerConfirmed ? 'checkmark-circle' : 'time-outline'}
              size={14}
              color={item.sellerConfirmed ? '#059669' : '#64748B'}
            />
            <Text style={[styles.confirmChipText, item.sellerConfirmed ? styles.confirmChipTextActive : styles.confirmChipTextInactive]}>
              Seller Confirmed
            </Text>
          </View>
        </View>
        <View style={styles.transactionStatus}>
          <Text style={[styles.statusText, styles[`status${item.status}` as keyof typeof styles] ?? styles.statusDefault]}>
            {formatStatus(item.status)}
          </Text>
          {item.status === 'pending' && !item.buyerConfirmed && (
            <TouchableOpacity
              style={styles.confirmButton}
              onPress={async () => {
                const r = await confirmBuyerReceived(item.id)
                if (r.error) {
                  Alert.alert('Confirm Received', r.error)
                } else {
                  toast.show('Confirm Received', 'Item received. Awaiting seller confirmation.', 'success')
                  setPurchases(prev => prev.map(p => p.id === item.id ? { ...p, buyerConfirmed: true } : p))
                  setReviewContext({ sellerId: item.sellerId ?? null, productId: item.productId ?? null })
                  setReviewSellerRating(0)
                  setReviewProductRating(0)
                  setReviewProductComment('')
                  setShowReviewModal(true)
                }
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.confirmButtonText}>Confirm Received</Text>
            </TouchableOpacity>
          )}
          {(item.productId && (item.status === 'completed' || (item.buyerConfirmed && item.sellerConfirmed))) && (
            <TouchableOpacity
              style={[styles.addReviewButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => {
                setReviewContext({ sellerId: item.sellerId ?? null, productId: item.productId ?? null })
                setReviewSellerRating(0)
                setReviewProductRating(0)
                setReviewProductComment('')
                setShowReviewModal(true)
              }}
            >
              <Ionicons name="star-outline" size={16} color={colors.primary} />
              <Text style={[styles.addReviewButtonText, { color: colors.primary }]}>Add Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderReviewModal = () => (
    <Modal
      visible={showReviewModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReviewModal(false)}
    >
      <View style={[styles.centerOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.passCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Rate Seller & Product</Text>
            <TouchableOpacity onPress={() => setShowReviewModal(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 16 }}>
            <Text style={[styles.label, { color: colors.text }]}>Seller Rating</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setReviewSellerRating(n)}>
                  <Ionicons name={reviewSellerRating >= n ? 'star' : 'star-outline'} size={22} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Product Rating</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              {[1,2,3,4,5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setReviewProductRating(n)}>
                  <Ionicons name={reviewProductRating >= n ? 'star' : 'star-outline'} size={22} color={colors.primary} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.label, { color: colors.text }]}>Product Comment</Text>
            <TextInput
              style={[styles.input, styles.bioInput, { borderColor: colors.inputBorder, backgroundColor: colors.inputBackground, color: colors.text }]}
              placeholder="Share your experience with the product"
              placeholderTextColor={colors.muted}
              value={reviewProductComment}
              onChangeText={setReviewProductComment}
              multiline
            />
            <View style={[styles.actionRow]}>
              <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: colors.surface }]} onPress={() => setShowReviewModal(false)}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={async () => {
                  if (!user?.id || !reviewContext?.sellerId || !reviewContext?.productId) { Alert.alert('Review', 'Unable to submit review'); return }
                  if (reviewSellerRating < 1 || reviewProductRating < 1) { Alert.alert('Review', 'Please rate seller and product'); return }
                  try {
                    setSubmittingReview(true)
                    const res = await submitSellerReview({
                      reviewerId: user.id,
                      reviewedUserId: reviewContext.sellerId,
                      productId: reviewContext.productId,
                      rating: reviewSellerRating,
                      comment: undefined,
                    })
                    if (res.error) {
                      setSubmittingReview(false)
                      Alert.alert('Review', res.error)
                      return
                    }
                    const res2 = await submitProductReview({
                      reviewerId: user.id,
                      productId: reviewContext.productId,
                      rating: reviewProductRating,
                      comment: reviewProductComment.trim() || undefined,
                    })
                    setSubmittingReview(false)
                    if (res2.error) {
                      Alert.alert('Review', res2.error)
                      return
                    }
                    toast.show('Review', 'Thanks for your review', 'success')
                    setShowReviewModal(false)
                  } catch (e: any) {
                    setSubmittingReview(false)
                    Alert.alert('Review', e?.message || 'Failed to submit review')
                  }
                }}
                disabled={submittingReview}
              >
                {submittingReview ? <ActivityIndicator color="#FFFFFF" /> : <Text style={[styles.saveButtonText]}>Submit Review</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Transaction History</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={[styles.tabsContainer, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' ? { backgroundColor: colors.surface } : null]}
          onPress={() => setActiveTab('sales')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'sales' ? colors.primary : colors.muted }]}>
            Sales
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'purchases' ? { backgroundColor: colors.surface } : null]}
          onPress={() => setActiveTab('purchases')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'purchases' ? colors.primary : colors.muted }]}>
            Purchases
          </Text>
        </TouchableOpacity>
      </View>

      {loading && !loadingMore ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={activeTab === 'sales' ? sales : purchases}
          renderItem={activeTab === 'sales' ? renderSaleItem : renderPurchaseItem as any}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onEndReached={() => {
            if (hasMore && !loadingMore) {
              loadData(false);
            }
          }}
          onEndReachedThreshold={0.2}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 16 }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyStateContainer}>
              <Ionicons name={activeTab === 'sales' ? "trending-up-outline" : "cart-outline"} size={40} color="#94A3B8" />
              <Text style={styles.emptyStateTitle}>No {activeTab} yet</Text>
            </View>
          }
        />
      )}
      {renderReviewModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    paddingTop: 40,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  transactionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  transactionTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  transactionPrice: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionUserContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionUserName: {
    fontSize: 14,
    color: '#4338CA',
    textDecorationLine: 'underline',
  },
  transactionDate: {
    fontSize: 14,
    color: '#64748B',
  },
  confirmationRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  confirmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    gap: 6,
  },
  confirmChipActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#6EE7B7',
  },
  confirmChipInactive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  confirmChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  confirmChipTextActive: {
    color: '#059669',
  },
  confirmChipTextInactive: {
    color: '#64748B',
  },
  transactionStatus: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statuscompleted: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
  statuspending: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  statuscancelled: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  statusrefunded: {
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
  },
  statusDefault: {
    backgroundColor: '#E2E8F0',
    color: '#475569',
  },
  confirmButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-end',
    gap: 6,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  addReviewButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-end',
    gap: 6,
  },
  addReviewButtonText: {
    fontWeight: '600',
    fontSize: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
  },
  centerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  passCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});