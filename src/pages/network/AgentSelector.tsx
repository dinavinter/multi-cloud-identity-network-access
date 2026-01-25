import { useState, useEffect } from 'react';
import { Bot, Search, Check, Loader2, Database, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AgentType, agents, Identity } from './agentData';


interface AgentSelectorProps {
  selectedAgentId: string | null;
  onSelectAgent: (agent: AgentType | null) => void;
  agents: AgentType[];
}

// Simulated agents for demo purposes
// Note: procurement-agent-001 uses the full agentData structure


export default function AgentSelector({ selectedAgentId, onSelectAgent, agents }: AgentSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');



  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAgent = (agent: AgentType) => {
    // If using real data, we need to fetch full agent details
    loadFullAgentData(agent.id);
  };

  const loadFullAgentData = async (agentId: string) => {
    setLoading(true);
    try {
      // Fetch full agent data including identities
      // This is a simplified version - you'd need to build the full AgentConfig
      const agentData = agents.find(agent => agent.id === agentId);

      if (agentData) {
        const fullAgent: AgentType = {
          ...agentData,
          identities: agentData.identities.map((identity: Identity) => ({
            id: identity.id,
            identity_name: identity.identity_name,
            identity_id: identity.identity_id,
            tenant: identity.tenant,
            subaccount: identity.subaccount,
            applications: identity.applications || [],
            idp_type: identity.idp_type,
            idp_domain: identity.idp_domain,
            status: identity.status,
            identityRules: identity.identityRules || [],
            tenantRuleIds: identity.tenantRuleIds || [],
            instances: identity.instances || [],
            agentDependencies: identity.agentDependencies || [],
            mcpDependencies: identity.mcpDependencies || []
          }))
        };
        onSelectAgent(fullAgent);
      }
    } catch (error) {
      console.error('Error loading full agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-600" />
            Agent Selector
          </h3>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {searchQuery ? 'No agents found' : 'No agents available'}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAgents.map((agent) => {
              const isSelected = selectedAgentId === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => handleSelectAgent(agent)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected
                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Bot className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-600'}`} />
                        <span className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {agent.name}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mb-2">{agent.type}</div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>{agent.region}</span>
                        <span>•</span>
                        <span>{agent.provider}</span>
                      </div>
                      {agent.labels && agent.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.labels.slice(0, 2).map((label, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
                            >
                              {label}
                            </span>
                          ))}
                          {agent.labels.length > 2 && (
                            <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                              +{agent.labels.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <div className="font-medium mb-1">Total Agents: {agents.length}</div>

        </div>
      </div>
    </div>
  );
}
