import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  Image,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';
import { useAuth } from '../context/AuthContext';
import { pickImage, pickDocument, Attachment, formatFileSize, getFileIcon } from '../utils/chatUtils';
import {
  sendMessage as sendChatMessage,
  subscribeToMessages,
  markMessagesAsRead,
  subscribeToTypingStatus,
  updateTypingStatus,
  ensureConversation,
  Message,
} from '../services/chatService';
import { uploadChatAttachment } from '../services/storageService';
import { getProfileById } from '../services/profileService';
import { useThemeMode } from '../context/ThemeContext';

const ChatScreen = () => {
  const route = useRoute<RouteProp<import('../types/navigation').RootStackParamList, 'Chat'>>();
  const otherUserId = route.params.userId;
  const navigation = useNavigation<RootStackNavigationProp>();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [attachment, setAttachment] = useState<Attachment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<Message> | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [otherProfileName, setOtherProfileName] = useState<string>('');
  const [otherProfileAvatar, setOtherProfileAvatar] = useState<string | null>(null);
  const [otherVerified, setOtherVerified] = useState<boolean>(false);
  const { colors, isDark } = useThemeMode();
  const bannerAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const isFocused = useIsFocused();

  useEffect(() => {
    const setup = async () => {
      if (user?.id && otherUserId) {
        const conv = await ensureConversation(user.id, otherUserId);
        setConversationId(conv.id);
        const prof = await getProfileById(otherUserId);
        if (prof.data) {
          setOtherProfileName(prof.data.name ?? 'User');
          setOtherProfileAvatar(prof.data.avatar_url ?? null);
          setOtherVerified(!!prof.data.verified);
        }
        try {
          await markMessagesAsRead(conv.id, user.id);
        } catch {}
      }
    };
    setup();
  }, [user?.id, otherUserId]);

  useEffect(() => {
    // Subscribe to messages
    if (!conversationId) return;
    const unsubscribeMessages = subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages);
      if (user?.id) markMessagesAsRead(conversationId, user.id);
    });

    // Subscribe to typing status
    if (user?.id) {
      const unsubscribeTyping = subscribeToTypingStatus(
        conversationId,
        user.id,
        (isTyping) => setIsOtherTyping(isTyping)
      );

      return () => {
        unsubscribeMessages();
        unsubscribeTyping();
      };
    }

    return () => {
      unsubscribeMessages();
    };
  }, [conversationId, otherUserId, user?.id]);

  useEffect(() => {
    if (isFocused && conversationId && user?.id) {
      markMessagesAsRead(conversationId, user.id).catch(() => {});
    }
  }, [isFocused, conversationId, user?.id]);

  const handleBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const w = Dimensions.get('window').width;
    bannerAnim.setValue(w);
    let mounted = true;
    const loop = () => {
      if (!mounted) return;
      Animated.timing(bannerAnim, {
        toValue: -w,
        duration: 16000,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && mounted) {
          bannerAnim.setValue(w);
          loop();
        }
      });
    };
    loop();
    return () => { mounted = false; };
  }, [bannerAnim]);

  const handleOptions = () => {
    Alert.alert(
      'Chat Options',
      'What would you like to do?',
      [
        {
          text: 'View Profile',
          onPress: () => navigation.navigate('Profile', { userId: otherUserId }),
        },
        {
          text: 'Block User',
          onPress: () => Alert.alert('Block User', 'Are you sure you want to block this user?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Block', style: 'destructive', onPress: () => console.log('User blocked') },
          ]),
        },
        {
          text: 'Report',
          onPress: () => Alert.alert('Report User', 'Are you sure you want to report this user?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Report', style: 'destructive', onPress: () => console.log('User reported') },
          ]),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleAttachment = async () => {
    Alert.alert(
      'Add Attachment',
      'Choose attachment type',
      [
        {
          text: 'Image',
          onPress: async () => {
            const result = await pickImage();
            if (result) setAttachment(result);
          },
        },
        {
          text: 'Document',
          onPress: async () => {
            const result = await pickDocument();
            if (result) setAttachment(result);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Set typing status to true
    if (!isTyping && user?.id && conversationId) {
      setIsTyping(true);
      updateTypingStatus(conversationId, user.id, true);
    }

    // Set a timeout to set typing status to false
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (user?.id && conversationId) updateTypingStatus(conversationId, user.id, false);
    }, 2000);
  };

  const containsRestricted = (text: string) => {
    const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
    let phone = false;
    let account = false;
    const candidates = text.match(/[\+\d][\d \-\(\)]{9,}/g) ?? [];
    for (const c of candidates) {
      const n = c.replace(/[^\d]/g, '');
      if (n.length >= 11) {
        if (n.startsWith('234') && n.length >= 13) { phone = true; break; }
        if (n.startsWith('0') && n.length === 11) { phone = true; break; }
      }
      if (n.length === 10) { account = true; break; }
    }
    return email || phone || account;
  };

  const handleSend = async () => {
    if (!message.trim() && !attachment) return;
    if (!conversationId) return;

    setIsLoading(true);
    try {
      if (!user?.id) {
        Alert.alert('Sign in required', 'Please sign in to send messages.');
        setIsLoading(false);
        return;
      }
      if (message.trim()) {
        if (containsRestricted(message.trim())) {
          Alert.alert('Restricted Content', 'Remove phone numbers, bank account numbers, or emails before sending.');
          setIsLoading(false);
          return;
        }
      }
      let finalAttachment: { type: 'image' | 'document'; uri: string; name: string; size?: number; mimeType?: string } | undefined;
      if (attachment) {
        const up = await uploadChatAttachment(attachment.uri, user.id);
        if (up.error || !up.url) {
          Alert.alert('Attachment', up.error ?? 'Failed to upload attachment');
        } else {
          finalAttachment = { type: attachment.type, uri: up.url, name: attachment.name, size: attachment.size, mimeType: attachment.mimeType };
        }
      }
      const sent = await sendChatMessage(conversationId, user.id, message.trim(), finalAttachment);
      setMessages((prev) => [...prev, sent]);
      setMessage('');
      setAttachment(null);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderAttachment = () => {
    if (!attachment) return null;

    return (
      <View style={styles.attachmentPreview}>
        {attachment.type === 'image' ? (
          <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
        ) : (
          <View style={styles.documentPreview}>
            <Ionicons name={getFileIcon(attachment.mimeType) as any} size={24} color="#6366F1" />
            <Text style={styles.documentName} numberOfLines={1}>
              {attachment.name}
            </Text>
            {attachment.size && (
              <Text style={styles.documentSize}>
                {formatFileSize(attachment.size)}
              </Text>
            )}
          </View>
        )}
        <TouchableOpacity
          style={styles.removeAttachment}
          onPress={() => setAttachment(null)}
        >
          <Ionicons name="close-circle" size={20} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.senderId === user?.id ? styles.userMessage : styles.sellerMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.senderId === user?.id ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.sellerBubble, { borderColor: colors.border, backgroundColor: colors.card }]
      ]}>
        {item.attachment && (
          <View style={styles.attachmentContainer}>
            {item.attachment.type === 'image' ? (
              <Image source={{ uri: item.attachment.url }} style={styles.messageImage} />
            ) : (
              <TouchableOpacity style={styles.messageDocument}>
                <Ionicons name={getFileIcon(item.attachment.mime_type) as any} size={24} color="#6366F1" />
                <Text style={styles.documentName} numberOfLines={1}>
                  {item.attachment.name}
                </Text>
                {item.attachment.size && (
                  <Text style={styles.documentSize}>
                    {formatFileSize(item.attachment.size)}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
        {item.text && (
          <Text style={[styles.messageText, item.senderId === user?.id ? { color: '#FFFFFF' } : { color: colors.text }]}>
            {item.text}
          </Text>
        )}
        <View style={styles.messageFooter}>
          <Text style={[styles.timestamp, { color: colors.muted }]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {item.senderId === user?.id && (
            <Ionicons
              name={item.read ? "checkmark-done" : "checkmark"}
              size={16}
              color={item.read ? "#6366F1" : "#94A3B8"}
              style={styles.readReceipt}
            />
          )}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {otherProfileAvatar ? (
              <Image source={{ uri: otherProfileAvatar }} style={{ width: 24, height: 24, borderRadius: 12 }} />
            ) : null}
            <Text style={[styles.headerName, { color: colors.text }]}>{otherProfileName}</Text>
            {otherVerified && <Ionicons name="checkmark-circle" size={16} color="#10B981" />}
          </View>
          <Text style={[styles.headerStatus, { color: colors.muted }]}>
            {isOtherTyping ? 'typing...' : ''}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={handleOptions}
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>
      <View style={[styles.safetyBannerContainer, { backgroundColor: colors.card }]}> 
        <Animated.View style={{ transform: [{ translateX: bannerAnim }] }}>
          <View style={styles.safetyBannerContent}>
            <Ionicons name="alert-circle-outline" size={14} color={colors.muted} />
            <Text style={[styles.safetyBannerText, { color: colors.muted }]}>Payments outside the app are at your own risk.</Text>
          </View>
        </Animated.View>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToIndex({ index: messages.length - 1, animated: true, viewPosition: 1 });
            }
          }}
          onScrollToIndexFailed={(info) => {
            const offset = info.averageItemLength * info.index;
            flatListRef.current?.scrollToOffset({ offset, animated: true });
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({ index: info.index, animated: true, viewPosition: 1 });
            }, 100);
          }}
        />

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {renderAttachment()}
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleAttachment}
          >
            <Ionicons name="attach" size={24} color="#6366F1" />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1F2937' : '#F1F5F9', color: colors.text }]}
            placeholder="Type a message..."
            value={message}
            onChangeText={handleTyping}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              (!message.trim() && !attachment) && styles.sendButtonDisabled
            ]}
            onPress={handleSend}
            disabled={(!message.trim() && !attachment) || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  backButton: {
    marginRight: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerStatus: {
    fontSize: 12,
    color: '#64748B',
  },
  headerIcon: {
    padding: 4,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  sellerMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#6366F1',
  },
  sellerBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 15,
    color: '#1E293B',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#64748B',
  },
  readReceipt: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    fontSize: 15,
    color: '#1E293B',
    maxHeight: 100,
  },
  safetyBannerContainer: {
    height: 24,
    overflow: 'hidden',
  },
  safetyBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  safetyBannerText: {
    fontSize: 11,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  attachmentPreview: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachmentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  documentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
  },
  documentName: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#1E293B',
  },
  documentSize: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  removeAttachment: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
  },
  attachmentContainer: {
    marginBottom: 8,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  messageDocument: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 8,
  },
});

export default ChatScreen;
  
