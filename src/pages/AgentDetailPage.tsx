import { useEffect, useState } from 'react';
import { ChevronRight, Edit, Trash2, Bot, Tag, Network, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ProviderBadge } from '../components/ProviderBadge';
import { StatusBadge } from '../components/StatusBadge';
import NetworkGraph from './network/graph';
import IdentityFlow from './network/header';
import { PermissionsGraphPage } from './PermissionsGraphPage';
import { agentData } from './network/agentData';

type Agent = Database['public']['Tables']['agents']['Row'];
type PolicyRule = Database['public']['Tables']['policy_rules']['Row'];
type Permission = Database['public']['Tables']['permissions']['Row'] & {
  systems: { name: string } | null;
};
type AgentIdentity = Database['public']['Tables']['agent_identities']['Row'];

interface AgentDetailPageProps {
  agentId: string;
  onBack: () => void;
}

export function AgentDetailPage({ agentId, onBack }: AgentDetailPageProps) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [policyRules, setPolicyRules] = useState<PolicyRule[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [identities, setIdentities] = useState<AgentIdentity[]>([]);
  const [activeTab, setActiveTab] = useState<'attributes' | 'network' | 'permissions-graph'>('network');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentData();
  }, [agentId]);

  const loadAgentData = async () => {
    try {
      const [agentRes, rulesRes, identitiesRes] = await Promise.all([
        supabase.from('agents').select('*').eq('id', agentId).single(),
        supabase.from('policy_rules').select('*').eq('agent_id', agentId).order('priority'),
        supabase.from('agent_identities').select('*').eq('agent_id', agentId)
      ]);

      if (agentRes.error) throw agentRes.error;
      setAgent(agentRes.data);
      setPolicyRules(rulesRes.data || []);
      setIdentities(identitiesRes.data || []);

      if (identitiesRes.data && identitiesRes.data.length > 0) {
        const { data: permsData } = await supabase
          .from('permissions')
          .select('*, systems(name)')
          .eq('agent_identity_id', identitiesRes.data[0].id);
        setPermissions(permsData || []);
      }
    } catch (error) {
      console.error('Error loading agent data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action === 'Allow') return 'bg-green-100 text-green-800';
    if (action === 'Deny') return 'bg-red-100 text-red-800';
    if (action === 'Ask For Consent') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading || !agent) {
    return <div className="p-6">Loading...</div>;
  }

  const currentIdentity = identities[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-6">
        <div className="flex items-center gap-2 text-sm mb-6">
          <button onClick={onBack} className="text-[#0854A0] hover:underline">
            Home
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button onClick={onBack} className="text-[#0854A0] hover:underline">
            Agent Identity
          </button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <span className="text-gray-600">{agent.name}</span>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="p-6 flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-50 rounded flex items-center justify-center flex-shrink-0">
                <Bot className="w-7 h-7 text-[#0854A0]" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-normal text-gray-900">{agent.name}</h1>
                  <StatusBadge status={agent.status} />
                  <ProviderBadge provider={agent.provider} />
                </div>
                {agent.labels && agent.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {agent.labels.map((label, idx) => (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${label.includes(':')
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
                {currentIdentity && (
                  <a href="#" className="text-sm text-[#0854A0] hover:underline">
                    Link to parent application
                  </a>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 text-sm">
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded flex items-center gap-2 text-sm">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200">
            <div className="flex gap-8 px-6 overflow-x-auto">
              {(['network', 'permissions-graph', 'attributes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  aria-label={
                    tab === 'attributes' ? 'Custom Attributes' :
                      tab === 'network' ? 'Network' :
                        'Policies'
                  }
                  className={`py-4 text-sm font-medium whitespace-nowrap flex items-center gap-2 ${activeTab === tab
                    ? 'text-gray-900 border-b-2 border-gray-900'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {tab === 'attributes' && 'Attributes'}
                  {tab === 'network' && (
                    <>
                      <Network className="w-4 h-4" />
                      Network
                    </>
                  )}
                  {tab === 'permissions-graph' && (
                    <>
                      <Shield className="w-4 h-4" />
                      Policies
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'attributes' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-1">
                    Attributes
                  </h2>
                  <p className="text-sm text-gray-600">Manage attributes for this agent</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="text-sm text-gray-600">
                Custom attributes configuration will be available here.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'network' && (
          <div className="space-y-6">
            <IdentityFlow data={agentData} />
            <NetworkGraph data={agentData} />
          </div>
        )}

        {activeTab === 'permissions-graph' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <PermissionsGraphPage />
          </div>
        )}
      </div>
    </div>
  );
}
