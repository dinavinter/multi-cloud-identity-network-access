/*
  # Add Labels to Agents

  1. Changes
    - Add `labels` column to `agents` table
      - JSONB array to store flexible labels like "SAP:S4", "SAP:Ariba", "Microsoft:365"
      - Defaults to empty array
    
  2. Notes
    - Labels will help categorize and filter agents by technology stack
    - Using JSONB for flexibility and efficient querying
*/

-- Add labels column to agents table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agents' AND column_name = 'labels'
  ) THEN
    ALTER TABLE agents ADD COLUMN labels jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;