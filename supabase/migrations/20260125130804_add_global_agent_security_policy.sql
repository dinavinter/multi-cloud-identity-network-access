/*
  # Add Global Agent Security Policy

  This migration adds the "Global Agent Security Policy" with the SAP server discovery rule.
  The policy allows discovery of tools from SAP-created servers (server.createdBy = sap/*).
*/

-- Insert Global Agent Security Policy if it doesn't exist
INSERT INTO meta_policies (name, description, scope, scope_target, policy_rules, is_active)
SELECT 
  'Global Agent Security Policy',
  'Global security policies that apply to all agents',
  'global',
  '',
  '[
    {
      "attribute": "server.createdBy",
      "operator": "=",
      "value": "sap/*",
      "action": "Allow",
      "actionType": "Discover Tool"
    }
  ]'::jsonb,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM meta_policies 
  WHERE name = 'Global Agent Security Policy' 
  AND scope = 'global'
);
