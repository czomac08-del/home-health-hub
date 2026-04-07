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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_profiles: {
        Row: {
          business_name: string | null
          created_at: string
          id: string
          profile_name: string
          profile_type: Database["public"]["Enums"]["profile_type"]
          separate_expenses: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          id?: string
          profile_name?: string
          profile_type?: Database["public"]["Enums"]["profile_type"]
          separate_expenses?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          id?: string
          profile_name?: string
          profile_type?: Database["public"]["Enums"]["profile_type"]
          separate_expenses?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          created_at: string
          id: string
          improvement: string
          page_route: string
          rating: number
          user_id: string
          user_role: string
          what_happened: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          improvement?: string
          page_route?: string
          rating: number
          user_id: string
          user_role?: string
          what_happened?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          improvement?: string
          page_route?: string
          rating?: number
          user_id?: string
          user_role?: string
          what_happened?: string
        }
        Relationships: []
      }
      maintenance_history: {
        Row: {
          action: string
          created_at: string
          id: string
          performed_by: string | null
          performed_date: string
          property_id: string
          system_name: string
          user_id: string
          verified: boolean | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          performed_by?: string | null
          performed_date: string
          property_id: string
          system_name: string
          user_id: string
          verified?: boolean | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          performed_by?: string | null
          performed_date?: string
          property_id?: string
          system_name?: string
          user_id?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          created_at: string
          health_score: number | null
          id: string
          is_active: boolean
          label: string
          profile_id: string | null
          square_footage: string | null
          updated_at: string
          user_id: string
          year_built: string | null
        }
        Insert: {
          address: string
          created_at?: string
          health_score?: number | null
          id?: string
          is_active?: boolean
          label?: string
          profile_id?: string | null
          square_footage?: string | null
          updated_at?: string
          user_id: string
          year_built?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          health_score?: number | null
          id?: string
          is_active?: boolean
          label?: string
          profile_id?: string | null
          square_footage?: string | null
          updated_at?: string
          user_id?: string
          year_built?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "app_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      system_details: {
        Row: {
          brand: string | null
          created_at: string
          extended_warranty: boolean | null
          health_score: number | null
          id: string
          install_date: string | null
          last_service: string | null
          location_in_home: string | null
          model: string | null
          next_service: string | null
          notes: string | null
          property_id: string
          purchase_date: string | null
          serial_number: string | null
          service_company: string | null
          service_phone: string | null
          specs: Json | null
          status: string | null
          system_name: string
          updated_at: string
          user_id: string
          warranty_exp: string | null
          warranty_provider: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          extended_warranty?: boolean | null
          health_score?: number | null
          id?: string
          install_date?: string | null
          last_service?: string | null
          location_in_home?: string | null
          model?: string | null
          next_service?: string | null
          notes?: string | null
          property_id: string
          purchase_date?: string | null
          serial_number?: string | null
          service_company?: string | null
          service_phone?: string | null
          specs?: Json | null
          status?: string | null
          system_name: string
          updated_at?: string
          user_id: string
          warranty_exp?: string | null
          warranty_provider?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          extended_warranty?: boolean | null
          health_score?: number | null
          id?: string
          install_date?: string | null
          last_service?: string | null
          location_in_home?: string | null
          model?: string | null
          next_service?: string | null
          notes?: string | null
          property_id?: string
          purchase_date?: string | null
          serial_number?: string | null
          service_company?: string | null
          service_phone?: string | null
          specs?: Json | null
          status?: string | null
          system_name?: string
          updated_at?: string
          user_id?: string
          warranty_exp?: string | null
          warranty_provider?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "system_details_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      system_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          id: string
          storage_path: string
          system_detail_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name: string
          id?: string
          storage_path: string
          system_detail_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          id?: string
          storage_path?: string
          system_detail_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_documents_system_detail_id_fkey"
            columns: ["system_detail_id"]
            isOneToOne: false
            referencedRelation: "system_details"
            referencedColumns: ["id"]
          },
        ]
      }
      system_photos: {
        Row: {
          created_at: string
          id: string
          label: string
          storage_path: string
          system_detail_id: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          storage_path: string
          system_detail_id: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          storage_path?: string
          system_detail_id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_photos_system_detail_id_fkey"
            columns: ["system_detail_id"]
            isOneToOne: false
            referencedRelation: "system_details"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "homeowner" | "realtor" | "inspector" | "contractor"
      profile_type: "personal" | "business"
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
      app_role: ["homeowner", "realtor", "inspector", "contractor"],
      profile_type: ["personal", "business"],
    },
  },
} as const
