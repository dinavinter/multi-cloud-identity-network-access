import { useEffect, useState } from 'react';
import { Plus, Trash2, Filter, Search, ChevronRight, Bot, ChevronDown, Settings, Network } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ProviderBadge } from '../components/ProviderBadge';
import { StatusBadge } from '../components/StatusBadge';

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
  const [searchQuery, setSearchQuery] = useState('');

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
      // Expand first 3 agents by default
      setExpandedAgents(new Set(agentsWithIdentities.slice(0, 3).map(a => a.id)));
    } catch (error) {
      console.error('Error loading agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    return Network;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const totalIdentities = agents.reduce((sum, agent) => sum + agent.identities.length, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="flex items-center gap-2 text-sm mb-6">
          <a href="#" className="text-[#0854A0] hover:underline">Home</a>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Agent Identity</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-1">Agent Identity Network Access</h1>
          <p className="text-sm text-gray-600">{agents.length} agents with {totalIdentities} identities across multiple tenants</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-[#0854A0] text-white rounded hover:bg-[#073d7a] flex items-center gap-2 text-sm font-medium">
                <Plus className="w-4 h-4" />
                Add
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 text-sm">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0854A0] focus:border-transparent w-80 text-sm"
              />
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {filteredAgents.map((agent) => {
              const isExpanded = expandedAgents.has(agent.id);
              const IdpIcon = getIdpIcon(agent.identities[0]?.idp_type || '');

              return (
                <div key={agent.id} className="bg-white">
                  <div className="flex items-center hover:bg-gray-50">
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className="px-4 py-4 flex items-center gap-3 flex-1"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                      <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-[#0854A0]" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">
                            {agent.name} ({agent.identities.length} identities)
                          </span>
                          <ProviderBadge provider={agent.provider} />
                          <StatusBadge status={agent.status} />
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => onSelectAgent(agent.id)}
                      className="px-4 py-4 text-[#0854A0] hover:underline text-sm"
                    >
                      View Details
                    </button>
                  </div>

                  {isExpanded && agent.identities.length > 0 && (
                    <div className="bg-gray-50 border-t border-gray-200">
                      {agent.identities.map((identity, idx) => (
                        <div
                          key={identity.id}
                          className={`px-4 py-3 flex items-center gap-4 hover:bg-gray-100 ml-14 ${
                            idx !== agent.identities.length - 1 ? 'border-b border-gray-100' : ''
                          }`}
                        >
                          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4 text-[#0854A0]" />
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {identity.identity_name}
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xs text-gray-600 font-mono">{identity.identity_id}</span>
                              <div className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded border border-blue-200">
                                <IdpIcon className="w-3 h-3 text-blue-700" />
                                <span className="text-xs text-blue-700">
                                  {identity.idp_type} ({identity.idp_domain})
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">Tenant: {identity.tenant}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-1.5 hover:bg-gray-200 rounded">
                              <Settings className="w-4 h-4 text-[#0854A0]" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-200 rounded">
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
  );
}
