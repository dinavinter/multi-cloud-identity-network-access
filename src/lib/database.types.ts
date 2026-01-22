export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agents: {
        Row: {
          id: string
          name: string
          type: string
          description: string
          provider: string
          status: string
          labels: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string
          provider: string
          status?: string
          labels?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string
          provider?: string
          status?: string
          labels?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      agent_identities: {
        Row: {
          id: string
          agent_id: string
          identity_name: string
          identity_id: string
          ord_id: string
          tenant: string
          idp_type: string
          idp_domain: string
          status: string
          last_login: string
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          identity_name: string
          identity_id: string
          ord_id: string
          tenant: string
          idp_type: string
          idp_domain: string
          status?: string
          last_login?: string
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          identity_name?: string
          identity_id?: string
          ord_id?: string
          tenant?: string
          idp_type?: string
          idp_domain?: string
          status?: string
          last_login?: string
          created_at?: string
        }
      }
      systems: {
        Row: {
          id: string
          name: string
          system_type: string
          provider: string
          description: string
          created_at: string
        }
      }
      permissions: {
        Row: {
          id: string
          agent_identity_id: string
          system_id: string
          permission_type: string
          api_name: string
          api_description: string
          authorization_context: string
          granted_by: string
          created_at: string
        }
      }
      policy_rules: {
        Row: {
          id: string
          agent_id: string
          rule_attribute: string
          rule_operator: string
          rule_value: string
          action: string
          action_type: string
          priority: number
          created_at: string
        }
      }
      meta_policies: {
        Row: {
          id: string
          name: string
          description: string
          scope: string
          scope_target: string
          policy_rules: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      agent_connections: {
        Row: {
          id: string
          from_agent_identity_id: string
          to_agent_identity_id: string
          connection_type: string
          created_at: string
        }
      }
      mcp_servers: {
        Row: {
          id: string
          name: string
          server_type: string
          provider: string
          description: string
          endpoint: string
          created_at: string
        }
      }
    }
  }
}
