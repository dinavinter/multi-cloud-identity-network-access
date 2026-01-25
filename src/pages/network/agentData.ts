export interface AgentConfig {
    id: string;
    name: string;
    type: string;
    provider: string;
    region: string;
    subaccount: string;
    labels: string[];
    rules: Rule[];
    identities: Identity[];
  }
  
  export interface Rule {
    id: string;
    action: string;
    targetType: string;
    targetSpecifier?: string;
    actingAs?: string;
    conditions?: Condition[];
  }
  
  export interface Condition {
    attribute: string;
    operator: string;
    value: string;
  }
  
  export interface Identity {
    id: string;
    identity_name: string;
    identity_id: string;
    tenant: string;
    idp_type: string;
    idp_domain: string;
    status: string;
    rules: Rule[];
    instances: Instance[];
    agentDependencies?: AgentConfig[];
    mcpDependencies?: MCPServer[];
  }
  
  export interface Instance {
    id: string;
    pod_id: string;
    os: string;
    public_key: string;
    audit_logs: {
      blocked: number;
      approved: number;
    };
  }
  
  export interface MCPServer {
    id: string;
    name: string;
    server_type: string;
    provider: string;
    description: string;
    endpoint: string;
    systems: System[];
  }
  
  export interface System {
    id: string;
    name: string;
    system_type: string;
    provider: string;
    description: string;
  }
  
  export const agentData: AgentConfig = {
    id: 'procurement-agent-001',
    name: 'Procurement Agent',
    type: 'Procurement Orchestration',
    provider: 'SAP',
    region: 'EMEA',
    subaccount: 'Global',
    labels: ['env:production', 'team:procurement', 'hr'],
    rules: [
      { id: '1', action: 'Allow', targetType: 'Agent', conditions: [{ attribute: 'agent.region', operator: '=', value: 'EMEA' }] },
      { id: '2', action: 'Allow', targetType: 'Agent', conditions: [{ attribute: 'agent.subaccount', operator: '=', value: 'Global' }] },
      { id: '3', action: 'Allow', targetType: 'Agent', actingAs: 'User', conditions: [{ attribute: 'user.location', operator: '=', value: 'agent.region' }] },
    ],
    identities: [
      {
        id: 'identity-001',
        identity_name: 'Procurement Agent EMEA',
        identity_id: 'A532408',
        tenant: 'EMEA',
        idp_type: 'SAP IAS',
        idp_domain: 'ias.accounts.sap.com',
        status: 'Active',
        rules: [
          { id: 'i1', action: 'Allow', targetType: 'Identity', conditions: [{ attribute: 'identity.tenant', operator: '=', value: 'EMEA' }] },
          { id: 'i2', action: 'Allow', targetType: 'Identity', conditions: [{ attribute: 'identity.idp_type', operator: '=', value: 'SAP IAS' }] },
        ],
        instances: [
          {
            id: 'instance-001',
            pod_id: 'pod-procurement-emea-001',
            os: 'Linux 5.15.0',
            public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...',
            audit_logs: { blocked: 5, approved: 10 }
          },
          {
            id: 'instance-002',
            pod_id: 'pod-procurement-emea-002',
            os: 'Linux 5.15.0',
            public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQD...',
            audit_logs: { blocked: 2, approved: 15 }
          }
        ],
        mcpDependencies: [
          {
            id: 'mcp-001',
            name: 'mcp-commerce-products',
            server_type: 'Commerce',
            provider: 'SAP',
            description: 'MCP server for commerce and product management',
            endpoint: 'https://emea.mcp-commerce.sap.com/api',
            systems: [
              {
                id: 'sys-001',
                name: 'SAP S/4HANA',
                system_type: 'ERP',
                provider: 'SAP',
                description: 'Enterprise resource planning system'
              },
              {
                id: 'sys-002',
                name: 'SAP Commerce Cloud',
                system_type: 'E-Commerce',
                provider: 'SAP',
                description: 'E-commerce platform'
              }
            ]
          },
          {
            id: 'mcp-002',
            name: 'sap-ariba-procurement',
            server_type: 'Procurement',
            provider: 'SAP',
            description: 'MCP server for Ariba procurement workflows',
            endpoint: 'https://emea.mcp-ariba.sap.com/api',
            systems: [
              {
                id: 'sys-003',
                name: 'SAP Ariba',
                system_type: 'Procurement',
                provider: 'SAP',
                description: 'Procurement and sourcing platform'
              }
            ]
          }
        ]
      },
      {
        id: 'identity-002',
        identity_name: 'Procurement Agent US',
        identity_id: 'A532409',
        tenant: 'US',
        idp_type: 'Azure AD',
        idp_domain: 'login.microsoftonline.com',
        status: 'Active',
        rules: [
          { id: 'i3', action: 'Allow', targetType: 'Identity', conditions: [{ attribute: 'identity.tenant', operator: '=', value: 'US' }] },
          { id: 'i4', action: 'Ask For Consent', targetType: 'Identity', conditions: [{ attribute: 'identity.idp_type', operator: '=', value: 'Azure AD' }] },
        ],
        instances: [
          {
            id: 'instance-003',
            pod_id: 'pod-procurement-us-001',
            os: 'Windows Server 2022',
            public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQE...',
            audit_logs: { blocked: 8, approved: 12 }
          }
        ],
        agentDependencies: [
          {
            id: 'agent-001',
            name: 'Procurement Agent EMEA',
            type: 'Procurement Orchestration',
            provider: 'SAP',
            region: 'EMEA',
            subaccount: 'Global',
            labels: ['env:production', 'team:procurement', 'hr'],
            rules: [
              { id: '1', action: 'Allow', targetType: 'Tools', targetSpecifier: 'id: xyz' },
              { id: '2', action: 'Allow', targetType: 'Tools', targetSpecifier: 'id: abc' },
              { id: '3', action: 'Allow', targetType: 'Tools', targetSpecifier: 'id: def' },
            ],
            identities: [],
          },
          {
            id: 'agent-002',
            name: 'Finance Agent',
            type: 'Finance Orchestration',
            provider: 'SAP',
            region: 'US',
            subaccount: 'Global',
            labels: ['env:production', 'team:finance'],
            rules: [
              { id: 'f1', action: 'Allow', targetType: 'Tools', targetSpecifier: 'id: finance-001' },
              { id: 'f2', action: 'Ask For Consent', targetType: 'Tools', targetSpecifier: 'id: finance-002' },
            ],
            identities: [],
          }
        ],
        mcpDependencies: [
          {
            id: 'mcp-001',
            name: 'mcp-commerce-products',
            server_type: 'Commerce',
            provider: 'SAP',
            description: 'MCP server for commerce and product management',
            endpoint: 'https://us.mcp-commerce.sap.com/api',
            systems: [
              {
                id: 'sys-001',
                name: 'SAP S/4HANA',
                system_type: 'ERP',
                provider: 'SAP',
                description: 'Enterprise resource planning system'
              }
            ]
          },
          {
            id: 'mcp-003',
            name: 'mcp-analytics',
            server_type: 'Analytics',
            provider: 'SAP',
            description: 'MCP server for data analytics and reporting',
            endpoint: 'https://us.mcp-analytics.sap.com/api',
            systems: [
              {
                id: 'sys-004',
                name: 'SAP Analytics Cloud',
                system_type: 'Analytics',
                provider: 'SAP',
                description: 'Business intelligence and analytics platform'
              },
              {
                id: 'sys-005',
                name: 'SAP Data Warehouse Cloud',
                system_type: 'Data Warehouse',
                provider: 'SAP',
                description: 'Cloud data warehouse solution'
              }
            ]
          }
        ]
      },
      {
        id: 'identity-003',
        identity_name: 'Procurement Agent APAC',
        identity_id: 'A532410',
        tenant: 'APAC',
        idp_type: 'Okta',
        idp_domain: 'okta.com',
        status: 'Active',
        rules: [
          { id: 'i5', action: 'Allow', targetType: 'Identity', conditions: [{ attribute: 'identity.tenant', operator: '=', value: 'APAC' }] },
        ],
        instances: [
          {
            id: 'instance-004',
            pod_id: 'pod-procurement-apac-001',
            os: 'Linux 6.1.0',
            public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQF...',
            audit_logs: { blocked: 3, approved: 20 }
          },
          {
            id: 'instance-005',
            pod_id: 'pod-procurement-apac-002',
            os: 'Linux 6.1.0',
            public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQG...',
            audit_logs: { blocked: 1, approved: 18 }
          }
        ],
        mcpDependencies: [
          {
            id: 'mcp-002',
            name: 'sap-ariba-procurement',
            server_type: 'Procurement',
            provider: 'SAP',
            description: 'MCP server for Ariba procurement workflows',
            endpoint: 'https://apac.mcp-ariba.sap.com/api',
            systems: [
              {
                id: 'sys-003',
                name: 'SAP Ariba',
                system_type: 'Procurement',
                provider: 'SAP',
                description: 'Procurement and sourcing platform'
              }
            ]
          },
          {
            id: 'mcp-004',
            name: 'mcp-finance',
            server_type: 'Finance',
            provider: 'SAP',
            description: 'MCP server for financial operations',
            endpoint: 'https://apac.mcp-finance.sap.com/api',
            systems: [
              {
                id: 'sys-006',
                name: 'SAP Financial Services',
                system_type: 'Finance',
                provider: 'SAP',
                description: 'Financial services and banking platform'
              }
            ]
          }
        ]
      }
    ]
  };
  