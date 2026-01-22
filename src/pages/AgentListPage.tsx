import { useEffect, useState } from 'react';
import { Plus, Trash2, Filter, Search, ChevronRight, Bot } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ProviderBadge } from '../components/ProviderBadge';
import { StatusBadge } from '../components/StatusBadge';

type Agent = Database['public']['Tables']['agents']['Row'];

interface AgentListPageProps {
  onSelectAgent: (agentId: string) => void;
}

export function AgentListPage({ onSelectAgent }: AgentListPageProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('name');

      if (error) throw error;
      setAgents(data || []);
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

  const formatLastLogin = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return 'about 1 month ago';
    if (diffDays < 365) return `about ${Math.floor(diffDays / 30)} months ago`;
    return `about ${Math.floor(diffDays / 365)} year ago`;
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="flex items-center gap-2 text-sm mb-6">
          <a href="#" className="text-[#0854A0] hover:underline">Home</a>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">Agent Identity</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-1">Agent Identity Management</h1>
          <p className="text-sm text-gray-600">{agents.length} agents configured</p>
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-12 px-4 py-3">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Agent Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    ORD ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    User Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Last Login
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => onSelectAgent(agent.id)}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                          <Bot className="w-5 h-5 text-[#0854A0]" />
                        </div>
                        <span className="text-sm font-medium text-[#0854A0] hover:underline">
                          {agent.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600 font-mono">
                        {agent.type.toLowerCase()}:agent:{agent.provider.toLowerCase()}:v1
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <ProviderBadge provider={agent.provider} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-900">Agent</span>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={agent.status} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-sm text-gray-600">
                        {formatLastLogin(agent.created_at)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
