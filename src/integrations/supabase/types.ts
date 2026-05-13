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
      assignments: {
        Row: {
          allow_resubmit: boolean
          created_at: string
          created_by: string | null
          deadline_at: string | null
          description: string | null
          file_name: string | null
          file_url: string | null
          id: string
          session_id: string
          title: string
        }
        Insert: {
          allow_resubmit?: boolean
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          session_id: string
          title: string
        }
        Update: {
          allow_resubmit?: boolean
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          description?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          session_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          id: string
          marked_at: string
          marked_by: string | null
          session_id: string
          student_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          marked_by?: string | null
          session_id: string
          student_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          marked_by?: string | null
          session_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_id: string | null
          created_at: string
          department: string | null
          email: string
          id: string
          name: string
          status: Database["public"]["Enums"]["student_status"]
          usn: string | null
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          department?: string | null
          email: string
          id: string
          name: string
          status?: Database["public"]["Enums"]["student_status"]
          usn?: string | null
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          name?: string
          status?: Database["public"]["Enums"]["student_status"]
          usn?: string | null
        }
        Relationships: []
      }
      qr_tokens_used: {
        Row: {
          session_id: string | null
          token: string
          used_at: string
        }
        Insert: {
          session_id?: string | null
          token: string
          used_at?: string
        }
        Update: {
          session_id?: string | null
          token?: string
          used_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_tokens_used_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string | null
          file_url: string | null
          id: string
          link_url: string | null
          session_id: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          link_url?: string | null
          session_id: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          link_url?: string | null
          session_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_summaries: {
        Row: {
          content: string
          created_at: string
          id: string
          session_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          session_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          session_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_summaries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_summaries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          hosted_by: string | null
          id: string
          max_capacity: number
          name: string
          resource_person: string | null
          status: Database["public"]["Enums"]["session_status"]
          time: string
          updated_at: string
          venue: string
          volunteer_count: number
          volunteer_names: string[]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          hosted_by?: string | null
          id?: string
          max_capacity?: number
          name: string
          resource_person?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          time: string
          updated_at?: string
          venue: string
          volunteer_count?: number
          volunteer_names?: string[]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          hosted_by?: string | null
          id?: string
          max_capacity?: number
          name?: string
          resource_person?: string | null
          status?: Database["public"]["Enums"]["session_status"]
          time?: string
          updated_at?: string
          venue?: string
          volunteer_count?: number
          volunteer_names?: string[]
        }
        Relationships: []
      }
      submissions: {
        Row: {
          assignment_id: string
          file_name: string | null
          file_url: string | null
          id: string
          links: string[]
          reviewed: boolean
          student_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          links?: string[]
          reviewed?: boolean
          student_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          links?: string[]
          reviewed?: boolean
          student_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      lookup_email_by_identifier: {
        Args: { _identifier: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "student" | "admin"
      session_status: "upcoming" | "live" | "closed"
      student_status: "pending" | "approved" | "rejected"
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
      app_role: ["student", "admin"],
      session_status: ["upcoming", "live", "closed"],
      student_status: ["pending", "approved", "rejected"],
    },
  },
} as const
