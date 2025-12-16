export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface ProfilesRow {
  id: string; // references auth.users(id)
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  matric_number?: string | null;
  nin_document_url?: string | null;
  verification_status?: VerificationStatus | null;
  verified?: boolean | null;
  is_admin?: boolean | null;
  rating?: number | null; // decimal(3,2)
  total_reviews?: number | null;
  paystack_recipient_code?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  expo_push_token?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ProfilesInsert = Omit<ProfilesRow, 'created_at' | 'updated_at'>;
export type ProfilesUpdate = Partial<ProfilesRow>;

export interface CategoriesRow {
  id: string;
  name: string;
  created_at?: string | null;
}

export interface ProductsRow {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  available_quantity?: number | null;
  images: string[] | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ProductsInsert = Omit<ProductsRow, 'id' | 'created_at' | 'updated_at'>;
export type ProductsUpdate = Partial<ProductsRow> & { id: string };

export interface NotificationsRow {
  id: string
  user_id: string
  type: 'message' | 'favorite' | 'review' | 'product_sold' | 'system'
  title: string
  body: string
  data?: any
  read: boolean
  created_at?: string | null
}
