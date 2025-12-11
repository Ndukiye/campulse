import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Alert, ScrollView, Modal } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { RootStackNavigationProp } from '../types/navigation'
import { useAuth } from '../context/AuthContext'
import { useThemeMode } from '../context/ThemeContext'
import { searchProducts, type ProductSummary, deleteProduct } from '../services/productService'
import { getProfileById, updateProfile } from '../services/profileService'
import { fetchNotifications } from '../services/notificationService'
import { supabase } from '../lib/supabase'
import { APP_CATEGORIES } from '../constants/categories'

type AdminUser = {
  id: string
  name: string
  email: string
  verified: boolean
  verification_status?: import('../types/database').VerificationStatus | null
  phone?: string | null
  location?: string | null
  matric_number?: string | null
  created_at?: string | null
}

const AdminDashboardScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>()
  const { colors } = useThemeMode()
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'products' | 'transactions' | 'notifications' | 'logs'>('overview')
  const [loading, setLoading] = useState(false)

  const [users, setUsers] = useState<AdminUser[]>([])
  const [usersSearch, setUsersSearch] = useState('')
  const [usersVerifiedOnly, setUsersVerifiedOnly] = useState(false)
  const [usersPage, setUsersPage] = useState(0)
  const [usersPageSize] = useState(20)
  const [usersHasMore, setUsersHasMore] = useState(false)

  const [products, setProducts] = useState<ProductSummary[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsPage, setProductsPage] = useState(0)
  const [productsPageSize] = useState(24)
  const [productsHasMore, setProductsHasMore] = useState(false)
  const [productsCategory, setProductsCategory] = useState<string | undefined>(undefined)
  const [productsCondition, setProductsCondition] = useState<import('../types/database').ProductsRow['condition'] | 'all'>('all')
  const [productsMinPrice, setProductsMinPrice] = useState<string>('')
  const [productsMaxPrice, setProductsMaxPrice] = useState<string>('')
  const [productsSortBy, setProductsSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest')
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifBody, setNotifBody] = useState('')
  const [notifType, setNotifType] = useState<'system' | 'message' | 'favorite' | 'review' | 'product_sold'>('system')
  const [audienceVerified, setAudienceVerified] = useState(false)
  const [showRecipientModal, setShowRecipientModal] = useState(false)
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientProfile, setRecipientProfile] = useState<{ id: string, name?: string | null, email?: string | null } | null>(null)
  const [recipientQuery, setRecipientQuery] = useState('')
  const [recipientResults, setRecipientResults] = useState<any[]>([])
  const [recipientSearching, setRecipientSearching] = useState(false)
  const [expandedUserIds, setExpandedUserIds] = useState<Record<string, boolean>>({})

  const [transactions, setTransactions] = useState<any[]>([])
  const [notificationsCount, setNotificationsCount] = useState(0)
  const [overviewCounts, setOverviewCounts] = useState({
    users: 0,
    verified: 0,
    products: 0,
    transactions: 0,
    newUsersLast7Days: 0,
    newProductsLast7Days: 0,
    totalSalesValue: 0,
    pendingTransactions: 0,
  })
  const [adminsCount, setAdminsCount] = useState(0)
  const [adminLogs, setAdminLogs] = useState<any[]>([])
  const [logsPage, setLogsPage] = useState(0)
  const [logsPageSize] = useState(30)
  const [logsHasMore, setLogsHasMore] = useState(false)
  const [productsSearch, setProductsSearch] = useState('')
  const [txPage, setTxPage] = useState(0)
  const [txPageSize] = useState(20)
  const [txHasMore, setTxHasMore] = useState(false)
  const [txStatus, setTxStatus] = useState<'all' | 'pending' | 'completed' | 'cancelled' | 'refunded'>('all')

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user?.id) { setIsAdmin(false); return }
      const res = await getProfileById(user.id)
      const flag = !!res.data?.is_admin
      setIsAdmin(flag)
      if (!flag) {
        Alert.alert('Access Restricted', 'Admin actions are disabled. Set is_admin=true to enable.')
      }
    }
    checkAdmin()
  }, [user?.id])

  useEffect(() => {
    if (activeTab !== 'overview') return
    const loadOverview = async () => {
      setLoading(true)
      try {
        const { count: usersCount } = await supabase.from('profiles').select('id', { head: true, count: 'exact' })
        const { count: verifiedCount } = await supabase
          .from('profiles')
          .select('id', { head: true, count: 'exact' })
          .or('verified.eq.true,verification_status.eq.approved')
        const { count: productsCount } = await supabase.from('products').select('id', { head: true, count: 'exact' })
        const { count: txCount } = await supabase.from('transactions').select('id', { head: true, count: 'exact' })
        const { count: adminsCountVal } = await supabase.from('app_admins').select('user_id', { head: true, count: 'exact' })

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const sevenDaysAgoISO = sevenDaysAgo.toISOString()

        const { count: newUsersLast7Days } = await supabase
          .from('profiles')
          .select('id', { head: true, count: 'exact' })
          .gte('created_at', sevenDaysAgoISO)

        const { count: newProductsLast7Days } = await supabase
          .from('products')
          .select('id', { head: true, count: 'exact' })
          .gte('created_at', sevenDaysAgoISO)

        const { data: salesData } = await supabase
          .from('transactions')
          .select('amount')
          .eq('status', 'completed')

        const totalSalesValue = salesData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0

        const { count: pendingTransactions } = await supabase
          .from('transactions')
          .select('id', { head: true, count: 'exact' })
          .eq('status', 'pending')


        setOverviewCounts({
          users: usersCount ?? 0,
          verified: verifiedCount ?? 0,
          products: productsCount ?? 0,
          transactions: txCount ?? 0,
          newUsersLast7Days: newUsersLast7Days ?? 0,
          newProductsLast7Days: newProductsLast7Days ?? 0,
          totalSalesValue: totalSalesValue,
          pendingTransactions: pendingTransactions ?? 0,
        })
        setAdminsCount(adminsCountVal ?? 0)
        const notif = user?.id ? await fetchNotifications(user.id, 1) : { data: [] }
        setNotificationsCount((notif.data ?? []).length)
      } finally {
        setLoading(false)
      }
    }
    loadOverview()
  }, [user?.id, activeTab])

  const searchRecipients = async (q: string) => {
    setRecipientQuery(q)
    const s = q.trim()
    if (!s) { setRecipientResults([]); return }
    setRecipientSearching(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('id,name,email')
      .or(`name.ilike.%${s}%,email.ilike.%${s}%`)
      .limit(10)
    if (!error) setRecipientResults(data ?? [])
    setRecipientSearching(false)
  }

  useEffect(() => {
    const loadInitialRecipients = async () => {
      setRecipientSearching(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('id,name,email')
        .order('created_at', { ascending: false })
        .limit(10)
      if (error) {
        Alert.alert('Recipients', error.message)
        setRecipientResults([])
      } else {
        setRecipientResults(data ?? [])
      }
      setRecipientSearching(false)
    }
    if (showRecipientModal) {
      setRecipientQuery('')
      if (users.length) {
        setRecipientResults(users.map(u => ({ id: u.id, name: u.name, email: u.email })))
      } else {
        loadInitialRecipients()
      }
    }
  }, [showRecipientModal])

  const loadUsers = async (opts?: { append?: boolean }) => {
    setLoading(true)
    const from = usersPage * usersPageSize
    const to = from + usersPageSize - 1
    let q = supabase
      .from('profiles')
      .select('id,name,email,verified,verification_status,phone,location,matric_number,created_at')
      .order('created_at', { ascending: false })
      .range(from, to)
    if (usersSearch.trim()) {
      q = q.or(`name.ilike.%${usersSearch}%,email.ilike.%${usersSearch}%`)
    }
    if (usersVerifiedOnly) {
      q = q.or('verified.eq.true,verification_status.eq.approved')
    }
    const { data, error } = await q
    if (error) {
      Alert.alert('Error', error.message)
      setUsers([])
      setUsersHasMore(false)
    } else {
      const rows = (data ?? []).map((p: any) => ({ id: p.id, name: p.name ?? 'User', email: p.email, verified: !!p.verified, verification_status: p.verification_status ?? null, phone: p.phone ?? null, location: p.location ?? null, matric_number: p.matric_number ?? null, created_at: p.created_at ?? null }))
      setUsers(prev => (opts?.append ? prev.concat(rows) : rows))
      setUsersHasMore(rows.length === usersPageSize)
    }
    setLoading(false)
  }

  const toggleVerifyUser = async (u: AdminUser) => {
    const res = await updateProfile(u.id, { verified: !u.verified, verification_status: !u.verified ? 'approved' : 'none' })
    if (res.error) {
      const msg = res.error.includes('row-level security')
        ? 'This action requires admin privileges via a secure backend. Please configure a service role or allow admin updates in Supabase policies.'
        : res.error
      Alert.alert('Verification', msg)
      return
    }
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, verified: !u.verified, verification_status: !u.verified ? 'approved' : 'none' } : x))
    logActivity(!u.verified ? 'verify_user' : 'unverify_user', { user_id: u.id })
  }

  const loadProducts = async (opts?: { append?: boolean }) => {
    setProductsLoading(true)
    const res = await searchProducts({
      category: productsCategory,
      searchQuery: productsSearch,
      minPrice: productsMinPrice ? Number(productsMinPrice) : undefined,
      maxPrice: productsMaxPrice ? Number(productsMaxPrice) : undefined,
      condition: productsCondition,
      sortBy: productsSortBy,
      page: productsPage,
      pageSize: productsPageSize,
    })
    const rows = res.data ?? []
    setProducts(prev => (opts?.append ? prev.concat(rows) : rows))
    setProductsHasMore(rows.length === productsPageSize)
    setProductsLoading(false)
  }

  const removeProduct = async (p: ProductSummary) => {
    Alert.alert('Remove Product', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const sellerId = p.seller_id || ''
        const del = await deleteProduct(p.id, sellerId)
        if (del.error) {
          Alert.alert('Error', del.error)
        } else {
          setProducts(prev => prev.filter(x => x.id !== p.id))
          logActivity('delete_product', { product_id: p.id })
        }
      } }
    ])
  }

  const loadTransactions = async (opts?: { append?: boolean }) => {
    const from = txPage * txPageSize
    const to = from + txPageSize - 1
    let q = supabase
      .from('transactions')
      .select('id,amount,status,created_at,product:product_id(id,title),buyer:buyer_id(id,name,email),seller:seller_id(id,name,email)')
      .order('created_at', { ascending: false })
      .range(from, to)
    if (txStatus !== 'all') {
      q = q.eq('status', txStatus)
    }
    const { data, error } = await q
    if (error) {
      Alert.alert('Error', error.message)
      setTransactions([])
      setTxHasMore(false)
    } else {
      const rows = data ?? []
      setTransactions(prev => (opts?.append ? prev.concat(rows) : rows))
      setTxHasMore(rows.length === txPageSize)
    }
  }

  const loadAdminLogs = async (opts?: { append?: boolean }) => {
    const from = logsPage * logsPageSize
    const to = from + logsPageSize - 1
    const { data, error } = await supabase
      .from('admin_activity_logs')
      .select('id,admin_id,action,details,created_at,admin:admin_id(id,name,email)')
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) {
      setAdminLogs([])
      setLogsHasMore(false)
    } else {
      const rows = data ?? []
      setAdminLogs(prev => (opts?.append ? prev.concat(rows) : rows))
      setLogsHasMore(rows.length === logsPageSize)
    }
  }

  useEffect(() => {
    if (activeTab === 'users') { setUsersPage(0); loadUsers() }
    if (activeTab === 'products') { setProductsPage(0); loadProducts() }
    if (activeTab === 'transactions') { setTxPage(0); loadTransactions() }
    if (activeTab === 'logs') { setLogsPage(0); loadAdminLogs() }
  }, [activeTab])

  const logActivity = async (action: string, details?: any) => {
    try {
      if (!isAdmin || !user?.id) return
      await supabase.from('admin_activity_logs').insert([{ admin_id: user.id, action, details: details ?? null }])
    } catch (_) { /* ignore logging errors */ }
  }

  useEffect(() => {
    if (isAdmin) {
      logActivity('enter_dashboard')
    }
    return () => { if (isAdmin) logActivity('exit_dashboard') }
  }, [isAdmin])

  const renderUser = ({ item }: { item: AdminUser }) => (
    <View style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.itemSub, { color: colors.muted }]}>{item.email}</Text>
        {expandedUserIds[item.id] && (
          <View style={styles.detailsBox}>
            <Text style={[styles.detailsText, { color: colors.muted }]}>Phone: {item.phone ?? 'N/A'}</Text>
            <Text style={[styles.detailsText, { color: colors.muted }]}>Location: {item.location ?? 'N/A'}</Text>
            <Text style={[styles.detailsText, { color: colors.muted }]}>Matric: {item.matric_number ?? 'N/A'}</Text>
            <Text style={[styles.detailsText, { color: colors.muted }]}>Joined: {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}</Text>
            <Text style={[styles.detailsText, { color: colors.muted }]}>Status: {item.verification_status ?? 'none'}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={styles.verifyButton}
        onPress={() => {
          if (!isAdmin) return
          Alert.alert(
            item.verified ? 'Unverify User' : 'Verify User',
            `Are you sure you want to ${item.verified ? 'remove verification from' : 'verify'} ${item.name}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: item.verified ? 'Unverify' : 'Verify', style: 'destructive', onPress: () => toggleVerifyUser(item) },
            ]
          )
        }}
        disabled={!isAdmin}
      >
        <Ionicons name={item.verified ? 'shield-checkmark' : 'shield-outline'} size={18} color={item.verified ? '#10B981' : '#64748B'} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.expandButton} onPress={() => setExpandedUserIds(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
        <Ionicons name={expandedUserIds[item.id] ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
      </TouchableOpacity>
    </View>
  )

  const renderProduct = ({ item }: { item: ProductSummary }) => (
    <View style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.itemSub, { color: colors.muted }]}>₦{(item.price ?? 0).toLocaleString()}</Text>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => removeProduct(item)}>
        <Ionicons name="trash" size={18} color="#EF4444" />
      </TouchableOpacity>
    </View>
  )

  const renderTransaction = ({ item }: { item: any }) => (
    <View style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>{item.product?.title ?? 'Product'}</Text>
        <Text style={[styles.itemSub, { color: colors.muted }]}>₦{Number(item.amount ?? 0).toLocaleString()} • {String(item.status)}</Text>
        <Text style={[styles.itemSub, { color: colors.muted }]}>Buyer: {item.buyer?.name ?? 'N/A'} ({item.buyer?.email ?? 'N/A'})</Text>
        <Text style={[styles.itemSub, { color: colors.muted }]}>Seller: {item.seller?.name ?? 'N/A'} ({item.seller?.email ?? 'N/A'})</Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>Admin Dashboard</Text>
        <View style={styles.headerIcon} />
      </View>

      <View style={[styles.tabsBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}> 
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScrollContent}>
          {([
            { key: 'overview', label: 'Overview' },
            { key: 'users', label: 'Users' },
            { key: 'products', label: 'Products' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'notifications', label: 'Notifications' },
            { key: 'logs', label: 'Logs' },
          ] as const).map(t => (
            <TouchableOpacity key={t.key} style={[styles.tabItem, activeTab === t.key && styles.tabItemActive]} onPress={() => setActiveTab(t.key)}>
              <Text style={[styles.tabItemText, activeTab === t.key && styles.tabItemTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {activeTab === 'overview' && (
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          {loading ? <ActivityIndicator size="large" color="#6366F1" /> : (
            <>
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, styles.metricCardLeft, { borderColor: colors.border }]}> 
                  <Ionicons name="people-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Users</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{overviewCounts.users}</Text>
                </View>
                <View style={[styles.metricCard, { borderColor: colors.border }]}> 
                  <Ionicons name="shield-checkmark-outline" size={20} color="#10B981" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Verified</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{overviewCounts.verified}</Text>
                </View>
              </View>
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, styles.metricCardLeft, { borderColor: colors.border }]}> 
                  <Ionicons name="person-add-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>New Users (7 Days)</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{overviewCounts.newUsersLast7Days}</Text>
                </View>
                <View style={[styles.metricCard, { borderColor: colors.border }]}> 
                  <Ionicons name="cube-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Products</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{overviewCounts.products}</Text>
                </View>
              </View>
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, styles.metricCardLeft, { borderColor: colors.border }]}> 
                  <Ionicons name="pricetags-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>New Products (7 Days)</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{overviewCounts.newProductsLast7Days}</Text>
                </View>
                <View style={[styles.metricCard, { borderColor: colors.border }]}> 
                  <Ionicons name="cash-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Total Sales Value</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>₦{overviewCounts.totalSalesValue.toLocaleString()}</Text>
                </View>
              </View>
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, styles.metricCardLeft, { borderColor: colors.border }]}> 
                  <Ionicons name="receipt-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Transactions</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{overviewCounts.transactions}</Text>
                </View>
                <View style={[styles.metricCard, { borderColor: colors.border }]}> 
                  <Ionicons name="time-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Pending Transactions</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{overviewCounts.pendingTransactions}</Text>
                </View>
              </View>
              <View style={styles.metricsRow}>
                <View style={[styles.metricCard, styles.metricCardLeft, { borderColor: colors.border }]}> 
                  <Ionicons name="key-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Admins</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{adminsCount}</Text>
                </View>
                <View style={[styles.metricCard, { borderColor: colors.border }]}> 
                  <Ionicons name="document-text-outline" size={20} color="#6366F1" />
                  <Text style={[styles.metricLabel, { color: colors.muted }]}>Notifications</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{notificationsCount}</Text>
                </View>
              </View>
              {/* Charts removed per request */}
            </>
          )}
        </View>
      )}

      {activeTab === 'users' && (
        <View style={{ flex: 1 }}>
          <View style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput style={[styles.toolbarInput, { color: colors.text }]} placeholder="Search users" value={usersSearch} onChangeText={setUsersSearch} placeholderTextColor={colors.muted} />
            <TouchableOpacity style={styles.toolbarButton} onPress={() => { setUsersPage(0); loadUsers() }}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolbarChip, usersVerifiedOnly && styles.toolbarChipActive]} onPress={() => { setUsersVerifiedOnly(!usersVerifiedOnly); setUsersPage(0); loadUsers() }}>
              <Ionicons name="shield-checkmark-outline" size={14} color={usersVerifiedOnly ? '#FFFFFF' : colors.text} />
              <Text style={[styles.toolbarChipText, { color: usersVerifiedOnly ? '#FFFFFF' : colors.text }]}>Verified</Text>
            </TouchableOpacity>
          </View>
          {loading ? <ActivityIndicator size="large" color="#6366F1" /> : (
            <FlatList data={users} renderItem={renderUser} keyExtractor={u => u.id} contentContainerStyle={styles.list} />
          )}
          {(usersHasMore || usersPage > 0) && (
          <View style={styles.paginationRow}>
            <TouchableOpacity style={[styles.pageButton, { borderColor: colors.border }]} disabled={usersPage === 0 || loading} onPress={() => { const next = Math.max(0, usersPage - 1); setUsersPage(next); loadUsers() }}>
              <Ionicons name="chevron-back" size={16} color={colors.text} />
              <Text style={[styles.pageButtonText, { color: colors.text }]}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pageButton, { borderColor: colors.border }]} disabled={!usersHasMore || loading} onPress={() => { const next = usersPage + 1; setUsersPage(next); loadUsers({ append: true }) }}>
              <Text style={[styles.pageButtonText, { color: colors.text }]}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          )}
        </View>
      )}

      {activeTab === 'products' && (
        <View style={{ flex: 1 }}>
          <View style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Ionicons name="search" size={16} color={colors.muted} />
            <TextInput style={[styles.toolbarInput, { color: colors.text }]} placeholder="Search products" value={productsSearch} onChangeText={setProductsSearch} placeholderTextColor={colors.muted} />
            <TouchableOpacity style={styles.toolbarButton} onPress={() => { setProductsPage(0); loadProducts() }}>
              <Ionicons name="refresh" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TouchableOpacity style={[styles.toolbarChip, productsSortBy === 'newest' && styles.toolbarChipActive]} onPress={() => { setProductsSortBy('newest'); setProductsPage(0); loadProducts() }}>
              <Text style={[styles.toolbarChipText, { color: productsSortBy === 'newest' ? '#FFFFFF' : colors.text }]}>Newest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolbarChip, productsSortBy === 'price_asc' && styles.toolbarChipActive]} onPress={() => { setProductsSortBy('price_asc'); setProductsPage(0); loadProducts() }}>
              <Text style={[styles.toolbarChipText, { color: productsSortBy === 'price_asc' ? '#FFFFFF' : colors.text }]}>Price ↑</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toolbarChip, productsSortBy === 'price_desc' && styles.toolbarChipActive]} onPress={() => { setProductsSortBy('price_desc'); setProductsPage(0); loadProducts() }}>
              <Text style={[styles.toolbarChipText, { color: productsSortBy === 'price_desc' ? '#FFFFFF' : colors.text }]}>Price ↓</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TouchableOpacity style={[styles.toolbarChip, productsCategory && styles.toolbarChipActive]} onPress={() => setShowCategoryPicker(true)}>
              <Ionicons name="list-circle-outline" size={14} color={productsCategory ? '#FFFFFF' : colors.text} />
              <Text style={[styles.toolbarChipText, { color: productsCategory ? '#FFFFFF' : colors.text }]}>{productsCategory ?? 'Category'}</Text>
            </TouchableOpacity>
            <TextInput style={[styles.toolbarInput, { color: colors.text }]} placeholder="Min ₦" keyboardType="numeric" value={productsMinPrice} onChangeText={setProductsMinPrice} placeholderTextColor={colors.muted} />
            <TextInput style={[styles.toolbarInput, { color: colors.text }]} placeholder="Max ₦" keyboardType="numeric" value={productsMaxPrice} onChangeText={setProductsMaxPrice} placeholderTextColor={colors.muted} />
            <TouchableOpacity style={styles.toolbarButton} onPress={() => { setProductsPage(0); loadProducts() }}>
              <Ionicons name="filter" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Modal visible={showCategoryPicker} transparent animationType="fade" onRequestClose={() => setShowCategoryPicker(false)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                {APP_CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat.id} style={styles.modalItem} onPress={() => { setProductsCategory(cat.name); setShowCategoryPicker(false); }}>
                    <Ionicons name={cat.icon} size={16} color={colors.primary} />
                    <Text style={[styles.modalItemText, { color: colors.text }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={styles.modalClose} onPress={() => setShowCategoryPicker(false)}>
                  <Text style={{ color: '#DC2626', fontWeight: '600' }}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
          {productsLoading ? <ActivityIndicator size="large" color="#6366F1" /> : (
            <FlatList data={products} renderItem={renderProduct} keyExtractor={p => p.id} contentContainerStyle={styles.list} />
          )}
          {(productsHasMore || productsPage > 0) && (
          <View style={styles.paginationRow}>
            <TouchableOpacity style={[styles.pageButton, { borderColor: colors.border }]} disabled={productsPage === 0 || productsLoading} onPress={() => { const next = Math.max(0, productsPage - 1); setProductsPage(next); loadProducts() }}>
              <Ionicons name="chevron-back" size={16} color={colors.text} />
              <Text style={[styles.pageButtonText, { color: colors.text }]}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pageButton, { borderColor: colors.border }]} disabled={!productsHasMore || productsLoading} onPress={() => { const next = productsPage + 1; setProductsPage(next); loadProducts({ append: true }) }}>
              <Text style={[styles.pageButtonText, { color: colors.text }]}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          )}
        </View>
      )}

      {activeTab === 'transactions' && (
        <View style={{ flex: 1 }}> 
          <View style={[styles.toolbarTabsBar, { borderBottomColor: colors.border }]}> 
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarTabsScroll}>
              {(['all','pending','completed','cancelled','refunded'] as const).map(s => (
              <TouchableOpacity key={s} style={[styles.toolbarTabItem, txStatus === s && styles.toolbarTabItemActive]} onPress={() => { setTxStatus(s); setTxPage(0); loadTransactions(); logActivity('select_tx_status', { status: s }) }}>
                <Text style={[styles.toolbarTabItemText, txStatus === s && styles.toolbarTabItemTextActive]}>{s[0].toUpperCase() + s.slice(1)}</Text>
              </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <FlatList data={transactions} renderItem={renderTransaction} keyExtractor={t => t.id} contentContainerStyle={styles.list} />
          {(txHasMore || txPage > 0) && (
          <View style={styles.paginationRow}>
            <TouchableOpacity style={[styles.pageButton, { borderColor: colors.border }]} disabled={txPage === 0} onPress={() => { const next = Math.max(0, txPage - 1); setTxPage(next); loadTransactions() }}>
              <Ionicons name="chevron-back" size={16} color={colors.text} />
              <Text style={[styles.pageButtonText, { color: colors.text }]}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.pageButton, { borderColor: colors.border }]} disabled={!txHasMore} onPress={() => { const next = txPage + 1; setTxPage(next); loadTransactions({ append: true }) }}>
              <Text style={[styles.pageButtonText, { color: colors.text }]}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.text} />
            </TouchableOpacity>
          </View>
          )}
        </View>
      )}

      {activeTab === 'notifications' && (
        <View style={[styles.card, { backgroundColor: colors.card }]}> 
          <View style={[styles.toolbarTabsBar, { borderBottomColor: colors.border }]}> 
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolbarTabsScroll}>
              {([
                { key: 'system', label: 'System' },
                { key: 'message', label: 'Message' },
                { key: 'favorite', label: 'Favourite' },
                { key: 'review', label: 'Review' },
                { key: 'product_sold', label: 'Product Sold' },
              ] as const).map(t => (
                <TouchableOpacity key={t.key} style={[styles.toolbarTabItem, notifType === t.key && styles.toolbarTabItemActive]} onPress={() => setNotifType(t.key)}>
                  <Text style={[styles.toolbarTabItemText, notifType === t.key && styles.toolbarTabItemTextActive]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TextInput style={[styles.toolbarInput, { color: colors.text }]} placeholder="Title" value={notifTitle} onChangeText={setNotifTitle} placeholderTextColor={colors.muted} />
          </View>
          <View style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <TextInput style={[styles.toolbarInput, { color: colors.text }]} placeholder="Message" value={notifBody} onChangeText={setNotifBody} placeholderTextColor={colors.muted} />
            {notifType !== 'message' && (
              <TouchableOpacity style={[styles.toolbarChip, audienceVerified && styles.toolbarChipActive]} onPress={() => setAudienceVerified(!audienceVerified)}>
                <Text style={[styles.toolbarChipText, { color: audienceVerified ? '#FFFFFF' : colors.text }]}>Only Verified</Text>
              </TouchableOpacity>
            )}
          </View>
          {notifType === 'message' && (
            <View style={[styles.toolbar, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <TouchableOpacity style={[styles.toolbarChip, recipientProfile && styles.toolbarChipActive]} onPress={() => setShowRecipientModal(true)}>
                <Ionicons name="person-circle-outline" size={14} color={recipientProfile ? '#FFFFFF' : colors.text} />
                <Text style={[styles.toolbarChipText, { color: recipientProfile ? '#FFFFFF' : colors.text }]}>{recipientProfile ? (recipientProfile.name || recipientProfile.email || 'Selected User') : 'Choose Recipient'}</Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity style={styles.broadcastButton} onPress={async () => {
            if (!notifTitle.trim() || !notifBody.trim()) {
              Alert.alert('Broadcast', 'Enter a title and message')
              return
            }
            Alert.alert('Confirm Broadcast', 'Send this notification?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Send', style: 'destructive', onPress: async () => {
                if (notifType === 'message') {
                  if (!recipientProfile?.id) { Alert.alert('Message', 'Select a user to message'); return }
                  const { error } = await supabase.from('notifications').insert([{ user_id: recipientProfile.id, type: 'message', title: notifTitle.trim(), body: notifBody.trim(), data: null, read: false }])
                  if (error) Alert.alert('Error', error.message)
                  else {
                    Alert.alert('Message', 'Notification sent to user')
                    setNotifTitle('')
                    setNotifBody('')
                    setRecipientProfile(null)
                    logActivity('message_user', { recipient_id: recipientProfile.id })
                  }
                  return
                }
                const q = supabase.from('profiles').select('id')
                const { data: usersList } = audienceVerified ? await q.or('verified.eq.true,verification_status.eq.approved') : await q
                const rows = (usersList ?? []).map((u: any) => ({ user_id: u.id, type: notifType, title: notifTitle.trim(), body: notifBody.trim(), data: null, read: false }))
                const { error } = await supabase.from('notifications').insert(rows)
                if (error) Alert.alert('Error', error.message)
                else { 
                  Alert.alert('Broadcast', 'Notification sent')
                  setNotifTitle('')
                  setNotifBody('')
                  logActivity('broadcast', { type: notifType, audienceVerified }) 
                }
              } }
            ])
          }}>
            <Ionicons name="megaphone-outline" size={18} color="#FFFFFF" />
            <Text style={styles.broadcastText}>Send Broadcast</Text>
          </TouchableOpacity>
          <Modal visible={showRecipientModal} transparent animationType="fade" onRequestClose={() => setShowRecipientModal(false)}>
            <View style={styles.modalBackdrop}>
              <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}> 
                <Text style={{ fontWeight: '600', color: colors.text, marginBottom: 8 }}>Select Recipient</Text>
                <TextInput style={[styles.recipientInput, { color: colors.text, borderColor: colors.border }]} placeholder="Search name or email" value={recipientQuery} onChangeText={searchRecipients} placeholderTextColor={colors.muted} />
                <View style={{ maxHeight: 240, marginTop: 8 }}>
                  {recipientSearching ? (
                    <ActivityIndicator size="small" color="#6366F1" />
                  ) : recipientResults.length > 0 ? (
                    <FlatList
                      data={recipientResults}
                      keyExtractor={(r) => r.id}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity style={styles.modalItem} onPress={() => { setRecipientProfile({ id: item.id, name: item.name, email: item.email }); setShowRecipientModal(false) }}>
                          <Ionicons name="person-circle-outline" size={16} color={colors.primary} />
                          <Text style={[styles.modalItemText, { color: colors.text }]}>{item.name || 'User'} ({item.email})</Text>
                        </TouchableOpacity>
                      )}
                    />
                  ) : (
                    <Text style={{ color: colors.muted }}>Start typing to search users</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
                  <TouchableOpacity style={styles.toolbarButton} onPress={() => setShowRecipientModal(false)}>
                    <Text style={{ color: '#DC2626', fontWeight: '600' }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}

      {activeTab === 'logs' && (
        <View style={{ flex: 1 }}>
          <FlatList data={adminLogs} keyExtractor={(l) => l.id} renderItem={({ item }) => (
            <View style={[styles.listItem, { backgroundColor: colors.card, borderColor: colors.border }]}> 
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{String(item.action)}</Text>
                <Text style={[styles.itemSub, { color: colors.muted }]}>{new Date(item.created_at).toLocaleString()}</Text>
                <Text style={[styles.itemSub, { color: colors.muted }]}>{`Admin ${item.admin?.name ?? item.admin?.email ?? ''}`}</Text>
                {item.details && <Text style={[styles.itemSub, { color: colors.muted }]} numberOfLines={2}>{JSON.stringify(item.details)}</Text>}
              </View>
            </View>
          )} contentContainerStyle={styles.list} />
          {(logsHasMore || logsPage > 0) && (
            <View style={styles.paginationRow}>
              <TouchableOpacity style={[styles.pageButton, { borderColor: colors.border }]} disabled={logsPage === 0} onPress={() => { const next = Math.max(0, logsPage - 1); setLogsPage(next); loadAdminLogs() }}>
                <Ionicons name="chevron-back" size={16} color={colors.text} />
                <Text style={[styles.pageButtonText, { color: colors.text }]}>Prev</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pageButton, { borderColor: colors.border }]} disabled={!logsHasMore} onPress={() => { const next = logsPage + 1; setLogsPage(next); loadAdminLogs({ append: true }) }}>
                <Text style={[styles.pageButtonText, { color: colors.text }]}>Next</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 0,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabsBar: {
    borderBottomWidth: 1,
    marginBottom: 6,
  },
  tabsScrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: '#6366F1',
  },
  tabItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabItemTextActive: {
    color: '#1E293B',
  },
  card: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  chartCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'stretch',
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 50,
    marginTop: 8,
  },
  chartBar: {
    width: 10,
    marginRight: 6,
    backgroundColor: '#6366F1',
    borderRadius: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricCard: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricCardLeft: {
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  toolbarInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  toolbarButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toolbarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  toolbarChipActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  toolbarChipText: {
    marginLeft: 4,
    fontSize: 13,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  detailsBox: {
    marginTop: 8,
    width: '100%',
  },
  detailsText: {
    fontSize: 12,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSub: {
    fontSize: 13,
    marginTop: 2,
  },
  verifyButton: {
    padding: 8,
    borderRadius: 8,
  },
  expandButton: {
    padding: 8,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
  },
  paginationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 24,
    marginTop: 10,
  },
  pageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  pageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  broadcastButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    borderRadius: 8,
  },
  broadcastText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  toolbarScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toolbarTabsBar: {
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  toolbarTabsScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  toolbarTabItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  toolbarTabItemActive: {
    borderBottomColor: '#6366F1',
  },
  toolbarTabItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  toolbarTabItemTextActive: {
    color: '#1E293B',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSheet: {
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  recipientInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalClose: {
    marginTop: 8,
    alignSelf: 'flex-end',
  },
})


export default AdminDashboardScreen
