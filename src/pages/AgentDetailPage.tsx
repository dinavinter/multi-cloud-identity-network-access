import { useEffect, useState } from 'react';
import { ChevronRight, Edit, Trash2, Bot, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ProviderBadge } from '../components/ProviderBadge';
import { StatusBadge } from '../components/StatusBadge';

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
  const [activeTab, setActiveTab] = useState<'personal' | 'auth' | 'timestamps' | 'attributes' | 'groups' | 'policies' | 'dependencies'>('policies');
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
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
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
            <div className="flex gap-8 px-6">
              {(['personal', 'auth', 'timestamps', 'attributes', 'groups', 'policies', 'dependencies'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-medium ${
                    activeTab === tab
                      ? 'text-gray-900 border-b-2 border-gray-900'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab === 'personal' && 'Personal Information'}
                  {tab === 'auth' && 'Authentication'}
                  {tab === 'timestamps' && 'Timestamps'}
                  {tab === 'attributes' && 'Custom Attributes'}
                  {tab === 'groups' && 'Groups'}
                  {tab === 'policies' && 'Policies'}
                  {tab === 'dependencies' && 'Dependencies'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeTab === 'policies' && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900 mb-1">
                    AI Agent Policies Management
                  </h2>
                  <p className="text-sm text-gray-600">Configure access policies for AI agents</p>
                </div>
                {currentIdentity && (
                  <div className="bg-blue-50 px-4 py-2 rounded">
                    <span className="text-sm text-gray-600">Current Agent: </span>
                    <span className="text-sm font-medium text-[#0854A0]">
                      {currentIdentity.identity_id}
                    </span>
                    <span className="text-sm text-gray-600"> ({agent.name})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">
                Policy Rules ({policyRules.length}):
              </h3>
              <div className="space-y-3">
                {policyRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm text-gray-600">Where</span>
                      <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded text-sm font-mono">
                        {rule.rule_attribute}
                      </span>
                      <span className="text-sm text-gray-600">{rule.rule_operator}</span>
                      <span className="px-3 py-1 bg-white border border-gray-300 rounded text-sm font-mono">
                        {rule.rule_value}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(rule.action)}`}>
                        {rule.action}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {rule.action_type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dependencies' && permissions.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <p className="text-sm text-gray-700">
                  This application was created from a source application. Some of the inherited configurations can't be changed.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 text-sm">
                <div>
                  <span className="text-gray-600">Application type:</span>
                  <span className="ml-2 font-medium">Bundled</span>
                </div>
                <div>
                  <span className="text-gray-600">Application ID:</span>
                  <span className="ml-2 font-mono text-xs">{agent.id}</span>
                </div>
                <div>
                  <span className="text-gray-600">Name Type:</span>
                  <span className="ml-2 font-medium">SAP BTP solution</span>
                </div>
                <div>
                  <span className="text-gray-600">URL:</span>
                  <span className="ml-2 text-[#0854A0]">Home URL not configured</span>
                </div>
                <div>
                  <span className="text-gray-600">Organization ID:</span>
                  <span className="ml-2 font-medium">global</span>
                </div>
                <div>
                  <span className="text-gray-600">Protocol Type:</span>
                  <span className="ml-2 font-medium">OpenID Connect</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-900">
                  APIs ({permissions.length})
                </h3>
                <button className="text-sm text-[#0854A0] hover:underline">Add</button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p className="text-sm text-gray-700">
                  List of APIs provided by other Identity Authentication applications that are consumed by this application.
                  A maximum of 20 entries is allowed.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Dependency Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Application
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        API Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        API Description
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Authorization Context
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {permissions.map((perm) => (
                      <tr key={perm.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 text-sm text-gray-900">{perm.permission_type}</td>
                        <td className="px-4 py-4 text-sm text-gray-900">
                          {perm.systems?.name || 'Unknown'}
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-900">{perm.api_name}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{perm.api_description}</td>
                        <td className="px-4 py-4 text-sm text-gray-700">{perm.authorization_context}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-1 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
