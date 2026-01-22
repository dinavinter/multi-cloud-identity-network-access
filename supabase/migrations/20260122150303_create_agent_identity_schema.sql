/*
  # Agent Identity & Access Management Schema

  ## Overview
  This migration creates the complete schema for an Agent Identity & Access Management system
  following SAP Cloud Identity patterns. It supports multi-tenant agent identities, permissions,
  policies, and cross-system dependencies.

  ## New Tables

  ### 1. `agents`
  Represents logical agent types (e.g., Workflow Automation, HR Agent, Finance Agent)
  - `id` (uuid, primary key)
  - `name` (text) - Agent display name
  - `type` (text) - Agent type/category
  - `description` (text) - Agent description
  - `provider` (text) - Provider (SAP, Microsoft, ServiceNow, AWS, Google, Salesforce, etc.)
  - `status` (text) - Active/Inactive
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. `agent_identities`
  Represents specific agent instances/identities across different tenants/regions
  - `id` (uuid, primary key)
  - `agent_id` (uuid, foreign key to agents)
  - `identity_name` (text) - Specific identity name
  - `identity_id` (text) - Identity identifier (e.g., A532408)
  - `ord_id` (text) - ORD identifier
  - `tenant` (text) - Tenant/region identifier
  - `idp_type` (text) - IDP type (IAS, Azure AD, Okta, etc.)
  - `idp_domain` (text) - IDP domain
  - `status` (text) - Active/Inactive
  - `last_login` (timestamptz)
  - `created_at` (timestamptz)

  ### 3. `systems`
  External systems that agents can access
  - `id` (uuid, primary key)
  - `name` (text) - System name
  - `system_type` (text) - Type of system
  - `provider` (text) - System provider
  - `description` (text)
  - `created_at` (timestamptz)

  ### 4. `permissions`
  Permissions that agents have on systems
  - `id` (uuid, primary key)
  - `agent_identity_id` (uuid, foreign key to agent_identities)
  - `system_id` (uuid, foreign key to systems)
  - `permission_type` (text) - Principal Propagation, Agentic Access, Read Only, etc.
  - `api_name` (text) - API name
  - `api_description` (text)
  - `authorization_context` (text) - User Context, Technical Access, etc.
  - `granted_by` (text) - How permission was granted
  - `created_at` (timestamptz)

  ### 5. `policy_rules`
  Individual policy rules applied to agents
  - `id` (uuid, primary key)
  - `agent_id` (uuid, foreign key to agents, nullable for global policies)
  - `rule_attribute` (text) - Attribute being checked (risk-level, access-level, createdBy, etc.)
  - `rule_operator` (text) - is, contains, matches, etc.
  - `rule_value` (text) - Value to check against
  - `action` (text) - Allow, Deny, Ask For Consent
  - `action_type` (text) - Invoke Tool, Block, etc.
  - `priority` (integer) - Rule priority
  - `created_at` (timestamptz)

  ### 6. `meta_policies`
  Meta-level policies that apply to agent types or all agents in tenants
  - `id` (uuid, primary key)
  - `name` (text) - Policy name
  - `description` (text)
  - `scope` (text) - global, agent_type, specific_agent, tenant
  - `scope_target` (text) - Target agent type or tenant ID
  - `policy_rules` (jsonb) - Array of policy rule definitions
  - `is_active` (boolean)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 7. `agent_connections`
  Connections/relationships between agent identities
  - `id` (uuid, primary key)
  - `from_agent_identity_id` (uuid, foreign key to agent_identities)
  - `to_agent_identity_id` (uuid, foreign key to agent_identities)
  - `connection_type` (text) - delegates_to, calls, depends_on, etc.
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Add policies for authenticated users to read all data
  - In production, these would be more restrictive based on user roles
*/

-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL,
  description text DEFAULT '',
  provider text NOT NULL,
  status text DEFAULT 'Active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_identities table
CREATE TABLE IF NOT EXISTS agent_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  identity_name text NOT NULL,
  identity_id text NOT NULL,
  ord_id text NOT NULL,
  tenant text NOT NULL,
  idp_type text NOT NULL,
  idp_domain text NOT NULL,
  status text DEFAULT 'Active',
  last_login timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Create systems table
CREATE TABLE IF NOT EXISTS systems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  system_type text NOT NULL,
  provider text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_identity_id uuid REFERENCES agent_identities(id) ON DELETE CASCADE,
  system_id uuid REFERENCES systems(id) ON DELETE CASCADE,
  permission_type text NOT NULL,
  api_name text NOT NULL,
  api_description text DEFAULT '',
  authorization_context text DEFAULT '',
  granted_by text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create policy_rules table
CREATE TABLE IF NOT EXISTS policy_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES agents(id) ON DELETE CASCADE,
  rule_attribute text NOT NULL,
  rule_operator text NOT NULL,
  rule_value text NOT NULL,
  action text NOT NULL,
  action_type text NOT NULL,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create meta_policies table
CREATE TABLE IF NOT EXISTS meta_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  scope text NOT NULL,
  scope_target text DEFAULT '',
  policy_rules jsonb DEFAULT '[]'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_connections table
CREATE TABLE IF NOT EXISTS agent_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_agent_identity_id uuid REFERENCES agent_identities(id) ON DELETE CASCADE,
  to_agent_identity_id uuid REFERENCES agent_identities(id) ON DELETE CASCADE,
  connection_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_connections ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all authenticated users to read for demo purposes)
CREATE POLICY "Allow all to read agents"
  ON agents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to insert agents"
  ON agents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to update agents"
  ON agents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete agents"
  ON agents FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to read agent_identities"
  ON agent_identities FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to insert agent_identities"
  ON agent_identities FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to update agent_identities"
  ON agent_identities FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete agent_identities"
  ON agent_identities FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to read systems"
  ON systems FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to insert systems"
  ON systems FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to read permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to insert permissions"
  ON permissions FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to read policy_rules"
  ON policy_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to insert policy_rules"
  ON policy_rules FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to update policy_rules"
  ON policy_rules FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete policy_rules"
  ON policy_rules FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to read meta_policies"
  ON meta_policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to insert meta_policies"
  ON meta_policies FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all to update meta_policies"
  ON meta_policies FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all to delete meta_policies"
  ON meta_policies FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to read agent_connections"
  ON agent_connections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all to insert agent_connections"
  ON agent_connections FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_identities_agent_id ON agent_identities(agent_id);
CREATE INDEX IF NOT EXISTS idx_permissions_agent_identity_id ON permissions(agent_identity_id);
CREATE INDEX IF NOT EXISTS idx_permissions_system_id ON permissions(system_id);
CREATE INDEX IF NOT EXISTS idx_policy_rules_agent_id ON policy_rules(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_connections_from ON agent_connections(from_agent_identity_id);
CREATE INDEX IF NOT EXISTS idx_agent_connections_to ON agent_connections(to_agent_identity_id);