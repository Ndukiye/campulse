export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          phone: string | null
          location: string | null
          verified: boolean
          rating: number
          total_reviews: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          verified?: boolean
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          phone?: string | null
          location?: string | null
          verified?: boolean
          rating?: number
          total_reviews?: number
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          seller_id: string
          title: string
          description: string
          price: number
          category: string
          condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
          brand: string | null
          model: string | null
          images: string[]
          status: 'active' | 'sold' | 'reserved' | 'deleted'
          views: number
          location: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          seller_id: string
          title: string
          description: string
          price: number
          category: string
          condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
          brand?: string | null
          model?: string | null
          images?: string[]
          status?: 'active' | 'sold' | 'reserved' | 'deleted'
          views?: number
          location?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          seller_id?: string
          title?: string
          description?: string
          price?: number
          category?: string
          condition?: 'new' | 'like-new' | 'good' | 'fair' | 'poor'
          brand?: string | null
          model?: string | null
          images?: string[]
          status?: 'active' | 'sold' | 'reserved' | 'deleted'
          views?: number
          location?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      favorites: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          participant1_id: string
          participant2_id: string
          product_id: string | null
          last_message_at: string
          created_at: string
        }
        Insert: {
          id?: string
          participant1_id: string
          participant2_id: string
          product_id?: string | null
          last_message_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          participant1_id?: string
          participant2_id?: string
          product_id?: string | null
          last_message_at?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          content?: string
          read?: boolean
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          reviewer_id: string
          reviewed_user_id: string
          product_id: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          reviewer_id: string
          reviewed_user_id: string
          product_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          reviewer_id?: string
          reviewed_user_id?: string
          product_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'message' | 'favorite' | 'review' | 'product_sold' | 'system'
          title: string
          body: string
          data: Json | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'message' | 'favorite' | 'review' | 'product_sold' | 'system'
          title: string
          body: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'message' | 'favorite' | 'review' | 'product_sold' | 'system'
          title?: string
          body?: string
          data?: Json | null
          read?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
