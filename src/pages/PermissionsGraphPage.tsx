import { useEffect, useState } from 'react';
import { Bot, Server, Database } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database as DB } from '../lib/database.types';

type Agent = DB['public']['Tables']['agents']['Row'];
type MCPServer = DB['public']['Tables']['mcp_servers']['Row'];
type System = DB['public']['Tables']['systems']['Row'];
type NodeConnection = DB['public']['Tables']['node_connections']['Row'];

type NetworkNode = {
  id: string;
  name: string;
  type: 'agent' | 'mcp' | 'system';
  provider: string;
  subType?: string;
  identityCount?: number;
};

export function PermissionsGraphPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mcpServers, setMCPServers] = useState<MCPServer[]>([]);
  const [systems, setSystems] = useState<System[]>([]);
  const [connections, setConnections] = useState<NodeConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      const [agentsRes, mcpRes, systemsRes, connectionsRes] = await Promise.all([
        supabase.from('agents').select('*').eq('status', 'Active'),
        supabase.from('mcp_servers').select('*'),
        supabase.from('systems').select('*'),
        supabase.from('node_connections').select('*')
      ]);

      setAgents(agentsRes.data || []);
      setMCPServers(mcpRes.data || []);
      setSystems(systemsRes.data || []);
      setConnections(connectionsRes.data || []);
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
    if (p.includes('aws')) return '#FF9900';
    if (p.includes('salesforce')) return '#00A1E0';
    if (p.includes('multi-cloud')) return '#6366F1';
    return '#6B7280';
  };

  const getNodeIcon = (type: 'agent' | 'mcp' | 'system') => {
    switch (type) {
      case 'agent':
        return Bot;
      case 'mcp':
        return Server;
      case 'system':
        return Database;
    }
  };

  const getLane1Nodes = (): NetworkNode[] => {
    return agents
      .filter(agent => connections.some(c => c.source_type === 'agent' && c.source_id === agent.id))
      .map(agent => ({
        id: agent.id,
        name: agent.name,
        type: 'agent' as const,
        provider: agent.provider,
        subType: agent.type
      }));
  };

  const getLane2NodesForAgent = (agentId: string): NetworkNode[] => {
    const agentConnections = connections.filter(
      c => c.source_type === 'agent' && c.source_id === agentId
    );

    return agentConnections.map(conn => {
      if (conn.target_type === 'mcp') {
        const mcp = mcpServers.find(m => m.id === conn.target_id);
        if (mcp) {
          return {
            id: mcp.id,
            name: mcp.name,
            type: 'mcp' as const,
            provider: mcp.provider,
            subType: mcp.server_type
          };
        }
      } else if (conn.target_type === 'agent') {
        const targetAgent = agents.find(a => a.id === conn.target_id);
        if (targetAgent) {
          return {
            id: targetAgent.id,
            name: targetAgent.name,
            type: 'agent' as const,
            provider: targetAgent.provider,
            subType: targetAgent.type
          };
        }
      }
      return null;
    }).filter(Boolean) as NetworkNode[];
  };

  const getLane3NodesForLane2Node = (nodeId: string, nodeType: string): NetworkNode[] => {
    if (nodeType !== 'mcp') return [];

    const mcpConnections = connections.filter(
      c => c.source_type === 'mcp' && c.source_id === nodeId && c.target_type === 'system'
    );

    return mcpConnections.map(conn => {
      const system = systems.find(s => s.id === conn.target_id);
      if (system) {
        return {
          id: system.id,
          name: system.name,
          type: 'system' as const,
          provider: system.provider,
          subType: system.system_type
        };
      }
      return null;
    }).filter(Boolean) as NetworkNode[];
  };

  const getAllLane2Nodes = (): NetworkNode[] => {
    const lane2Nodes = new Map<string, NetworkNode>();

    getLane1Nodes().forEach(agent => {
      getLane2NodesForAgent(agent.id).forEach(node => {
        lane2Nodes.set(node.id, node);
      });
    });

    return Array.from(lane2Nodes.values());
  };

  const getAllLane3Nodes = (): NetworkNode[] => {
    const lane3Nodes = new Map<string, NetworkNode>();

    getAllLane2Nodes().forEach(node => {
      getLane3NodesForLane2Node(node.id, node.type).forEach(systemNode => {
        lane3Nodes.set(systemNode.id, systemNode);
      });
    });

    return Array.from(lane3Nodes.values());
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const lane1Nodes = getLane1Nodes();
  const lane2Nodes = getAllLane2Nodes();
  const lane3Nodes = getAllLane3Nodes();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-normal text-gray-900 mb-2">Network Topology</h1>
          <p className="text-sm text-gray-600">
            Comprehensive view of agent identities, MCP servers, and system access across the network
          </p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-blue-200 bg-blue-50">
              <Bot className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Agents ({lane1Nodes.length})</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-purple-200 bg-purple-50">
              <Server className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">MCP Servers ({lane2Nodes.filter(n => n.type === 'mcp').length})</span>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-green-200 bg-green-50">
              <Database className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Systems ({lane3Nodes.length})</span>
            </div>
          </div>

          <div className="relative" style={{ minHeight: '500px' }}>
            <div className="grid grid-cols-3 gap-12">
              <div className="space-y-3">
                {lane1Nodes.map((node, idx) => {
                  const Icon = getNodeIcon(node.type);
                  return (
                    <div
                      key={node.id}
                      id={`lane1-${idx}`}
                      className="rounded-lg p-3 border-2 border-blue-200 bg-blue-50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className="w-4 h-4"
                          style={{ color: getProviderColor(node.provider) }}
                        />
                        <span className="text-sm font-medium text-gray-900">{node.name}</span>
                      </div>
                      <div className="text-xs text-gray-600">{node.subType}</div>
                      <div
                        className="text-xs mt-1 px-1.5 py-0.5 rounded inline-block"
                        style={{
                          backgroundColor: `${getProviderColor(node.provider)}20`,
                          color: getProviderColor(node.provider)
                        }}
                      >
                        {node.provider}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {lane2Nodes.map((node, idx) => {
                  const Icon = getNodeIcon(node.type);
                  const bgColor = node.type === 'mcp' ? 'bg-purple-50' : 'bg-blue-50';
                  const borderColor = node.type === 'mcp' ? 'border-purple-200' : 'border-blue-200';
                  return (
                    <div
                      key={node.id}
                      id={`lane2-${idx}`}
                      className={`rounded-lg p-3 border-2 ${borderColor} ${bgColor} hover:shadow-md transition-all`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className="w-4 h-4"
                          style={{ color: getProviderColor(node.provider) }}
                        />
                        <span className="text-sm font-medium text-gray-900">{node.name}</span>
                      </div>
                      <div className="text-xs text-gray-600">{node.subType}</div>
                      <div
                        className="text-xs mt-1 px-1.5 py-0.5 rounded inline-block"
                        style={{
                          backgroundColor: `${getProviderColor(node.provider)}20`,
                          color: getProviderColor(node.provider)
                        }}
                      >
                        {node.provider}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-3">
                {lane3Nodes.map((node, idx) => {
                  const Icon = getNodeIcon(node.type);
                  return (
                    <div
                      key={node.id}
                      id={`lane3-${idx}`}
                      className="rounded-lg p-3 border-2 border-green-200 bg-green-50 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon
                          className="w-4 h-4"
                          style={{ color: getProviderColor(node.provider) }}
                        />
                        <span className="text-sm font-medium text-gray-900">{node.name}</span>
                      </div>
                      <div className="text-xs text-gray-600">{node.subType}</div>
                      <div
                        className="text-xs mt-1 px-1.5 py-0.5 rounded inline-block"
                        style={{
                          backgroundColor: `${getProviderColor(node.provider)}20`,
                          color: getProviderColor(node.provider)
                        }}
                      >
                        {node.provider}
                      </div>
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

              {lane1Nodes.map((lane1Node, lane1Idx) => {
                const lane2Targets = getLane2NodesForAgent(lane1Node.id);

                return lane2Targets.map((lane2Target) => {
                  const lane2Idx = lane2Nodes.findIndex(n => n.id === lane2Target.id);
                  if (lane2Idx === -1) return null;

                  const lane3Targets = getLane3NodesForLane2Node(lane2Target.id, lane2Target.type);

                  return (
                    <g key={`${lane1Node.id}-${lane2Target.id}`}>
                      <line
                        x1="30%"
                        y1={`${lane1Idx * 95 + 55}px`}
                        x2="40%"
                        y2={`${lane2Idx * 95 + 55}px`}
                        stroke="#93c5fd"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />

                      {lane3Targets.map((lane3Target) => {
                        const lane3Idx = lane3Nodes.findIndex(n => n.id === lane3Target.id);
                        if (lane3Idx === -1) return null;

                        return (
                          <line
                            key={`${lane2Target.id}-${lane3Target.id}`}
                            x1="64%"
                            y1={`${lane2Idx * 95 + 55}px`}
                            x2="74%"
                            y2={`${lane3Idx * 95 + 55}px`}
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
                <h4 className="text-sm font-medium text-gray-700 mb-2">Agent Connections</h4>
                <p className="text-xs text-gray-600">
                  {connections.filter(c => c.source_type === 'agent').length} connection{connections.filter(c => c.source_type === 'agent').length !== 1 ? 's' : ''} from agents
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">MCP Integration</h4>
                <p className="text-xs text-gray-600">
                  {lane2Nodes.filter(n => n.type === 'mcp').length} MCP server{lane2Nodes.filter(n => n.type === 'mcp').length !== 1 ? 's' : ''} in use
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">System Access</h4>
                <p className="text-xs text-gray-600">
                  {lane3Nodes.length} system{lane3Nodes.length !== 1 ? 's' : ''} accessed
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
