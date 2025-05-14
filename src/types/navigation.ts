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
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ListingDetails: { listingId?: string; product?: Product };
  CreateListing: undefined;
  Profile: { userId?: string };
  Chat: { userId: string };
  Settings: undefined;
  Messages: undefined;
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