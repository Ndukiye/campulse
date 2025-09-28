import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';

type Conversation = {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
  };
  lastMessage: {
    text: string;
    timestamp: string;
    unread: boolean;
  };
  product?: {
    id: string;
    title: string;
    image: string;
  };
};

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    user: {
      id: 'user1',
      name: 'John Doe',
      avatar: 'https://picsum.photos/seed/user1/200',
      verified: true,
    },
    lastMessage: {
      text: 'Is this still available?',
      timestamp: '2m ago',
      unread: true,
    },
    product: {
      id: 'prod1',
      title: 'Canon EOS R5',
      image: 'https://picsum.photos/seed/canon/200',
    },
  },
  {
    id: '2',
    user: {
      id: 'user2',
      name: 'Jane Smith',
      avatar: 'https://picsum.photos/seed/user2/200',
      verified: false,
    },
    lastMessage: {
      text: 'I can offer ₦450,000 for it',
      timestamp: '1h ago',
      unread: false,
    },
    product: {
      id: 'prod2',
      title: 'Sony A7III',
      image: 'https://picsum.photos/seed/sony/200',
    },
  },
  {
    id: '3',
    user: {
      id: 'user3',
      name: 'Mike Johnson',
      avatar: 'https://picsum.photos/seed/user3/200',
      verified: true,
    },
    lastMessage: {
      text: 'Thanks for the quick response!',
      timestamp: '3h ago',
      unread: false,
    },
    product: {
      id: 'prod3',
      title: 'Nikon Z6',
      image: 'https://picsum.photos/seed/nikon/200',
    },
  },
];

const MessagesScreen = () => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);

  const filteredConversations = conversations.filter(conv =>
    conv.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.product?.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => navigation.navigate('Chat', { conversationId: item.id })}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
        {item.user.verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#10B981" />
          </View>
        )}
      </View>
      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.userName}>{item.user.name}</Text>
          <Text style={styles.timestamp}>{item.lastMessage.timestamp}</Text>
        </View>
        <View style={styles.messageContainer}>
          <Text 
            style={[
              styles.lastMessage,
              item.lastMessage.unread && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {item.lastMessage.text}
          </Text>
          {item.lastMessage.unread && <View style={styles.unreadDot} />}
        </View>
        {item.product && (
          <View style={styles.productPreview}>
            <Image 
              source={{ uri: item.product.image }} 
              style={styles.productImage}
            />
            <Text style={styles.productTitle} numberOfLines={1}>
              {item.product.title}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerIcon}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search conversations"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubble-ellipses-outline" size={64} color="#94A3B8" />
          <Text style={styles.emptyStateText}>No conversations yet</Text>
          <Text style={styles.emptyStateSubtext}>
            Start a conversation by messaging a seller
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingTop: 40,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    padding: 0,
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748B',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
  },
  unreadMessage: {
    color: '#1E293B',
    fontWeight: '500',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4338CA',
    marginLeft: 8,
  },
  productPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  productImage: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
  },
  productTitle: {
    flex: 1,
    fontSize: 12,
    color: '#64748B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default MessagesScreen; 