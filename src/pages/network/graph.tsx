import { useState, useEffect } from 'react';
import { Bot, ShieldCheck, Container, Boxes, HardDrive, Activity, Network } from 'lucide-react';
import { AgentConfig } from './agentData';

interface IdentityFlowProps {
  data: AgentConfig;
}

interface GraphNode {
  id: string;
  type: 'agent' | 'identity' | 'instance' | 'mcp' | 'system';
  label: string;
  x: number;
  y: number;
  size: number;
  color: string;
  icon: string;
  connections: string[];
  metadata?: {
    region?: string;
    tenant?: string;
    idp_type?: string;
    server_type?: string;
    system_type?: string;
    provider?: string;
    status?: string;
    os?: string;
    audit_logs?: { blocked: number; approved: number };
    rules?: number;
  };
}

export default function NetworkGraph({ data }: IdentityFlowProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const stats = {
    totalNodes: 0,
    totalConnections: 0,
    identities: data.identities.length,
    instances: data.identities.reduce((acc, id) => acc + id.instances.length, 0),
    mcpServers: new Set(data.identities.flatMap(id => id.mcpDependencies?.map(m => m.id) || [])).size,
    systems: new Set(data.identities.flatMap(id => id.mcpDependencies?.flatMap(m => m.systems.map(s => s.id)) || [])).size,
    totalAuditLogs: data.identities.reduce((acc, id) => {
      const logs = id.instances.reduce((sum, inst) => ({
        approved: sum.approved + inst.audit_logs.approved,
        blocked: sum.blocked + inst.audit_logs.blocked
      }), { approved: 0, blocked: 0 });
      return { approved: acc.approved + logs.approved, blocked: acc.blocked + logs.blocked };
    }, { approved: 0, blocked: 0 })
  };

  useEffect(() => {
    const graphNodes: GraphNode[] = [];
    const centerX = 500;
    const centerY = 300;

    graphNodes.push({
      id: data.id,
      type: 'agent',
      label: data.name,
      x: centerX,
      y: centerY,
      size: 90,
      color: '#3b82f6',
      icon: 'bot',
      connections: data.identities.map(i => i.id),
      metadata: {
        region: data.region,
        provider: data.provider,
        status: 'Active',
        rules: data.rules.length
      }
    });

    data.identities.forEach((identity, idIdx) => {
      const angle = (idIdx / data.identities.length) * 2 * Math.PI;
      const radius = 190;
      const idX = centerX + Math.cos(angle) * radius;
      const idY = centerY + Math.sin(angle) * radius;

      const totalAuditLogs = identity.instances.reduce((acc, inst) => ({
        blocked: acc.blocked + inst.audit_logs.blocked,
        approved: acc.approved + inst.audit_logs.approved
      }), { blocked: 0, approved: 0 });

      graphNodes.push({
        id: identity.id,
        type: 'identity',
        label: identity.identity_name,
        x: idX,
        y: idY,
        size: 70,
        color: '#9333ea',
        icon: 'shield',
        connections: [data.id, ...identity.instances.map(i => i.id)],
        metadata: {
          tenant: identity.tenant,
          idp_type: identity.idp_type,
          status: identity.status,
          rules: identity.rules.length,
          audit_logs: totalAuditLogs
        }
      });

      identity.instances.forEach((instance, instIdx) => {
        const instAngle = angle + (instIdx - identity.instances.length / 2) * 0.3;
        const instRadius = radius + 130;
        const instX = centerX + Math.cos(instAngle) * instRadius;
        const instY = centerY + Math.sin(instAngle) * instRadius;

        graphNodes.push({
          id: instance.id,
          type: 'instance',
          label: instance.pod_id,
          x: instX,
          y: instY,
          size: 55,
          color: '#0891b2',
          icon: 'container',
          connections: [identity.id, ...(identity.mcpDependencies?.map(m => m.id) || [])],
          metadata: {
            os: instance.os,
            status: 'Running',
            audit_logs: instance.audit_logs
          }
        });
      });

      identity.mcpDependencies?.forEach((mcp, mcpIdx) => {
        const mcpAngle = angle + (mcpIdx - (identity.mcpDependencies?.length || 0) / 2) * 0.4;
        const mcpRadius = radius + 260;
        const mcpX = centerX + Math.cos(mcpAngle) * mcpRadius;
        const mcpY = centerY + Math.sin(mcpAngle) * mcpRadius;

        const existingMcp = graphNodes.find(n => n.id === mcp.id);
        if (!existingMcp) {
          graphNodes.push({
            id: mcp.id,
            type: 'mcp',
            label: mcp.name,
            x: mcpX,
            y: mcpY,
            size: 60,
            color: '#ea580c',
            icon: 'boxes',
            connections: [...identity.instances.map(i => i.id), ...mcp.systems.map(s => s.id)],
            metadata: {
              server_type: mcp.server_type,
              provider: mcp.provider,
              status: 'Connected'
            }
          });
        }

        mcp.systems.forEach((system, sysIdx) => {
          const sysAngle = mcpAngle + (sysIdx - mcp.systems.length / 2) * 0.25;
          const sysRadius = mcpRadius + 110;
          const sysX = centerX + Math.cos(sysAngle) * sysRadius;
          const sysY = centerY + Math.sin(sysAngle) * sysRadius;

          const existingSystem = graphNodes.find(n => n.id === system.id);
          if (!existingSystem) {
            graphNodes.push({
              id: system.id,
              type: 'system',
              label: system.name,
              x: sysX,
              y: sysY,
              size: 55,
              color: '#059669',
              icon: 'database',
              connections: [mcp.id],
              metadata: {
                system_type: system.system_type,
                provider: system.provider,
                status: 'Live'
              }
            });
          }
        });
      });

      identity.agentDependencies?.forEach((agent, agIdx) => {
        const agAngle = angle + (agIdx - (identity.agentDependencies?.length || 0) / 2) * 0.5;
        const agRadius = radius + 150;
        const agX = centerX + Math.cos(agAngle) * agRadius;
        const agY = centerY + Math.sin(agAngle) * agRadius;

        const existingAgent = graphNodes.find(n => n.id === agent.id);
        if (!existingAgent) {
          graphNodes.push({
            id: agent.id,
            type: 'agent',
            label: agent.name,
            x: agX,
            y: agY,
            size: 50,
            color: '#6366f1',
            icon: 'network',
            connections: [identity.id],
            metadata: {
              region: agent.region,
              provider: agent.provider,
              status: 'Active',
              rules: agent.rules.length
            }
          });
        }
      });
    });

    stats.totalNodes = graphNodes.length;
    stats.totalConnections = graphNodes.reduce((acc, node) => acc + node.connections.length, 0);

    setNodes(graphNodes);
  }, [data]);

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'bot': return Bot;
      case 'shield': return ShieldCheck;
      case 'container': return Container;
      case 'boxes': return Boxes;
      case 'database': return HardDrive;
      case 'network': return Network;
      default: return Bot;
    }
  };

  const isConnected = (nodeId: string) => {
    if (!hoveredNode && !selectedNode) return false;
    const activeNode = selectedNode || hoveredNode;
    const node = nodes.find(n => n.id === activeNode);
    if (!node) return false;
    return node.connections.includes(nodeId) || nodeId === activeNode;
  };

  const getNodeDetails = (node: GraphNode) => {
    const details: string[] = [];
    if (node.metadata?.region) details.push(`Region: ${node.metadata.region}`);
    if (node.metadata?.tenant) details.push(`Tenant: ${node.metadata.tenant}`);
    if (node.metadata?.idp_type) details.push(`IDP: ${node.metadata.idp_type}`);
    if (node.metadata?.server_type) details.push(`Type: ${node.metadata.server_type}`);
    if (node.metadata?.system_type) details.push(`Type: ${node.metadata.system_type}`);
    if (node.metadata?.provider) details.push(`Provider: ${node.metadata.provider}`);
    if (node.metadata?.os) details.push(`OS: ${node.metadata.os}`);
    if (node.metadata?.rules !== undefined) details.push(`Rules: ${node.metadata.rules}`);
    if (node.metadata?.audit_logs) {
      details.push(`Approved: ${node.metadata.audit_logs.approved}`);
      details.push(`Blocked: ${node.metadata.audit_logs.blocked}`);
    }
    if (node.metadata?.status) details.push(`Status: ${node.metadata.status}`);
    return details;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Policy Graph Visualization</h2>
        <p className="text-sm text-gray-600 mt-1">Interactive network graph showing access relationships across agents, identities, instances, MCP servers, and backend systems</p>
      </div>

      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '700px' }}>
        <svg width="100%" height="100%" className="absolute inset-0">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#9ca3af" />
            </marker>
            <marker id="arrowhead-highlight" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="#f97316" />
            </marker>
          </defs>

          {nodes.map(node =>
            node.connections.map(connId => {
              const targetNode = nodes.find(n => n.id === connId);
              if (!targetNode) return null;

              const isHighlighted = isConnected(node.id) && isConnected(connId);
              const dx = targetNode.x - node.x;
              const dy = targetNode.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const offset = targetNode.size / 2 + 5;
              const ratio = (distance - offset) / distance;

              return (
                <g key={`${node.id}-${connId}`}>
                  <line
                    x1={node.x}
                    y1={node.y}
                    x2={node.x + dx * ratio}
                    y2={node.y + dy * ratio}
                    stroke={isHighlighted ? '#f97316' : '#d1d5db'}
                    strokeWidth={isHighlighted ? 3 : 1.5}
                    strokeOpacity={isHighlighted ? 0.8 : 0.4}
                    markerEnd={isHighlighted ? 'url(#arrowhead-highlight)' : 'url(#arrowhead)'}
                    className="transition-all duration-300"
                  />
                  {isHighlighted && (
                    <line
                      x1={node.x}
                      y1={node.y}
                      x2={node.x + dx * ratio}
                      y2={node.y + dy * ratio}
                      stroke="#f97316"
                      strokeWidth="3"
                      strokeOpacity="0.2"
                      strokeDasharray="5,5"
                      className="animate-pulse"
                    />
                  )}
                </g>
              );
            })
          )}

          {nodes.map(node => {
            const Icon = getIcon(node.icon);
            const isActive = isConnected(node.id);
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const showTooltip = isHovered || isSelected;
            const details = getNodeDetails(node);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                className="cursor-pointer transition-all duration-300"
                style={{
                  opacity: (hoveredNode || selectedNode) && !isActive ? 0.25 : 1,
                  filter: (isHovered || isSelected) ? 'url(#glow)' : 'none'
                }}
              >
                <circle
                  r={node.size / 2 + 3}
                  fill="white"
                  opacity={showTooltip ? 0.3 : 0}
                  className="transition-all duration-300"
                />
                <circle
                  r={node.size / 2}
                  fill={node.color}
                  opacity={0.95}
                  className="transition-all duration-300"
                  style={{
                    transform: showTooltip ? 'scale(1.15)' : 'scale(1)',
                    transformOrigin: 'center'
                  }}
                />
                <circle
                  r={node.size / 2}
                  fill="none"
                  stroke="white"
                  strokeWidth={showTooltip ? 3 : 0}
                  opacity={0.5}
                  className="transition-all duration-300"
                />
                <foreignObject
                  x={-node.size / 4}
                  y={-node.size / 4}
                  width={node.size / 2}
                  height={node.size / 2}
                >
                  <div className="flex items-center justify-center h-full">
                    <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
                  </div>
                </foreignObject>

                {node.metadata?.status && (
                  <circle
                    cx={node.size / 3}
                    cy={-node.size / 3}
                    r="5"
                    fill={node.metadata.status === 'Active' || node.metadata.status === 'Running' || node.metadata.status === 'Connected' || node.metadata.status === 'Live' ? '#10b981' : '#ef4444'}
                    stroke="white"
                    strokeWidth="2"
                  />
                )}

                {showTooltip && (
                  <g>
                    <rect
                      x={-85}
                      y={node.size / 2 + 12}
                      width="170"
                      height={24 + (details.length * 16)}
                      rx="6"
                      fill="white"
                      stroke={node.color}
                      strokeWidth="2"
                      opacity="0.98"
                      filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))"
                    />
                    <text
                      y={node.size / 2 + 30}
                      textAnchor="middle"
                      className="text-sm font-bold fill-gray-900"
                    >
                      {node.label.length > 22 ? node.label.substring(0, 22) + '...' : node.label}
                    </text>
                    {details.map((detail, idx) => (
                      <text
                        key={idx}
                        y={node.size / 2 + 46 + (idx * 16)}
                        textAnchor="middle"
                        className="text-xs fill-gray-600"
                      >
                        {detail}
                      </text>
                    ))}
                    <rect
                      x={-85}
                      y={node.size / 2 + 12}
                      width="170"
                      height="3"
                      rx="6"
                      fill={node.color}
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Node Types
          </div>
          <div className="space-y-2.5">
            {[
              { icon: Bot, label: 'Primary Agent', color: '#3b82f6', desc: 'Main orchestrator' },
              { icon: ShieldCheck, label: 'Identity', color: '#9333ea', desc: 'Auth provider' },
              { icon: Container, label: 'Instance', color: '#0891b2', desc: 'Runtime pod' },
              { icon: Boxes, label: 'MCP Server', color: '#ea580c', desc: 'Integration layer' },
              { icon: HardDrive, label: 'System', color: '#059669', desc: 'Backend service' },
              { icon: Network, label: 'Linked Agent', color: '#6366f1', desc: 'Cross-agent ref' }
            ].map(({ icon: Icon, label, color, desc }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: color }}>
                  <Icon className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-900">{label}</span>
                  <span className="text-xs text-gray-500">{desc}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Active</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Inactive</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-200 px-4 py-3">
          <div className="text-xs font-semibold text-gray-900 mb-1">
            {selectedNode ? 'Node Selected' : 'Interactive Mode'}
          </div>
          <div className="text-xs text-gray-600">
            {selectedNode ? 'Click to deselect • Hover for more' : 'Click or hover nodes to explore connections'}
          </div>
        </div>

        <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg border-2 border-blue-200 px-4 py-3">
          <div className="text-xs font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Network className="w-4 h-4 text-blue-600" />
            {data.name}
          </div>
          <div className="text-xs text-gray-600">
            {data.region} • {data.provider} • {data.identities.length} Identities
          </div>
        </div>

        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg border-2 border-gray-200 p-4">
          <div className="text-xs font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            Network Statistics
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div className="flex flex-col">
              <span className="text-gray-500">Total Nodes</span>
              <span className="font-bold text-gray-900">{stats.totalNodes}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Connections</span>
              <span className="font-bold text-gray-900">{stats.totalConnections}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Identities</span>
              <span className="font-bold text-purple-600">{stats.identities}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Instances</span>
              <span className="font-bold text-cyan-600">{stats.instances}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">MCP Servers</span>
              <span className="font-bold text-orange-600">{stats.mcpServers}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-gray-500">Systems</span>
              <span className="font-bold text-emerald-600">{stats.systems}</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="text-xs font-semibold text-gray-700 mb-2">Audit Logs</div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-600">Approved:</span>
                <span className="font-bold text-green-600">{stats.totalAuditLogs.approved}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-gray-600">Blocked:</span>
                <span className="font-bold text-red-600">{stats.totalAuditLogs.blocked}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
