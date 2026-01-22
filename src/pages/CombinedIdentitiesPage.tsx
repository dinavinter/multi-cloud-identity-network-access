import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Settings, Network, Bot, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentIdentity = Database['public']['Tables']['agent_identities']['Row'];

interface AgentWithIdentities extends Agent {
  identities: AgentIdentity[];
}

export function CombinedIdentitiesPage() {
  const [agents, setAgents] = useState<AgentWithIdentities[]>([]);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentsWithIdentities();
  }, []);

  const loadAgentsWithIdentities = async () => {
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

      setAgents(agentsWithIdentities.filter(a => a.identities.length > 0));
      setExpandedAgents(new Set(agentsWithIdentities.map(a => a.id)));
    } catch (error) {
      console.error('Error loading agents with identities:', error);
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
    if (idpType.toLowerCase().includes('ias')) return Users;
    if (idpType.toLowerCase().includes('azure')) return Network;
    return Users;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="max-w-[1600px] mx-auto">
        <div className="h-16 bg-[#354A5F] flex items-center px-6 text-white">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-[#2a3d4f] rounded">
              <span className="text-xl">☰</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">AI Security Cloud</span>
              <span className="text-sm text-gray-300">AI Agent Identity & Access Management</span>
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="w-14 bg-[#2C3E50] min-h-[calc(100vh-4rem)] flex flex-col items-center py-4 gap-4">
            <button className="p-3 hover:bg-[#1a2a3a] rounded text-white">
              <Bot className="w-5 h-5" />
            </button>
            <button className="p-3 hover:bg-[#1a2a3a] rounded text-white">
              <Users className="w-5 h-5" />
            </button>
            <button className="p-3 hover:bg-[#1a2a3a] rounded text-white">
              <Network className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-normal text-gray-900 mb-2">Identities</h1>
              <p className="text-sm text-gray-600">
                Combined view of agent identities across multiple tenants and identity providers
              </p>
            </div>

            <div className="space-y-2">
              {agents.map((agent) => {
                const isExpanded = expandedAgents.has(agent.id);
                const IdpIcon = getIdpIcon(agent.identities[0]?.idp_type || '');

                return (
                  <div key={agent.id} className="bg-white rounded border border-gray-200">
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      <Users className="w-5 h-5 text-gray-600 flex-shrink-0" />
                      <div className="flex-1 text-left">
                        <span className="text-sm font-medium text-gray-900">
                          {agent.name} ({agent.identities.length} identities)
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
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
                                <span className="text-sm text-gray-600">{identity.identity_id}</span>
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
      </div>
    </div>
  );
}
