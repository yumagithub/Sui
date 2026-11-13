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
      outing_candidates: {
        Row: {
          outing_id: string
          position: number
          spot_id: string
        }
        Insert: {
          outing_id: string
          position: number
          spot_id: string
        }
        Update: {
          outing_id?: string
          position?: number
          spot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outing_candidates_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outing_candidates_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      outing_members: {
        Row: {
          display_name: string
          joined_at: string
          outing_id: string
          user_id: string
        }
        Insert: {
          display_name: string
          joined_at?: string
          outing_id: string
          user_id: string
        }
        Update: {
          display_name?: string
          joined_at?: string
          outing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outing_members_outing_id_fkey"
            columns: ["outing_id"]
            isOneToOne: false
            referencedRelation: "outings"
            referencedColumns: ["id"]
          },
        ]
      }
      outings: {
        Row: {
          conditions: Json
          created_at: string
          created_by: string
          decided_spot_id: string | null
          id: string
          share_code: string
          status: string
        }
        Insert: {
          conditions?: Json
          created_at?: string
          created_by: string
          decided_spot_id?: string | null
          id?: string
          share_code?: string
          status?: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          created_by?: string
          decided_spot_id?: string | null
          id?: string
          share_code?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "outings_decided_spot_fkey"
            columns: ["id", "decided_spot_id"]
            isOneToOne: false
            referencedRelation: "outing_candidates"
            referencedColumns: ["outing_id", "spot_id"]
          },
        ]
      }
      spots: {
        Row: {
          budget_yen: number | null
          car_free_ok: boolean | null
          category: string
          created_at: string
          description: string | null
          google_maps_url: string | null
          has_parking: boolean | null
          hours_note: string | null
          id: string
          is_indoor: boolean
          is_published: boolean
          location: unknown
          municipality: string
          name: string
          photo_url: string | null
          tags: string[]
        }
        Insert: {
          budget_yen?: number | null
          car_free_ok?: boolean | null
          category: string
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          has_parking?: boolean | null
          hours_note?: string | null
          id?: string
          is_indoor: boolean
          is_published?: boolean
          location: unknown
          municipality: string
          name: string
          photo_url?: string | null
          tags?: string[]
        }
        Update: {
          budget_yen?: number | null
          car_free_ok?: boolean | null
          category?: string
          created_at?: string
          description?: string | null
          google_maps_url?: string | null
          has_parking?: boolean | null
          hours_note?: string | null
          id?: string
          is_indoor?: boolean
          is_published?: boolean
          location?: unknown
          municipality?: string
          name?: string
          photo_url?: string | null
          tags?: string[]
        }
        Relationships: []
      }
      visit_feedback: {
        Row: {
          created_at: string
          outing_id: string
          user_id: string
          went: boolean
        }
        Insert: {
          created_at?: string
          outing_id: string
          user_id: string
          went: boolean
        }
        Update: {
          created_at?: string
          outing_id?: string
          user_id?: string
          went?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "visit_feedback_outing_id_user_id_fkey"
            columns: ["outing_id", "user_id"]
            isOneToOne: true
            referencedRelation: "outing_members"
            referencedColumns: ["outing_id", "user_id"]
          },
        ]
      }
      votes: {
        Row: {
          created_at: string
          outing_id: string
          spot_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          outing_id: string
          spot_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          outing_id?: string
          spot_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_outing_id_spot_id_fkey"
            columns: ["outing_id", "spot_id"]
            isOneToOne: false
            referencedRelation: "outing_candidates"
            referencedColumns: ["outing_id", "spot_id"]
          },
          {
            foreignKeyName: "votes_outing_id_user_id_fkey"
            columns: ["outing_id", "user_id"]
            isOneToOne: true
            referencedRelation: "outing_members"
            referencedColumns: ["outing_id", "user_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_outing: {
        Args: { conditions?: Json; display_name: string; spot_ids: string[] }
        Returns: {
          id: string
          share_code: string
        }[]
      }
      join_outing: {
        Args: { display_name: string; share_code: string }
        Returns: string
      }
      pick_candidates: {
        Args: {
          categories?: string[]
          exclude_ids?: string[]
          has_car: boolean
          max_budget_yen?: number
          municipality?: string
          origin_lat: number
          origin_lng: number
          prefer_indoor?: boolean
        }
        Returns: {
          budget_yen: number
          car_free_ok: boolean
          category: string
          description: string
          distance_m: number
          google_maps_url: string
          has_parking: boolean
          hours_note: string
          id: string
          is_indoor: boolean
          lat: number
          lng: number
          municipality: string
          name: string
          photo_url: string
          relaxed: boolean
          tags: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
