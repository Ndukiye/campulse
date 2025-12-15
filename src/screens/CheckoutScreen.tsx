import React, { useEffect, useState } from 'react'
import { View, Text, SafeAreaView, TouchableOpacity, FlatList, StyleSheet, Image, Platform, Linking, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeMode } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { listCartItems } from '../services/cartService'
import { checkoutCartPaystack, checkoutSingle } from '../services/orderService'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { RootStackNavigationProp, RootStackParamList } from '../types/navigation'
import { getProductById } from '../services/productService'
import { useToast } from '../context/ToastContext'

export default function CheckoutScreen() {
  const { colors } = useThemeMode()
  const { user } = useAuth()
  const nav = useNavigation<RootStackNavigationProp>()
  const route = useRoute<RouteProp<RootStackParamList, 'Checkout'>>()
  const productId = route.params?.productId
  const toast = useToast()

  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    if (productId) {
      const r = await getProductById(productId)
      if (r.error || !r.data) { Alert.alert('Checkout', r.error ?? 'Product unavailable'); setLoading(false); return }
      setItems([{ id: r.data.id, quantity: 1, product: r.data }])
    } else if (user?.id) {
      const r = await listCartItems(user.id)
      if (r.error) Alert.alert('Checkout', r.error)
      setItems(r.data ?? [])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id, productId])

  const subtotal = items.reduce((sum, it) => sum + (Number(it.product?.price ?? 0) * Number(it.quantity ?? 1)), 0)

  const placeOrder = async () => {
    if (!user?.id) { Alert.alert('Checkout', 'Sign in required'); return }
    const r = productId ? await checkoutSingle(user.id, productId) : await checkoutCartPaystack(user.id)
    if (r.error) Alert.alert('Checkout', r.error)
    else {
      toast.show('Payment', 'Opening Paystack for secure payment', 'info')
      nav.goBack()
    }
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}> 
      <Image source={{ uri: item.product?.images?.[0] ?? 'https://placehold.co/80' }} style={styles.itemImage} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{item.product?.title ?? 'Item'}</Text>
        <Text style={[styles.itemMeta, { color: colors.muted }]}>Qty: {item.quantity} • ₦{Number(item.product?.price ?? 0).toLocaleString()}</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#6366F1' }]}>Checkout</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(x) => x.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={!loading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: colors.muted }}>No items to checkout</Text>
          </View>
        ) : null}
      />

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}> 
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.muted }]}>Subtotal</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>₦{subtotal.toLocaleString()}</Text>
        </View>
        <View style={[styles.notice, { borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
          <Text style={[styles.noticeText, { color: colors.muted }]}>
            Delivery is handled by buyer and seller directly. CamPulse does not provide delivery.
          </Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={placeOrder}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
          <Text style={styles.checkoutText}>Place Order</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },

  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  itemImage: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  itemMeta: { fontSize: 12 },

  footer: { padding: 16, borderTopWidth: 1 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 16, fontWeight: '700' },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 12, borderRadius: 10 },
  checkoutText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
  notice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, marginTop: 10, padding: 10, borderRadius: 10 },
  noticeText: { fontSize: 12, marginLeft: 8 },
}) 
