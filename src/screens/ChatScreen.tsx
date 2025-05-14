import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '../types/navigation';

// Mock data for messages
const mockMessages = [
  {
    id: '1',
    text: 'Hi, is this still available?',
    sender: 'user',
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    text: 'Yes, it is! Are you interested in buying?',
    sender: 'seller',
    timestamp: '10:32 AM',
  },
  {
    id: '3',
    text: 'Yes, I am. Can we meet on campus?',
    sender: 'user',
    timestamp: '10:33 AM',
  },
  {
    id: '4',
    text: 'Sure, I\'m usually around the Engineering Building. When would you like to meet?',
    sender: 'seller',
    timestamp: '10:35 AM',
  },
];

const ChatScreen = ({ route }) => {
  const navigation = useNavigation<RootStackNavigationProp>();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(mockMessages);
  const flatListRef = useRef(null);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleOptions = () => {
    Alert.alert(
      'Chat Options',
      'What would you like to do?',
      [
        {
          text: 'View Profile',
          onPress: () => navigation.navigate('Profile', { userId: '123' }),
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

  const handleAttachment = () => {
    Alert.alert(
      'Add Attachment',
      'Choose attachment type',
      [
        {
          text: 'Image',
          onPress: () => console.log('Image attachment'),
        },
        {
          text: 'Document',
          onPress: () => console.log('Document attachment'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const sendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: Date.now().toString(),
        text: message.trim(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
      // Scroll to bottom after sending message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.sender === 'user' ? styles.userMessage : styles.sellerMessage
    ]}>
      <View style={[
        styles.messageBubble,
        item.sender === 'user' ? styles.userBubble : styles.sellerBubble
      ]}>
        <Text style={styles.messageText}>{item.text}</Text>
        <Text style={styles.timestamp}>{item.timestamp}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>John Doe</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
        <TouchableOpacity 
          style={styles.headerIcon}
          onPress={handleOptions}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="#1E293B" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={handleAttachment}
          >
            <Ionicons name="attach" size={24} color="#6366F1" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[
              styles.sendButton,
              !message.trim() && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!message.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={message.trim() ? '#6366F1' : '#94A3B8'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 4,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  headerStatus: {
    fontSize: 14,
    color: '#10B981',
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
    borderBottomRightRadius: 4,
  },
  sellerBubble: {
    backgroundColor: '#F1F5F9',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#fff',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    fontSize: 15,
    color: '#1E293B',
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatScreen; 