import { useEffect, useState, useRef } from 'react';
import { Bot, User, Shield, Network, ZoomIn, ZoomOut, Maximize2, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Agent = Database['public']['Tables']['agents']['Row'];
type AgentIdentity = Database['public']['Tables']['agent_identities']['Row'];
type PolicyRule = Database['public']['Tables']['policy_rules']['Row'];
type NodeConnection = Database['public']['Tables']['node_connections']['Row'];

interface GraphNode {
  id: string;
  type: 'agent' | 'identity' | 'policy' | 'system';
  label: string;
  data: Agent | AgentIdentity | PolicyRule | any;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  label?: string;
}

export function AgentAccessNetworkPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filterType, setFilterType] = useState<'all' | 'agent' | 'identity' | 'policy'>('all');
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGraphData();
  }, []);

  const loadGraphData = async () => {
    try {
      const [agentsRes, identitiesRes, policiesRes, connectionsRes] = await Promise.all([
        supabase.from('agents').select('*'),
        supabase.from('agent_identities').select('*'),
        supabase.from('policy_rules').select('*'),
        supabase.from('node_connections').select('*'),
      ]);

      const agents = agentsRes.data || [];
      const identities = identitiesRes.data || [];
      const policies = policiesRes.data || [];
      const connections = connectionsRes.data || [];

      // Create nodes
      const graphNodes: GraphNode[] = [];
      const nodeMap = new Map<string, GraphNode>();

      // Add agent nodes
      agents.forEach((agent, idx) => {
        const node: GraphNode = {
          id: `agent-${agent.id}`,
          type: 'agent',
          label: agent.name,
          data: agent,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        };
        graphNodes.push(node);
        nodeMap.set(node.id, node);
      });

      // Add identity nodes
      identities.forEach((identity, idx) => {
        const node: GraphNode = {
          id: `identity-${identity.id}`,
          type: 'identity',
          label: identity.identity_name || identity.identity_id,
          data: identity,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        };
        graphNodes.push(node);
        nodeMap.set(node.id, node);
      });

      // Add policy nodes
      policies.forEach((policy, idx) => {
        const node: GraphNode = {
          id: `policy-${policy.id}`,
          type: 'policy',
          label: `${policy.action}: ${policy.rule_attribute}`,
          data: policy,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
        };
        graphNodes.push(node);
        nodeMap.set(node.id, node);
      });

      // Create edges
      const graphEdges: GraphEdge[] = [];

      // Agent to Identity edges
      identities.forEach((identity) => {
        graphEdges.push({
          id: `edge-${identity.agent_id}-${identity.id}`,
          source: `agent-${identity.agent_id}`,
          target: `identity-${identity.id}`,
          type: 'has_identity',
          label: 'has identity',
        });
      });

      // Agent to Policy edges
      policies.forEach((policy) => {
        if (policy.agent_id) {
          graphEdges.push({
            id: `edge-${policy.agent_id}-${policy.id}`,
            source: `agent-${policy.agent_id}`,
            target: `policy-${policy.id}`,
            type: 'has_policy',
            label: 'has policy',
          });
        }
      });

      // Node connections
      connections.forEach((conn) => {
        const sourceId = `${conn.source_type}-${conn.source_id}`;
        const targetId = `${conn.target_type}-${conn.target_id}`;
        if (nodeMap.has(sourceId) && nodeMap.has(targetId)) {
          graphEdges.push({
            id: `edge-${conn.id}`,
            source: sourceId,
            target: targetId,
            type: conn.connection_type,
            label: conn.connection_type,
          });
        }
      });

      // Initialize positions using force-directed layout
      initializeLayout(graphNodes, graphEdges);

      setNodes(graphNodes);
      setEdges(graphEdges);
    } catch (error) {
      console.error('Error loading graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeLayout = (nodes: GraphNode[], edges: GraphEdge[]) => {
    const width = 1200;
    const height = 800;
    const centerX = width / 2;
    const centerY = height / 2;

    // Group nodes by type for better layout
    const agents = nodes.filter((n) => n.type === 'agent');
    const identities = nodes.filter((n) => n.type === 'identity');
    const policies = nodes.filter((n) => n.type === 'policy');

    // Position agents in center-left
    agents.forEach((node, idx) => {
      const angle = (idx / agents.length) * Math.PI * 2;
      const radius = 150;
      node.x = centerX - 300 + Math.cos(angle) * radius;
      node.y = centerY + Math.sin(angle) * radius;
    });

    // Position identities around their agents
    identities.forEach((identity, idx) => {
      const agentId = (identity.data as AgentIdentity).agent_id;
      const agentNode = nodes.find((n) => n.id === `agent-${agentId}`);
      if (agentNode) {
        const angle = (idx / Math.max(identities.length, 1)) * Math.PI * 2;
        const radius = 200;
        identity.x = agentNode.x + Math.cos(angle) * radius;
        identity.y = agentNode.y + Math.sin(angle) * radius;
      } else {
        identity.x = centerX + (idx % 5) * 100;
        identity.y = centerY + Math.floor(idx / 5) * 100;
      }
    });

    // Position policies around agents/identities
    policies.forEach((policy, idx) => {
      const agentId = (policy.data as PolicyRule).agent_id;
      if (agentId) {
        const agentNode = nodes.find((n) => n.id === `agent-${agentId}`);
        if (agentNode) {
          const angle = (idx / Math.max(policies.length, 1)) * Math.PI * 2;
          const radius = 300;
          policy.x = agentNode.x + Math.cos(angle) * radius;
          policy.y = agentNode.y + Math.sin(angle) * radius;
        } else {
          policy.x = centerX + 400 + (idx % 4) * 120;
          policy.y = centerY + Math.floor(idx / 4) * 120;
        }
      } else {
        policy.x = centerX + 400 + (idx % 4) * 120;
        policy.y = centerY + Math.floor(idx / 4) * 120;
      }
    });
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'agent':
        return { fill: '#0854A0', stroke: '#063d75', light: '#e6f2ff' };
      case 'identity':
        return { fill: '#7c3aed', stroke: '#5b21b6', light: '#f3e8ff' };
      case 'policy':
        return { fill: '#059669', stroke: '#047857', light: '#d1fae5' };
      case 'system':
        return { fill: '#dc2626', stroke: '#991b1b', light: '#fee2e2' };
      default:
        return { fill: '#6b7280', stroke: '#4b5563', light: '#f3f4f6' };
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'agent':
        return Bot;
      case 'identity':
        return User;
      case 'policy':
        return Shield;
      default:
        return Network;
    }
  };

  const getEdgeColor = (type: string) => {
    switch (type) {
      case 'has_identity':
        return '#7c3aed';
      case 'has_policy':
        return '#059669';
      case 'delegates_to':
        return '#dc2626';
      case 'uses_mcp':
        return '#ea580c';
      case 'accesses_system':
        return '#0891b2';
      default:
        return '#6b7280';
    }
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const filteredNodes = filterType === 'all' 
    ? nodes 
    : nodes.filter((n) => n.type === filterType || (filterType === 'identity' && n.type === 'identity'));

  const filteredEdges = edges.filter((e) => {
    const sourceNode = nodes.find((n) => n.id === e.source);
    const targetNode = nodes.find((n) => n.id === e.target);
    if (filterType === 'all') return true;
    return (
      (sourceNode && sourceNode.type === filterType) ||
      (targetNode && targetNode.type === filterType) ||
      (filterType === 'identity' && (sourceNode?.type === 'identity' || targetNode?.type === 'identity'))
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0854A0] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading graph data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal text-gray-900 mb-2">Policy Graph Visualization</h1>
            <p className="text-sm text-gray-600">
              Interactive graph showing agents, identities, instances, and their policy relationships
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filterType === 'all'
                    ? 'bg-[#0854A0] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('agent')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filterType === 'agent'
                    ? 'bg-[#0854A0] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Agents
              </button>
              <button
                onClick={() => setFilterType('identity')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filterType === 'identity'
                    ? 'bg-[#0854A0] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Identities
              </button>
              <button
                onClick={() => setFilterType('policy')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filterType === 'policy'
                    ? 'bg-[#0854A0] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Policies
              </button>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => handleZoom(-0.1)}
                className="p-2 hover:bg-gray-100 rounded"
                title="Zoom out"
              >
                <ZoomOut className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-sm text-gray-600 px-2 min-w-[60px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => handleZoom(0.1)}
                className="p-2 hover:bg-gray-100 rounded"
                title="Zoom in"
              >
                <ZoomIn className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={handleResetView}
                className="p-2 hover:bg-gray-100 rounded"
                title="Reset view"
              >
                <Maximize2 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={containerRef}
          className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden relative"
          style={{ height: '800px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            className={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="10"
                refX="9"
                refY="3"
                orient="auto"
              >
                <polygon points="0 0, 10 3, 0 6" fill="#6b7280" />
              </marker>
              {['agent', 'identity', 'policy', 'system'].map((type) => {
                const colors = getNodeColor(type);
                return (
                  <filter key={`glow-${type}`} id={`glow-${type}`}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                );
              })}
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Render edges */}
              {filteredEdges.map((edge) => {
                const sourceNode = filteredNodes.find((n) => n.id === edge.source);
                const targetNode = filteredNodes.find((n) => n.id === edge.target);
                if (!sourceNode || !targetNode) return null;

                const dx = targetNode.x - sourceNode.x;
                const dy = targetNode.y - sourceNode.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx);

                // Calculate edge start/end points (on node boundaries)
                const nodeRadius = 30;
                const startX = sourceNode.x + Math.cos(angle) * nodeRadius;
                const startY = sourceNode.y + Math.sin(angle) * nodeRadius;
                const endX = targetNode.x - Math.cos(angle) * nodeRadius;
                const endY = targetNode.y - Math.sin(angle) * nodeRadius;

                const edgeColor = getEdgeColor(edge.type);

                return (
                  <g key={edge.id}>
                    <line
                      x1={startX}
                      y1={startY}
                      x2={endX}
                      y2={endY}
                      stroke={edgeColor}
                      strokeWidth="2"
                      strokeDasharray={edge.type === 'has_policy' ? '5,5' : 'none'}
                      opacity="0.6"
                      markerEnd="url(#arrowhead)"
                    />
                    {dist > 100 && (
                      <text
                        x={(startX + endX) / 2}
                        y={(startY + endY) / 2 - 5}
                        textAnchor="middle"
                        fontSize="10"
                        fill={edgeColor}
                        className="pointer-events-none"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Render nodes */}
              {filteredNodes.map((node) => {
                const colors = getNodeColor(node.type);
                const Icon = getNodeIcon(node.type);
                const isSelected = selectedNode?.id === node.id;

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedNode(node)}
                  >
                    {/* Node circle */}
                    <circle
                      r="30"
                      fill={colors.fill}
                      stroke={isSelected ? '#fbbf24' : colors.stroke}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all hover:r-[35]"
                      filter={`url(#glow-${node.type})`}
                    />
                    {/* Icon */}
                    <Icon
                      className="w-5 h-5 text-white pointer-events-none -translate-x-2.5 -translate-y-2.5"
                    />
                    {/* Label */}
                    <text
                      x="0"
                      y="45"
                      textAnchor="middle"
                      fontSize="12"
                      fill="#1f2937"
                      fontWeight="500"
                      className="pointer-events-none"
                    >
                      {node.label.length > 15 ? node.label.substring(0, 15) + '...' : node.label}
                    </text>
                    {/* Type badge */}
                    <rect
                      x="-20"
                      y="55"
                      width="40"
                      height="16"
                      rx="8"
                      fill={colors.light}
                      className="pointer-events-none"
                    />
                    <text
                      x="0"
                      y="66"
                      textAnchor="middle"
                      fontSize="9"
                      fill={colors.stroke}
                      fontWeight="600"
                      className="pointer-events-none uppercase"
                    >
                      {node.type}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-lg border border-gray-200 shadow-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Legend</h3>
            <div className="space-y-2">
              {[
                { type: 'agent', label: 'Agents', icon: Bot },
                { type: 'identity', label: 'Identities/Instances', icon: User },
                { type: 'policy', label: 'Policies', icon: Shield },
              ].map(({ type, label, icon: Icon }) => {
                const colors = getNodeColor(type);
                return (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.fill }}
                    >
                      <Icon className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-700">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Node details panel */}
        {selectedNode && (
          <div className="mt-6 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {(() => {
                  const colors = getNodeColor(selectedNode.type);
                  const Icon = getNodeIcon(selectedNode.type);
                  return (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: colors.fill }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedNode.label}</h3>
                  <span className="text-sm text-gray-500 capitalize">{selectedNode.type}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedNode.type === 'agent' && (
                <>
                  <div>
                    <span className="text-xs text-gray-500">Type</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as Agent).type}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Provider</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as Agent).provider}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as Agent).status}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">ID</span>
                    <p className="text-sm font-mono text-xs text-gray-600">
                      {(selectedNode.data as Agent).id}
                    </p>
                  </div>
                </>
              )}

              {selectedNode.type === 'identity' && (
                <>
                  <div>
                    <span className="text-xs text-gray-500">Identity ID</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as AgentIdentity).identity_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Tenant</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as AgentIdentity).tenant}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">IDP Type</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as AgentIdentity).idp_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Status</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as AgentIdentity).status}
                    </p>
                  </div>
                </>
              )}

              {selectedNode.type === 'policy' && (
                <>
                  <div>
                    <span className="text-xs text-gray-500">Action</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as PolicyRule).action}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Attribute</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as PolicyRule).rule_attribute}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Operator</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as PolicyRule).rule_operator}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Value</span>
                    <p className="text-sm font-medium text-gray-900">
                      {(selectedNode.data as PolicyRule).rule_value}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
