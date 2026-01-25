import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Settings, Network, Bot, Users, Tag, Server, Key, FileText } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentIdentity = Database['public']['Tables']['agent_identities']['Row'];

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

interface IdentityWithInstances extends AgentIdentity {
  instances: Instance[];
}

interface AgentWithIdentities extends Agent {
  identities: IdentityWithInstances[];
}

interface AgentListPageProps {
  onSelectAgent: (agentId: string) => void;
}

export function AgentListPage({ onSelectAgent }: AgentListPageProps) {
  const [agents, setAgents] = useState<AgentWithIdentities[]>([]);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [expandedIdentities, setExpandedIdentities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAgents = async () => {
    try {
      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .order('name');

      if (!agentsData) return;

      const agentsWithIdentities: AgentWithIdentities[] = await Promise.all(
        agentsData.map(async (agent: Agent) => {
          const { data: identities } = await supabase
            .from('agent_identities')
            .select('*')
            .eq('agent_id', agent.id)
            .order('tenant');

          // For now, we'll generate sample instances for each identity
          // In production, this would come from a database table
          const identitiesWithInstances: IdentityWithInstances[] = (identities || []).map((identity: AgentIdentity, idx: number) => ({
            ...identity,
            instances: generateSampleInstances(identity.id, idx)
          }));

          return {
            ...agent,
            identities: identitiesWithInstances
          } as AgentWithIdentities;
        })
      );

      setAgents(agentsWithIdentities);
      setExpandedAgents(new Set(agentsWithIdentities.slice(0, 4).map((a: AgentWithIdentities) => a.id)));
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSampleInstances = (identityId: string, identityIndex: number): Instance[] => {
    // Generate 1-3 sample instances per identity
    const instanceCount = (identityIndex % 3) + 1;
    const osOptions = ['Linux 5.15.0', 'Linux 6.1.0', 'Windows Server 2022', 'Ubuntu 22.04'];
    
    return Array.from({ length: instanceCount }, (_, i) => ({
      id: `instance-${identityId}-${i + 1}`,
      pod_id: `pod-${identityId.substring(0, 8)}-${i + 1}`,
      os: osOptions[(identityIndex + i) % osOptions.length],
      public_key: `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC${identityId.substring(0, 20)}...`,
      audit_logs: {
        blocked: Math.floor(Math.random() * 10),
        approved: Math.floor(Math.random() * 20) + 10
      }
    }));
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

  const toggleIdentity = (identityId: string) => {
    setExpandedIdentities(prev => {
      const next = new Set(prev);
      if (next.has(identityId)) {
        next.delete(identityId);
      } else {
        next.add(identityId);
      }
      return next;
    });
  };

  const getIdpIcon = (idpType: string) => {
    if (idpType.toLowerCase().includes('azure')) return Network;
    return Users;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const totalIdentities = agents.reduce((sum, agent) => sum + agent.identities.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Agent Identities</h1>
          <p className="text-sm text-gray-600">
            {agents.length} agents with {totalIdentities} identities across multiple tenants and identity providers
          </p>
        </div>

        <div className="space-y-2">
          {agents.map((agent) => {
            const isExpanded = expandedAgents.has(agent.id);
            const IdpIcon = getIdpIcon(agent.identities[0]?.idp_type || '');

            return (
              <div key={agent.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className="flex-1 px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                    <Users className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {agent.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({agent.identities.length} identities)
                        </span>
                      </div>
                      {agent.labels && agent.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {agent.labels.map((label, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                                label.includes(':')
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              <Tag className="w-3 h-3" />
                              {label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => onSelectAgent(agent.id)}
                    className="px-6 py-4 text-sm text-[#0854A0] hover:underline"
                  >
                    View Details
                  </button>
                </div>

                {isExpanded && agent.identities.length > 0 && (
                  <div className="border-t border-gray-200">
                    {agent.identities.map((identity, idx) => {
                      const isIdentityExpanded = expandedIdentities.has(identity.id);
                      return (
                        <div key={identity.id}>
                          <div
                            className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50 ${
                              idx !== agent.identities.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                          >
                          <button
                            onClick={() => toggleIdentity(identity.id)}
                            className="flex-shrink-0"
                            title={isIdentityExpanded ? 'Collapse instances' : 'Expand instances'}
                          >
                              {isIdentityExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                              )}
                            </button>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <Bot className="w-5 h-5 text-[#0854A0]" />
                            </div>
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                {identity.identity_name}
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600 font-mono">{identity.identity_id}</span>
                                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded">
                                  <IdpIcon className="w-3 h-3 text-blue-700" />
                                  <span className="text-xs text-blue-700">
                                    {identity.idp_type} ({identity.idp_domain})
                                  </span>
                                </div>
                                {identity.instances && identity.instances.length > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {identity.instances.length} instance{identity.instances.length !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-gray-100 rounded" title="Settings" aria-label="Settings">
                                <Settings className="w-4 h-4 text-[#0854A0]" />
                              </button>
                              <button className="p-2 hover:bg-gray-100 rounded" title="Network" aria-label="Network">
                                <Network className="w-4 h-4 text-[#0854A0]" />
                              </button>
                            </div>
                          </div>

                          {/* Instances Section */}
                          {isIdentityExpanded && identity.instances && identity.instances.length > 0 && (
                            <div className="bg-gray-50 border-t border-gray-100">
                              <div className="px-6 py-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                                  Runtime Instances
                                </div>
                                <div className="space-y-3 ml-4">
                                  {identity.instances.map((instance) => (
                                    <div
                                      key={instance.id}
                                      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                                    >
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
