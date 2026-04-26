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
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_earnings: {
        Row: {
          affiliate_id: string
          created_at: string
          gross_revenue_cents: number
          id: string
          month: string
          paid_at: string | null
          paid_out: boolean
          rev_share_amount_cents: number
          stripe_payout_id: string | null
          subscribers_count: number
          updated_at: string
        }
        Insert: {
          affiliate_id: string
          created_at?: string
          gross_revenue_cents?: number
          id?: string
          month: string
          paid_at?: string | null
          paid_out?: boolean
          rev_share_amount_cents?: number
          stripe_payout_id?: string | null
          subscribers_count?: number
          updated_at?: string
        }
        Update: {
          affiliate_id?: string
          created_at?: string
          gross_revenue_cents?: number
          id?: string
          month?: string
          paid_at?: string | null
          paid_out?: boolean
          rev_share_amount_cents?: number
          stripe_payout_id?: string | null
          subscribers_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_earnings_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_partners: {
        Row: {
          code: string
          contact_email: string | null
          created_at: string
          id: string
          name: string
          rev_share_pct: number
          status: string
          stripe_payout_id: string | null
          total_earned_cents: number
          total_referred: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          code: string
          contact_email?: string | null
          created_at?: string
          id?: string
          name: string
          rev_share_pct?: number
          status?: string
          stripe_payout_id?: string | null
          total_earned_cents?: number
          total_referred?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          code?: string
          contact_email?: string | null
          created_at?: string
          id?: string
          name?: string
          rev_share_pct?: number
          status?: string
          stripe_payout_id?: string | null
          total_earned_cents?: number
          total_referred?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          active: boolean
          affiliate_id: string
          first_paid_at: string | null
          id: string
          referred_user_id: string
          signed_up_at: string
        }
        Insert: {
          active?: boolean
          affiliate_id: string
          first_paid_at?: string | null
          id?: string
          referred_user_id: string
          signed_up_at?: string
        }
        Update: {
          active?: boolean
          affiliate_id?: string
          first_paid_at?: string | null
          id?: string
          referred_user_id?: string
          signed_up_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_partners"
            referencedColumns: ["id"]
          },
        ]
      }
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
      certification_shares: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          property_id: string
          share_token: string
          user_id: string
          view_count: number
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          property_id: string
          share_token?: string
          user_id: string
          view_count?: number
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          property_id?: string
          share_token?: string
          user_id?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "certification_shares_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      civic_contributions: {
        Row: {
          county_fips: string
          created_at: string
          id: string
          property_record_id: string
          report_date: string | null
          shared_at: string
          user_id: string
        }
        Insert: {
          county_fips: string
          created_at?: string
          id?: string
          property_record_id: string
          report_date?: string | null
          shared_at?: string
          user_id: string
        }
        Update: {
          county_fips?: string
          created_at?: string
          id?: string
          property_record_id?: string
          report_date?: string | null
          shared_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "civic_contributions_property_record_id_fkey"
            columns: ["property_record_id"]
            isOneToOne: false
            referencedRelation: "property_records"
            referencedColumns: ["id"]
          },
        ]
      }
      closed_deals: {
        Row: {
          charged_at: string | null
          close_date: string
          created_at: string
          deal_address: string
          id: string
          notes: string | null
          platform_fee_cents: number
          platform_fee_charged: boolean
          purchase_price: number | null
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          charged_at?: string | null
          close_date: string
          created_at?: string
          deal_address: string
          id?: string
          notes?: string | null
          platform_fee_cents?: number
          platform_fee_charged?: boolean
          purchase_price?: number | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          charged_at?: string | null
          close_date?: string
          created_at?: string
          deal_address?: string
          id?: string
          notes?: string | null
          platform_fee_cents?: number
          platform_fee_charged?: boolean
          purchase_price?: number | null
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      community_requests: {
        Row: {
          consolidated_letter_sent: boolean | null
          county_fips: string
          county_name: string
          created_at: string
          escalated_to_state: boolean | null
          id: string
          last_consolidated_at: string | null
          request_count: number
          state: string
          system_type: string
          updated_at: string
        }
        Insert: {
          consolidated_letter_sent?: boolean | null
          county_fips: string
          county_name: string
          created_at?: string
          escalated_to_state?: boolean | null
          id?: string
          last_consolidated_at?: string | null
          request_count?: number
          state: string
          system_type: string
          updated_at?: string
        }
        Update: {
          consolidated_letter_sent?: boolean | null
          county_fips?: string
          county_name?: string
          created_at?: string
          escalated_to_state?: boolean | null
          id?: string
          last_consolidated_at?: string | null
          request_count?: number
          state?: string
          system_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      consent_log: {
        Row: {
          consent_type: string
          consent_value: boolean
          context: string | null
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json
          policy_version: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          consent_type: string
          consent_value: boolean
          context?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          policy_version?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          consent_type?: string
          consent_value?: boolean
          context?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json
          policy_version?: string | null
          user_agent?: string | null
          user_id?: string | null
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
      county_agencies: {
        Row: {
          accepts_email_requests: boolean | null
          agency_name: string
          agency_type: string
          county_fips: string
          county_name: string
          created_at: string
          email: string | null
          id: string
          mailing_address: string | null
          notes: string | null
          phone: string | null
          records_portal_url: string | null
          state: string
          updated_at: string
        }
        Insert: {
          accepts_email_requests?: boolean | null
          agency_name: string
          agency_type?: string
          county_fips: string
          county_name: string
          created_at?: string
          email?: string | null
          id?: string
          mailing_address?: string | null
          notes?: string | null
          phone?: string | null
          records_portal_url?: string | null
          state?: string
          updated_at?: string
        }
        Update: {
          accepts_email_requests?: boolean | null
          agency_name?: string
          agency_type?: string
          county_fips?: string
          county_name?: string
          created_at?: string
          email?: string | null
          id?: string
          mailing_address?: string | null
          notes?: string | null
          phone?: string | null
          records_portal_url?: string | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      data_audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          field_path: string | null
          flag_reason: string | null
          flagged_for_review: boolean
          id: string
          metadata: Json
          new_source: Database["public"]["Enums"]["data_source_type"] | null
          new_value: string | null
          old_source: Database["public"]["Enums"]["data_source_type"] | null
          old_value: string | null
          property_id: string
          user_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          field_path?: string | null
          flag_reason?: string | null
          flagged_for_review?: boolean
          id?: string
          metadata?: Json
          new_source?: Database["public"]["Enums"]["data_source_type"] | null
          new_value?: string | null
          old_source?: Database["public"]["Enums"]["data_source_type"] | null
          old_value?: string | null
          property_id: string
          user_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          field_path?: string | null
          flag_reason?: string | null
          flagged_for_review?: boolean
          id?: string
          metadata?: Json
          new_source?: Database["public"]["Enums"]["data_source_type"] | null
          new_value?: string | null
          old_source?: Database["public"]["Enums"]["data_source_type"] | null
          old_value?: string | null
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_audit_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      data_history: {
        Row: {
          created_at: string
          entered_by_user_id: string | null
          field_path: string
          field_value: string | null
          id: string
          is_current: boolean
          property_id: string
          replaced_source:
            | Database["public"]["Enums"]["data_source_type"]
            | null
          replaced_value: string | null
          source: Database["public"]["Enums"]["data_source_type"]
          source_label: string | null
          source_record_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          entered_by_user_id?: string | null
          field_path: string
          field_value?: string | null
          id?: string
          is_current?: boolean
          property_id: string
          replaced_source?:
            | Database["public"]["Enums"]["data_source_type"]
            | null
          replaced_value?: string | null
          source?: Database["public"]["Enums"]["data_source_type"]
          source_label?: string | null
          source_record_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          entered_by_user_id?: string | null
          field_path?: string
          field_value?: string | null
          id?: string
          is_current?: boolean
          property_id?: string
          replaced_source?:
            | Database["public"]["Enums"]["data_source_type"]
            | null
          replaced_value?: string | null
          source?: Database["public"]["Enums"]["data_source_type"]
          source_label?: string | null
          source_record_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_history_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      data_pull_log: {
        Row: {
          api_cost_cents: number
          credits_charged: number
          data_type: string
          id: string
          property_id: string | null
          pulled_at: string
          raw_response_cached: boolean
          source_name: string
          status: string
          user_id: string
        }
        Insert: {
          api_cost_cents?: number
          credits_charged?: number
          data_type: string
          id?: string
          property_id?: string | null
          pulled_at?: string
          raw_response_cached?: boolean
          source_name: string
          status: string
          user_id: string
        }
        Update: {
          api_cost_cents?: number
          credits_charged?: number
          data_type?: string
          id?: string
          property_id?: string | null
          pulled_at?: string
          raw_response_cached?: boolean
          source_name?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_pull_log_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      data_source_cache: {
        Row: {
          cache_key: string
          expires_at: string
          fetched_at: string
          id: string
          payload: Json
          source_name: string
        }
        Insert: {
          cache_key: string
          expires_at: string
          fetched_at?: string
          id?: string
          payload: Json
          source_name: string
        }
        Update: {
          cache_key?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          payload?: Json
          source_name?: string
        }
        Relationships: []
      }
      data_source_refresh_state: {
        Row: {
          id: string
          last_refreshed_at: string
          last_status: string | null
          property_id: string
          source_name: string
        }
        Insert: {
          id?: string
          last_refreshed_at?: string
          last_status?: string | null
          property_id: string
          source_name: string
        }
        Update: {
          id?: string
          last_refreshed_at?: string
          last_status?: string | null
          property_id?: string
          source_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_source_refresh_state_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      date_verifications: {
        Row: {
          claimed_date: string
          created_at: string
          document_storage_path: string | null
          document_type: string | null
          document_url: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["verification_entity"]
          exif_date: string | null
          exif_matches_claim: boolean | null
          id: string
          notes: string | null
          property_id: string
          updated_at: string
          user_id: string
          verification_level: Database["public"]["Enums"]["verification_level"]
        }
        Insert: {
          claimed_date: string
          created_at?: string
          document_storage_path?: string | null
          document_type?: string | null
          document_url?: string | null
          entity_id: string
          entity_type: Database["public"]["Enums"]["verification_entity"]
          exif_date?: string | null
          exif_matches_claim?: boolean | null
          id?: string
          notes?: string | null
          property_id: string
          updated_at?: string
          user_id: string
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Update: {
          claimed_date?: string
          created_at?: string
          document_storage_path?: string | null
          document_type?: string | null
          document_url?: string | null
          entity_id?: string
          entity_type?: Database["public"]["Enums"]["verification_entity"]
          exif_date?: string | null
          exif_matches_claim?: boolean | null
          id?: string
          notes?: string | null
          property_id?: string
          updated_at?: string
          user_id?: string
          verification_level?: Database["public"]["Enums"]["verification_level"]
        }
        Relationships: [
          {
            foreignKeyName: "date_verifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      disclosure_awareness: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          created_at: string
          flagged_data_summary: string | null
          id: string
          property_id: string
          state: string
          trigger_category: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          created_at?: string
          flagged_data_summary?: string | null
          id?: string
          property_id: string
          state: string
          trigger_category: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          created_at?: string
          flagged_data_summary?: string | null
          id?: string
          property_id?: string
          state?: string
          trigger_category?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disclosure_awareness_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          created_at: string
          date_filed: string
          field_path: string | null
          finding_id: string | null
          homeowner_statement: string
          id: string
          inspector_finding_text: string | null
          property_id: string
          property_record_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
          supporting_documents: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_filed?: string
          field_path?: string | null
          finding_id?: string | null
          homeowner_statement: string
          id?: string
          inspector_finding_text?: string | null
          property_id: string
          property_record_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          supporting_documents?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_filed?: string
          field_path?: string | null
          finding_id?: string | null
          homeowner_statement?: string
          id?: string
          inspector_finding_text?: string | null
          property_id?: string
          property_record_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
          supporting_documents?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disputes_property_record_id_fkey"
            columns: ["property_record_id"]
            isOneToOne: false
            referencedRelation: "property_records"
            referencedColumns: ["id"]
          },
        ]
      }
      drought_cache: {
        Row: {
          created_at: string
          drought_description: string
          drought_level: string
          fetched_at: string
          fips_code: string
          id: string
          raw_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          drought_description?: string
          drought_level?: string
          fetched_at?: string
          fips_code: string
          id?: string
          raw_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          drought_description?: string
          drought_level?: string
          fetched_at?: string
          fips_code?: string
          id?: string
          raw_data?: Json | null
          updated_at?: string
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
      field_sources: {
        Row: {
          created_at: string
          current_source: Database["public"]["Enums"]["data_source_type"]
          current_value: string | null
          field_path: string
          has_open_dispute: boolean
          id: string
          inspection_date: string | null
          inspector_company: string | null
          inspector_license: string | null
          inspector_name: string | null
          property_id: string
          source_record_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_source: Database["public"]["Enums"]["data_source_type"]
          current_value?: string | null
          field_path: string
          has_open_dispute?: boolean
          id?: string
          inspection_date?: string | null
          inspector_company?: string | null
          inspector_license?: string | null
          inspector_name?: string | null
          property_id: string
          source_record_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_source?: Database["public"]["Enums"]["data_source_type"]
          current_value?: string | null
          field_path?: string
          has_open_dispute?: boolean
          id?: string
          inspection_date?: string | null
          inspector_company?: string | null
          inspector_license?: string | null
          inspector_name?: string | null
          property_id?: string
          source_record_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_sources_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      fix_verifications: {
        Row: {
          contractor_license: string | null
          contractor_name: string | null
          created_at: string
          data_quality_flag: string
          date_completed: string
          description: string | null
          documents: Json
          finding_id: string
          fix_type: string
          has_permit: boolean
          id: string
          photos: Json
          property_id: string
          trade_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contractor_license?: string | null
          contractor_name?: string | null
          created_at?: string
          data_quality_flag?: string
          date_completed: string
          description?: string | null
          documents?: Json
          finding_id: string
          fix_type: string
          has_permit?: boolean
          id?: string
          photos?: Json
          property_id: string
          trade_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contractor_license?: string | null
          contractor_name?: string | null
          created_at?: string
          data_quality_flag?: string
          date_completed?: string
          description?: string | null
          documents?: Json
          finding_id?: string
          fix_type?: string
          has_permit?: boolean
          id?: string
          photos?: Json
          property_id?: string
          trade_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fix_verifications_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "inspection_findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fix_verifications_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      home_checkup_items: {
        Row: {
          answer: string
          checkup_id: string
          created_at: string
          data_status: Database["public"]["Enums"]["data_status"]
          id: string
          item_id: string
          notes: string | null
          photo_url: string | null
          section_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          checkup_id: string
          created_at?: string
          data_status?: Database["public"]["Enums"]["data_status"]
          id?: string
          item_id: string
          notes?: string | null
          photo_url?: string | null
          section_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          checkup_id?: string
          created_at?: string
          data_status?: Database["public"]["Enums"]["data_status"]
          id?: string
          item_id?: string
          notes?: string | null
          photo_url?: string | null
          section_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_checkup_items_checkup_id_fkey"
            columns: ["checkup_id"]
            isOneToOne: false
            referencedRelation: "home_checkups"
            referencedColumns: ["id"]
          },
        ]
      }
      home_checkups: {
        Row: {
          completed_at: string | null
          created_at: string
          current_section: number
          id: string
          property_id: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_section?: number
          id?: string
          property_id: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_section?: number
          id?: string
          property_id?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_checkups_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      household_profiles: {
        Row: {
          activity_level: string | null
          bedrooms: number | null
          cooking_frequency: string | null
          created_at: string
          data_status: Database["public"]["Enums"]["data_status"]
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
          data_status?: Database["public"]["Enums"]["data_status"]
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
          data_status?: Database["public"]["Enums"]["data_status"]
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
      inspection_findings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          finding_key: string
          fix_verification_id: string | null
          id: string
          inspection_record_id: string
          is_diy: boolean
          level: number
          page_reference: number | null
          property_id: string
          recommendation: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          finding_key: string
          fix_verification_id?: string | null
          id?: string
          inspection_record_id: string
          is_diy?: boolean
          level: number
          page_reference?: number | null
          property_id: string
          recommendation?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          finding_key?: string
          fix_verification_id?: string | null
          id?: string
          inspection_record_id?: string
          is_diy?: boolean
          level?: number
          page_reference?: number | null
          property_id?: string
          recommendation?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_fix_verification_fk"
            columns: ["fix_verification_id"]
            isOneToOne: false
            referencedRelation: "fix_verifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_findings_inspection_record_id_fkey"
            columns: ["inspection_record_id"]
            isOneToOne: false
            referencedRelation: "property_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_findings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_notifications: {
        Row: {
          action_taken: string | null
          id: string
          inspection_record_id: string | null
          notification_type: Database["public"]["Enums"]["inspection_notification_type"]
          notified_user_id: string
          payload: Json
          property_id: string
          read_at: string | null
          sent_at: string
          user_role:
            | Database["public"]["Enums"]["property_connection_role"]
            | null
        }
        Insert: {
          action_taken?: string | null
          id?: string
          inspection_record_id?: string | null
          notification_type?: Database["public"]["Enums"]["inspection_notification_type"]
          notified_user_id: string
          payload?: Json
          property_id: string
          read_at?: string | null
          sent_at?: string
          user_role?:
            | Database["public"]["Enums"]["property_connection_role"]
            | null
        }
        Update: {
          action_taken?: string | null
          id?: string
          inspection_record_id?: string | null
          notification_type?: Database["public"]["Enums"]["inspection_notification_type"]
          notified_user_id?: string
          payload?: Json
          property_id?: string
          read_at?: string | null
          sent_at?: string
          user_role?:
            | Database["public"]["Enums"]["property_connection_role"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_notifications_inspection_record_id_fkey"
            columns: ["inspection_record_id"]
            isOneToOne: false
            referencedRelation: "property_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_notifications_property_id_fkey"
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
      inspector_media: {
        Row: {
          caption: string | null
          created_at: string
          file_name: string
          finding_id: string | null
          id: string
          inspection_date: string | null
          inspector_company: string | null
          inspector_name: string | null
          is_primary: boolean
          property_id: string
          property_record_id: string | null
          storage_path: string
          system_type: string | null
          url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          file_name: string
          finding_id?: string | null
          id?: string
          inspection_date?: string | null
          inspector_company?: string | null
          inspector_name?: string | null
          is_primary?: boolean
          property_id: string
          property_record_id?: string | null
          storage_path: string
          system_type?: string | null
          url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          file_name?: string
          finding_id?: string | null
          id?: string
          inspection_date?: string | null
          inspector_company?: string | null
          inspector_name?: string | null
          is_primary?: boolean
          property_id?: string
          property_record_id?: string | null
          storage_path?: string
          system_type?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspector_media_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspector_media_property_record_id_fkey"
            columns: ["property_record_id"]
            isOneToOne: false
            referencedRelation: "property_records"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          amount_claimed: number | null
          amount_paid: number | null
          claim_date: string
          claim_number: string | null
          claim_type: string
          created_at: string
          id: string
          notes: string | null
          policy_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_claimed?: number | null
          amount_paid?: number | null
          claim_date: string
          claim_number?: string | null
          claim_type: string
          created_at?: string
          id?: string
          notes?: string | null
          policy_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_claimed?: number | null
          amount_paid?: number | null
          claim_date?: string
          claim_number?: string | null
          claim_type?: string
          created_at?: string
          id?: string
          notes?: string | null
          policy_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          id: string
          policy_id: string
          storage_path: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          doc_type?: string
          file_name: string
          id?: string
          policy_id: string
          storage_path: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          id?: string
          policy_id?: string
          storage_path?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_documents_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          agent_name: string | null
          agent_phone: string | null
          ai_analysis: Json | null
          claims_phone: string | null
          coverage_end: string | null
          coverage_gaps: string[] | null
          coverage_start: string | null
          created_at: string
          data_status: Database["public"]["Enums"]["data_status"]
          deductible_amount: number | null
          dwelling_coverage: number | null
          earthquake_coverage: boolean | null
          equipment_breakdown: boolean | null
          exclusions: string[] | null
          flood_coverage: boolean | null
          id: string
          insurance_company: string | null
          liability_coverage: number | null
          online_portal_url: string | null
          personal_property_coverage: number | null
          policy_number: string | null
          policy_type: string
          premium_amount: number | null
          premium_frequency: string | null
          property_id: string
          updated_at: string
          user_id: string
          wind_hail_deductible: string | null
        }
        Insert: {
          agent_name?: string | null
          agent_phone?: string | null
          ai_analysis?: Json | null
          claims_phone?: string | null
          coverage_end?: string | null
          coverage_gaps?: string[] | null
          coverage_start?: string | null
          created_at?: string
          data_status?: Database["public"]["Enums"]["data_status"]
          deductible_amount?: number | null
          dwelling_coverage?: number | null
          earthquake_coverage?: boolean | null
          equipment_breakdown?: boolean | null
          exclusions?: string[] | null
          flood_coverage?: boolean | null
          id?: string
          insurance_company?: string | null
          liability_coverage?: number | null
          online_portal_url?: string | null
          personal_property_coverage?: number | null
          policy_number?: string | null
          policy_type?: string
          premium_amount?: number | null
          premium_frequency?: string | null
          property_id: string
          updated_at?: string
          user_id: string
          wind_hail_deductible?: string | null
        }
        Update: {
          agent_name?: string | null
          agent_phone?: string | null
          ai_analysis?: Json | null
          claims_phone?: string | null
          coverage_end?: string | null
          coverage_gaps?: string[] | null
          coverage_start?: string | null
          created_at?: string
          data_status?: Database["public"]["Enums"]["data_status"]
          deductible_amount?: number | null
          dwelling_coverage?: number | null
          earthquake_coverage?: boolean | null
          equipment_breakdown?: boolean | null
          exclusions?: string[] | null
          flood_coverage?: boolean | null
          id?: string
          insurance_company?: string | null
          liability_coverage?: number | null
          online_portal_url?: string | null
          personal_property_coverage?: number | null
          policy_number?: string | null
          policy_type?: string
          premium_amount?: number | null
          premium_frequency?: string | null
          property_id?: string
          updated_at?: string
          user_id?: string
          wind_hail_deductible?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_acknowledgments: {
        Row: {
          accepted_at: string
          age_confirmed: boolean
          civic_consent: boolean | null
          created_at: string
          id: string
          privacy_accepted: boolean
          professional_disclaimer_accepted: boolean
          state_selected: string | null
          terms_accepted: boolean
          user_id: string
        }
        Insert: {
          accepted_at?: string
          age_confirmed?: boolean
          civic_consent?: boolean | null
          created_at?: string
          id?: string
          privacy_accepted?: boolean
          professional_disclaimer_accepted?: boolean
          state_selected?: string | null
          terms_accepted?: boolean
          user_id: string
        }
        Update: {
          accepted_at?: string
          age_confirmed?: boolean
          civic_consent?: boolean | null
          created_at?: string
          id?: string
          privacy_accepted?: boolean
          professional_disclaimer_accepted?: boolean
          state_selected?: string | null
          terms_accepted?: boolean
          user_id?: string
        }
        Relationships: []
      }
      legal_resources: {
        Row: {
          attorney_type: string
          created_at: string
          id: string
          issue_type: string
          legal_aid_name: string | null
          legal_aid_phone: string | null
          legal_aid_url: string | null
          notes: string | null
          referral_phone: string | null
          referral_service_name: string
          referral_url: string | null
          state: string
        }
        Insert: {
          attorney_type: string
          created_at?: string
          id?: string
          issue_type: string
          legal_aid_name?: string | null
          legal_aid_phone?: string | null
          legal_aid_url?: string | null
          notes?: string | null
          referral_phone?: string | null
          referral_service_name: string
          referral_url?: string | null
          state: string
        }
        Update: {
          attorney_type?: string
          created_at?: string
          id?: string
          issue_type?: string
          legal_aid_name?: string | null
          legal_aid_phone?: string | null
          legal_aid_url?: string | null
          notes?: string | null
          referral_phone?: string | null
          referral_service_name?: string
          referral_url?: string | null
          state?: string
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
      needs_info: {
        Row: {
          created_at: string
          field_label: string | null
          field_name: string
          id: string
          last_prompted_at: string | null
          prompt_shown_count: number
          property_id: string
          resolved_at: string | null
          section: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_label?: string | null
          field_name: string
          id?: string
          last_prompted_at?: string | null
          prompt_shown_count?: number
          property_id: string
          resolved_at?: string | null
          section: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_label?: string | null
          field_name?: string
          id?: string
          last_prompted_at?: string | null
          prompt_shown_count?: number
          property_id?: string
          resolved_at?: string | null
          section?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      permanent_archive: {
        Row: {
          ai_analysis: string | null
          confidence_score: number
          created_at: string
          description: string | null
          documents: Json | null
          evidence_sources: Json | null
          existed_from: string | null
          existed_until: string | null
          homeowner_notes: string | null
          id: string
          property_id: string
          record_type: string
          removal_reason: string | null
          satellite_images: Json | null
          status: string
          title: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          ai_analysis?: string | null
          confidence_score?: number
          created_at?: string
          description?: string | null
          documents?: Json | null
          evidence_sources?: Json | null
          existed_from?: string | null
          existed_until?: string | null
          homeowner_notes?: string | null
          id?: string
          property_id: string
          record_type: string
          removal_reason?: string | null
          satellite_images?: Json | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          ai_analysis?: string | null
          confidence_score?: number
          created_at?: string
          description?: string | null
          documents?: Json | null
          evidence_sources?: Json | null
          existed_from?: string | null
          existed_until?: string | null
          homeowner_notes?: string | null
          id?: string
          property_id?: string
          record_type?: string
          removal_reason?: string | null
          satellite_images?: Json | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "permanent_archive_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      privacy_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          handled_by: string | null
          id: string
          request_details: string | null
          request_type: string
          requested_at: string
          response_notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          handled_by?: string | null
          id?: string
          request_details?: string | null
          request_type: string
          requested_at?: string
          response_notes?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          handled_by?: string | null
          id?: string
          request_details?: string | null
          request_type?: string
          requested_at?: string
          response_notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      professional_license_boards: {
        Row: {
          board_name: string
          board_phone: string | null
          board_url: string | null
          country: string
          created_at: string
          dissolved_licensee_process: string | null
          id: string
          notes: string | null
          profession_type: string
          retention_years_required: number | null
          state: string | null
        }
        Insert: {
          board_name: string
          board_phone?: string | null
          board_url?: string | null
          country?: string
          created_at?: string
          dissolved_licensee_process?: string | null
          id?: string
          notes?: string | null
          profession_type: string
          retention_years_required?: number | null
          state?: string | null
        }
        Update: {
          board_name?: string
          board_phone?: string | null
          board_url?: string | null
          country?: string
          created_at?: string
          dissolved_licensee_process?: string | null
          id?: string
          notes?: string | null
          profession_type?: string
          retention_years_required?: number | null
          state?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active_property_id: string | null
          affiliate_code: string | null
          age_confirmed_at: string | null
          anonymized: boolean
          anonymized_at: string | null
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          marketing_opted_in: boolean
          marketing_opted_in_at: string | null
          privacy_accepted_at: string | null
          promo_code: string | null
          referral_source: string | null
          role: Database["public"]["Enums"]["app_role"]
          terms_accepted_at: string | null
          terms_version_accepted: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_property_id?: string | null
          affiliate_code?: string | null
          age_confirmed_at?: string | null
          anonymized?: boolean
          anonymized_at?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          marketing_opted_in?: boolean
          marketing_opted_in_at?: string | null
          privacy_accepted_at?: string | null
          promo_code?: string | null
          referral_source?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          terms_accepted_at?: string | null
          terms_version_accepted?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_property_id?: string | null
          affiliate_code?: string | null
          age_confirmed_at?: string | null
          anonymized?: boolean
          anonymized_at?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          marketing_opted_in?: boolean
          marketing_opted_in_at?: string | null
          privacy_accepted_at?: string | null
          promo_code?: string | null
          referral_source?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          terms_accepted_at?: string | null
          terms_version_accepted?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_property_id_fkey"
            columns: ["active_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string
          created_at: string
          data_status: Database["public"]["Enums"]["data_status"]
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
          data_status?: Database["public"]["Enums"]["data_status"]
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
          data_status?: Database["public"]["Enums"]["data_status"]
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
      property_connections: {
        Row: {
          created_at: string
          granted_by: string | null
          id: string
          notes: string | null
          property_id: string
          role: Database["public"]["Enums"]["property_connection_role"]
          status: Database["public"]["Enums"]["property_connection_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          property_id: string
          role: Database["public"]["Enums"]["property_connection_role"]
          status?: Database["public"]["Enums"]["property_connection_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          role?: Database["public"]["Enums"]["property_connection_role"]
          status?: Database["public"]["Enums"]["property_connection_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_connections_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_records: {
        Row: {
          ai_extracted_data: Json | null
          ai_verified: boolean
          consent_civic_sharing: boolean
          created_at: string
          document_date: string | null
          file_name: string | null
          id: string
          notes: string | null
          property_id: string
          record_type: string
          source: string
          storage_path: string | null
          system_type: string
          updated_at: string
          upload_consent_at: string | null
          uploaded_by_user_id: string
          url: string | null
          verified: boolean
        }
        Insert: {
          ai_extracted_data?: Json | null
          ai_verified?: boolean
          consent_civic_sharing?: boolean
          created_at?: string
          document_date?: string | null
          file_name?: string | null
          id?: string
          notes?: string | null
          property_id: string
          record_type?: string
          source?: string
          storage_path?: string | null
          system_type: string
          updated_at?: string
          upload_consent_at?: string | null
          uploaded_by_user_id: string
          url?: string | null
          verified?: boolean
        }
        Update: {
          ai_extracted_data?: Json | null
          ai_verified?: boolean
          consent_civic_sharing?: boolean
          created_at?: string
          document_date?: string | null
          file_name?: string | null
          id?: string
          notes?: string | null
          property_id?: string
          record_type?: string
          source?: string
          storage_path?: string | null
          system_type?: string
          updated_at?: string
          upload_consent_at?: string | null
          uploaded_by_user_id?: string
          url?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "property_records_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      property_timeline_events: {
        Row: {
          category: string
          confidence: string | null
          created_at: string
          description: string | null
          event_date: string
          icon_key: string | null
          id: string
          is_estimated: boolean
          property_id: string
          property_record_id: string | null
          record_type_id: string | null
          source: string | null
          source_type: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          confidence?: string | null
          created_at?: string
          description?: string | null
          event_date: string
          icon_key?: string | null
          id?: string
          is_estimated?: boolean
          property_id: string
          property_record_id?: string | null
          record_type_id?: string | null
          source?: string | null
          source_type?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          confidence?: string | null
          created_at?: string
          description?: string | null
          event_date?: string
          icon_key?: string | null
          id?: string
          is_estimated?: boolean
          property_id?: string
          property_record_id?: string | null
          record_type_id?: string | null
          source?: string | null
          source_type?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_timeline_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_timeline_events_property_record_id_fkey"
            columns: ["property_record_id"]
            isOneToOne: false
            referencedRelation: "property_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_timeline_events_record_type_id_fkey"
            columns: ["record_type_id"]
            isOneToOne: false
            referencedRelation: "record_types"
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
      record_sources: {
        Row: {
          api_endpoint: string | null
          contact_lookup_method: string | null
          cost_to_obtain: string
          created_at: string
          id: string
          priority_order: number
          record_type_id: string
          request_template: string | null
          source_name: string
          source_type: string
          typical_digitization_year: number | null
          typical_response_days: number | null
        }
        Insert: {
          api_endpoint?: string | null
          contact_lookup_method?: string | null
          cost_to_obtain?: string
          created_at?: string
          id?: string
          priority_order?: number
          record_type_id: string
          request_template?: string | null
          source_name: string
          source_type?: string
          typical_digitization_year?: number | null
          typical_response_days?: number | null
        }
        Update: {
          api_endpoint?: string | null
          contact_lookup_method?: string | null
          cost_to_obtain?: string
          created_at?: string
          id?: string
          priority_order?: number
          record_type_id?: string
          request_template?: string | null
          source_name?: string
          source_type?: string
          typical_digitization_year?: number | null
          typical_response_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "record_sources_record_type_id_fkey"
            columns: ["record_type_id"]
            isOneToOne: false
            referencedRelation: "record_types"
            referencedColumns: ["id"]
          },
        ]
      }
      record_types: {
        Row: {
          category: string
          category_order: number
          created_at: string
          description: string | null
          digitization_notes: string | null
          icon_name: string | null
          id: string
          safety_critical: boolean
          subcategory: string
          typical_digitization_year: number | null
        }
        Insert: {
          category: string
          category_order?: number
          created_at?: string
          description?: string | null
          digitization_notes?: string | null
          icon_name?: string | null
          id?: string
          safety_critical?: boolean
          subcategory: string
          typical_digitization_year?: number | null
        }
        Update: {
          category?: string
          category_order?: number
          created_at?: string
          description?: string | null
          digitization_notes?: string | null
          icon_name?: string | null
          id?: string
          safety_critical?: boolean
          subcategory?: string
          typical_digitization_year?: number | null
        }
        Relationships: []
      }
      records_requests: {
        Row: {
          agency_type: string
          county_fips: string
          created_at: string
          id: string
          is_part_of_community_request: boolean | null
          notes: string | null
          property_id: string
          request_letter_text: string | null
          response_due_date: string | null
          response_received_at: string | null
          sent_at: string | null
          status: string
          system_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_type: string
          county_fips: string
          created_at?: string
          id?: string
          is_part_of_community_request?: boolean | null
          notes?: string | null
          property_id: string
          request_letter_text?: string | null
          response_due_date?: string | null
          response_received_at?: string | null
          sent_at?: string | null
          status?: string
          system_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_type?: string
          county_fips?: string
          created_at?: string
          id?: string
          is_part_of_community_request?: boolean | null
          notes?: string | null
          property_id?: string
          request_letter_text?: string | null
          response_due_date?: string | null
          response_received_at?: string | null
          sent_at?: string | null
          status?: string
          system_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "records_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          referrer_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          referrer_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          referrer_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          admin_notes: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          issued_at: string | null
          referral_id: string
          referred_user_id: string
          referrer_type: string
          referrer_user_id: string
          reward_amount_cents: number | null
          reward_description: string
          reward_type: string
          status: string
          stripe_reference: string | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          issued_at?: string | null
          referral_id: string
          referred_user_id: string
          referrer_type: string
          referrer_user_id: string
          reward_amount_cents?: number | null
          reward_description: string
          reward_type: string
          status?: string
          stripe_reference?: string | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          issued_at?: string | null
          referral_id?: string
          referred_user_id?: string
          referrer_type?: string
          referrer_user_id?: string
          reward_amount_cents?: number | null
          reward_description?: string
          reward_type?: string
          status?: string
          stripe_reference?: string | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          conversion_date: string | null
          converted_to_paid: boolean
          created_at: string
          id: string
          notes: string | null
          referral_code: string
          referred_user_id: string
          referrer_type: string
          referrer_user_id: string
          retained_3_months: boolean
          reward_amount_cents: number | null
          reward_issued: boolean
          reward_type: string | null
          signup_date: string
          updated_at: string
        }
        Insert: {
          conversion_date?: string | null
          converted_to_paid?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          referral_code: string
          referred_user_id: string
          referrer_type?: string
          referrer_user_id: string
          retained_3_months?: boolean
          reward_amount_cents?: number | null
          reward_issued?: boolean
          reward_type?: string | null
          signup_date?: string
          updated_at?: string
        }
        Update: {
          conversion_date?: string | null
          converted_to_paid?: boolean
          created_at?: string
          id?: string
          notes?: string | null
          referral_code?: string
          referred_user_id?: string
          referrer_type?: string
          referrer_user_id?: string
          retained_3_months?: boolean
          reward_amount_cents?: number | null
          reward_issued?: boolean
          reward_type?: string | null
          signup_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      refresh_logs: {
        Row: {
          created_at: string
          id: string
          property_id: string
          refresh_scope: string
          results_summary: Json
          sources_queried: string[]
          triggered_by: string
          updates_found: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          refresh_scope?: string
          results_summary?: Json
          sources_queried?: string[]
          triggered_by?: string
          updates_found?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          refresh_scope?: string
          results_summary?: Json
          sources_queried?: string[]
          triggered_by?: string
          updates_found?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refresh_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      state_disclosure_requirements: {
        Row: {
          applies_to_sales: boolean
          country: string
          created_at: string
          has_online_portal: boolean | null
          id: string
          is_federal: boolean
          jurisdiction_type: string
          legal_citation: string | null
          legal_escalation_path: Json | null
          notes: string | null
          online_portal_url: string | null
          oversight_body_name: string | null
          oversight_body_url: string | null
          penalty_for_nondisclosure: string | null
          professional_retention_rules: Json | null
          public_records_law_citation: string | null
          public_records_law_name: string | null
          requirement_text: string
          response_timeframe_days: number | null
          response_timeframe_unit: string | null
          state: string
          trigger_category: string
        }
        Insert: {
          applies_to_sales?: boolean
          country?: string
          created_at?: string
          has_online_portal?: boolean | null
          id?: string
          is_federal?: boolean
          jurisdiction_type?: string
          legal_citation?: string | null
          legal_escalation_path?: Json | null
          notes?: string | null
          online_portal_url?: string | null
          oversight_body_name?: string | null
          oversight_body_url?: string | null
          penalty_for_nondisclosure?: string | null
          professional_retention_rules?: Json | null
          public_records_law_citation?: string | null
          public_records_law_name?: string | null
          requirement_text: string
          response_timeframe_days?: number | null
          response_timeframe_unit?: string | null
          state: string
          trigger_category: string
        }
        Update: {
          applies_to_sales?: boolean
          country?: string
          created_at?: string
          has_online_portal?: boolean | null
          id?: string
          is_federal?: boolean
          jurisdiction_type?: string
          legal_citation?: string | null
          legal_escalation_path?: Json | null
          notes?: string | null
          online_portal_url?: string | null
          oversight_body_name?: string | null
          oversight_body_url?: string | null
          penalty_for_nondisclosure?: string | null
          professional_retention_rules?: Json | null
          public_records_law_citation?: string | null
          public_records_law_name?: string | null
          requirement_text?: string
          response_timeframe_days?: number | null
          response_timeframe_unit?: string | null
          state?: string
          trigger_category?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_period: string | null
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_details: {
        Row: {
          brand: string | null
          created_at: string
          data_status: Database["public"]["Enums"]["data_status"]
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
          well_type: string | null
        }
        Insert: {
          brand?: string | null
          created_at?: string
          data_status?: Database["public"]["Enums"]["data_status"]
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
          well_type?: string | null
        }
        Update: {
          brand?: string | null
          created_at?: string
          data_status?: Database["public"]["Enums"]["data_status"]
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
          well_type?: string | null
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
      trusted_devices: {
        Row: {
          created_at: string
          device_label: string | null
          device_token: string
          expires_at: string
          id: string
          last_used_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_label?: string | null
          device_token: string
          expires_at?: string
          id?: string
          last_used_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_label?: string | null
          device_token?: string
          expires_at?: string
          id?: string
          last_used_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          balance: number
          created_at: string
          lifetime_purchased: number
          lifetime_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          lifetime_purchased?: number
          lifetime_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          lifetime_purchased?: number
          lifetime_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_security_settings: {
        Row: {
          created_at: string
          id: string
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          two_factor_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      verification_events: {
        Row: {
          ai_analysis: string | null
          confidence_after: number | null
          confidence_before: number | null
          created_at: string
          evidence_notes: string | null
          evidence_url: string | null
          field_path: string
          field_value: string | null
          id: string
          property_id: string
          result: string
          source_name: string | null
          source_priority: number
          source_type: string
          source_weight: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          ai_analysis?: string | null
          confidence_after?: number | null
          confidence_before?: number | null
          created_at?: string
          evidence_notes?: string | null
          evidence_url?: string | null
          field_path: string
          field_value?: string | null
          id?: string
          property_id: string
          result?: string
          source_name?: string | null
          source_priority?: number
          source_type?: string
          source_weight?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          ai_analysis?: string | null
          confidence_after?: number | null
          confidence_before?: number | null
          created_at?: string
          evidence_notes?: string | null
          evidence_url?: string | null
          field_path?: string
          field_value?: string | null
          id?: string
          property_id?: string
          result?: string
          source_name?: string | null
          source_priority?: number
          source_type?: string
          source_weight?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_events_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      warranties: {
        Row: {
          claim_notes: string | null
          claim_phone: string | null
          claim_website: string | null
          coverage_end: string | null
          coverage_start: string | null
          created_at: string
          data_status: Database["public"]["Enums"]["data_status"]
          document_path: string | null
          document_url: string | null
          extended_doc_path: string | null
          extended_doc_url: string | null
          id: string
          is_transferable: boolean | null
          property_id: string
          provider_name: string | null
          system_detail_id: string | null
          updated_at: string
          user_id: string
          warranty_type: string
        }
        Insert: {
          claim_notes?: string | null
          claim_phone?: string | null
          claim_website?: string | null
          coverage_end?: string | null
          coverage_start?: string | null
          created_at?: string
          data_status?: Database["public"]["Enums"]["data_status"]
          document_path?: string | null
          document_url?: string | null
          extended_doc_path?: string | null
          extended_doc_url?: string | null
          id?: string
          is_transferable?: boolean | null
          property_id: string
          provider_name?: string | null
          system_detail_id?: string | null
          updated_at?: string
          user_id: string
          warranty_type?: string
        }
        Update: {
          claim_notes?: string | null
          claim_phone?: string | null
          claim_website?: string | null
          coverage_end?: string | null
          coverage_start?: string | null
          created_at?: string
          data_status?: Database["public"]["Enums"]["data_status"]
          document_path?: string | null
          document_url?: string | null
          extended_doc_path?: string | null
          extended_doc_url?: string | null
          id?: string
          is_transferable?: boolean | null
          property_id?: string
          provider_name?: string | null
          system_detail_id?: string | null
          updated_at?: string
          user_id?: string
          warranty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "warranties_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warranties_system_detail_id_fkey"
            columns: ["system_detail_id"]
            isOneToOne: false
            referencedRelation: "system_details"
            referencedColumns: ["id"]
          },
        ]
      }
      water_quality_tests: {
        Row: {
          created_at: string
          id: string
          lab_name: string | null
          notes: string | null
          property_id: string
          result: string
          result_values: Json | null
          test_date: string
          test_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lab_name?: string | null
          notes?: string | null
          property_id: string
          result?: string
          result_values?: Json | null
          test_date: string
          test_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lab_name?: string | null
          notes?: string | null
          property_id?: string
          result?: string
          result_values?: Json | null
          test_date?: string
          test_type?: string
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
      generate_referral_code: {
        Args: { _full_name: string; _referrer_type: string; _user_id: string }
        Returns: string
      }
      grant_credits: {
        Args: { _amount: number; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      notify_property_connections: {
        Args: {
          _inspection_record_id: string
          _notification_type?: Database["public"]["Enums"]["inspection_notification_type"]
          _payload?: Json
          _property_id: string
        }
        Returns: number
      }
      spend_credits: { Args: { _amount: number }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "homeowner"
        | "realtor"
        | "inspector"
        | "contractor"
        | "investor"
      data_source_type:
        | "inspector_verified"
        | "county_record"
        | "ai_extracted"
        | "owner_submitted"
      data_status:
        | "confirmed"
        | "unknown"
        | "ai_extracted"
        | "inspector_verified"
        | "county_record"
      dispute_status:
        | "open"
        | "under_review"
        | "resolved_upheld"
        | "resolved_updated"
      inspection_notification_type:
        | "new_inspection_uploaded"
        | "finding_resolved"
        | "fix_verified"
      profile_type: "personal" | "business"
      property_connection_role:
        | "co_owner"
        | "renter"
        | "realtor"
        | "inspector"
        | "contractor"
        | "investor"
      property_connection_status: "active" | "pending" | "revoked"
      verification_entity:
        | "maintenance_history"
        | "inspection_finding"
        | "fix_verification"
        | "property_record"
      verification_level:
        | "permit_verified"
        | "receipt_verified"
        | "photo_timestamp"
        | "owner_claimed"
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
      data_source_type: [
        "inspector_verified",
        "county_record",
        "ai_extracted",
        "owner_submitted",
      ],
      data_status: [
        "confirmed",
        "unknown",
        "ai_extracted",
        "inspector_verified",
        "county_record",
      ],
      dispute_status: [
        "open",
        "under_review",
        "resolved_upheld",
        "resolved_updated",
      ],
      inspection_notification_type: [
        "new_inspection_uploaded",
        "finding_resolved",
        "fix_verified",
      ],
      profile_type: ["personal", "business"],
      property_connection_role: [
        "co_owner",
        "renter",
        "realtor",
        "inspector",
        "contractor",
        "investor",
      ],
      property_connection_status: ["active", "pending", "revoked"],
      verification_entity: [
        "maintenance_history",
        "inspection_finding",
        "fix_verification",
        "property_record",
      ],
      verification_level: [
        "permit_verified",
        "receipt_verified",
        "photo_timestamp",
        "owner_claimed",
      ],
    },
  },
} as const
