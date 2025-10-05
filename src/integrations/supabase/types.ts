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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aluno_curso: {
        Row: {
          aluno_id: string
          created_at: string | null
          curso_id: string
          id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          curso_id: string
          id?: string
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          curso_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aluno_curso_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aluno_curso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      aluno_turma: {
        Row: {
          aluno_id: string
          created_at: string | null
          id: string
          turma_id: string
        }
        Insert: {
          aluno_id: string
          created_at?: string | null
          id?: string
          turma_id: string
        }
        Update: {
          aluno_id?: string
          created_at?: string | null
          id?: string
          turma_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aluno_turma_aluno_id_fkey"
            columns: ["aluno_id"]
            isOneToOne: false
            referencedRelation: "alunos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aluno_turma_turma_id_fkey"
            columns: ["turma_id"]
            isOneToOne: false
            referencedRelation: "turmas"
            referencedColumns: ["id"]
          },
        ]
      }
      alunos: {
        Row: {
          created_at: string | null
          email: string | null
          graduacao: Database["public"]["Enums"]["graduacao_militar"]
          id: string
          local_servico: string | null
          nome_completo: string
          observacoes: string | null
          telefone: string | null
          tipo_militar: Database["public"]["Enums"]["tipo_militar"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          graduacao: Database["public"]["Enums"]["graduacao_militar"]
          id?: string
          local_servico?: string | null
          nome_completo: string
          observacoes?: string | null
          telefone?: string | null
          tipo_militar: Database["public"]["Enums"]["tipo_militar"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          graduacao?: Database["public"]["Enums"]["graduacao_militar"]
          id?: string
          local_servico?: string | null
          nome_completo?: string
          observacoes?: string | null
          telefone?: string | null
          tipo_militar?: Database["public"]["Enums"]["tipo_militar"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          categoria: string | null
          created_at: string | null
          data_fim: string | null
          data_inicio: string | null
          id: string
          instituicao: string | null
          nome: string
          observacoes: string | null
          situacao: Database["public"]["Enums"]["situacao_curso"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          categoria?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          instituicao?: string | null
          nome: string
          observacoes?: string | null
          situacao?: Database["public"]["Enums"]["situacao_curso"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          categoria?: string | null
          created_at?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          id?: string
          instituicao?: string | null
          nome?: string
          observacoes?: string | null
          situacao?: Database["public"]["Enums"]["situacao_curso"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documentos_curso: {
        Row: {
          created_at: string | null
          curso_id: string
          id: string
          nome_arquivo: string
          url_arquivo: string
        }
        Insert: {
          created_at?: string | null
          curso_id: string
          id?: string
          nome_arquivo: string
          url_arquivo: string
        }
        Update: {
          created_at?: string | null
          curso_id?: string
          id?: string
          nome_arquivo?: string
          url_arquivo?: string
        }
        Relationships: [
          {
            foreignKeyName: "documentos_curso_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          id: string
          nome_completo: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          nome_completo?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          nome_completo?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      turmas: {
        Row: {
          ano: number
          created_at: string | null
          curso_id: string
          id: string
          nome: string
          observacoes: string | null
          tipo_militar: Database["public"]["Enums"]["tipo_militar"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ano: number
          created_at?: string | null
          curso_id: string
          id?: string
          nome: string
          observacoes?: string | null
          tipo_militar: Database["public"]["Enums"]["tipo_militar"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ano?: number
          created_at?: string | null
          curso_id?: string
          id?: string
          nome?: string
          observacoes?: string | null
          tipo_militar?: Database["public"]["Enums"]["tipo_militar"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "turmas_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      graduacao_militar:
        | "Soldado"
        | "Cabo"
        | "Terceiro Sargento"
        | "Segundo Sargento"
        | "Primeiro Sargento"
        | "Subtenente"
        | "Aspirante"
        | "Segundo Tenente"
        | "Primeiro Tenente"
        | "Capitão"
        | "Major"
        | "Tenente Coronel"
        | "Coronel"
        | "1º Tenente"
        | "2º Tenente"
        | "Tenente-Coronel"
        | "1º Sargento"
        | "2º Sargento"
        | "3º Sargento"
      situacao_curso: "Em Andamento" | "Concluído" | "Cancelado"
      tipo_militar: "Fuzileiro Naval" | "Guarda Costeiro"
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
      graduacao_militar: [
        "Soldado",
        "Cabo",
        "Terceiro Sargento",
        "Segundo Sargento",
        "Primeiro Sargento",
        "Subtenente",
        "Aspirante",
        "Segundo Tenente",
        "Primeiro Tenente",
        "Capitão",
        "Major",
        "Tenente Coronel",
        "Coronel",
        "1º Tenente",
        "2º Tenente",
        "Tenente-Coronel",
        "1º Sargento",
        "2º Sargento",
        "3º Sargento",
      ],
      situacao_curso: ["Em Andamento", "Concluído", "Cancelado"],
      tipo_militar: ["Fuzileiro Naval", "Guarda Costeiro"],
    },
  },
} as const
