import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Shield, ChevronDown, ChevronRight, Globe, Users, Building } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type MetaPolicy = Database['public']['Tables']['meta_policies']['Row'];

interface PolicyRule {
  attribute: string;
  operator: string;
  value: string;
  action: string;
  actionType: string;
}

export function MetaPoliciesPage() {
  const [policies, setPolicies] = useState<MetaPolicy[]>([]);
  const [expandedPolicies, setExpandedPolicies] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetaPolicies();
  }, []);

  const loadMetaPolicies = async () => {
    try {
      const { data, error } = await supabase
        .from('meta_policies')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      // Sort policies: Global Agent Security Policy first, then by created_at
      const sortedPolicies = (data || []).sort((a, b) => {
        // Put "Global Agent Security Policy" at the top
        if (a.name === 'Global Agent Security Policy' && b.name !== 'Global Agent Security Policy') {
          return -1;
        }
        if (b.name === 'Global Agent Security Policy' && a.name !== 'Global Agent Security Policy') {
          return 1;
        }
        // For others, maintain created_at ascending order
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      setPolicies(sortedPolicies);
      setExpandedPolicies(new Set(sortedPolicies.map(p => p.id)));
    } catch (error) {
      console.error('Error loading meta policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePolicy = (policyId: string) => {
    setExpandedPolicies(prev => {
      const next = new Set(prev);
      if (next.has(policyId)) {
        next.delete(policyId);
      } else {
        next.add(policyId);
      }
      return next;
    });
  };

  const getScopeIcon = (scope: string) => {
    if (scope === 'global') return Globe;
    if (scope === 'agent_type') return Users;
    if (scope === 'tenant') return Building;
    return Shield;
  };

  const getScopeColor = (scope: string) => {
    if (scope === 'global') return 'bg-purple-100 text-purple-800';
    if (scope === 'agent_type') return 'bg-blue-100 text-blue-800';
    if (scope === 'tenant') return 'bg-green-100 text-green-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getActionColor = (action: string) => {
    if (action === 'Allow') return 'bg-green-100 text-green-800';
    if (action === 'Deny') return 'bg-red-100 text-red-800';
    if (action === 'Ask For Consent') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1400px] mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Meta Policies</h1>
          <p className="text-sm text-gray-600">
            Global governance policies that apply across multiple agents, agent types, or tenants
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-[#0854A0] text-white rounded hover:bg-[#073d7a] flex items-center gap-2 text-sm font-medium">
                <Plus className="w-4 h-4" />
                Add Policy
              </button>
              <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2 text-sm">
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-900">Global Policies</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {policies.filter(p => p.scope === 'global').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Apply to all agents</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-900">Agent Type Policies</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {policies.filter(p => p.scope === 'agent_type').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Apply to specific agent types</p>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3 mb-2">
                  <Building className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-900">Tenant Policies</span>
                </div>
                <p className="text-2xl font-semibold text-gray-900">
                  {policies.filter(p => p.scope === 'tenant').length}
                </p>
                <p className="text-xs text-gray-600 mt-1">Apply to specific tenants</p>
              </div>
            </div>

            <div className="space-y-3">
              {policies.map((policy) => {
                const isExpanded = expandedPolicies.has(policy.id);
                const ScopeIcon = getScopeIcon(policy.scope);
                const rules = (policy.policy_rules as PolicyRule[]) || [];

                return (
                  <div
                    key={policy.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors"
                  >
                    <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <button
                          onClick={() => togglePolicy(policy.id)}
                          className="flex items-center gap-2 hover:bg-gray-100 p-1 rounded"
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                        <div className="w-10 h-10 bg-white rounded flex items-center justify-center border border-gray-200">
                          <Shield className="w-5 h-5 text-[#0854A0]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-sm font-medium text-gray-900">{policy.name}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScopeColor(policy.scope)}`}>
                              <ScopeIcon className="w-3 h-3 inline mr-1" />
                              {policy.scope}
                            </span>
                            {policy.scope_target && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {policy.scope_target}
                              </span>
                            )}
                            {policy.is_active && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">{policy.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-200 rounded">
                          <Edit className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && rules.length > 0 && (
                      <div className="bg-white p-6 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">
                          Policy Rules ({rules.length}):
                        </h4>
                        <div className="space-y-2">
                          {rules.map((rule, idx) => (
                            <div
                              key={idx}
                              className="bg-gray-50 rounded p-3 border border-gray-200"
                            >
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className="text-sm text-gray-600">Where</span>
                                <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-mono">
                                  {rule.attribute}
                                </span>
                                <span className="text-sm text-gray-600">{rule.operator}</span>
                                <span className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">
                                  {rule.value}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(rule.action)}`}>
                                  {rule.action}
                                </span>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                  {rule.actionType}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
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
