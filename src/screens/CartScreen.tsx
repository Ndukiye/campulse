import React, { useEffect, useState } from 'react'
import { View, Text, SafeAreaView, TouchableOpacity, FlatList, StyleSheet, Image, Platform, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeMode } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { listCartItems, removeFromCart } from '../services/cartService'
import { getProfileById } from '../services/profileService'
import { RootStackNavigationProp } from '../types/navigation'
import { useNavigation } from '@react-navigation/native'
import { useToast } from '../context/ToastContext'

export default function CartScreen() {
  const { colors } = useThemeMode()
  const { user } = useAuth()
  const nav = useNavigation<RootStackNavigationProp>()
  const [items, setItems] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const toast = useToast()

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    const r = await listCartItems(user.id)
    if (r.error) Alert.alert('Cart', r.error)
    setItems(r.data ?? [])
    const rows = r.data ?? []
    const sellerIds = Array.from(new Set(rows.map((it: any) => it.product?.seller_id).filter(Boolean)))
    const profileMap: Record<string, string> = {}
    await Promise.all(sellerIds.map(async (sid: string) => {
      const pr = await getProfileById(sid)
      profileMap[sid] = pr.data?.name ?? 'Seller'
    }))
    const bySeller: Record<string, any[]> = {}
    rows.forEach((it: any) => {
      const sid = it.product?.seller_id || 'unknown'
      bySeller[sid] = bySeller[sid] || []
      bySeller[sid].push(it)
    })
    const grouped = Object.keys(bySeller).map((sid) => ({ sellerId: sid, sellerName: profileMap[sid] ?? 'Seller', items: bySeller[sid] }))
    setGroups(grouped)
    setLoading(false)
  }

  useEffect(() => { load() }, [user?.id])

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity onPress={() => nav.navigate('ListingDetails', { listingId: item.product?.id })}>
      <View style={[styles.itemRow, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Image source={{ uri: item.product?.images?.[0] ?? 'https://placehold.co/80' }} style={styles.itemImage} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{item.product?.title ?? 'Item'}</Text>
          <Text style={[styles.itemMeta, { color: colors.muted }]}>Qty: {item.quantity} • ₦{Number(item.product?.price ?? 0).toLocaleString()}</Text>
        </View>
        <TouchableOpacity onPress={async () => {
          const r = await removeFromCart(user!.id, item.product.id)
          if (r.error) Alert.alert('Cart', r.error)
          else load()
        }}>
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}> 
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#6366F1' }]}>Cart</Text>
      </View>

      <View style={[styles.notice, { backgroundColor: colors.card, borderColor: colors.border }]}> 
        <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
        <Text style={[styles.noticeText, { color: colors.muted, marginLeft: 8 }]}>Items may be from different sellers. Delivery is handled by buyer and seller directly. CamPulse does not provide delivery.</Text>
      </View>

      <FlatList
        data={groups}
        keyExtractor={(g) => g.sellerId}
        renderItem={({ item: group }) => (
          <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            <View style={styles.sellerHeader}> 
              <Ionicons name="person-circle-outline" size={20} color={colors.text} />
              <Text style={[styles.sellerName, { color: colors.text, marginLeft: 8 }]}>{group.sellerName}</Text>
            </View>
            {group.items.map((it: any) => (
              <View key={it.id} style={{ marginBottom: 12 }}>
                {renderItem({ item: it })}
              </View>
            ))}
          </View>
        )}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 16 }}
        ListEmptyComponent={!loading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <Text style={{ color: colors.muted }}>Your cart is empty</Text>
          </View>
        ) : null}
      />

      <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.card }]}> 
        <TouchableOpacity style={styles.checkoutBtn} onPress={() => nav.navigate('Checkout', {})}>
          <Ionicons name="cash-outline" size={18} color="#fff" />
          <Text style={styles.checkoutText}>Proceed to Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', paddingHorizontal: 16, paddingVertical: 8, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#6366F1' },

  notice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, margin: 16, padding: 12, borderRadius: 10 },
  noticeText: { fontSize: 12 },

  itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  itemImage: { width: 48, height: 48, borderRadius: 8, marginRight: 12 },
  itemTitle: { fontSize: 15, fontWeight: '600' },
  itemMeta: { fontSize: 12 },

  sellerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sellerName: { fontSize: 13, fontWeight: '600' },

  footer: { padding: 16, borderTopWidth: 1 },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366F1', paddingVertical: 12, borderRadius: 10 },
  checkoutText: { color: '#fff', fontWeight: '600', marginLeft: 8 },
})
