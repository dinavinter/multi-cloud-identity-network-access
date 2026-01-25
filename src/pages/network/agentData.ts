export interface AgentType {
    id: string;
    name: string;
    type: string;
    provider: string;
    system: string; // System/provider like S4, Concur, Customer Managed
    codePurpose: string; // Agent nature - links to code purpose
    systemPrompts: string[]; // System prompts for the agent
    region: string;
    labels: string[];
    typeRules: Rule[]; // Organization-defined rules at type level (cannot escalate global rules, only restrict/configure)
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
    subaccount: string; // Subaccount linked to this identity
    applications: Application[]; // Applications linked to this identity
    idp_type: string;
    idp_domain: string;
    status: string;
    identityRules: Rule[]; // Identity-specific rules (can restrict more but cannot escalate over type rules)
    tenantRuleIds?: string[]; // References to tenant-specific rules from meta_policies (scope='tenant')
    instances: Instance[];
    agentDependencies?: AgentType[];
    mcpDependencies?: MCPServer[];
  }

  export interface Application {
    id: string;
    name: string;
    application_type: string;
    description?: string;
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
  
  export const agentData: AgentType = {
    id: 'procurement-agent-001',
    name: 'Procurement Agent',
    type: 'Procurement Orchestration',
    provider: 'SAP',
    system: 'S4', // System: S4, Concur, Customer Managed, etc.
    codePurpose: 'Automate procurement workflows including purchase order creation, vendor management, and invoice processing',
    systemPrompts: [
      'You are a procurement automation agent responsible for managing purchase orders and vendor relationships.',
      'Always verify vendor credentials before processing orders.',
      'Maintain compliance with procurement policies and approval workflows.'
    ],
    region: 'EMEA',
    labels: ['env:production', 'team:procurement', 'hr'],
    typeRules: [
      // Type-level rules: cannot escalate global rules, only restrict more or configure actions
      { id: '1', action: 'Allow', targetType: 'Agent', conditions: [{ attribute: 'agent.region', operator: '=', value: 'EMEA' }] },
      { id: '2', action: 'Ask For Consent', targetType: 'Tools', targetSpecifier: 'risk-level:high', conditions: [{ attribute: 'tool.risk_level', operator: '=', value: 'high' }] },
      { id: '3', action: 'Allow', targetType: 'Agent', actingAs: 'User', conditions: [{ attribute: 'user.location', operator: '=', value: 'agent.region' }] },
    ],
    identities: [
      {
        id: 'identity-001',
        identity_name: 'Procurement Agent EMEA',
        identity_id: 'A532408',
        tenant: 'EMEA',
        subaccount: 'EMEA-Production',
        applications: [
          { id: 'app-001', name: 'SAP Ariba', application_type: 'Procurement', description: 'Procurement and sourcing platform' },
          { id: 'app-002', name: 'SAP S/4HANA', application_type: 'ERP', description: 'Enterprise resource planning system' }
        ],
        idp_type: 'SAP IAS',
        idp_domain: 'ias.accounts.sap.com',
        status: 'Active',
        identityRules: [
          // Identity-specific rules: can restrict more but cannot escalate over type rules
          { id: 'i1', action: 'Deny', targetType: 'Identity', conditions: [{ attribute: 'identity.tenant', operator: '!=', value: 'EMEA' }] },
          { id: 'i2', action: 'Ask For Consent', targetType: 'Tools', targetSpecifier: 'category:financial', conditions: [{ attribute: 'tool.category', operator: '=', value: 'financial' }] },
        ],
        tenantRuleIds: ['tenant-rule-emea-001'], // References to tenant-specific rules from meta_policies
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
        subaccount: 'US-Production',
        applications: [
          { id: 'app-003', name: 'SAP Ariba', application_type: 'Procurement', description: 'Procurement and sourcing platform' },
          { id: 'app-004', name: 'SAP Concur', application_type: 'Expense Management', description: 'Travel and expense management' }
        ],
        idp_type: 'Azure AD',
        idp_domain: 'login.microsoftonline.com',
        status: 'Active',
        identityRules: [
          // Identity-specific rules: can restrict more but cannot escalate over type rules
          { id: 'i3', action: 'Deny', targetType: 'Identity', conditions: [{ attribute: 'identity.tenant', operator: '!=', value: 'US' }] },
          { id: 'i4', action: 'Ask For Consent', targetType: 'Identity', conditions: [{ attribute: 'identity.idp_type', operator: '=', value: 'Azure AD' }] },
        ],
        tenantRuleIds: ['tenant-rule-us-001'], // References to tenant-specific rules from meta_policies
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
            system: 'S4',
            codePurpose: 'Procurement workflow automation',
            systemPrompts: ['Automate procurement processes'],
            region: 'EMEA',
            labels: ['env:production', 'team:procurement', 'hr'],
            typeRules: [
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
            system: 'S4',
            codePurpose: 'Financial operations automation',
            systemPrompts: ['Automate financial reporting and transactions'],
            region: 'US',
            labels: ['env:production', 'team:finance'],
            typeRules: [
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
        subaccount: 'APAC-Production',
        applications: [
          { id: 'app-005', name: 'SAP Ariba', application_type: 'Procurement', description: 'Procurement and sourcing platform' },
          { id: 'app-006', name: 'Customer Managed Portal', application_type: 'Custom', description: 'Customer-managed procurement portal' }
        ],
        idp_type: 'Okta',
        idp_domain: 'okta.com',
        status: 'Active',
        identityRules: [
          // Identity-specific rules: can restrict more but cannot escalate over type rules
          { id: 'i5', action: 'Deny', targetType: 'Identity', conditions: [{ attribute: 'identity.tenant', operator: '!=', value: 'APAC' }] },
        ],
        tenantRuleIds: ['tenant-rule-apac-001'], // References to tenant-specific rules from meta_policies
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
  
  export const agents: AgentType[] = [
    agentData, // Full procurement agent data
    {
      id: 'finance-agent-001',
      name: 'Finance Agent',
      type: 'Finance Orchestration',
      provider: 'SAP',
      system: 'S4',
      codePurpose: 'Financial operations and reporting automation',
      systemPrompts: [
        'You are a finance automation agent responsible for financial reporting and transaction processing.',
        'Ensure all financial operations comply with accounting standards and regulations.'
      ],
      region: 'US',
      labels: ['env:production', 'team:finance'],
      typeRules: [],
      identities: []
    },
    {
      id: 'hr-agent-001',
      name: 'HR Agent',
      type: 'HR Orchestration',
      provider: 'SAP',
      system: 'SuccessFactors',
      codePurpose: 'Human resources management and employee lifecycle automation',
      systemPrompts: [
        'You are an HR automation agent responsible for managing employee data and HR processes.',
        'Maintain strict confidentiality of employee information.'
      ],
      region: 'APAC',
      labels: ['env:production', 'team:hr'],
      typeRules: [],
      identities: []
    },
    {
      id: 'sales-agent-001',
      name: 'Sales Agent',
      type: 'Sales Orchestration',
      provider: 'SAP',
      system: 'Sales Cloud',
      codePurpose: 'Sales process automation and customer relationship management',
      systemPrompts: [
        'You are a sales automation agent responsible for managing sales opportunities and customer relationships.',
        'Track all sales activities and maintain accurate customer records.'
      ],
      region: 'US',
      labels: ['env:production', 'team:sales'],
      typeRules: [],
      identities: []
    }
  ];