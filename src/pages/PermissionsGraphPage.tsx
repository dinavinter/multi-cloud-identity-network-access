import { useEffect, useState } from 'react';
import { Bot, Database, Shield, ArrowRight, Network, Server, ChevronDown, ChevronRight, Settings, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database as DB } from '../lib/database.types';

type Agent = DB['public']['Tables']['agents']['Row'];
type AgentIdentity = DB['public']['Tables']['agent_identities']['Row'];
type System = DB['public']['Tables']['systems']['Row'];
type Permission = DB['public']['Tables']['permissions']['Row'];
type MCPServer = DB['public']['Tables']['mcp_servers']['Row'];
type PolicyRule = DB['public']['Tables']['policy_rules']['Row'];
type MetaPolicy = DB['public']['Tables']['meta_policies']['Row'];

export function PermissionsGraphPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [identities, setIdentities] = useState<AgentIdentity[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>([]);
  const [metaPolicies, setMetaPolicies] = useState<MetaPolicy[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'agent' | 'identity' | 'mcp' | 'system' | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [showMetaPolicies, setShowMetaPolicies] = useState(true);
  const [showSpecificPolicies, setShowSpecificPolicies] = useState(true);
  const [showPermissionTypes, setShowPermissionTypes] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      const [agentsRes, identitiesRes, systemsRes, permsRes, mcpRes, rulesRes, metaRes] = await Promise.all([
        supabase.from('agents').select('*').eq('status', 'Active'),
        supabase.from('agent_identities').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('permissions').select('*'),
        supabase.from('mcp_servers').select('*'),
        supabase.from('policy_rules').select('*'),
        supabase.from('meta_policies').select('*').eq('is_active', true)
      ]);

      setAgents(agentsRes.data || []);
      setIdentities(identitiesRes.data || []);
      setSystems(systemsRes.data || []);
      setPermissions(permsRes.data || []);
      setMcpServers(mcpRes.data || []);
      setPolicyRules(rulesRes.data || []);
      setMetaPolicies(metaRes.data || []);

      const initialExpanded = new Set((agentsRes.data || []).slice(0, 3).map(a => a.id));
      setExpandedAgents(initialExpanded);
    } catch (error) {
      console.error('Error loading graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAgentPermissions = (agentId: string) => {
    const agentIdentityIds = identities
      .filter(i => i.agent_id === agentId)
      .map(i => i.id);
    return permissions.filter(p => agentIdentityIds.includes(p.agent_identity_id));
  };

  const getSystemsForAgent = (agentId: string) => {
    const agentPerms = getAgentPermissions(agentId);
    const systemIds = new Set(agentPerms.map(p => p.system_id));
    return systems.filter(s => systemIds.has(s.id));
  };

  const getProviderColor = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('sap')) return '#0854A0';
    if (p.includes('microsoft')) return '#00A4EF';
    if (p.includes('servicenow')) return '#62D84E';
    if (p.includes('aws')) return '#FF9900';
    if (p.includes('salesforce')) return '#00A1E0';
    if (p.includes('google')) return '#EA4335';
    if (p.includes('multi-cloud')) return '#6366F1';
    return '#6B7280';
  };

  const getMCPForProvider = (provider: string) => {
    return mcpServers.find(mcp =>
      mcp.provider.toLowerCase().includes(provider.toLowerCase()) ||
      provider.toLowerCase().includes(mcp.provider.toLowerCase())
    );
  };

  const getIdentityPermissions = (identityId: string) => {
    return permissions.filter(p => p.agent_identity_id === identityId);
  };

  const getSystemsForIdentity = (identityId: string) => {
    const identityPerms = getIdentityPermissions(identityId);
    const systemIds = new Set(identityPerms.map(p => p.system_id));
    return systems.filter(s => systemIds.has(s.id));
  };

  const getPolicyRulesForAgent = (agentId: string) => {
    return policyRules.filter(r => r.agent_id === agentId);
  };

  const getApplicableMetaPolicies = (agentId: string, identityId: string) => {
    const agent = agents.find(a => a.id === agentId);
    const identity = identities.find(i => i.id === identityId);
    if (!agent || !identity) return [];

    return metaPolicies.filter(mp => {
      if (mp.scope === 'global') return true;
      if (mp.scope === 'provider' && mp.scope_target === agent.provider) return true;
      if (mp.scope === 'tenant' && mp.scope_target === identity.tenant) return true;
      if (mp.scope === 'agent' && mp.scope_target === agentId) return true;
      return false;
    });
  };

  const toggleAgent = (agentId: string) => {
    setExpandedAgents(prev => {
      const next = new Set(prev);
      if (next.has(agentId)) {
        next.delete(agentId);
      } else {
        next.add(agentId);
      }
      return next;
    });
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const selectedAgent = agents.find(a => a.id === selectedNode && selectedType === 'agent');
  const selectedIdentity = identities.find(i => i.id === selectedNode && selectedType === 'identity');
  const selectedMCP = mcpServers.find(m => m.id === selectedNode && selectedType === 'mcp');
  const selectedSystem = systems.find(s => s.id === selectedNode && selectedType === 'system');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-normal text-gray-900 mb-2">Network Topology</h1>
            <p className="text-sm text-gray-600">
              Comprehensive view of agent identities, MCP servers, and system access across tenants and resource groups
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Edge Labels</span>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMetaPolicies}
                  onChange={(e) => setShowMetaPolicies(e.target.checked)}
                  className="rounded border-gray-300 text-[#0854A0] focus:ring-[#0854A0]"
                />
                <span className="text-sm text-gray-700">Meta Policies</span>
                {showMetaPolicies ? <Eye className="w-3 h-3 text-green-600" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSpecificPolicies}
                  onChange={(e) => setShowSpecificPolicies(e.target.checked)}
                  className="rounded border-gray-300 text-[#0854A0] focus:ring-[#0854A0]"
                />
                <span className="text-sm text-gray-700">Specific Policies</span>
                {showSpecificPolicies ? <Eye className="w-3 h-3 text-green-600" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPermissionTypes}
                  onChange={(e) => setShowPermissionTypes(e.target.checked)}
                  className="rounded border-gray-300 text-[#0854A0] focus:ring-[#0854A0]"
                />
                <span className="text-sm text-gray-700">Permission Types</span>
                {showPermissionTypes ? <Eye className="w-3 h-3 text-green-600" /> : <EyeOff className="w-3 h-3 text-gray-400" />}
              </label>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                  <Bot className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-900">Agents ({agents.length})</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
                  <Server className="w-4 h-4 text-indigo-700" />
                  <span className="text-sm font-medium text-indigo-900">MCP Servers ({mcpServers.length})</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
                  <Database className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-medium text-purple-900">Systems ({systems.length})</span>
                </div>
              </div>

              <div className="space-y-6">
                {agents.slice(0, 8).map((agent) => {
                  const agentIdentities = identities.filter(i => i.agent_id === agent.id);
                  const isExpanded = expandedAgents.has(agent.id);
                  const isSelected = selectedNode === agent.id && selectedType === 'agent';
                  const agentRules = getPolicyRulesForAgent(agent.id);

                  return (
                    <div key={agent.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      {/* Agent Header */}
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={() => toggleAgent(agent.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <div
                          onClick={() => {
                            setSelectedNode(agent.id);
                            setSelectedType('agent');
                          }}
                          className={`flex-1 cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-[#0854A0] ring-offset-2 rounded-lg' : ''
                          }`}
                        >
                          <div
                            className="rounded-lg p-3 border-2 hover:shadow-md transition-all"
                            style={{
                              borderColor: getProviderColor(agent.provider),
                              backgroundColor: `${getProviderColor(agent.provider)}08`
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <Bot
                                className="w-5 h-5"
                                style={{ color: getProviderColor(agent.provider) }}
                              />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{agent.name}</p>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-xs text-gray-600">{agent.provider}</span>
                                  <span className="text-xs text-gray-500">•</span>
                                  <span className="text-xs text-gray-600">{agentIdentities.length} instances</span>
                                  {agentRules.length > 0 && (
                                    <>
                                      <span className="text-xs text-gray-500">•</span>
                                      <span className="text-xs text-blue-600">{agentRules.length} policies</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Agent Identities */}
                      {isExpanded && agentIdentities.length > 0 && (
                        <div className="ml-8 space-y-3">
                          {agentIdentities.map((identity) => {
                            const identitySystems = getSystemsForIdentity(identity.id);
                            const identityPerms = getIdentityPermissions(identity.id);
                            const applicableMetaPolicies = getApplicableMetaPolicies(agent.id, identity.id);
                            const isIdentitySelected = selectedNode === identity.id && selectedType === 'identity';

                            return (
                              <div key={identity.id} className="relative">
                                <div className="flex items-start gap-4">
                                  {/* Identity Node */}
                                  <div className="flex-shrink-0 w-64">
                                    <div
                                      onClick={() => {
                                        setSelectedNode(identity.id);
                                        setSelectedType('identity');
                                      }}
                                      className={`cursor-pointer transition-all ${
                                        isIdentitySelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                                      }`}
                                    >
                                      <div className="rounded-lg p-3 border-2 border-blue-200 bg-blue-50 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Network className="w-4 h-4 text-blue-600" />
                                          <span className="text-xs font-medium text-blue-900">
                                            Identity Instance
                                          </span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-900 mb-1 truncate">
                                          {identity.identity_name}
                                        </p>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-600">Tenant:</span>
                                            <span className="text-xs font-mono text-gray-900 truncate">{identity.tenant}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-600">IDP:</span>
                                            <span className="text-xs text-gray-900">{identity.idp_type}</span>
                                          </div>
                                          {identityPerms.length > 0 && (
                                            <div className="text-xs text-blue-700 mt-1">
                                              {identityPerms.length} permissions
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Connection to Systems with Policy Labels */}
                                  {identitySystems.length > 0 && (
                                    <>
                                      <div className="flex flex-col items-center justify-center gap-2 pt-6">
                                        <div className="relative">
                                          <ArrowRight className="w-5 h-5 text-gray-400" />
                                          {/* Edge Labels */}
                                          {(showMetaPolicies || showSpecificPolicies || showPermissionTypes) && (
                                            <div className="absolute top-6 left-0 min-w-32 space-y-1">
                                              {showMetaPolicies && applicableMetaPolicies.length > 0 && (
                                                <div className="bg-orange-50 border border-orange-200 px-2 py-1 rounded text-xs text-orange-700 whitespace-nowrap">
                                                  Meta: {applicableMetaPolicies[0].name}
                                                </div>
                                              )}
                                              {showSpecificPolicies && agentRules.length > 0 && (
                                                <div className="bg-blue-50 border border-blue-200 px-2 py-1 rounded text-xs text-blue-700 whitespace-nowrap">
                                                  {agentRules[0].action}: {agentRules[0].rule_attribute}
                                                </div>
                                              )}
                                              {showPermissionTypes && identityPerms.length > 0 && (
                                                <div className="bg-green-50 border border-green-200 px-2 py-1 rounded text-xs text-green-700 whitespace-nowrap">
                                                  {identityPerms[0].permission_type}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Systems */}
                                      <div className="flex-1 space-y-2">
                                        {identitySystems.map((system) => {
                                          const systemPerms = identityPerms.filter(p => p.system_id === system.id);
                                          const isSystemSelected = selectedNode === system.id && selectedType === 'system';

                                          return (
                                            <div
                                              key={system.id}
                                              onClick={() => {
                                                setSelectedNode(system.id);
                                                setSelectedType('system');
                                              }}
                                              className={`cursor-pointer transition-all ${
                                                isSystemSelected ? 'ring-2 ring-green-500 ring-offset-2' : ''
                                              }`}
                                            >
                                              <div className="rounded-lg p-3 border-2 border-green-200 bg-green-50 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <Database className="w-4 h-4 text-green-600" />
                                                  <span className="text-xs font-medium text-green-900">
                                                    {system.provider}
                                                  </span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900 leading-tight">
                                                  {system.name}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-0.5">{system.system_type}</p>
                                                {systemPerms.length > 0 && (
                                                  <div className="mt-1 text-xs text-green-700">
                                                    {systemPerms.length} APIs
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Network Legend</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Node Types:</h4>
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#0854A0]" />
                      <span className="text-gray-600">Agent</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-600">Agent Identity Instance</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-green-600" />
                      <span className="text-gray-600">System</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Edge Labels:</h4>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded" />
                      <span className="text-gray-600">Meta Policies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded" />
                      <span className="text-gray-600">Specific Policies</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100 border border-green-300 rounded" />
                      <span className="text-gray-600">Permission Types</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">Details</h2>
              </div>

              {selectedAgent && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded flex items-center justify-center"
                      style={{
                        backgroundColor: `${getProviderColor(selectedAgent.provider)}20`,
                        color: getProviderColor(selectedAgent.provider)
                      }}
                    >
                      <Bot className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedAgent.name}</h3>
                      <p className="text-sm text-gray-600">{selectedAgent.type}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Provider</h4>
                      <p className="text-sm text-gray-900">{selectedAgent.provider}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Policy Rules</h4>
                      <div className="space-y-2">
                        {getPolicyRulesForAgent(selectedAgent.id).slice(0, 3).map(rule => (
                          <div key={rule.id} className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
                            <p className="font-medium text-blue-900">{rule.action}</p>
                            <p className="text-gray-600">{rule.rule_attribute} {rule.rule_operator} {rule.rule_value}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Identity Instances</h4>
                      <div className="space-y-2">
                        {identities
                          .filter(i => i.agent_id === selectedAgent.id)
                          .slice(0, 5)
                          .map(identity => (
                            <div key={identity.id} className="text-sm bg-gray-50 p-2 rounded border border-gray-200">
                              <p className="font-medium text-gray-900 text-xs">{identity.tenant}</p>
                              <p className="text-xs text-gray-600 font-mono">{identity.identity_id}</p>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Total Permissions</h4>
                      <p className="text-2xl font-semibold text-[#0854A0]">
                        {getAgentPermissions(selectedAgent.id).length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedIdentity && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded flex items-center justify-center">
                      <Network className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedIdentity.identity_name}</h3>
                      <p className="text-sm text-gray-600">Agent Identity Instance</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tenant</h4>
                      <p className="text-sm text-gray-900 font-mono">{selectedIdentity.tenant}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Identity Provider</h4>
                      <p className="text-sm text-gray-900">{selectedIdentity.idp_type}</p>
                      <p className="text-xs text-gray-600 mt-1">{selectedIdentity.idp_domain}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">ORD ID</h4>
                      <p className="text-xs text-gray-900 font-mono break-all">{selectedIdentity.ord_id}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Meta Policies Applied</h4>
                      <div className="space-y-2">
                        {getApplicableMetaPolicies(selectedIdentity.agent_id, selectedIdentity.id).slice(0, 3).map(mp => (
                          <div key={mp.id} className="text-xs bg-orange-50 p-2 rounded border border-orange-200">
                            <p className="font-medium text-orange-900">{mp.name}</p>
                            <p className="text-gray-600">{mp.scope}: {mp.scope_target}</p>
                          </div>
                        ))}
                        {getApplicableMetaPolicies(selectedIdentity.agent_id, selectedIdentity.id).length === 0 && (
                          <p className="text-xs text-gray-500">No meta policies applied</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">System Access</h4>
                      <p className="text-2xl font-semibold text-blue-600">
                        {getSystemsForIdentity(selectedIdentity.id).length}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Permissions</h4>
                      <p className="text-2xl font-semibold text-green-600">
                        {getIdentityPermissions(selectedIdentity.id).length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedMCP && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded flex items-center justify-center">
                      <Server className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedMCP.name}</h3>
                      <p className="text-sm text-gray-600">{selectedMCP.server_type}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Provider</h4>
                      <p className="text-sm text-gray-900">{selectedMCP.provider}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{selectedMCP.description}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Endpoint</h4>
                      <p className="text-xs text-gray-600 font-mono break-all">{selectedMCP.endpoint}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Connected Agents</h4>
                      <p className="text-2xl font-semibold text-indigo-600">
                        {agents.filter(a => getMCPForProvider(a.provider)?.id === selectedMCP.id).length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {selectedSystem && (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                      <Database className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedSystem.name}</h3>
                      <p className="text-sm text-gray-600">{selectedSystem.system_type}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Provider</h4>
                      <p className="text-sm text-gray-900">{selectedSystem.provider}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{selectedSystem.description}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Agents with Access</h4>
                      <p className="text-2xl font-semibold text-purple-600">
                        {agents.filter(a => getSystemsForAgent(a.id).some(s => s.id === selectedSystem.id)).length}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {!selectedAgent && !selectedIdentity && !selectedMCP && !selectedSystem && (
                <div className="text-center py-12 text-gray-500">
                  <Network className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Select a node to view details</p>
                  <p className="text-xs mt-2 text-gray-400">
                    Click on agents, identities, or systems in the graph
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
