import { useState } from 'react';
import { Bot, Users, ChevronDown, ChevronRight, Shield, ArrowRight, User, Network, Key, Server, FileText } from 'lucide-react';

interface PolicyRule {
  id: string;
  action: 'Allow' | 'Deny' | 'Ask For Consent';
  targetType: 'Identity' | 'Agent' | 'Instance';
  targetSpecifier?: string;
  conditions?: { attribute: string; operator: string; value: string }[];
  actingAs?: string;
}

interface Instance {
  id: string;
  pod_id: string;
  os: string;
  public_key: string;
  audit_logs: {
    blocked: number;
    approved: number;
  };
}

interface Identity {
  id: string;
  identity_name: string;
  identity_id: string;
  tenant: string;
  idp_type: string;
  idp_domain: string;
  status: string;
  rules: PolicyRule[];
  instances: Instance[];
  mcpDependencies: MCPServer[];
}

interface MCPServer {
  id: string;
  name: string;
  server_type: string;
  provider: string;
  description: string;
  endpoint: string;
}

interface AgentConfig {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  subaccount: string;
  labels: string[];
  identities: Identity[];
  identityRules: PolicyRule[];
}

export function PermissionsGraphPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['agent-rules', 'identity-rules'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  // Sample focused agent with full dependency chain
  const selectedAgent: AgentConfig = {
    id: 'procurement-agent-001',
    name: 'Procurement Agent',
    type: 'Procurement Orchestration',
    provider: 'SAP',
    region: 'EMEA',
    subaccount: 'Global',
    labels: ['env:production', 'team:procurement', 'hr'],
    identityRules: [
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
            audit_logs: {
              blocked: 5,
              approved: 10
            }
          },
          {
            id: 'instance-002',
            pod_id: 'pod-procurement-emea-002',
            os: 'Linux 5.15.0',
            public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQD...',
            audit_logs: {
              blocked: 2,
              approved: 15
            }
          }
        ],
        mcpDependencies: [
          {
            id: 'mcp-001',
            name: 'mcp-commerce-products',
            server_type: 'Commerce',
            provider: 'SAP',
            description: 'MCP server for commerce and product management',
            endpoint: 'https://emea.mcp-commerce.sap.com/api'
          },
          {
            id: 'mcp-002',
            name: 'sap-ariba-procurement',
            server_type: 'Procurement',
            provider: 'SAP',
            description: 'MCP server for Ariba procurement workflows',
            endpoint: 'https://emea.mcp-ariba.sap.com/api'
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
            audit_logs: {
              blocked: 8,
              approved: 12
            }
          }
        ],
        mcpDependencies: [
          {
            id: 'mcp-001',
            name: 'mcp-commerce-products',
            server_type: 'Commerce',
            provider: 'SAP',
            description: 'MCP server for commerce and product management',
            endpoint: 'https://us.mcp-commerce.sap.com/api'
          },
          {
            id: 'mcp-003',
            name: 'mcp-analytics',
            server_type: 'Analytics',
            provider: 'SAP',
            description: 'MCP server for data analytics and reporting',
            endpoint: 'https://us.mcp-analytics.sap.com/api'
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
            audit_logs: {
              blocked: 3,
              approved: 20
            }
          },
          {
            id: 'instance-005',
            pod_id: 'pod-procurement-apac-002',
            os: 'Linux 6.1.0',
            public_key: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQG...',
            audit_logs: {
              blocked: 1,
              approved: 18
            }
          }
        ],
        mcpDependencies: [
          {
            id: 'mcp-002',
            name: 'sap-ariba-procurement',
            server_type: 'Procurement',
            provider: 'SAP',
            description: 'MCP server for Ariba procurement workflows',
            endpoint: 'https://apac.mcp-ariba.sap.com/api'
          },
          {
            id: 'mcp-004',
            name: 'mcp-finance',
            server_type: 'Finance',
            provider: 'SAP',
            description: 'MCP server for financial operations',
            endpoint: 'https://apac.mcp-finance.sap.com/api'
          }
        ]
      }
    ]
  };

  const getActionColor = (action: string) => {
    if (action === 'Allow') return 'bg-green-100 text-green-800 border-green-200';
    if (action === 'Deny') return 'bg-red-100 text-red-800 border-red-200';
    if (action === 'Ask For Consent') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'Identity': return User;
      case 'Instance': return Users;
      case 'Agent': return Bot;
      default: return Shield;
    }
  };

  const getTargetColor = (type: string) => {
    switch (type) {
      case 'Identity': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Instance': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Agent': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const renderRule = (rule: PolicyRule) => {
    const TargetIcon = getTargetIcon(rule.targetType);
    return (
      <div key={rule.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-sm transition-shadow">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${getActionColor(rule.action)}`}>
            {rule.action}
          </span>
          
          {rule.actingAs && (
            <>
              <span className="text-sm text-gray-500">when acting as</span>
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium border border-indigo-200">
                {rule.actingAs}
              </span>
            </>
          )}
          
          <span className="text-sm text-gray-500">to access</span>
          
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${getTargetColor(rule.targetType)}`}>
            <TargetIcon className="w-3.5 h-3.5" />
            {rule.targetType}
            {rule.targetSpecifier && <span className="font-normal">{rule.targetSpecifier}</span>}
          </span>
          
          {rule.conditions && rule.conditions.length > 0 && (
            <>
              <span className="text-sm text-gray-500">where</span>
              {rule.conditions.map((cond, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                    {cond.attribute}
                  </span>
                  <span className="text-xs text-gray-600">{cond.operator}</span>
                  <span className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                    {cond.value}
                  </span>
                  {idx < rule.conditions!.length - 1 && (
                    <span className="px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-xs font-medium">AND</span>
                  )}
                </span>
              ))}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Agent Permissions & Dependencies</h1>
          <p className="text-sm text-gray-600">
            Comprehensive view of agent access policies and identity instances across multiple tenants
          </p>
        </div>

        {/* Agent Summary Card */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Bot className="w-8 h-8 text-[#0854A0]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-semibold text-gray-900">{selectedAgent.name}</h2>
                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {selectedAgent.type}
                </span>
                <span className="px-2.5 py-1 bg-[#0854A0] text-white rounded text-xs font-medium">
                  {selectedAgent.provider}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>Region: <strong>{selectedAgent.region}</strong></span>
                <span>Subaccount: <strong>{selectedAgent.subaccount}</strong></span>
                <span>ID: <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{selectedAgent.id}</code></span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedAgent.labels.map((label, idx) => (
                  <span
                    key={idx}
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      label.includes(':')
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Dependencies</div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-semibold text-purple-600">{selectedAgent.identities.length}</div>
                  <div className="text-xs text-gray-500">Identities</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-indigo-600">
                    {selectedAgent.identities.reduce((acc, id) => acc + id.instances.length, 0)}
                  </div>
                  <div className="text-xs text-gray-500">Instances</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-orange-600">
                    {selectedAgent.identities.reduce((acc, id) => acc + id.mcpDependencies.length, 0)}
                  </div>
                  <div className="text-xs text-gray-500">MCP Servers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dependency Flow Visualization */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Identity Flow</h3>
          <div className="flex items-center justify-center gap-4 py-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center border-2 border-blue-300">
                <Bot className="w-10 h-10 text-blue-600" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900">Agent</span>
              <span className="text-xs text-gray-500">Type</span>
            </div>
            
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-gray-500 mt-1">{selectedAgent.identityRules.length} rules</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-100 rounded-xl flex items-center justify-center border-2 border-purple-300">
                <User className="w-10 h-10 text-purple-600" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900">Identity</span>
              <span className="text-xs text-gray-500">Instances</span>
            </div>
            
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-gray-500 mt-1">
                {selectedAgent.identities.reduce((acc, id) => acc + id.rules.length, 0)} instances
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-xl flex items-center justify-center border-2 border-indigo-300">
                <Users className="w-10 h-10 text-indigo-600" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900">Instances</span>
              <span className="text-xs text-gray-500">
                {selectedAgent.identities.reduce((acc, id) => acc + id.instances.length, 0)} instances
              </span>
            </div>
            
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-8 h-8 text-indigo-400" />
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-orange-100 rounded-xl flex items-center justify-center border-2 border-orange-300">
                <Server className="w-10 h-10 text-orange-600" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900">MCP Servers</span>
              <span className="text-xs text-gray-500">
                {selectedAgent.identities.reduce((acc, id) => acc + id.mcpDependencies.length, 0)} servers
              </span>
            </div>
          </div>
        </div>

        {/* Agent Identity Rules */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <button
            onClick={() => toggleSection('agent-rules')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {expandedSections.has('agent-rules') ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-gray-900">Procurement Agent Rules</h3>
                <p className="text-sm text-gray-500">Rules governing access to this agent identity</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {selectedAgent.identityRules.length} rules
            </span>
          </button>
          
          {expandedSections.has('agent-rules') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-4 space-y-3">
                {selectedAgent.identityRules.map(rule => renderRule(rule))}
              </div>
            </div>
          )}
        </div>

        {/* Identities with Instances */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <button
            onClick={() => toggleSection('identity-rules')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {expandedSections.has('identity-rules') ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-gray-900">Identities & Instances</h3>
                <p className="text-sm text-gray-500">Identity instances across different tenants and IDPs with their runtime instances</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {selectedAgent.identities.length} identities
            </span>
          </button>
          
          {expandedSections.has('identity-rules') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              {selectedAgent.identities.map((identity, idx) => (
                <div key={identity.id} className={`pt-4 ${idx > 0 ? 'border-t border-gray-100 mt-4' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <User className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">{identity.identity_name}</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-mono">
                      {identity.identity_id}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      Tenant: {identity.tenant}
                    </span>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded">
                      <Network className="w-3 h-3 text-blue-700" />
                      <span className="text-xs text-blue-700">
                        {identity.idp_type} ({identity.idp_domain})
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      identity.status === 'Active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {identity.status}
                    </span>
                  </div>
                  
                  <div className="ml-8 space-y-4">
                    {/* Identity Rules */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Identity Access Rules
                      </div>
                      <div className="space-y-3">
                        {identity.rules.map(rule => renderRule(rule))}
                      </div>
                    </div>

                    {/* Instances */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        Runtime Instances ({identity.instances.length})
                      </div>
                      <div className="space-y-3">
                        {identity.instances.map((instance) => (
                          <div key={instance.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Server className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-500">Pod ID</span>
                                </div>
                                <span className="text-sm font-mono text-gray-900">{instance.pod_id}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-500">Operating System</span>
                                </div>
                                <span className="text-sm text-gray-900">{instance.os}</span>
                              </div>
                              <div className="col-span-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <Key className="w-4 h-4 text-gray-500" />
                                  <span className="text-xs font-medium text-gray-500">Public Key</span>
                                </div>
                                <span className="text-xs font-mono text-gray-700 break-all">{instance.public_key}</span>
                              </div>
                            </div>
                            <div className="border-t border-gray-200 pt-3 mt-3">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  <span className="text-xs text-gray-600">Blocked:</span>
                                  <span className="text-sm font-semibold text-red-700">{instance.audit_logs.blocked}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs text-gray-600">Approved:</span>
                                  <span className="text-sm font-semibold text-green-700">{instance.audit_logs.approved}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* MCP Server Dependencies for this Identity */}
                    {identity.mcpDependencies && identity.mcpDependencies.length > 0 && (
                      <div className="mt-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                          MCP Server Dependencies ({identity.mcpDependencies.length})
                        </div>
                        <div className="space-y-3">
                          {identity.mcpDependencies.map((mcp) => (
                            <div
                              key={mcp.id}
                              className="bg-orange-50 rounded-lg p-4 border border-orange-200"
                            >
                              <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Server className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className="font-medium text-gray-900">{mcp.name}</span>
                                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                      {mcp.server_type}
                                    </span>
                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                      {mcp.provider}
                                    </span>
                                  </div>
                                  {mcp.description && (
                                    <p className="text-sm text-gray-600 mb-2">{mcp.description}</p>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">Endpoint:</span>
                                    <span className="text-xs font-mono text-gray-700">{mcp.endpoint}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedAgent.identityRules.filter((r: PolicyRule) => r.action === 'Allow').length +
                   selectedAgent.identities.reduce((acc: number, id: Identity) => acc + id.rules.filter((r: PolicyRule) => r.action === 'Allow').length, 0)}
                </div>
                <div className="text-xs text-gray-500">Allow Rules</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedAgent.identities.reduce((acc: number, id: Identity) => acc + id.rules.filter((r: PolicyRule) => r.action === 'Ask For Consent').length, 0)}
                </div>
                <div className="text-xs text-gray-500">Consent Required</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedAgent.identities.length}
                </div>
                <div className="text-xs text-gray-500">Identities</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedAgent.identities.reduce((acc: number, id: Identity) => acc + id.instances.length, 0)}
                </div>
                <div className="text-xs text-gray-500">Runtime Instances</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedAgent.identities.reduce((acc: number, id: Identity) => acc + id.mcpDependencies.length, 0)}
                </div>
                <div className="text-xs text-gray-500">MCP Servers</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
