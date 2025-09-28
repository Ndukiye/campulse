import { Platform } from 'react-native';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  read: boolean;
  attachment?: {
    type: 'image' | 'document';
    url: string;
    name: string;
    size?: number;
    mime_type?: string;
  };
};

export type Conversation = {
  id: string;
  participants: string[];
  last_message?: Message;
  updated_at: string;
  unread_count: { [userId: string]: number };
};

// Dummy data
const dummyMessages: Message[] = [];
const dummyConversations: Conversation[] = [];
const typingStatus: { [key: string]: boolean } = {};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  attachment?: {
    type: 'image' | 'document';
    uri: string;
    name: string;
    size?: number;
    mimeType?: string;
  }
) => {
  try {
    const message: Message = {
      id: Date.now().toString(),
      conversation_id: conversationId,
      sender_id: senderId,
      text,
      created_at: new Date().toISOString(),
      read: false,
      ...(attachment && {
        attachment: {
          type: attachment.type,
          url: attachment.uri, // For dummy data, we'll just use the URI directly
          name: attachment.name,
          size: attachment.size,
          mime_type: attachment.mimeType,
        },
      }),
    };

    dummyMessages.push(message);

    // Update conversation
    const conversation = dummyConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.last_message = message;
      conversation.updated_at = new Date().toISOString();
      conversation.unread_count = {
        ...conversation.unread_count,
        [senderId]: 0,
      };
    }

    return message.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const subscribeToMessages = (
  conversationId: string,
  onMessages: (messages: Message[]) => void
) => {
  // Initial messages
  const messages = dummyMessages.filter(m => m.conversation_id === conversationId);
  onMessages(messages);

  // Simulate real-time updates
  const interval = setInterval(() => {
    const updatedMessages = dummyMessages.filter(m => m.conversation_id === conversationId);
    onMessages(updatedMessages);
  }, 1000);

  return () => {
    clearInterval(interval);
  };
};

export const markMessagesAsRead = async (conversationId: string, userId: string) => {
  try {
    // Update conversation unread count
    const conversation = dummyConversations.find(c => c.id === conversationId);
    if (conversation) {
      conversation.unread_count = {
        ...conversation.unread_count,
        [userId]: 0,
      };
    }

    // Mark messages as read
    dummyMessages.forEach(message => {
      if (message.conversation_id === conversationId && 
          !message.read && 
          message.sender_id !== userId) {
        message.read = true;
      }
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
};

export const subscribeToTypingStatus = (
  conversationId: string,
  userId: string,
  onTypingStatus: (isTyping: boolean) => void
) => {
  const key = `${conversationId}_${userId}`;
  
  // Initial status
  onTypingStatus(typingStatus[key] || false);

  // Simulate real-time updates
  const interval = setInterval(() => {
    onTypingStatus(typingStatus[key] || false);
  }, 1000);

  return () => {
    clearInterval(interval);
  };
};

export const updateTypingStatus = async (
  conversationId: string,
  userId: string,
  isTyping: boolean
) => {
  const key = `${conversationId}_${userId}`;
  typingStatus[key] = isTyping;
};

// Helper function to add dummy conversations
export const addDummyConversation = (conversation: Conversation) => {
  dummyConversations.push(conversation);
};

// Helper function to add dummy messages
export const addDummyMessage = (message: Message) => {
  dummyMessages.push(message);
}; 