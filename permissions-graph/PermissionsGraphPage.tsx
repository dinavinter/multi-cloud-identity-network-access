import { useState } from 'react';
import { Bot, Server, Database, Wrench, ChevronDown, ChevronRight, Shield, ArrowRight, Users } from 'lucide-react';

interface PolicyRule {
  id: string;
  action: 'Allow' | 'Deny' | 'Ask For Consent';
  targetType: 'Tools' | 'Agent' | 'MCP Server' | 'System';
  targetSpecifier?: string;
  conditions?: { attribute: string; operator: string; value: string }[];
  actingAs?: string;
}

interface MCPServer {
  id: string;
  name: string;
  provider: string;
  region: string;
  tools: Tool[];
  rules: PolicyRule[];
}

interface Tool {
  id: string;
  name: string;
  server: string;
  dataSensitivity?: string;
  dataType?: string;
}

interface SystemBackend {
  id: string;
  name: string;
  type: string;
  provider: string;
  rules: PolicyRule[];
}

interface AgentConfig {
  id: string;
  name: string;
  type: string;
  provider: string;
  region: string;
  subaccount: string;
  labels: string[];
  mcpDependencies: MCPServer[];
  systemDependencies: SystemBackend[];
  identityRules: PolicyRule[];
}

export function PermissionsGraphPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['agent-rules', 'mcp-rules', 'system-rules'])
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
    mcpDependencies: [
      {
        id: 'mcp-commerce',
        name: 'mcp-commerce-products',
        provider: 'SAP',
        region: 'EU',
        tools: [
          { id: 't1', name: 'create-purchase-order', server: 'mcp-commerce-products' },
          { id: 't2', name: 'get-supplier-info', server: 'mcp-commerce-products', dataSensitivity: 'sensitive' },
          { id: 't3', name: 'approve-invoice', server: 'mcp-commerce-products', dataType: 'pii' },
        ],
        rules: [
          { id: 'm1', action: 'Allow', targetType: 'MCP Server', conditions: [{ attribute: 'tag:hr', operator: 'exists', value: 'exists' }, { attribute: 'region', operator: '=', value: 'EMEA' }] },
          { id: 'm2', action: 'Allow', targetType: 'MCP Server', actingAs: 'Agent', conditions: [{ attribute: 'agent.subaccount', operator: '=', value: 'mcp.subaccount' }] },
        ]
      },
      {
        id: 'mcp-ariba',
        name: 'sap-ariba-procurement',
        provider: 'SAP',
        region: 'EU',
        tools: [
          { id: 't4', name: 'submit-rfq', server: 'sap-ariba-procurement' },
          { id: 't5', name: 'vendor-management', server: 'sap-ariba-procurement', dataSensitivity: 'sensitive' },
        ],
        rules: [
          { id: 'm3', action: 'Allow', targetType: 'Tools', targetSpecifier: 'created by sap/ariba' },
          { id: 'm4', action: 'Ask For Consent', targetType: 'Tools', conditions: [{ attribute: 'server.subaccount', operator: '=', value: 'Production' }] },
        ]
      }
    ],
    systemDependencies: [
      {
        id: 'sys-s4',
        name: 'SAP S/4HANA',
        type: 'ERP',
        provider: 'SAP',
        rules: [
          { id: 's1', action: 'Allow', targetType: 'Tools', conditions: [{ attribute: 'server.region', operator: '=', value: 'EU' }] },
          { id: 's2', action: 'Allow', targetType: 'Tools', targetSpecifier: 'server: mcp-commerce-products' },
        ]
      },
      {
        id: 'sys-ariba',
        name: 'SAP Ariba',
        type: 'Procurement',
        provider: 'SAP',
        rules: [
          { id: 's3', action: 'Allow', targetType: 'Tools', targetSpecifier: 'id: xyz' },
          { id: 's4', action: 'Allow', targetType: 'Tools', targetSpecifier: 'ids: [2]' },
          { id: 's5', action: 'Allow', targetType: 'Tools', targetSpecifier: 'servers: [2]' },
        ]
      }
    ]
  };

  // Tool-level rules
  const toolRules: PolicyRule[] = [
    { id: 'tr1', action: 'Ask For Consent', targetType: 'Tools', targetSpecifier: 'created by sap/ariba', conditions: [{ attribute: 'data-sensitivity', operator: '=', value: 'sensitive' }] },
    { id: 'tr2', action: 'Ask For Consent', targetType: 'Tools', targetSpecifier: 'created by sap/ariba', conditions: [{ attribute: 'data-type', operator: '=', value: 'pii' }] },
    { id: 'tr3', action: 'Deny', targetType: 'Tools', conditions: [{ attribute: 'data-classification', operator: '=', value: 'restricted' }] },
  ];

  const getActionColor = (action: string) => {
    if (action === 'Allow') return 'bg-green-100 text-green-800 border-green-200';
    if (action === 'Deny') return 'bg-red-100 text-red-800 border-red-200';
    if (action === 'Ask For Consent') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'Tools': return Wrench;
      case 'Agent': return Users;
      case 'MCP Server': return Server;
      case 'System': return Database;
      default: return Shield;
    }
  };

  const getTargetColor = (type: string) => {
    switch (type) {
      case 'Tools': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Agent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'MCP Server': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'System': return 'bg-green-50 text-green-700 border-green-200';
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
            Comprehensive view of agent access policies, MCP server dependencies, and system integrations
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
                  <div className="text-2xl font-semibold text-purple-600">{selectedAgent.mcpDependencies.length}</div>
                  <div className="text-xs text-gray-500">MCP Servers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-semibold text-green-600">{selectedAgent.systemDependencies.length}</div>
                  <div className="text-xs text-gray-500">Systems</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dependency Flow Visualization */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dependency Flow</h3>
          <div className="flex items-center justify-center gap-4 py-6">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center border-2 border-blue-300">
                <Bot className="w-10 h-10 text-blue-600" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900">Agent</span>
              <span className="text-xs text-gray-500">Identity</span>
            </div>
            
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-gray-500 mt-1">{selectedAgent.identityRules.length} rules</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-purple-100 rounded-xl flex items-center justify-center border-2 border-purple-300">
                <Server className="w-10 h-10 text-purple-600" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900">MCP Server</span>
              <span className="text-xs text-gray-500">Integration</span>
            </div>
            
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-gray-500 mt-1">
                {selectedAgent.mcpDependencies.reduce((acc, mcp) => acc + mcp.rules.length, 0)} rules
              </span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-orange-100 rounded-xl flex items-center justify-center border-2 border-orange-300">
                <Wrench className="w-10 h-10 text-orange-600" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900">Tools</span>
              <span className="text-xs text-gray-500">Actions</span>
            </div>
            
            <div className="flex flex-col items-center px-4">
              <ArrowRight className="w-8 h-8 text-orange-400" />
              <span className="text-xs text-gray-500 mt-1">{toolRules.length} rules</span>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-green-100 rounded-xl flex items-center justify-center border-2 border-green-300">
                <Database className="w-10 h-10 text-green-600" />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-900">System</span>
              <span className="text-xs text-gray-500">Backend</span>
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
                <h3 className="text-base font-medium text-gray-900">Agent Identity Rules</h3>
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

        {/* MCP Server Dependencies & Rules */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <button
            onClick={() => toggleSection('mcp-rules')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {expandedSections.has('mcp-rules') ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-gray-900">MCP Server Dependencies</h3>
                <p className="text-sm text-gray-500">Rules for accessing MCP servers and their tools</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
              {selectedAgent.mcpDependencies.length} servers
            </span>
          </button>
          
          {expandedSections.has('mcp-rules') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              {selectedAgent.mcpDependencies.map((mcp, idx) => (
                <div key={mcp.id} className={`pt-4 ${idx > 0 ? 'border-t border-gray-100 mt-4' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Server className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900">{mcp.name}</span>
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs">
                      {mcp.provider}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      Region: {mcp.region}
                    </span>
                    <span className="text-xs text-gray-500">
                      {mcp.tools.length} tools available
                    </span>
                  </div>
                  
                  <div className="ml-8 space-y-3">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Access Rules
                    </div>
                    {mcp.rules.map(rule => renderRule(rule))}
                    
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-4 mb-2">
                      Available Tools
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {mcp.tools.map(tool => (
                        <div
                          key={tool.id}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                            tool.dataSensitivity === 'sensitive' 
                              ? 'bg-amber-50 border-amber-200' 
                              : tool.dataType === 'pii'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-sm text-gray-700">{tool.name}</span>
                          {tool.dataSensitivity && (
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                              {tool.dataSensitivity}
                            </span>
                          )}
                          {tool.dataType && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                              {tool.dataType}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tool-Level Rules */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <button
            onClick={() => toggleSection('tool-rules')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {expandedSections.has('tool-rules') ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-gray-900">Tool Access Rules</h3>
                <p className="text-sm text-gray-500">Fine-grained rules for tool invocations</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
              {toolRules.length} rules
            </span>
          </button>
          
          {expandedSections.has('tool-rules') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              <div className="pt-4 space-y-3">
                {toolRules.map(rule => renderRule(rule))}
              </div>
            </div>
          )}
        </div>

        {/* System Dependencies & Rules */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <button
            onClick={() => toggleSection('system-rules')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              {expandedSections.has('system-rules') ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-400" />
              )}
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="text-base font-medium text-gray-900">System Backend Dependencies</h3>
                <p className="text-sm text-gray-500">Rules for accessing backend systems</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              {selectedAgent.systemDependencies.length} systems
            </span>
          </button>
          
          {expandedSections.has('system-rules') && (
            <div className="px-6 pb-6 border-t border-gray-100">
              {selectedAgent.systemDependencies.map((system, idx) => (
                <div key={system.id} className={`pt-4 ${idx > 0 ? 'border-t border-gray-100 mt-4' : ''}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">{system.name}</span>
                    <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs">
                      {system.type}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                      {system.provider}
                    </span>
                  </div>
                  
                  <div className="ml-8 space-y-3">
                    {system.rules.map(rule => renderRule(rule))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedAgent.identityRules.filter(r => r.action === 'Allow').length +
                   selectedAgent.mcpDependencies.reduce((acc, mcp) => acc + mcp.rules.filter(r => r.action === 'Allow').length, 0) +
                   selectedAgent.systemDependencies.reduce((acc, sys) => acc + sys.rules.filter(r => r.action === 'Allow').length, 0)}
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
                  {toolRules.filter(r => r.action === 'Ask For Consent').length +
                   selectedAgent.mcpDependencies.reduce((acc, mcp) => acc + mcp.rules.filter(r => r.action === 'Ask For Consent').length, 0)}
                </div>
                <div className="text-xs text-gray-500">Consent Required</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {toolRules.filter(r => r.action === 'Deny').length}
                </div>
                <div className="text-xs text-gray-500">Deny Rules</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedAgent.mcpDependencies.reduce((acc, mcp) => acc + mcp.tools.length, 0)}
                </div>
                <div className="text-xs text-gray-500">Total Tools</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
