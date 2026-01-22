/*
  # Add Node Connections Table
  
  1. New Tables
    - `node_connections`
      - `id` (uuid, primary key)
      - `source_type` (text) - "agent", "mcp", "system"
      - `source_id` (uuid) - ID of source node
      - `target_type` (text) - "agent", "mcp", "system"
      - `target_id` (uuid) - ID of target node
      - `connection_type` (text) - "delegates_to", "uses_mcp", "accesses_system"
      - `created_at` (timestamp)
  
  2. Security
    - Enable RLS on table
    - Add policies for public read access
*/

-- Create node connections table
CREATE TABLE IF NOT EXISTS node_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type text NOT NULL CHECK (source_type IN ('agent', 'mcp', 'system')),
  source_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('agent', 'mcp', 'system')),
  target_id uuid NOT NULL,
  connection_type text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE node_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for node_connections
CREATE POLICY "Allow public read access to node_connections"
  ON node_connections
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to insert node_connections"
  ON node_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update node_connections"
  ON node_connections
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete node_connections"
  ON node_connections
  FOR DELETE
  TO authenticated
  USING (true);
