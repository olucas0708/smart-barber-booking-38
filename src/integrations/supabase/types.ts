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
      agendamentos: {
        Row: {
          barbeiro_id: string
          cliente_id: string
          criado_em: string
          fim: string
          id: string
          inicio: string
          observacoes: string | null
          pagamento_metodo: string | null
          pagamento_status: Database["public"]["Enums"]["status_pagamento"]
          preco: number
          servico_id: string
          status: Database["public"]["Enums"]["status_agendamento"]
          beneficio_fidelidade: boolean
        }
        Insert: {
          barbeiro_id: string
          cliente_id: string
          criado_em?: string
          fim: string
          id?: string
          inicio: string
          observacoes?: string | null
          pagamento_metodo?: string | null
          pagamento_status?: Database["public"]["Enums"]["status_pagamento"]
          preco?: number
          servico_id: string
          status?: Database["public"]["Enums"]["status_agendamento"]
          beneficio_fidelidade?: boolean
        }
        Update: {
          barbeiro_id?: string
          cliente_id?: string
          criado_em?: string
          fim?: string
          id?: string
          inicio?: string
          observacoes?: string | null
          pagamento_metodo?: string | null
          pagamento_status?: Database["public"]["Enums"]["status_pagamento"]
          preco?: number
          servico_id?: string
          status?: Database["public"]["Enums"]["status_agendamento"]
        }
        Relationships: [
          {
            foreignKeyName: "agendamentos_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agendamentos_servico_id_fkey"
            columns: ["servico_id"]
            isOneToOne: false
            referencedRelation: "servicos"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          acao: string
          actor_id: string | null
          criado_em: string
          detalhes: Json | null
          entidade: string
          entidade_id: string | null
          id: string
        }
        Insert: {
          acao: string
          actor_id?: string | null
          criado_em?: string
          detalhes?: Json | null
          entidade: string
          entidade_id?: string | null
          id?: string
        }
        Update: {
          acao?: string
          actor_id?: string | null
          criado_em?: string
          detalhes?: Json | null
          entidade?: string
          entidade_id?: string | null
          id?: string
        }
        Relationships: []
      }
      avaliacoes: {
        Row: {
          agendamento_id: string
          barbeiro_id: string
          cliente_id: string
          comentario: string | null
          criado_em: string
          id: string
          nota: number
        }
        Insert: {
          agendamento_id: string
          barbeiro_id: string
          cliente_id: string
          comentario?: string | null
          criado_em?: string
          id?: string
          nota: number
        }
        Update: {
          agendamento_id?: string
          barbeiro_id?: string
          cliente_id?: string
          comentario?: string | null
          criado_em?: string
          id?: string
          nota?: number
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_agendamento_id_fkey"
            columns: ["agendamento_id"]
            isOneToOne: true
            referencedRelation: "agendamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      barbeiros: {
        Row: {
          ativo: boolean
          criado_em: string
          especialidades: string[]
          foto_url: string | null
          id: string
          nome: string
          profile_id: string | null
          cargo: string
          bio: string | null
          ordem: number
        }
        Insert: {
          ativo?: boolean
          criado_em?: string
          especialidades?: string[]
          foto_url?: string | null
          id?: string
          nome: string
          profile_id?: string | null
          cargo?: string
          bio?: string | null
          ordem?: number
        }
        Update: {
          ativo?: boolean
          criado_em?: string
          especialidades?: string[]
          foto_url?: string | null
          id?: string
          nome?: string
          profile_id?: string | null
          cargo?: string
          bio?: string | null
          ordem?: number
        }
        Relationships: []
      }
      bloqueios: {
        Row: {
          barbeiro_id: string
          criado_em: string
          data: string
          hora_fim: string
          hora_inicio: string
          id: string
          motivo: string | null
        }
        Insert: {
          barbeiro_id: string
          criado_em?: string
          data: string
          hora_fim: string
          hora_inicio: string
          id?: string
          motivo?: string | null
        }
        Update: {
          barbeiro_id?: string
          criado_em?: string
          data?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          motivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bloqueios_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes: {
        Row: {
          antecedencia_min_cancelamento_horas: number
          atualizado_em: string
          dias_funcionamento: number[]
          hora_abertura: string
          hora_fechamento: string
          id: boolean
          intervalo_slots_minutos: number
          nome: string
        }
        Insert: {
          antecedencia_min_cancelamento_horas?: number
          atualizado_em?: string
          dias_funcionamento?: number[]
          hora_abertura?: string
          hora_fechamento?: string
          id?: boolean
          intervalo_slots_minutos?: number
          nome?: string
        }
        Update: {
          antecedencia_min_cancelamento_horas?: number
          atualizado_em?: string
          dias_funcionamento?: number[]
          hora_abertura?: string
          hora_fechamento?: string
          id?: boolean
          intervalo_slots_minutos?: number
          nome?: string
        }
        Relationships: []
      }
      horarios_trabalho: {
        Row: {
          barbeiro_id: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id: string
        }
        Insert: {
          barbeiro_id: string
          dia_semana: number
          hora_fim: string
          hora_inicio: string
          id?: string
        }
        Update: {
          barbeiro_id?: string
          dia_semana?: number
          hora_fim?: string
          hora_inicio?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horarios_trabalho_barbeiro_id_fkey"
            columns: ["barbeiro_id"]
            isOneToOne: false
            referencedRelation: "barbeiros"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bloqueado: boolean
          consentimento_lgpd: boolean
          criado_em: string
          email: string | null
          foto_url: string | null
          id: string
          nome: string
          telefone: string | null
        }
        Insert: {
          bloqueado?: boolean
          consentimento_lgpd?: boolean
          criado_em?: string
          email?: string | null
          foto_url?: string | null
          id: string
          nome?: string
          telefone?: string | null
        }
        Update: {
          bloqueado?: boolean
          consentimento_lgpd?: boolean
          criado_em?: string
          email?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          telefone?: string | null
        }
        Relationships: []
      }
      servicos: {
        Row: {
          ativo: boolean
          categoria: string | null
          criado_em: string
          descricao: string | null
          duracao_minutos: number
          id: string
          nome: string
          preco: number
          preco_a_partir: boolean
        }
        Insert: {
          ativo?: boolean
          categoria?: string | null
          criado_em?: string
          descricao?: string | null
          duracao_minutos: number
          id?: string
          nome: string
          preco: number
          preco_a_partir?: boolean
        }
        Update: {
          ativo?: boolean
          categoria?: string | null
          criado_em?: string
          descricao?: string | null
          duracao_minutos?: number
          id?: string
          nome?: string
          preco?: number
          preco_a_partir?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          criado_em: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          criado_em?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          criado_em?: string
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
      atende_cliente: { Args: { _cliente: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      horarios_disponiveis: {
        Args: { p_barbeiro: string; p_data: string; p_duracao: number }
        Returns: string[]
      }
      meu_barbeiro_id: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "cliente" | "barbeiro" | "admin"
      status_agendamento:
        | "pendente"
        | "confirmado"
        | "concluido"
        | "cancelado"
        | "nao_compareceu"
      status_pagamento: "pagar_no_local" | "pago" | "reembolsado"
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
    Enums: {
      app_role: ["cliente", "barbeiro", "admin"],
      status_agendamento: [
        "pendente",
        "confirmado",
        "concluido",
        "cancelado",
        "nao_compareceu",
      ],
      status_pagamento: ["pagar_no_local", "pago", "reembolsado"],
    },
  },
} as const
