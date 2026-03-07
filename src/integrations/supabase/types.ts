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
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          cif: string | null
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          notes: string | null
          rate_per_km: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          cif?: string | null
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          rate_per_km?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          cif?: string | null
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          rate_per_km?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string | null
          doc_category: string | null
          driver_id: string | null
          expiry_date: string | null
          file_type: string | null
          file_url: string
          id: string
          name: string
          trailer_id: string | null
          trip_id: string | null
          uploaded_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          doc_category?: string | null
          driver_id?: string | null
          expiry_date?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          trailer_id?: string | null
          trip_id?: string | null
          uploaded_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          doc_category?: string | null
          driver_id?: string | null
          expiry_date?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          trailer_id?: string | null
          trip_id?: string | null
          uploaded_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          license_expiry: string | null
          license_number: string | null
          notes: string | null
          phone: string | null
          rating: number | null
          status: string | null
          tachograph_card: string | null
          tachograph_expiry: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name: string
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          status?: string | null
          tachograph_card?: string | null
          tachograph_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          rating?: number | null
          status?: string | null
          tachograph_card?: string | null
          tachograph_expiry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      expiry_notifications_sent: {
        Row: {
          days_before: number
          entity_id: string
          entity_type: string
          expiry_date: string
          id: string
          notified_at: string
        }
        Insert: {
          days_before: number
          entity_id: string
          entity_type: string
          expiry_date: string
          id?: string
          notified_at?: string
        }
        Update: {
          days_before?: number
          entity_id?: string
          entity_type?: string
          expiry_date?: string
          id?: string
          notified_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          created_at: string | null
          id: string
          lat: number
          lng: number
          trip_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lat: number
          lng: number
          trip_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lat?: number
          lng?: number
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          content: string | null
          created_at: string | null
          id: string
          sender_id: string
          trip_id: string
        }
        Insert: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sender_id: string
          trip_id: string
        }
        Update: {
          attachment_url?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_document_uploaded: boolean
          email_driver_status: boolean
          email_enabled: boolean
          email_expiry_alert: boolean
          email_location_update: boolean
          email_new_message: boolean
          email_trip_assigned: boolean
          email_trip_status: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_document_uploaded?: boolean
          email_driver_status?: boolean
          email_enabled?: boolean
          email_expiry_alert?: boolean
          email_location_update?: boolean
          email_new_message?: boolean
          email_trip_assigned?: boolean
          email_trip_status?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_document_uploaded?: boolean
          email_driver_status?: boolean
          email_enabled?: boolean
          email_expiry_alert?: boolean
          email_location_update?: boolean
          email_new_message?: boolean
          email_trip_assigned?: boolean
          email_trip_status?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          language: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          language?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          language?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      trailers: {
        Row: {
          capacity_tons: number | null
          created_at: string | null
          id: string
          itp_expiry: string | null
          notes: string | null
          plate_number: string
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          capacity_tons?: number | null
          created_at?: string | null
          id?: string
          itp_expiry?: string | null
          notes?: string | null
          plate_number: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          capacity_tons?: number | null
          created_at?: string | null
          id?: string
          itp_expiry?: string | null
          notes?: string | null
          plate_number?: string
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_events: {
        Row: {
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          cargo_type: string | null
          client_id: string | null
          created_at: string | null
          delivery_address: string
          delivery_date: string | null
          distance_km: number | null
          driver_advance: number | null
          driver_id: string | null
          fuel_cost: number | null
          id: string
          observations: string | null
          other_expenses: number | null
          pickup_address: string
          pickup_date: string | null
          revenue: number | null
          road_taxes: number | null
          status: string | null
          trailer_id: string | null
          trip_number: string
          updated_at: string | null
          vehicle_id: string | null
          weight_tons: number | null
        }
        Insert: {
          cargo_type?: string | null
          client_id?: string | null
          created_at?: string | null
          delivery_address: string
          delivery_date?: string | null
          distance_km?: number | null
          driver_advance?: number | null
          driver_id?: string | null
          fuel_cost?: number | null
          id?: string
          observations?: string | null
          other_expenses?: number | null
          pickup_address: string
          pickup_date?: string | null
          revenue?: number | null
          road_taxes?: number | null
          status?: string | null
          trailer_id?: string | null
          trip_number: string
          updated_at?: string | null
          vehicle_id?: string | null
          weight_tons?: number | null
        }
        Update: {
          cargo_type?: string | null
          client_id?: string | null
          created_at?: string | null
          delivery_address?: string
          delivery_date?: string | null
          distance_km?: number | null
          driver_advance?: number | null
          driver_id?: string | null
          fuel_cost?: number | null
          id?: string
          observations?: string | null
          other_expenses?: number | null
          pickup_address?: string
          pickup_date?: string | null
          revenue?: number | null
          road_taxes?: number | null
          status?: string | null
          trailer_id?: string | null
          trip_number?: string
          updated_at?: string | null
          vehicle_id?: string | null
          weight_tons?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_trailer_id_fkey"
            columns: ["trailer_id"]
            isOneToOne: false
            referencedRelation: "trailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
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
      vehicles: {
        Row: {
          avg_consumption: number | null
          capacity_tons: number | null
          created_at: string | null
          id: string
          insurance_expiry: string | null
          itp_expiry: string | null
          model: string | null
          notes: string | null
          plate_number: string
          rca_expiry: string | null
          status: string | null
          updated_at: string | null
          vin: string | null
          year: number | null
        }
        Insert: {
          avg_consumption?: number | null
          capacity_tons?: number | null
          created_at?: string | null
          id?: string
          insurance_expiry?: string | null
          itp_expiry?: string | null
          model?: string | null
          notes?: string | null
          plate_number: string
          rca_expiry?: string | null
          status?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          avg_consumption?: number | null
          capacity_tons?: number | null
          created_at?: string | null
          id?: string
          insurance_expiry?: string | null
          itp_expiry?: string | null
          model?: string | null
          notes?: string | null
          plate_number?: string
          rca_expiry?: string | null
          status?: string | null
          updated_at?: string | null
          vin?: string | null
          year?: number | null
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
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      notify_admins:
        | { Args: { _message?: string; _title: string }; Returns: undefined }
        | {
            Args: {
              _entity_id?: string
              _entity_type?: string
              _message?: string
              _title: string
            }
            Returns: undefined
          }
      notify_user:
        | {
            Args: { _message?: string; _title: string; _user_id: string }
            Returns: undefined
          }
        | {
            Args: {
              _entity_id?: string
              _entity_type?: string
              _message?: string
              _title: string
              _user_id: string
            }
            Returns: undefined
          }
    }
    Enums: {
      app_role: "owner" | "dispatcher" | "driver"
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
      app_role: ["owner", "dispatcher", "driver"],
    },
  },
} as const
