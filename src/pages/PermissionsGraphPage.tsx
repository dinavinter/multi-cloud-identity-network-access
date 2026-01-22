import { useEffect, useState } from 'react';
import { Bot, Database, Shield, ArrowRight, Network } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database as DB } from '../lib/database.types';

type Agent = DB['public']['Tables']['agents']['Row'];
type AgentIdentity = DB['public']['Tables']['agent_identities']['Row'];
type System = DB['public']['Tables']['systems']['Row'];
type Permission = DB['public']['Tables']['permissions']['Row'];
type AgentConnection = DB['public']['Tables']['agent_connections']['Row'];

interface GraphNode {
  id: string;
  type: 'agent' | 'system';
  name: string;
  provider?: string;
  status?: string;
}

interface GraphEdge {
  from: string;
  to: string;
  permissions: string[];
}

export function PermissionsGraphPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [identities, setIdentities] = useState<AgentIdentity[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [connections, setConnections] = useState<AgentConnection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      const [agentsRes, identitiesRes, systemsRes, permsRes, connsRes] = await Promise.all([
        supabase.from('agents').select('*').eq('status', 'Active'),
        supabase.from('agent_identities').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('permissions').select('*'),
        supabase.from('agent_connections').select('*')
      ]);

      setAgents(agentsRes.data || []);
      setIdentities(identitiesRes.data || []);
      setSystems(systemsRes.data || []);
      setPermissions(permsRes.data || []);
      setConnections(connsRes.data || []);
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

  const getPermissionTypes = (agentId: string, systemId: string) => {
    const agentIdentityIds = identities
      .filter(i => i.agent_id === agentId)
      .map(i => i.id);

    return permissions
      .filter(p => agentIdentityIds.includes(p.agent_identity_id) && p.system_id === systemId)
      .map(p => p.permission_type);
  };

  const getProviderColor = (provider: string) => {
    const p = provider.toLowerCase();
    if (p.includes('sap')) return '#0854A0';
    if (p.includes('microsoft')) return '#00A4EF';
    if (p.includes('servicenow')) return '#62D84E';
    if (p.includes('aws')) return '#FF9900';
    if (p.includes('salesforce')) return '#00A1E0';
    if (p.includes('google')) return '#EA4335';
    return '#6B7280';
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-1">Permissions Graph</h1>
          <p className="text-sm text-gray-600">
            Visualization of agent identities, their permissions across systems, and inter-agent connections
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                  <Bot className="w-4 h-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-900">Agents ({agents.length})</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg">
                  <Database className="w-4 h-4 text-purple-700" />
                  <span className="text-sm font-medium text-purple-900">Systems ({systems.length})</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                  <Shield className="w-4 h-4 text-green-700" />
                  <span className="text-sm font-medium text-green-900">Permissions ({permissions.length})</span>
                </div>
              </div>

              <div className="space-y-8">
                {agents.map((agent) => {
                  const agentSystems = getSystemsForAgent(agent.id);
                  const isSelected = selectedNode === agent.id;

                  return (
                    <div key={agent.id} className="relative">
                      <div className="flex items-start gap-6">
                        <div
                          onClick={() => setSelectedNode(agent.id)}
                          className={`flex-shrink-0 cursor-pointer transition-all ${
                            isSelected ? 'ring-2 ring-[#0854A0] ring-offset-2' : ''
                          }`}
                        >
                          <div
                            className="w-32 rounded-lg p-4 border-2 hover:shadow-md transition-shadow"
                            style={{
                              borderColor: getProviderColor(agent.provider),
                              backgroundColor: `${getProviderColor(agent.provider)}10`
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Bot
                                className="w-5 h-5"
                                style={{ color: getProviderColor(agent.provider) }}
                              />
                              <span className="text-xs font-medium text-gray-600">
                                {agent.provider}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 leading-tight">
                              {agent.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">{agent.type}</p>
                          </div>
                        </div>

                        {agentSystems.length > 0 && (
                          <>
                            <div className="flex-1 flex items-center justify-center py-12">
                              <div className="space-y-4 w-full">
                                {agentSystems.map((system) => {
                                  const permTypes = getPermissionTypes(agent.id, system.id);
                                  return (
                                    <div key={system.id} className="flex items-center gap-4">
                                      <div className="flex-1 flex items-center gap-3">
                                        <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 to-transparent" />
                                        <div className="flex flex-col gap-1">
                                          {permTypes.map((type, idx) => (
                                            <div
                                              key={idx}
                                              className="px-3 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-800 whitespace-nowrap"
                                            >
                                              {type}
                                            </div>
                                          ))}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                        <div className="flex-1 h-0.5 bg-gradient-to-r from-transparent to-gray-300" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="flex-shrink-0 space-y-4">
                              {agentSystems.map((system) => (
                                <div
                                  key={system.id}
                                  onClick={() => setSelectedNode(system.id)}
                                  className={`w-32 rounded-lg p-4 border-2 bg-purple-50 border-purple-300 cursor-pointer hover:shadow-md transition-all ${
                                    selectedNode === system.id ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                                  }`}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <Database className="w-5 h-5 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-900">
                                      {system.provider}
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium text-gray-900 leading-tight">
                                    {system.name}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1">{system.system_type}</p>
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Network className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-medium text-gray-900">Details</h2>
              </div>

              {selectedNode ? (
                <div>
                  {(() => {
                    const agent = agents.find(a => a.id === selectedNode);
                    const system = systems.find(s => s.id === selectedNode);

                    if (agent) {
                      const agentPerms = getAgentPermissions(agent.id);
                      const agentIdentitiesForAgent = identities.filter(i => i.agent_id === agent.id);

                      return (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="w-12 h-12 rounded flex items-center justify-center"
                              style={{
                                backgroundColor: `${getProviderColor(agent.provider)}20`,
                                color: getProviderColor(agent.provider)
                              }}
                            >
                              <Bot className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{agent.name}</h3>
                              <p className="text-sm text-gray-600">{agent.type}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Provider</h4>
                              <p className="text-sm text-gray-900">{agent.provider}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                agent.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {agent.status}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Identities ({agentIdentitiesForAgent.length})
                              </h4>
                              <div className="space-y-2">
                                {agentIdentitiesForAgent.map(identity => (
                                  <div key={identity.id} className="text-sm bg-gray-50 p-2 rounded">
                                    <p className="font-medium text-gray-900">{identity.tenant}</p>
                                    <p className="text-xs text-gray-600">{identity.identity_id}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Permissions ({agentPerms.length})
                              </h4>
                              <div className="space-y-1">
                                {agentPerms.map(perm => (
                                  <div key={perm.id} className="text-xs bg-green-50 text-green-800 px-2 py-1 rounded">
                                    {perm.permission_type}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    if (system) {
                      const systemPerms = permissions.filter(p => p.system_id === system.id);
                      const agentsWithAccess = agents.filter(a =>
                        getSystemsForAgent(a.id).some(s => s.id === system.id)
                      );

                      return (
                        <div>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded flex items-center justify-center">
                              <Database className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{system.name}</h3>
                              <p className="text-sm text-gray-600">{system.system_type}</p>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Provider</h4>
                              <p className="text-sm text-gray-900">{system.provider}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                              <p className="text-sm text-gray-600">{system.description}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Agents with Access ({agentsWithAccess.length})
                              </h4>
                              <div className="space-y-2">
                                {agentsWithAccess.map(a => (
                                  <div key={a.id} className="text-sm bg-gray-50 p-2 rounded">
                                    <p className="font-medium text-gray-900">{a.name}</p>
                                    <p className="text-xs text-gray-600">{a.provider}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">
                                Total Permissions ({systemPerms.length})
                              </h4>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  })()}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Network className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm">Select an agent or system to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
