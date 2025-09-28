import { Ionicons } from '@expo/vector-icons';

export interface AppCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const APP_CATEGORIES: AppCategory[] = [
  { id: '1', name: 'Textbooks', icon: 'book' },
  { id: '2', name: 'Electronics', icon: 'laptop' },
  { id: '3', name: 'Dorm & Home', icon: 'home' },
  { id: '4', name: 'Fashion', icon: 'shirt' },
  { id: '5', name: 'Sports', icon: 'basketball' },
  { id: '6', name: 'Tickets', icon: 'ticket' },
  { id: '7', name: 'Services', icon: 'construct' },
  { id: '8', name: 'Other', icon: 'apps' },
]; 