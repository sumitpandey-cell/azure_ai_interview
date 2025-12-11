export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      badges: {
        Row: {
          id: string
          slug: string
          name: string
          description: string
          icon_name: string
          created_at: string
        }
        Insert: {
          id?: string
          slug: string
          name: string
          description: string
          icon_name: string
          created_at?: string
        }
        Update: {
          id?: string
          slug?: string
          name?: string
          description?: string
          icon_name?: string
          created_at?: string
        }
        Relationships: []
      }
      company_questions: {
        Row: {
          id: string
          company_id: string
          question_text: string
          question_type: 'Technical' | 'Behavioral' | 'System Design' | 'Coding' | 'Case Study'
          difficulty: 'Easy' | 'Medium' | 'Hard' | null
          role: string | null
          experience_level: 'Entry' | 'Mid' | 'Senior' | 'Staff' | 'Principal' | null
          tags: string[]
          metadata: Json
          is_active: boolean
          created_at: string
          updated_at: string
          difficulty_score: number | null
          hints: Json
        }
        Insert: {
          id?: string
          company_id: string
          question_text: string
          question_type: 'Technical' | 'Behavioral' | 'System Design' | 'Coding' | 'Case Study'
          difficulty?: 'Easy' | 'Medium' | 'Hard' | null
          role?: string | null
          experience_level?: 'Entry' | 'Mid' | 'Senior' | 'Staff' | 'Principal' | null
          tags?: string[]
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          difficulty_score?: number | null
          hints?: Json
        }
        Update: {
          id?: string
          company_id?: string
          question_text?: string
          question_type?: 'Technical' | 'Behavioral' | 'System Design' | 'Coding' | 'Case Study'
          difficulty?: 'Easy' | 'Medium' | 'Hard' | null
          role?: string | null
          experience_level?: 'Entry' | 'Mid' | 'Senior' | 'Staff' | 'Principal' | null
          tags?: string[]
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
          difficulty_score?: number | null
          hints?: Json
        }
        Relationships: [
          {
            foreignKeyName: "company_questions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      company_templates: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          industry: string | null
          description: string | null
          difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | null
          common_roles: string[]
          metadata: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          industry?: string | null
          description?: string | null
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null
          common_roles?: string[]
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          industry?: string | null
          description?: string | null
          difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null
          common_roles?: string[]
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_usage: {
        Row: {
          id: string
          user_id: string
          date: string
          minutes_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          minutes_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          minutes_used?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          id: string
          name: string
          icon: string
          description: string | null
          companies: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          description?: string | null
          companies?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          description?: string | null
          companies?: string[] | null
          created_at?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          id: string
          user_id: string
          interview_type: string
          position: string
          score: number | null
          status: string
          duration_minutes: number | null
          created_at: string
          completed_at: string | null
          config: Json
          feedback: Json | null
          transcript: Json | null
          difficulty_progression: Json
          total_hints_used: number
          average_performance_score: number | null
        }
        Insert: {
          id?: string
          user_id: string
          interview_type: string
          position: string
          score?: number | null
          status?: string
          duration_minutes?: number | null
          created_at?: string
          completed_at?: string | null
          config?: Json
          feedback?: Json | null
          transcript?: Json | null
          difficulty_progression?: Json
          total_hints_used?: number
          average_performance_score?: number | null
        }
        Update: {
          id?: string
          user_id?: string
          interview_type?: string
          position?: string
          score?: number | null
          status?: string
          duration_minutes?: number | null
          created_at?: string
          completed_at?: string | null
          config?: Json
          feedback?: Json | null
          transcript?: Json | null
          difficulty_progression?: Json
          total_hints_used?: number
          average_performance_score?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          title: string
          message: string
          type: string
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          message: string
          type?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          name: string
          monthly_minutes: number
          price_monthly: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          monthly_minutes: number
          price_monthly: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          monthly_minutes?: number
          price_monthly?: number
          created_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          streak_count: number
          last_activity_date: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          streak_count?: number
          last_activity_date?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          streak_count?: number
          last_activity_date?: string | null
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          title: string
          difficulty: 'Easy' | 'Medium' | 'Hard'
          domain_id: string | null
          topics: string[] | null
          description: string
          constraints: string[] | null
          examples: Json | null
          hints: string[] | null
          default_code: Json | null
          created_at: string
          test_cases: Json | null
          topic_id: string | null
        }
        Insert: {
          id?: string
          title: string
          difficulty: 'Easy' | 'Medium' | 'Hard'
          domain_id?: string | null
          topics?: string[] | null
          description: string
          constraints?: string[] | null
          examples?: Json | null
          hints?: string[] | null
          default_code?: Json | null
          created_at?: string
          test_cases?: Json | null
          topic_id?: string | null
        }
        Update: {
          id?: string
          title?: string
          difficulty?: 'Easy' | 'Medium' | 'Hard'
          domain_id?: string | null
          topics?: string[] | null
          description?: string
          constraints?: string[] | null
          examples?: Json | null
          hints?: string[] | null
          default_code?: Json | null
          created_at?: string
          test_cases?: Json | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          monthly_minutes: number
          minutes_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          monthly_minutes: number
          minutes_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          monthly_minutes?: number
          minutes_used?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      topics: {
        Row: {
          id: string
          domain_id: string | null
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          domain_id?: string | null
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          domain_id?: string | null
          name?: string
          description?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "topics_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          }
        ]
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          awarded_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          awarded_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          awarded_at?: string
        }
        Relationships: []
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[keyof Database]

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
    PublicSchema["Views"])
  ? (PublicSchema["Tables"] &
    PublicSchema["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
  | keyof PublicSchema["Tables"]
  | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
  ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
  | keyof PublicSchema["Enums"]
  | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
  ? PublicSchema["Enums"][PublicEnumNameOrOptions]
  : never
