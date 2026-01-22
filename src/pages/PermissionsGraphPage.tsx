import { useEffect, useState } from 'react';
import { Bot, Database, Network, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database as DB } from '../lib/database.types';

type Agent = DB['public']['Tables']['agents']['Row'];
type AgentIdentity = DB['public']['Tables']['agent_identities']['Row'];
type System = DB['public']['Tables']['systems']['Row'];
type Permission = DB['public']['Tables']['permissions']['Row'];

export function PermissionsGraphPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [identities, setIdentities] = useState<AgentIdentity[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedAgentType, setSelectedAgentType] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      const [agentsRes, identitiesRes, systemsRes, permsRes] = await Promise.all([
        supabase.from('agents').select('*').eq('status', 'Active'),
        supabase.from('agent_identities').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('permissions').select('*')
      ]);

      setAgents(agentsRes.data || []);
      setIdentities(identitiesRes.data || []);
      setSystems(systemsRes.data || []);
      setPermissions(permsRes.data || []);

      if (agentsRes.data && agentsRes.data.length > 0) {
        setSelectedAgentType(agentsRes.data[0].type);
      }
    } catch (error) {
      console.error('Error loading graph data:', error);
    } finally {
      setLoading(false);
    }
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

  const getAgentTypeColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('budget') || t.includes('compliance')) return '#059669';
    if (t.includes('order')) return '#0284c7';
    if (t.includes('invoice')) return '#7c3aed';
    if (t.includes('requisition')) return '#dc2626';
    if (t.includes('contract')) return '#ea580c';
    return '#6B7280';
  };

  const getIdentityPermissions = (identityId: string) => {
    return permissions.filter(p => p.agent_identity_id === identityId);
  };

  const getSystemsForIdentity = (identityId: string) => {
    const identityPerms = getIdentityPermissions(identityId);
    const systemIds = new Set(identityPerms.map(p => p.system_id));
    return systems.filter(s => systemIds.has(s.id));
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const uniqueAgentTypes = [...new Set(agents.map(a => a.type))];
  const filteredAgents = agents.filter(a => a.type === selectedAgentType);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Network Topology by Agent Type</h1>
          <p className="text-sm text-gray-600">
            View how each agent type operates across different tenants and systems
          </p>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {uniqueAgentTypes.map(agentType => {
            const typeAgents = agents.filter(a => a.type === agentType);
            const typeIdentities = identities.filter(i =>
              typeAgents.some(a => a.id === i.agent_id)
            );
            return (
              <button
                key={agentType}
                onClick={() => setSelectedAgentType(agentType)}
                className={`px-4 py-2 rounded-lg border-2 transition-all ${
                  selectedAgentType === agentType
                    ? 'border-current shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  backgroundColor: selectedAgentType === agentType
                    ? `${getAgentTypeColor(agentType)}20`
                    : 'white',
                  color: getAgentTypeColor(agentType)
                }}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="font-medium">{agentType}</span>
                  <span className="text-xs opacity-70">({typeIdentities.length} instances)</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">{selectedAgentType}</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredAgents.length} agent{filteredAgents.length !== 1 ? 's' : ''} across{' '}
                {new Set(filteredAgents.map(a => a.provider)).size} provider{new Set(filteredAgents.map(a => a.provider)).size !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  className="px-3 py-1.5 rounded border text-xs font-medium"
                  style={{
                    borderColor: getProviderColor(agent.provider),
                    backgroundColor: `${getProviderColor(agent.provider)}15`,
                    color: getProviderColor(agent.provider)
                  }}
                >
                  {agent.provider}
                </div>
              ))}
            </div>
          </div>

          <div className="relative" style={{ minHeight: '600px' }}>
            <div className="grid grid-cols-3 gap-8">
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Agent Instances
                </h3>
                {filteredAgents.map((agent) => {
                  const agentIdentities = identities.filter(i => i.agent_id === agent.id);
                  return (
                    <div
                      key={agent.id}
                      id={`agent-${agent.id}`}
                      className="rounded-lg p-3 border-2 transition-all hover:shadow-md"
                      style={{
                        borderColor: getProviderColor(agent.provider),
                        backgroundColor: `${getProviderColor(agent.provider)}15`
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Bot
                          className="w-4 h-4"
                          style={{ color: getProviderColor(agent.provider) }}
                        />
                        <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        {agent.provider}
                      </div>
                      <div className="text-xs" style={{ color: getProviderColor(agent.provider) }}>
                        {agentIdentities.length} identit{agentIdentities.length !== 1 ? 'ies' : 'y'}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Identity Instances
                </h3>
                {filteredAgents.flatMap(agent =>
                  identities
                    .filter(i => i.agent_id === agent.id)
                    .map(identity => {
                      const identityPerms = getIdentityPermissions(identity.id);
                      const agent = agents.find(a => a.id === identity.agent_id);
                      return (
                        <div
                          key={identity.id}
                          id={`identity-${identity.id}`}
                          className="rounded-lg p-2 border-2 border-blue-200 bg-blue-50 hover:shadow-md transition-all"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Network className="w-3.5 h-3.5 text-blue-600" />
                            <span className="text-xs font-medium text-gray-900 truncate">
                              {identity.identity_name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {identity.tenant}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {agent && (
                              <span
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${getProviderColor(agent.provider)}20`,
                                  color: getProviderColor(agent.provider)
                                }}
                              >
                                {agent.provider}
                              </span>
                            )}
                            {identityPerms.length > 0 && (
                              <span className="text-xs text-green-600">
                                {identityPerms.length} perms
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-4">
                  Connected Systems
                </h3>
                {Array.from(
                  new Set(
                    filteredAgents.flatMap(agent =>
                      identities
                        .filter(i => i.agent_id === agent.id)
                        .flatMap(identity => getSystemsForIdentity(identity.id).map(s => s.id))
                    )
                  )
                )
                  .map(systemId => systems.find(s => s.id === systemId))
                  .filter(Boolean)
                  .map(system => {
                    const systemPerms = permissions.filter(p => p.system_id === system!.id);
                    return (
                      <div
                        key={system!.id}
                        id={`system-${system!.id}`}
                        className="rounded-lg p-2 border-2 border-green-200 bg-green-50 hover:shadow-md transition-all"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Database className="w-3.5 h-3.5 text-green-600" />
                          <span className="text-xs font-medium text-gray-900 truncate">
                            {system!.name}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {system!.provider}
                        </div>
                        {systemPerms.length > 0 && (
                          <div className="text-xs text-green-600 mt-1">
                            {systemPerms.length} APIs
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="8"
                  markerHeight="8"
                  refX="7"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
                </marker>
              </defs>

              {filteredAgents.map((agent, agentIdx) => {
                const agentIdentities = identities.filter(i => i.agent_id === agent.id);
                const allIdentities = filteredAgents.flatMap(a =>
                  identities.filter(i => i.agent_id === a.id)
                );

                return agentIdentities.map((identity) => {
                  const identityIdx = allIdentities.findIndex(i => i.id === identity.id);
                  const identitySystems = getSystemsForIdentity(identity.id);

                  const allSystems = Array.from(
                    new Set(
                      filteredAgents.flatMap(a =>
                        identities
                          .filter(i => i.agent_id === a.id)
                          .flatMap(id => getSystemsForIdentity(id.id).map(s => s.id))
                      )
                    )
                  )
                    .map(sId => systems.find(s => s.id === sId))
                    .filter(Boolean);

                  return (
                    <g key={`${agent.id}-${identity.id}`}>
                      <line
                        x1="33%"
                        y1={`${agentIdx * 95 + 85}px`}
                        x2="50%"
                        y2={`${identityIdx * 85 + 75}px`}
                        stroke="#93c5fd"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />

                      {identitySystems.map((system) => {
                        const systemIdx = allSystems.findIndex(s => s!.id === system.id);
                        return (
                          <line
                            key={`${identity.id}-${system.id}`}
                            x1="50%"
                            y1={`${identityIdx * 85 + 75}px`}
                            x2="66%"
                            y2={`${systemIdx * 75 + 75}px`}
                            stroke="#86efac"
                            strokeWidth="2"
                            markerEnd="url(#arrowhead)"
                          />
                        );
                      })}
                    </g>
                  );
                });
              })}
            </svg>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Cross-Tenant Deployment</h4>
                <p className="text-xs text-gray-600">
                  This agent type operates across {new Set(filteredAgents.flatMap(a => identities.filter(i => i.agent_id === a.id).map(i => i.tenant))).size} different tenant{new Set(filteredAgents.flatMap(a => identities.filter(i => i.agent_id === a.id).map(i => i.tenant))).size !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">System Access</h4>
                <p className="text-xs text-gray-600">
                  Connected to {Array.from(new Set(filteredAgents.flatMap(agent => identities.filter(i => i.agent_id === agent.id).flatMap(identity => getSystemsForIdentity(identity.id).map(s => s.id))))).length} unique system{Array.from(new Set(filteredAgents.flatMap(agent => identities.filter(i => i.agent_id === agent.id).flatMap(identity => getSystemsForIdentity(identity.id).map(s => s.id))))).length !== 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Total Permissions</h4>
                <p className="text-xs text-gray-600">
                  {filteredAgents.flatMap(agent => identities.filter(i => i.agent_id === agent.id).flatMap(identity => getIdentityPermissions(identity.id))).length} permission{filteredAgents.flatMap(agent => identities.filter(i => i.agent_id === agent.id).flatMap(identity => getIdentityPermissions(identity.id))).length !== 1 ? 's' : ''} granted
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
