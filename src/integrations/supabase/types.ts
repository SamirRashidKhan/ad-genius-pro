export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advertisements: {
        Row: {
          ad_type: string
          ai_captions: string | null
          ai_script: string | null
          audio_prompt: string | null
          audio_type: string | null
          audio_url: string | null
          business_id: string
          created_at: string
          duration_seconds: number | null
          final_url: string | null
          has_watermark: boolean | null
          id: string
          max_revisions: number | null
          platforms: string[] | null
          preview_url: string | null
          revision_count: number | null
          shop_video_url: string | null
          status: string
          title: string
          tokens_spent: number | null
          updated_at: string
          user_id: string
          video_segments: Json | null
        }
        Insert: {
          ad_type: string
          ai_captions?: string | null
          ai_script?: string | null
          audio_prompt?: string | null
          audio_type?: string | null
          audio_url?: string | null
          business_id: string
          created_at?: string
          duration_seconds?: number | null
          final_url?: string | null
          has_watermark?: boolean | null
          id?: string
          max_revisions?: number | null
          platforms?: string[] | null
          preview_url?: string | null
          revision_count?: number | null
          shop_video_url?: string | null
          status?: string
          title: string
          tokens_spent?: number | null
          updated_at?: string
          user_id: string
          video_segments?: Json | null
        }
        Update: {
          ad_type?: string
          ai_captions?: string | null
          ai_script?: string | null
          audio_prompt?: string | null
          audio_type?: string | null
          audio_url?: string | null
          business_id?: string
          created_at?: string
          duration_seconds?: number | null
          final_url?: string | null
          has_watermark?: boolean | null
          id?: string
          max_revisions?: number | null
          platforms?: string[] | null
          preview_url?: string | null
          revision_count?: number | null
          shop_video_url?: string | null
          status?: string
          title?: string
          tokens_spent?: number | null
          updated_at?: string
          user_id?: string
          video_segments?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_assets: {
        Row: {
          asset_type: string
          business_id: string
          created_at: string
          file_name: string | null
          file_url: string
          id: string
        }
        Insert: {
          asset_type: string
          business_id: string
          created_at?: string
          file_name?: string | null
          file_url: string
          id?: string
        }
        Update: {
          asset_type?: string
          business_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_assets_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          brand_tone: string | null
          category: string | null
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          marketing_goal: string | null
          name: string
          onboarding_completed: boolean | null
          target_age_max: number | null
          target_age_min: number | null
          target_gender: string | null
          target_location: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_tone?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          marketing_goal?: string | null
          name: string
          onboarding_completed?: boolean | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_gender?: string | null
          target_location?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_tone?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          marketing_goal?: string | null
          name?: string
          onboarding_completed?: boolean | null
          target_age_max?: number | null
          target_age_min?: number | null
          target_gender?: string | null
          target_location?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          ad_description: string | null
          ad_title: string | null
          advertisement_id: string
          budget_inr: number | null
          clicks: number | null
          created_at: string
          description: string | null
          duration_days: number | null
          end_date: string | null
          id: string
          impressions: number | null
          platform: string
          reach: number | null
          start_date: string | null
          status: string
          target_audience: Json | null
          updated_at: string
          user_id: string
          views: number | null
        }
        Insert: {
          ad_description?: string | null
          ad_title?: string | null
          advertisement_id: string
          budget_inr?: number | null
          clicks?: number | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          platform: string
          reach?: number | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
          user_id: string
          views?: number | null
        }
        Update: {
          ad_description?: string | null
          ad_title?: string | null
          advertisement_id?: string
          budget_inr?: number | null
          clicks?: number | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          platform?: string
          reach?: number | null
          start_date?: string | null
          status?: string
          target_audience?: Json | null
          updated_at?: string
          user_id?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_advertisement_id_fkey"
            columns: ["advertisement_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      token_packages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price_inr: number
          tokens: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price_inr: number
          tokens: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_inr?: number
          tokens?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_role_audit: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tokens: {
        Row: {
          balance: number
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_ad_with_tokens: {
        Args: {
          _ad_type: string
          _business_id: string
          _duration_seconds: number
          _platforms: string[]
          _title: string
          _tokens_needed: number
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
