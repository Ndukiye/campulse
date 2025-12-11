import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type Product = {
  id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  condition: string;
  sellerVerified: boolean;
  description: string;
  datePosted: string;
};

export type RootStackParamList = {
  Auth: undefined;
  Main: {
    screen?: keyof MainTabParamList;
    params?: any;
  };
  ListingDetails: { listingId?: string; product?: Product };
  Cart: undefined;
  Checkout: { productId?: string };
  CreateListing: undefined;
  Profile: { userId?: string };
  SellerProfile: { userId: string };
  Chat: { userId: string };
  Settings: undefined;
  Messages: undefined;
  Notifications: undefined;
  PrivacySecurity: undefined;
  HelpSupport: undefined;
  AdminDashboard: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Browse: { category?: string; searchQuery?: string };
  Sell: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabNavigationProp = BottomTabNavigationProp<MainTabParamList>;
