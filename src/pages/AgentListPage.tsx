import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Settings, Network, Bot, Users, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentIdentity = Database['public']['Tables']['agent_identities']['Row'];

interface AgentWithIdentities extends Agent {
  identities: AgentIdentity[];
}

interface AgentListPageProps {
  onSelectAgent: (agentId: string) => void;
}

export function AgentListPage({ onSelectAgent }: AgentListPageProps) {
  const [agents, setAgents] = useState<AgentWithIdentities[]>([]);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data: agentsData } = await supabase
        .from('agents')
        .select('*')
        .order('name');

      if (!agentsData) return;

      const agentsWithIdentities = await Promise.all(
        agentsData.map(async (agent) => {
          const { data: identities } = await supabase
            .from('agent_identities')
            .select('*')
            .eq('agent_id', agent.id)
            .order('tenant');

          return {
            ...agent,
            identities: identities || []
          };
        })
      );

      setAgents(agentsWithIdentities);
      setExpandedAgents(new Set(agentsWithIdentities.slice(0, 4).map(a => a.id)));
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
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
                    {agent.identities.map((identity, idx) => (
                      <div
                        key={identity.id}
                        className={`px-6 py-4 flex items-center gap-4 hover:bg-gray-50 ${
                          idx !== agent.identities.length - 1 ? 'border-b border-gray-100' : ''
                        }`}
                      >
                        <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0 ml-7">
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-gray-100 rounded">
                            <Settings className="w-4 h-4 text-[#0854A0]" />
                          </button>
                          <button className="p-2 hover:bg-gray-100 rounded">
                            <Network className="w-4 h-4 text-[#0854A0]" />
                          </button>
                        </div>
                      </div>
                    ))}
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
