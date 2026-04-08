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
      contractor_jobs: {
        Row: {
          created_at: string
          homeowner_name: string
          id: string
          invoice_amount: string | null
          issue_description: string | null
          labor_hours: string | null
          next_service_rec: string | null
          part_models: string | null
          parts_replaced: string | null
          property_address: string
          quote_amount: string | null
          quote_description: string | null
          quote_notes: string | null
          quote_status: string | null
          scheduled_date: string | null
          scheduled_time: string | null
          status: string
          system_type: string
          updated_at: string
          user_id: string
          work_performed: string | null
        }
        Insert: {
          created_at?: string
          homeowner_name: string
          id?: string
          invoice_amount?: string | null
          issue_description?: string | null
          labor_hours?: string | null
          next_service_rec?: string | null
          part_models?: string | null
          parts_replaced?: string | null
          property_address: string
          quote_amount?: string | null
          quote_description?: string | null
          quote_notes?: string | null
          quote_status?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          system_type: string
          updated_at?: string
          user_id: string
          work_performed?: string | null
        }
        Update: {
          created_at?: string
          homeowner_name?: string
          id?: string
          invoice_amount?: string | null
          issue_description?: string | null
          labor_hours?: string | null
          next_service_rec?: string | null
          part_models?: string | null
          parts_replaced?: string | null
          property_address?: string
          quote_amount?: string | null
          quote_description?: string | null
          quote_notes?: string | null
          quote_status?: string | null
          scheduled_date?: string | null
          scheduled_time?: string | null
          status?: string
          system_type?: string
          updated_at?: string
          user_id?: string
          work_performed?: string | null
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
      flip_contractors: {
        Row: {
          amount_paid: number | null
          company: string | null
          completion_pct: number | null
          contract_amount: number | null
          created_at: string
          id: string
          license_number: string | null
          lien_waiver_received: boolean | null
          name: string
          project_id: string
          quality_rating: number | null
          specialty: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number | null
          company?: string | null
          completion_pct?: number | null
          contract_amount?: number | null
          created_at?: string
          id?: string
          license_number?: string | null
          lien_waiver_received?: boolean | null
          name: string
          project_id: string
          quality_rating?: number | null
          specialty?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number | null
          company?: string | null
          completion_pct?: number | null
          contract_amount?: number | null
          created_at?: string
          id?: string
          license_number?: string | null
          lien_waiver_received?: boolean | null
          name?: string
          project_id?: string
          quality_rating?: number | null
          specialty?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flip_contractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "flip_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      flip_projects: {
        Row: {
          budget_categories: Json | null
          carrying_costs: Json | null
          completion_pct: number | null
          created_at: string
          current_spend: number | null
          id: string
          notes: string | null
          photo_url: string | null
          projected_arv: number | null
          property_address: string
          purchase_date: string | null
          purchase_price: number | null
          renovation_budget: number | null
          sold_date: string | null
          sold_price: number | null
          status: string
          target_flip_date: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_categories?: Json | null
          carrying_costs?: Json | null
          completion_pct?: number | null
          created_at?: string
          current_spend?: number | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          projected_arv?: number | null
          property_address: string
          purchase_date?: string | null
          purchase_price?: number | null
          renovation_budget?: number | null
          sold_date?: string | null
          sold_price?: number | null
          status?: string
          target_flip_date?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_categories?: Json | null
          carrying_costs?: Json | null
          completion_pct?: number | null
          created_at?: string
          current_spend?: number | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          projected_arv?: number | null
          property_address?: string
          purchase_date?: string | null
          purchase_price?: number | null
          renovation_budget?: number | null
          sold_date?: string | null
          sold_price?: number | null
          status?: string
          target_flip_date?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      household_profiles: {
        Row: {
          activity_level: string | null
          bedrooms: number | null
          cooking_frequency: string | null
          created_at: string
          dusty_hobbies: boolean | null
          guest_frequency: string | null
          health_factors: string[] | null
          id: string
          people_count: number | null
          pets: Json | null
          property_id: string
          recommended_filter_days: number | null
          recommended_filter_merv: number | null
          smart_integrations: Json | null
          updated_at: string
          user_id: string
          work_from_home: string | null
        }
        Insert: {
          activity_level?: string | null
          bedrooms?: number | null
          cooking_frequency?: string | null
          created_at?: string
          dusty_hobbies?: boolean | null
          guest_frequency?: string | null
          health_factors?: string[] | null
          id?: string
          people_count?: number | null
          pets?: Json | null
          property_id: string
          recommended_filter_days?: number | null
          recommended_filter_merv?: number | null
          smart_integrations?: Json | null
          updated_at?: string
          user_id: string
          work_from_home?: string | null
        }
        Update: {
          activity_level?: string | null
          bedrooms?: number | null
          cooking_frequency?: string | null
          created_at?: string
          dusty_hobbies?: boolean | null
          guest_frequency?: string | null
          health_factors?: string[] | null
          id?: string
          people_count?: number | null
          pets?: Json | null
          property_id?: string
          recommended_filter_days?: number | null
          recommended_filter_merv?: number | null
          smart_integrations?: Json | null
          updated_at?: string
          user_id?: string
          work_from_home?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "household_profiles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inspections: {
        Row: {
          checklist_data: Json | null
          client_name: string | null
          created_at: string
          findings: Json | null
          has_passport: boolean | null
          id: string
          inspection_date: string | null
          notes_data: Json | null
          overall_score: number | null
          property_address: string
          report_generated: boolean | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          checklist_data?: Json | null
          client_name?: string | null
          created_at?: string
          findings?: Json | null
          has_passport?: boolean | null
          id?: string
          inspection_date?: string | null
          notes_data?: Json | null
          overall_score?: number | null
          property_address: string
          report_generated?: boolean | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          checklist_data?: Json | null
          client_name?: string | null
          created_at?: string
          findings?: Json | null
          has_passport?: boolean | null
          id?: string
          inspection_date?: string | null
          notes_data?: Json | null
          overall_score?: number | null
          property_address?: string
          report_generated?: boolean | null
          status?: string
          updated_at?: string
          user_id?: string
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
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          property_id: string | null
          read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          property_id?: string | null
          read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          property_id?: string | null
          read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_property_id_fkey"
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
      realtor_listings: {
        Row: {
          created_at: string
          days_on_market: number | null
          health_score: number | null
          homeowner_email: string | null
          id: string
          list_price: string | null
          notes: string | null
          passport_status: string
          photo_url: string | null
          property_address: string
          request_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_on_market?: number | null
          health_score?: number | null
          homeowner_email?: string | null
          id?: string
          list_price?: string | null
          notes?: string | null
          passport_status?: string
          photo_url?: string | null
          property_address: string
          request_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_on_market?: number | null
          health_score?: number | null
          homeowner_email?: string | null
          id?: string
          list_price?: string | null
          notes?: string | null
          passport_status?: string
          photo_url?: string | null
          property_address?: string
          request_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      app_role:
        | "homeowner"
        | "realtor"
        | "inspector"
        | "contractor"
        | "investor"
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
      app_role: ["homeowner", "realtor", "inspector", "contractor", "investor"],
      profile_type: ["personal", "business"],
    },
  },
} as const
