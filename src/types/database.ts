export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface ProfilesRow {
  id: string; // references auth.users(id)
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  phone?: string | null;
  location?: string | null;
  matric_number?: string | null;
  nin_document_url?: string | null;
  verification_status?: VerificationStatus | null;
  verified?: boolean | null;
  rating?: number | null; // decimal(3,2)
  total_reviews?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type ProfilesInsert = Omit<ProfilesRow, 'created_at' | 'updated_at'>;
export type ProfilesUpdate = Partial<ProfilesRow>;